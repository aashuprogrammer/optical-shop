package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"optical-shop/internal/token"
)

const (
	AuthorizationHeaderKey = "authorization"
	AuthorizationTypeBearer = "bearer"
	AuthorizationPayloadKey = "authorization_payload"
	CookieTokenKey          = "token"
)

func AuthMiddleware(tokenMaker *token.PasetoMaker) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var accessToken string

		// 1. Check Authorization header
		authHeader := c.Get(AuthorizationHeaderKey)
		if len(authHeader) > 0 {
			fields := strings.Fields(authHeader)
			if len(fields) >= 2 && strings.ToLower(fields[0]) == AuthorizationTypeBearer {
				accessToken = fields[1]
			}
		}

		// 2. Fallback to cookie
		if accessToken == "" {
			accessToken = c.Cookies(CookieTokenKey)
		}

		if accessToken == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "authorization token is missing",
				"code":    "UNAUTHORIZED",
			})
		}

		payload, err := tokenMaker.VerifyToken(accessToken)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "invalid or expired authorization token",
				"code":    "TOKEN_INVALID",
			})
		}

		c.Locals(AuthorizationPayloadKey, payload)
		return c.Next()
	}
}

func RequireRole(allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		val := c.Locals(AuthorizationPayloadKey)
		if val == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "unauthorized access",
				"code":    "UNAUTHORIZED",
			})
		}

		payload, ok := val.(*token.Payload)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "invalid payload context",
				"code":    "UNAUTHORIZED",
			})
		}

		for _, role := range allowedRoles {
			if payload.Role == role || payload.Role == "admin" {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"error":   "insufficient permissions",
			"code":    "FORBIDDEN",
		})
	}
}

func GetAuthPayload(c *fiber.Ctx) *token.Payload {
	val := c.Locals(AuthorizationPayloadKey)
	if val == nil {
		return nil
	}
	payload, ok := val.(*token.Payload)
	if !ok {
		return nil
	}
	return payload
}
