package handler

import (
	"github.com/gofiber/fiber/v2"
	"optical-shop/internal/translation"
)

type TranslationHandler struct {
	service *translation.TranslationService
}

func NewTranslationHandler(service *translation.TranslationService) *TranslationHandler {
	return &TranslationHandler{service: service}
}

type BatchTranslateRequest struct {
	Texts      []string `json:"texts"`
	SourceLang string   `json:"source_lang"`
	TargetLang string   `json:"target_lang"`
}

func (h *TranslationHandler) TranslateBatch(c *fiber.Ctx) error {
	var req BatchTranslateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid request body",
		})
	}

	if req.SourceLang == "" {
		req.SourceLang = "en"
	}
	if req.TargetLang == "" {
		req.TargetLang = "hi"
	}

	if len(req.Texts) == 0 {
		return c.JSON(fiber.Map{
			"success": true,
			"data": fiber.Map{
				"translations": map[string]string{},
			},
		})
	}

	// Limit batch size to 200 strings per request for safety
	if len(req.Texts) > 200 {
		req.Texts = req.Texts[:200]
	}

	translations := h.service.TranslateBatch(c.Context(), req.Texts, req.SourceLang, req.TargetLang)

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"translations": translations,
			"source_lang":  req.SourceLang,
			"target_lang":  req.TargetLang,
		},
	})
}
