package handler

import (
	"github.com/gofiber/fiber/v2"
	"optical-shop/internal/middleware"
	"optical-shop/internal/storage"
)

type UploadHandler struct {
	storage *storage.R2Service
}

func NewUploadHandler(storage *storage.R2Service) *UploadHandler {
	return &UploadHandler{storage: storage}
}

func (h *UploadHandler) Upload(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "file is required",
		})
	}

	category := c.FormValue("category", "general")

	url, key, err := h.storage.UploadFile(c.Context(), file, category, payload.ShopID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to upload file: " + err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"url": url,
			"key": key,
		},
		"message": "file uploaded successfully",
	})
}
