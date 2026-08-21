package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"optical-shop/db/pgdb"
	"optical-shop/internal/middleware"
)

type ExpenseHandler struct {
	db pgdb.Querier
}

func NewExpenseHandler(db pgdb.Querier) *ExpenseHandler {
	return &ExpenseHandler{db: db}
}

func (h *ExpenseHandler) ListExpenses(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	categoryID, _ := strconv.ParseInt(c.Query("category_id", "0"), 10, 64)
	expenseType := c.Query("expense_type", "all")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.Query("limit", "25"))
	if limit < 1 || limit > 100 {
		limit = 25
	}
	offset := (page - 1) * limit

	expenses, err := h.db.ListExpenses(c.Context(), pgdb.ListExpensesParams{
		ShopID:      payload.ShopID,
		CategoryID:  categoryID,
		ExpenseType: expenseType,
		FromDate:    toDate(c.Query("from", "")),
		ToDate:      toDate(c.Query("to", "")),
		LimitCount:  int32(limit),
		OffsetCount: int32(offset),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to fetch expenses",
		})
	}

	totalCount, _ := h.db.CountExpenses(c.Context(), pgdb.CountExpensesParams{
		ShopID:      payload.ShopID,
		CategoryID:  categoryID,
		ExpenseType: expenseType,
		FromDate:    toDate(c.Query("from", "")),
		ToDate:      toDate(c.Query("to", "")),
	})

	summary, _ := h.db.GetExpensesSummary(c.Context(), pgdb.GetExpensesSummaryParams{
		ShopID:   payload.ShopID,
		FromDate: toDate(c.Query("from", "")),
		ToDate:   toDate(c.Query("to", "")),
	})

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"expenses": expenses,
			"pagination": fiber.Map{
				"total": totalCount,
				"page":  page,
				"limit": limit,
			},
			"summary": summary,
		},
	})
}

type CreateExpenseRequest struct {
	CategoryID  *int64  `json:"category_id"`
	Title       string  `json:"title"`
	Amount      float64 `json:"amount"`
	ExpenseDate string  `json:"expense_date"`
	PaymentMode string  `json:"payment_mode"` // cash, card, upi, bank_transfer
	ExpenseType string  `json:"expense_type"` // one_time, recurring
	Recurrence  string  `json:"recurrence"`   // daily, weekly, monthly, yearly
	ReceiptURL  string  `json:"receipt_url"`
	Notes       string  `json:"notes"`
}

func (h *ExpenseHandler) CreateExpense(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	var req CreateExpenseRequest
	if err := c.BodyParser(&req); err != nil || req.Title == "" || req.Amount <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "title and positive amount are required",
		})
	}

	if req.ExpenseType == "" {
		req.ExpenseType = "one_time"
	}
	if req.PaymentMode == "" {
		req.PaymentMode = "cash"
	}

	expense, err := h.db.CreateExpense(c.Context(), pgdb.CreateExpenseParams{
		ShopID:      payload.ShopID,
		CategoryID:  toInt8Ptr(req.CategoryID),
		Title:       req.Title,
		Amount:      toNumeric(req.Amount),
		ExpenseDate: toDate(req.ExpenseDate),
		PaymentMode: req.PaymentMode,
		ExpenseType: req.ExpenseType,
		Recurrence:  toText(req.Recurrence),
		ReceiptUrl:  toText(req.ReceiptURL),
		Notes:       toText(req.Notes),
		CreatedBy:   toInt8(payload.UserID),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to record expense",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    expense,
		"message": "expense recorded successfully",
	})
}

func (h *ExpenseHandler) ListCategories(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	categories, err := h.db.ListExpenseCategories(c.Context(), payload.ShopID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to fetch categories",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    categories,
	})
}

func (h *ExpenseHandler) CreateCategory(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	var req struct {
		Name string `json:"name"`
	}
	if err := c.BodyParser(&req); err != nil || req.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "category name is required",
		})
	}

	cat, err := h.db.CreateExpenseCategory(c.Context(), pgdb.CreateExpenseCategoryParams{
		ShopID: payload.ShopID,
		Name:   req.Name,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to create category",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    cat,
	})
}

func (h *ExpenseHandler) DeleteExpense(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid expense ID",
		})
	}

	_ = h.db.DeleteExpense(c.Context(), pgdb.DeleteExpenseParams{
		ID:     id,
		ShopID: payload.ShopID,
	})

	return c.JSON(fiber.Map{
		"success": true,
		"message": "expense deleted",
	})
}
