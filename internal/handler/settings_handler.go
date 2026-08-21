package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"optical-shop/db/pgdb"
	"optical-shop/internal/middleware"
)

type SettingsHandler struct {
	db pgdb.Querier
}

func NewSettingsHandler(db pgdb.Querier) *SettingsHandler {
	return &SettingsHandler{db: db}
}

func (h *SettingsHandler) ListSettings(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	settings, err := h.db.ListShopSettings(c.Context(), payload.ShopID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to fetch settings",
		})
	}

	res := make(map[string]string)
	for _, s := range settings {
		res[s.SettingKey] = textVal(s.SettingValue)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    res,
	})
}

type UpsertSettingRequest struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

func (h *SettingsHandler) UpsertSetting(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	var req UpsertSettingRequest
	if err := c.BodyParser(&req); err != nil || req.Key == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "setting key is required",
		})
	}

	setting, err := h.db.UpsertShopSetting(c.Context(), pgdb.UpsertShopSettingParams{
		ShopID:       payload.ShopID,
		SettingKey:   req.Key,
		SettingValue: toText(req.Value),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to save setting",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    setting,
	})
}

// User Management (Admin only)
func (h *SettingsHandler) ListUsers(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	users, err := h.db.ListUsersByShop(c.Context(), payload.ShopID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to fetch users",
		})
	}

	var safeUsers []fiber.Map
	for _, u := range users {
		safeUsers = append(safeUsers, fiber.Map{
			"id":                u.ID,
			"shop_id":           u.ShopID,
			"username":          u.Username,
			"full_name":         u.FullName,
			"email":             u.Email,
			"phone":             u.Phone,
			"role":              u.Role,
			"profile_image_url": u.ProfileImageUrl,
			"is_active":         u.IsActive,
			"last_login_at":     u.LastLoginAt,
			"created_at":        u.CreatedAt,
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    safeUsers,
	})
}

type CreateUserRequest struct {
	Username        string `json:"username"`
	Password        string `json:"password"`
	FullName        string `json:"full_name"`
	Email           string `json:"email"`
	Phone           string `json:"phone"`
	Role            string `json:"role"`
	ProfileImageUrl string `json:"profile_image_url"`
}

func (h *SettingsHandler) CreateUser(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	var req CreateUserRequest
	if err := c.BodyParser(&req); err != nil || req.Username == "" || req.Password == "" || req.FullName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "username, password, and full name are required",
		})
	}

	if req.Role == "" {
		req.Role = "staff"
	}

	user, err := h.db.CreateUser(c.Context(), pgdb.CreateUserParams{
		ShopID:          payload.ShopID,
		Username:        req.Username,
		Password:        req.Password, // plain text per project constraints
		FullName:        req.FullName,
		Email:           toText(req.Email),
		Phone:           toText(req.Phone),
		Role:            req.Role,
		ProfileImageUrl: toText(req.ProfileImageUrl),
		IsActive:        true,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to create user (username may already exist)",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"id":        user.ID,
			"username":  user.Username,
			"full_name": user.FullName,
			"role":      user.Role,
		},
		"message": "user created successfully",
	})
}

func (h *SettingsHandler) UpdateUser(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid user ID",
		})
	}

	var req struct {
		FullName        string `json:"full_name"`
		Email           string `json:"email"`
		Phone           string `json:"phone"`
		Role            string `json:"role"`
		ProfileImageUrl string `json:"profile_image_url"`
		IsActive        bool   `json:"is_active"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid request body",
		})
	}

	user, err := h.db.UpdateUser(c.Context(), pgdb.UpdateUserParams{
		ID:              id,
		FullName:        req.FullName,
		Email:           toText(req.Email),
		Phone:           toText(req.Phone),
		Role:            req.Role,
		ProfileImageUrl: toText(req.ProfileImageUrl),
		IsActive:        req.IsActive,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to update user",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    user,
		"message": "user updated successfully",
	})
}

func (h *SettingsHandler) DeleteUser(c *fiber.Ctx) error {
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid user ID",
		})
	}

	_ = h.db.DeleteUser(c.Context(), id)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "user deleted",
	})
}

func (h *SettingsHandler) ListActivityLogs(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	page, _ := strconv.Atoi(c.Query("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.Query("limit", "50"))
	if limit < 1 || limit > 100 {
		limit = 50
	}
	offset := (page - 1) * limit

	logs, err := h.db.ListActivityLogs(c.Context(), pgdb.ListActivityLogsParams{
		ShopID: payload.ShopID,
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to fetch activity logs",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    logs,
	})
}
