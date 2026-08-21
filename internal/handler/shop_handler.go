package handler

import (
	"github.com/gofiber/fiber/v2"
	"optical-shop/db/pgdb"
	"optical-shop/internal/middleware"
)

type ShopHandler struct {
	db pgdb.Querier
}

func NewShopHandler(db pgdb.Querier) *ShopHandler {
	return &ShopHandler{db: db}
}

func (h *ShopHandler) GetShopProfile(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	shop, err := h.db.GetShopByID(c.Context(), payload.ShopID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "shop not found",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    shop,
	})
}

type UpdateShopRequest struct {
	Name               string  `json:"name"`
	Phone              string  `json:"phone"`
	Email              string  `json:"email"`
	AddressLine1       string  `json:"address_line1"`
	AddressLine2       string  `json:"address_line2"`
	City               string  `json:"city"`
	State              string  `json:"state"`
	PinCode            string  `json:"pin_code"`
	GSTIN              string  `json:"gstin"`
	LogoURL            string  `json:"logo_url"`
	InvoicePrefix      string  `json:"invoice_prefix"`
	OrderPrefix        string  `json:"order_prefix"`
	CurrencySymbol     string  `json:"currency_symbol"`
	DefaultTaxRate     float64 `json:"default_tax_rate"`
	OptometristName    string  `json:"optometrist_name"`
	EyeTestingFee      float64 `json:"eye_testing_fee"`
	TermsAndConditions string  `json:"terms_and_conditions"`
	Language           string  `json:"language"`
}

func (h *ShopHandler) UpdateShopProfile(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	var req UpdateShopRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid request body",
		})
	}

	if req.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "shop name is required",
		})
	}

	shop, err := h.db.UpdateShopProfile(c.Context(), pgdb.UpdateShopProfileParams{
		ID:                 payload.ShopID,
		Name:               req.Name,
		Phone:              toText(req.Phone),
		Email:              toText(req.Email),
		AddressLine1:       toText(req.AddressLine1),
		AddressLine2:       toText(req.AddressLine2),
		City:               toText(req.City),
		State:              toText(req.State),
		PinCode:            toText(req.PinCode),
		Gstin:              toText(req.GSTIN),
		LogoUrl:            toText(req.LogoURL),
		InvoicePrefix:      toText(req.InvoicePrefix),
		OrderPrefix:        toText(req.OrderPrefix),
		CurrencySymbol:     toText(req.CurrencySymbol),
		DefaultTaxRate:     toNumeric(req.DefaultTaxRate),
		OptometristName:    toText(req.OptometristName),
		EyeTestingFee:      toNumeric(req.EyeTestingFee),
		TermsAndConditions: toText(req.TermsAndConditions),
		Language:           toText(req.Language),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to update shop profile",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    shop,
		"message": "shop profile updated successfully",
	})
}
