package handler

import (
	"fmt"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"optical-shop/db/pgdb"
	"optical-shop/internal/middleware"
)

type PurchaseHandler struct {
	db pgdb.Querier
}

func NewPurchaseHandler(db pgdb.Querier) *PurchaseHandler {
	return &PurchaseHandler{db: db}
}

func (h *PurchaseHandler) ListBills(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	search := c.Query("search", "")
	status := c.Query("status", "all")
	vendorID, _ := strconv.ParseInt(c.Query("vendor_id", "0"), 10, 64)
	page, _ := strconv.Atoi(c.Query("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.Query("limit", "25"))
	if limit < 1 || limit > 100 {
		limit = 25
	}
	offset := (page - 1) * limit

	bills, err := h.db.ListPurchaseBills(c.Context(), pgdb.ListPurchaseBillsParams{
		ShopID:      payload.ShopID,
		Search:      search,
		Status:      status,
		VendorID:    vendorID,
		FromDate:    toDate(c.Query("from", "")),
		ToDate:      toDate(c.Query("to", "")),
		LimitCount:  int32(limit),
		OffsetCount: int32(offset),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to fetch purchase bills",
		})
	}

	totalCount, _ := h.db.CountPurchaseBills(c.Context(), pgdb.CountPurchaseBillsParams{
		ShopID:   payload.ShopID,
		Search:   search,
		Status:   status,
		VendorID: vendorID,
		FromDate: toDate(c.Query("from", "")),
		ToDate:   toDate(c.Query("to", "")),
	})

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"bills": bills,
			"pagination": fiber.Map{
				"total": totalCount,
				"page":  page,
				"limit": limit,
			},
		},
	})
}

func (h *PurchaseHandler) GetBill(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid bill ID",
		})
	}

	bill, err := h.db.GetPurchaseBillByID(c.Context(), pgdb.GetPurchaseBillByIDParams{
		ID:     id,
		ShopID: payload.ShopID,
	})
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "purchase bill not found",
		})
	}

	items, _ := h.db.ListPurchaseBillItems(c.Context(), bill.ID)

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"bill":  bill,
			"items": items,
		},
	})
}

type PurchaseItemInput struct {
	ProductID *int64  `json:"product_id"`
	Name      string  `json:"name"`
	Quantity  int     `json:"quantity"`
	UnitPrice float64 `json:"unit_price"`
	TaxRate   float64 `json:"tax_rate"`
}

type CreatePurchaseBillRequest struct {
	VendorID   int64               `json:"vendor_id"`
	BillNumber string              `json:"bill_number"`
	BillDate   string              `json:"bill_date"`
	DueDate    string              `json:"due_date"`
	Items      []PurchaseItemInput `json:"items"`
	AmountPaid float64             `json:"amount_paid"`
	Notes      string              `json:"notes"`
}

func (h *PurchaseHandler) CreateBill(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	var req CreatePurchaseBillRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid request body",
		})
	}

	if req.VendorID == 0 || req.BillNumber == "" || len(req.Items) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "vendor, bill number, and at least one item are required",
		})
	}

	var subtotal float64
	var totalTax float64

	type processedPItem struct {
		item       PurchaseItemInput
		taxAmount  float64
		totalPrice float64
	}
	var processedItems []processedPItem

	for _, item := range req.Items {
		if item.Quantity <= 0 {
			item.Quantity = 1
		}
		itemSubtotal := item.UnitPrice * float64(item.Quantity)
		itemTax := itemSubtotal * (item.TaxRate / 100.0)
		itemTotal := itemSubtotal + itemTax

		subtotal += itemSubtotal
		totalTax += itemTax

		processedItems = append(processedItems, processedPItem{
			item:       item,
			taxAmount:  itemTax,
			totalPrice: itemTotal,
		})
	}

	grandTotal := subtotal + totalTax
	balance := grandTotal - req.AmountPaid
	if balance < 0 {
		balance = 0
	}

	status := "pending"
	if req.AmountPaid >= grandTotal && grandTotal > 0 {
		status = "paid"
	} else if req.AmountPaid > 0 {
		status = "partial"
	}

	bill, err := h.db.CreatePurchaseBill(c.Context(), pgdb.CreatePurchaseBillParams{
		ShopID:      payload.ShopID,
		VendorID:    req.VendorID,
		BillNumber:  req.BillNumber,
		BillDate:    toDate(req.BillDate),
		DueDate:     toDate(req.DueDate),
		Subtotal:    toNumeric(subtotal),
		TaxAmount:   toNumeric(totalTax),
		TotalAmount: toNumeric(grandTotal),
		AmountPaid:  toNumeric(req.AmountPaid),
		Balance:     toNumeric(balance),
		Status:      status,
		Notes:       toText(req.Notes),
		CreatedBy:   toInt8(payload.UserID),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to create purchase bill",
		})
	}

	for _, pItem := range processedItems {
		item := pItem.item

		_, _ = h.db.CreatePurchaseBillItem(c.Context(), pgdb.CreatePurchaseBillItemParams{
			PurchaseBillID: bill.ID,
			ProductID:      toInt8Ptr(item.ProductID),
			Name:           item.Name,
			Quantity:       int32(item.Quantity),
			UnitPrice:      toNumeric(item.UnitPrice),
			TaxRate:        toNumeric(item.TaxRate),
			TaxAmount:      toNumeric(pItem.taxAmount),
			TotalPrice:     toNumeric(pItem.totalPrice),
		})

		if item.ProductID != nil && *item.ProductID > 0 {
			_, _ = h.db.UpdateProductStock(c.Context(), pgdb.UpdateProductStockParams{
				ID:           *item.ProductID,
				ShopID:       payload.ShopID,
				CurrentStock: int32(item.Quantity),
			})

			billIDInt8 := toInt8(bill.ID)
			_, _ = h.db.CreateStockMovement(c.Context(), pgdb.CreateStockMovementParams{
				ShopID:        payload.ShopID,
				ProductID:     *item.ProductID,
				MovementType:  "purchase_in",
				Quantity:      int32(item.Quantity),
				ReferenceType: toText("purchase_bill"),
				ReferenceID:   billIDInt8,
				Notes:         toText(fmt.Sprintf("Inward from Bill %s", req.BillNumber)),
				CreatedBy:     toInt8(payload.UserID),
			})
		}
	}

	_ = h.db.UpdateVendorBalance(c.Context(), pgdb.UpdateVendorBalanceParams{
		ID:                 req.VendorID,
		ShopID:             payload.ShopID,
		OutstandingBalance: toNumeric(balance),
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    bill,
		"message": "purchase bill recorded and stock updated",
	})
}

type RecordVendorPaymentRequest struct {
	VendorID       int64   `json:"vendor_id"`
	PurchaseBillID *int64  `json:"purchase_bill_id"`
	Amount         float64 `json:"amount"`
	PaymentMode    string  `json:"payment_mode"`
	TransactionRef string  `json:"transaction_ref"`
	Notes          string  `json:"notes"`
}

func (h *PurchaseHandler) RecordPayment(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	var req RecordVendorPaymentRequest
	if err := c.BodyParser(&req); err != nil || req.VendorID == 0 || req.Amount <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "vendor and payment amount are required",
		})
	}

	if req.PaymentMode == "" {
		req.PaymentMode = "cash"
	}

	payment, err := h.db.CreateVendorPayment(c.Context(), pgdb.CreateVendorPaymentParams{
		ShopID:         payload.ShopID,
		VendorID:       req.VendorID,
		PurchaseBillID: toInt8Ptr(req.PurchaseBillID),
		Amount:         toNumeric(req.Amount),
		PaymentMode:    req.PaymentMode,
		TransactionRef: toText(req.TransactionRef),
		Notes:          toText(req.Notes),
		CreatedBy:      toInt8(payload.UserID),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to record vendor payment",
		})
	}

	_ = h.db.UpdateVendorBalance(c.Context(), pgdb.UpdateVendorBalanceParams{
		ID:                 req.VendorID,
		ShopID:             payload.ShopID,
		OutstandingBalance: toNumeric(-req.Amount),
	})

	if req.PurchaseBillID != nil && *req.PurchaseBillID > 0 {
		_, _ = h.db.UpdatePurchaseBillPayment(c.Context(), pgdb.UpdatePurchaseBillPaymentParams{
			ID:         *req.PurchaseBillID,
			ShopID:     payload.ShopID,
			AmountPaid: toNumeric(req.Amount),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    payment,
		"message": "vendor payment recorded successfully",
	})
}
