package handler

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"optical-shop/db/pgdb"
	"optical-shop/internal/config"
	"optical-shop/internal/middleware"
	"optical-shop/internal/token"
)

type AuthHandler struct {
	db         pgdb.Querier
	tokenMaker *token.PasetoMaker
	cfg        *config.Config
}

func NewAuthHandler(db pgdb.Querier, tokenMaker *token.PasetoMaker, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		db:         db,
		tokenMaker: tokenMaker,
		cfg:        cfg,
	}
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid request body",
			"code":    "VALIDATION_ERROR",
		})
	}

	if req.Username == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "username and password are required",
			"code":    "VALIDATION_ERROR",
		})
	}

	user, err := h.db.GetUserByUsername(c.Context(), req.Username)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "invalid username or password",
			"code":    "INVALID_CREDENTIALS",
		})
	}

	if !user.IsActive {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"error":   "this account has been deactivated",
			"code":    "ACCOUNT_DISABLED",
		})
	}

	// Plain-text password check per strict project constraint
	if user.Password != req.Password {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "invalid username or password",
			"code":    "INVALID_CREDENTIALS",
		})
	}

	tokenStr, payload, err := h.tokenMaker.CreateToken(
		user.ID,
		user.ShopID,
		user.Username,
		user.FullName,
		user.Role,
		h.cfg.TokenDuration,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to generate session token",
			"code":    "INTERNAL_ERROR",
		})
	}

	// Update last login
	_ = h.db.UpdateLastLogin(c.Context(), user.ID)

	// Fetch shop info
	shop, _ := h.db.GetShopByID(c.Context(), user.ShopID)

	// Set httpOnly cookie
	c.Cookie(&fiber.Cookie{
		Name:     middleware.CookieTokenKey,
		Value:    tokenStr,
		Expires:  payload.ExpiredAt,
		HTTPOnly: true,
		Secure:   false,
		SameSite: "Lax",
		Path:     "/",
	})

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"token": tokenStr,
			"user": fiber.Map{
				"id":                user.ID,
				"shop_id":           user.ShopID,
				"username":          user.Username,
				"full_name":         user.FullName,
				"email":             user.Email,
				"phone":             user.Phone,
				"role":              user.Role,
				"profile_image_url": user.ProfileImageUrl,
			},
			"shop": shop,
		},
		"message": "login successful",
	})
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	c.Cookie(&fiber.Cookie{
		Name:     middleware.CookieTokenKey,
		Value:    "",
		Expires:  time.Now().Add(-time.Hour),
		HTTPOnly: true,
		Path:     "/",
	})

	return c.JSON(fiber.Map{
		"success": true,
		"message": "logged out successfully",
	})
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	if payload == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "unauthorized",
		})
	}

	user, err := h.db.GetUserByID(c.Context(), payload.UserID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "user not found",
		})
	}

	shop, _ := h.db.GetShopByID(c.Context(), user.ShopID)

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"user": fiber.Map{
				"id":                user.ID,
				"shop_id":           user.ShopID,
				"username":          user.Username,
				"full_name":         user.FullName,
				"email":             user.Email,
				"phone":             user.Phone,
				"role":              user.Role,
				"profile_image_url": user.ProfileImageUrl,
			},
			"shop": shop,
		},
	})
}

type UpdatePasswordRequest struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

func (h *AuthHandler) UpdatePassword(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	var req UpdatePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid request body",
		})
	}

	user, err := h.db.GetUserByID(c.Context(), payload.UserID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "user not found",
		})
	}

	if user.Password != req.OldPassword {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "incorrect existing password",
		})
	}

	if len(req.NewPassword) < 4 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "password must be at least 4 characters",
		})
	}

	_, err = h.db.UpdateUserPassword(c.Context(), pgdb.UpdateUserPasswordParams{
		ID:       user.ID,
		Password: req.NewPassword,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to update password",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "password updated successfully",
	})
}

type UpdateProfilePhotoRequest struct {
	ProfileImageUrl string `json:"profile_image_url"`
}

func (h *AuthHandler) UpdateProfilePhoto(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	var req UpdateProfilePhotoRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid request body",
		})
	}

	user, err := h.db.GetUserByID(c.Context(), payload.UserID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "user not found",
		})
	}

	updatedUser, err := h.db.UpdateUser(c.Context(), pgdb.UpdateUserParams{
		ID:              user.ID,
		FullName:        user.FullName,
		Email:           user.Email,
		Phone:           user.Phone,
		Role:            user.Role,
		ProfileImageUrl: toText(req.ProfileImageUrl),
		IsActive:        user.IsActive,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to update profile photo",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    updatedUser,
		"message": "profile photo updated successfully",
	})
}

