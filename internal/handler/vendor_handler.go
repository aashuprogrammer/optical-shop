package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"optical-shop/db/pgdb"
	"optical-shop/internal/middleware"
)

type VendorHandler struct {
	db pgdb.Querier
}

func NewVendorHandler(db pgdb.Querier) *VendorHandler {
	return &VendorHandler{db: db}
}

func (h *VendorHandler) ListVendors(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	vendors, err := h.db.ListVendors(c.Context(), payload.ShopID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to fetch vendors",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    vendors,
	})
}

func (h *VendorHandler) GetVendor(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid vendor ID",
		})
	}

	vendor, err := h.db.GetVendorByID(c.Context(), pgdb.GetVendorByIDParams{
		ID:     id,
		ShopID: payload.ShopID,
	})
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "vendor not found",
		})
	}

	payments, _ := h.db.ListVendorPaymentsByVendor(c.Context(), pgdb.ListVendorPaymentsByVendorParams{
		VendorID: vendor.ID,
		ShopID:   payload.ShopID,
	})

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"vendor":   vendor,
			"payments": payments,
		},
	})
}

type CreateVendorRequest struct {
	Name          string `json:"name"`
	ContactPerson string `json:"contact_person"`
	Phone         string `json:"phone"`
	Email         string `json:"email"`
	GSTIN         string `json:"gstin"`
	Address       string `json:"address"`
	City          string `json:"city"`
	State         string `json:"state"`
	PinCode       string `json:"pin_code"`
	Notes         string `json:"notes"`
}

func (h *VendorHandler) CreateVendor(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	var req CreateVendorRequest
	if err := c.BodyParser(&req); err != nil || req.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "vendor name is required",
		})
	}

	vendor, err := h.db.CreateVendor(c.Context(), pgdb.CreateVendorParams{
		ShopID:        payload.ShopID,
		Name:          req.Name,
		ContactPerson: toText(req.ContactPerson),
		Phone:         toText(req.Phone),
		Email:         toText(req.Email),
		Gstin:         toText(req.GSTIN),
		Address:       toText(req.Address),
		City:          toText(req.City),
		State:         toText(req.State),
		PinCode:       toText(req.PinCode),
		Notes:         toText(req.Notes),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to create vendor",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    vendor,
		"message": "vendor added successfully",
	})
}

func (h *VendorHandler) UpdateVendor(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid vendor ID",
		})
	}

	var req CreateVendorRequest
	if err := c.BodyParser(&req); err != nil || req.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "vendor name is required",
		})
	}

	vendor, err := h.db.UpdateVendor(c.Context(), pgdb.UpdateVendorParams{
		ID:            id,
		ShopID:        payload.ShopID,
		Name:          req.Name,
		ContactPerson: toText(req.ContactPerson),
		Phone:         toText(req.Phone),
		Email:         toText(req.Email),
		Gstin:         toText(req.GSTIN),
		Address:       toText(req.Address),
		City:          toText(req.City),
		State:         toText(req.State),
		PinCode:       toText(req.PinCode),
		Notes:         toText(req.Notes),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to update vendor",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    vendor,
		"message": "vendor updated successfully",
	})
}

func (h *VendorHandler) DeleteVendor(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid vendor ID",
		})
	}

	err = h.db.SoftDeleteVendor(c.Context(), pgdb.SoftDeleteVendorParams{
		ID:     id,
		ShopID: payload.ShopID,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to delete vendor",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "vendor deleted successfully",
	})
}
