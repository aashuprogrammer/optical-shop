package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgtype"
	"optical-shop/db/pgdb"
	"optical-shop/internal/middleware"
)

type OrderHandler struct {
	db pgdb.Querier
}

func NewOrderHandler(db pgdb.Querier) *OrderHandler {
	return &OrderHandler{db: db}
}

func (h *OrderHandler) ListOrders(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	search := c.Query("search", "")
	status := c.Query("status", "all")
	paymentStatus := c.Query("payment_status", "all")
	orderType := c.Query("order_type", "all")
	fromStr := c.Query("from", "")
	toStr := c.Query("to", "")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.Query("limit", "25"))
	if limit < 1 || limit > 100 {
		limit = 25
	}
	offset := (page - 1) * limit

	var fromDate, toDate time.Time
	if fromStr != "" {
		if t, err := time.Parse("2006-01-02", fromStr); err == nil {
			fromDate = t
		}
	}
	if toStr != "" {
		if t, err := time.Parse("2006-01-02", toStr); err == nil {
			toDate = t.Add(24 * time.Hour)
		}
	}

	orders, err := h.db.ListOrders(c.Context(), pgdb.ListOrdersParams{
		ShopID:        payload.ShopID,
		Search:        search,
		Status:        status,
		PaymentStatus: paymentStatus,
		OrderType:     orderType,
		FromDate:      toTimestamptz(fromDate),
		ToDate:        toTimestamptz(toDate),
		LimitCount:    int32(limit),
		OffsetCount:   int32(offset),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to fetch orders",
		})
	}

	totalCount, _ := h.db.CountOrders(c.Context(), pgdb.CountOrdersParams{
		ShopID:        payload.ShopID,
		Search:        search,
		Status:        status,
		PaymentStatus: paymentStatus,
		OrderType:     orderType,
		FromDate:      toTimestamptz(fromDate),
		ToDate:        toTimestamptz(toDate),
	})

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"orders": orders,
			"pagination": fiber.Map{
				"total": totalCount,
				"page":  page,
				"limit": limit,
			},
		},
	})
}

func (h *OrderHandler) GetOrder(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid order ID",
		})
	}

	order, err := h.db.GetOrderByID(c.Context(), pgdb.GetOrderByIDParams{
		ID:     id,
		ShopID: payload.ShopID,
	})
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "order not found",
		})
	}

	items, _ := h.db.ListOrderItems(c.Context(), order.ID)
	rx, _ := h.db.GetOrderPrescription(c.Context(), order.ID)
	payments, _ := h.db.ListOrderPayments(c.Context(), order.ID)
	history, _ := h.db.ListOrderStatusHistory(c.Context(), order.ID)
	shop, _ := h.db.GetShopByID(c.Context(), payload.ShopID)

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"order":        order,
			"items":        items,
			"prescription": rx,
			"payments":     payments,
			"history":      history,
			"shop":         shop,
		},
	})
}

type InlineCustomerInput struct {
	FirstName       string `json:"first_name"`
	LastName        string `json:"last_name"`
	Phone           string `json:"phone"`
	Email           string `json:"email"`
	DateOfBirth     string `json:"date_of_birth"`
	Gender          string `json:"gender"`
	AddressLine1    string `json:"address_line1"`
	City            string `json:"city"`
	ProfileImageUrl string `json:"profile_image_url"`
	Notes           string `json:"notes"`
}

type OrderItemInput struct {
	ProductID      *int64                 `json:"product_id"`
	ItemType       string                 `json:"item_type"` // full_specs_frame, full_specs_lens, frame, lens, contact_lens, accessories, service
	Name           string                 `json:"name"`
	Description    string                 `json:"description"`
	Quantity       int                    `json:"quantity"`
	UnitPrice      float64                `json:"unit_price"`
	DiscountAmount float64                `json:"discount_amount"`
	TaxRate        float64                `json:"tax_rate"`
	HSNCode        string                 `json:"hsn_code"`
	Details        map[string]interface{} `json:"details"`
}

type PrescriptionInput struct {
	EyeTestID             *int64  `json:"eye_test_id"`
	CheckupByType         string  `json:"checkup_by_type"` // dr, optical
	DoctorName            string  `json:"doctor_name"`
	HospitalName          string  `json:"hospital_name"`
	DoctorCity            string  `json:"doctor_city"`
	OpticalShopName       string  `json:"optical_shop_name"`
	OpticalCity           string  `json:"optical_city"`
	ExaminerName          string  `json:"examiner_name"`
	CheckupDate           string  `json:"checkup_date"`
	ReSph                 float64 `json:"re_sph"`
	ReCyl                 float64 `json:"re_cyl"`
	ReAxis                int     `json:"re_axis"`
	ReAdd                 float64 `json:"re_add"`
	RePd                  float64 `json:"re_pd"`
	RePrism               float64 `json:"re_prism"`
	RePrismBase           string  `json:"re_prism_base"`
	ReVisualAcuity        string  `json:"re_visual_acuity"`
	LeSph                 float64 `json:"le_sph"`
	LeCyl                 float64 `json:"le_cyl"`
	LeAxis                int     `json:"le_axis"`
	LeAdd                 float64 `json:"le_add"`
	LePd                  float64 `json:"le_pd"`
	LePrism               float64 `json:"le_prism"`
	LePrismBase           string  `json:"le_prism_base"`
	LeVisualAcuity        string  `json:"le_visual_acuity"`
	TotalPd               float64 `json:"total_pd"`
	LensFor               string  `json:"lens_for"` // DISTANCE, NEAR, BIFOCAL, PROGRESSIVE
	LensType              string  `json:"lens_type"` // MINERAL LENS, PLASTIC LENS, POLYCARBONATE LENS, etc.
	LensMaterial          string  `json:"lens_material"`
	LensCoating           string  `json:"lens_coating"`
	LensSide              string  `json:"lens_side"` // BOTH, RIGHT, LEFT
	LensCompany           string  `json:"lens_company"`
	LensProduct           string  `json:"lens_product"`
	LensIndex             string  `json:"lens_index"`
	LensDia               string  `json:"lens_dia"`
	Tint                  string  `json:"tint"`
	CLBaseCurve           float64 `json:"cl_base_curve"`
	CLDiameter            float64 `json:"cl_diameter"`
	CLReplacementSchedule string  `json:"cl_replacement_schedule"`
	Notes                 string  `json:"notes"`
}

type InitialPaymentInput struct {
	Amount         float64 `json:"amount"`
	PaymentMode    string  `json:"payment_mode"` // cash, card, upi, bank_transfer
	TransactionRef string  `json:"transaction_ref"`
	Notes          string  `json:"notes"`
}

type CreateOrderRequest struct {
	CustomerID       int64                `json:"customer_id"`
	Customer         *InlineCustomerInput `json:"customer,omitempty"`
	OrderType        string               `json:"order_type"` // spectacles, contact_lens, accessories, repair
	Items            []OrderItemInput     `json:"items"`
	Prescription     *PrescriptionInput   `json:"prescription,omitempty"`
	DiscountType     string               `json:"discount_type"` // flat, percentage
	DiscountValue    float64              `json:"discount_value"`
	ExpectedDelivery string               `json:"expected_delivery"`
	Notes            string               `json:"notes"`
	Payment          *InitialPaymentInput `json:"payment,omitempty"`
}

func (h *OrderHandler) CreateOrder(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	var req CreateOrderRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid request body",
		})
	}

	// 1. Resolve or Create Customer inline
	customerID := req.CustomerID
	if customerID == 0 {
		if req.Customer != nil && req.Customer.FirstName != "" {
			cust, err := h.db.CreateCustomer(c.Context(), pgdb.CreateCustomerParams{
				ShopID:          payload.ShopID,
				FirstName:       req.Customer.FirstName,
				LastName:        toText(req.Customer.LastName),
				Phone:           toText(req.Customer.Phone),
				Email:           toText(req.Customer.Email),
				DateOfBirth:     toDate(req.Customer.DateOfBirth),
				Gender:          toText(req.Customer.Gender),
				AddressLine1:    toText(req.Customer.AddressLine1),
				City:            toText(req.Customer.City),
				ProfileImageUrl: toText(req.Customer.ProfileImageUrl),
				Notes:           toText(req.Customer.Notes),
			})
			if err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"success": false,
					"error":   "failed to create customer inline: " + err.Error(),
				})
			}
			customerID = cust.ID
		} else {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"error":   "customer details are required",
			})
		}
	}

	if len(req.Items) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "at least one order item is required",
		})
	}

	// 2. Calculate financial line items
	var subtotal float64
	var totalItemTax float64

	type processedItem struct {
		input      OrderItemInput
		taxAmount  float64
		totalPrice float64
	}
	var processedItems []processedItem

	for _, item := range req.Items {
		if item.Quantity <= 0 {
			item.Quantity = 1
		}
		itemSubtotal := (item.UnitPrice * float64(item.Quantity)) - item.DiscountAmount
		if itemSubtotal < 0 {
			itemSubtotal = 0
		}
		itemTax := itemSubtotal * (item.TaxRate / 100.0)
		itemTotal := itemSubtotal + itemTax

		subtotal += (item.UnitPrice * float64(item.Quantity))
		totalItemTax += itemTax

		processedItems = append(processedItems, processedItem{
			input:      item,
			taxAmount:  itemTax,
			totalPrice: itemTotal,
		})
	}

	// 3. Global Discount
	var discountAmount float64
	if req.DiscountType == "percentage" {
		discountAmount = subtotal * (req.DiscountValue / 100.0)
	} else {
		discountAmount = req.DiscountValue
	}
	if discountAmount > subtotal {
		discountAmount = subtotal
	}

	taxableAmount := subtotal - discountAmount
	if taxableAmount < 0 {
		taxableAmount = 0
	}

	grandTotal := taxableAmount + totalItemTax
	var advancePaid float64
	if req.Payment != nil {
		advancePaid = req.Payment.Amount
	}
	balanceDue := grandTotal - advancePaid
	if balanceDue < 0 {
		balanceDue = 0
	}

	paymentStatus := "pending"
	if advancePaid >= grandTotal && grandTotal > 0 {
		paymentStatus = "paid"
	} else if advancePaid > 0 {
		paymentStatus = "partial"
	}

	// Auto-generate order number
	orderNumRow, err := h.db.IncrementAndGetNextOrderNumber(c.Context(), payload.ShopID)
	prefix := "ORD"
	var numVal int32 = 1
	if err == nil {
		if orderNumRow.OrderPrefix.Valid && orderNumRow.OrderPrefix.String != "" {
			prefix = orderNumRow.OrderPrefix.String
		}
		numVal = orderNumRow.OrderNumber
	}
	orderNumber := fmt.Sprintf("%s-%03d", prefix, numVal)

	if req.OrderType == "" {
		req.OrderType = "spectacles"
	}

	// 4. Create Order
	order, err := h.db.CreateOrder(c.Context(), pgdb.CreateOrderParams{
		ShopID:           payload.ShopID,
		CustomerID:       customerID,
		CreatedBy:        toInt8(payload.UserID),
		OrderNumber:      orderNumber,
		OrderType:        req.OrderType,
		Status:           "pending",
		PaymentStatus:    paymentStatus,
		Subtotal:         toNumeric(subtotal),
		DiscountType:     toText(req.DiscountType),
		DiscountValue:    toNumeric(req.DiscountValue),
		DiscountAmount:   toNumeric(discountAmount),
		TaxableAmount:    toNumeric(taxableAmount),
		CgstAmount:       toNumeric(0.00),
		SgstAmount:       toNumeric(0.00),
		IgstAmount:       toNumeric(0.00),
		TotalTax:         toNumeric(totalItemTax),
		GrandTotal:       toNumeric(grandTotal),
		AmountPaid:       toNumeric(advancePaid),
		BalanceDue:       toNumeric(balanceDue),
		ExpectedDelivery: toDate(req.ExpectedDelivery),
		Notes:            toText(req.Notes),
	})
	if err != nil {
		log.Printf("CreateOrder DB error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to create order: " + err.Error(),
		})
	}

	// 5. Create Order Items and deduct inventory stock
	for _, pItem := range processedItems {
		item := pItem.input

		detailsBytes, _ := json.Marshal(item.Details)

		_, _ = h.db.CreateOrderItem(c.Context(), pgdb.CreateOrderItemParams{
			OrderID:        order.ID,
			ProductID:      toInt8Ptr(item.ProductID),
			ItemType:       item.ItemType,
			Name:           item.Name,
			Description:    toText(item.Description),
			Quantity:       int32(item.Quantity),
			UnitPrice:      toNumeric(item.UnitPrice),
			DiscountAmount: toNumeric(item.DiscountAmount),
			TaxRate:        toNumeric(item.TaxRate),
			TaxAmount:      toNumeric(pItem.taxAmount),
			TotalPrice:     toNumeric(pItem.totalPrice),
			HsnCode:        toText(item.HSNCode),
			Details:        detailsBytes,
		})

		// Deduct stock if linked to inventory
		if item.ProductID != nil && *item.ProductID > 0 {
			_, _ = h.db.UpdateProductStock(c.Context(), pgdb.UpdateProductStockParams{
				ID:           *item.ProductID,
				ShopID:       payload.ShopID,
				CurrentStock: -int32(item.Quantity),
			})

			orderIDInt8 := toInt8(order.ID)
			_, _ = h.db.CreateStockMovement(c.Context(), pgdb.CreateStockMovementParams{
				ShopID:        payload.ShopID,
				ProductID:     *item.ProductID,
				MovementType:  "sale_out",
				Quantity:      -int32(item.Quantity),
				ReferenceType: toText("order"),
				ReferenceID:   orderIDInt8,
				Notes:         toText(fmt.Sprintf("Sold in Order %s", orderNumber)),
				CreatedBy:     toInt8(payload.UserID),
			})
		}
	}

	// 6. Save Eye Test & Prescription if present
	if req.Prescription != nil {
		rx := req.Prescription
		var eyeTestID *int64 = rx.EyeTestID

		// Auto create Eye Test record if not already linked
		if eyeTestID == nil || *eyeTestID == 0 {
			checkupDate := time.Now()
			if rx.CheckupDate != "" {
				if parsedDate, parseErr := time.Parse("2006-01-02", rx.CheckupDate); parseErr == nil {
					checkupDate = parsedDate
				}
			}

			etNum := fmt.Sprintf("ET-%03d", numVal)
			newEt, etErr := h.db.CreateEyeTest(c.Context(), pgdb.CreateEyeTestParams{
				ShopID:          payload.ShopID,
				CustomerID:      customerID,
				TestedBy:        toInt8(payload.UserID),
				TestNumber:      etNum,
				TestDate:        pgtype.Timestamptz{Time: checkupDate, Valid: true},
				CheckupByType:   toText(rx.CheckupByType),
				DoctorName:      toText(rx.DoctorName),
				HospitalName:    toText(rx.HospitalName),
				DoctorCity:      toText(rx.DoctorCity),
				OpticalShopName: toText(rx.OpticalShopName),
				OpticalCity:     toText(rx.OpticalCity),
				ExaminerName:    toText(rx.ExaminerName),
				ReSph:           toNumeric(rx.ReSph),
				ReCyl:           toNumeric(rx.ReCyl),
				ReAxis:          toInt4(rx.ReAxis),
				ReAdd:           toNumeric(rx.ReAdd),
				RePd:            toNumeric(rx.RePd),
				RePrism:         toNumeric(rx.RePrism),
				RePrismBase:     toText(rx.RePrismBase),
				ReVisualAcuity:  toText(rx.ReVisualAcuity),
				LeSph:           toNumeric(rx.LeSph),
				LeCyl:           toNumeric(rx.LeCyl),
				LeAxis:          toInt4(rx.LeAxis),
				LeAdd:           toNumeric(rx.LeAdd),
				LePd:            toNumeric(rx.LePd),
				LePrism:         toNumeric(rx.LePrism),
				LePrismBase:     toText(rx.LePrismBase),
				LeVisualAcuity:  toText(rx.LeVisualAcuity),
				TotalPd:         toNumeric(rx.TotalPd),
				Notes:           toText(rx.Notes),
			})
			if etErr == nil {
				eyeTestID = &newEt.ID
			}
		}

		checkupDateVal := toDate(rx.CheckupDate)

		_, rxErr := h.db.CreateOrderPrescription(c.Context(), pgdb.CreateOrderPrescriptionParams{
			OrderID:               order.ID,
			EyeTestID:             toInt8Ptr(eyeTestID),
			CheckupByType:         toText(rx.CheckupByType),
			DoctorName:            toText(rx.DoctorName),
			HospitalName:          toText(rx.HospitalName),
			DoctorCity:            toText(rx.DoctorCity),
			OpticalShopName:       toText(rx.OpticalShopName),
			OpticalCity:           toText(rx.OpticalCity),
			ExaminerName:          toText(rx.ExaminerName),
			CheckupDate:           checkupDateVal,
			ReSph:                 toNumeric(rx.ReSph),
			ReCyl:                 toNumeric(rx.ReCyl),
			ReAxis:                toInt4(rx.ReAxis),
			ReAdd:                 toNumeric(rx.ReAdd),
			RePd:                  toNumeric(rx.RePd),
			RePrism:               toNumeric(rx.RePrism),
			RePrismBase:           toText(rx.RePrismBase),
			ReVisualAcuity:        toText(rx.ReVisualAcuity),
			LeSph:                 toNumeric(rx.LeSph),
			LeCyl:                 toNumeric(rx.LeCyl),
			LeAxis:                toInt4(rx.LeAxis),
			LeAdd:                 toNumeric(rx.LeAdd),
			LePd:                  toNumeric(rx.LePd),
			LePrism:               toNumeric(rx.LePrism),
			LePrismBase:           toText(rx.LePrismBase),
			LeVisualAcuity:        toText(rx.LeVisualAcuity),
			TotalPd:               toNumeric(rx.TotalPd),
			LensFor:               toText(rx.LensFor),
			LensType:              toText(rx.LensType),
			LensMaterial:          toText(rx.LensMaterial),
			LensCoating:           toText(rx.LensCoating),
			LensSide:              toText(rx.LensSide),
			LensCompany:           toText(rx.LensCompany),
			LensProduct:           toText(rx.LensProduct),
			LensIndex:             toText(rx.LensIndex),
			LensDia:               toText(rx.LensDia),
			Tint:                  toText(rx.Tint),
			ClBaseCurve:           toNumeric(rx.CLBaseCurve),
			ClDiameter:            toNumeric(rx.CLDiameter),
			ClReplacementSchedule: toText(rx.CLReplacementSchedule),
			Notes:                 toText(rx.Notes),
		})
		if rxErr != nil {
			log.Printf("CreateOrderPrescription warning: %v", rxErr)
		}
	}

	// 7. Record Initial Payment
	if req.Payment != nil && advancePaid > 0 {
		_, _ = h.db.CreateOrderPayment(c.Context(), pgdb.CreateOrderPaymentParams{
			OrderID:        order.ID,
			Amount:         toNumeric(advancePaid),
			PaymentMode:    req.Payment.PaymentMode,
			TransactionRef: toText(req.Payment.TransactionRef),
			Notes:          toText(req.Payment.Notes),
			ReceivedBy:     toInt8(payload.UserID),
		})
	}

	// 8. Initial Status History
	_, _ = h.db.CreateOrderStatusHistory(c.Context(), pgdb.CreateOrderStatusHistoryParams{
		OrderID:    order.ID,
		FromStatus: toText(""),
		ToStatus:   "pending",
		ChangedBy:  toInt8(payload.UserID),
		Notes:      toText("Order created"),
	})

	// 9. Update Customer Financials
	_ = h.db.UpdateCustomerFinancials(c.Context(), pgdb.UpdateCustomerFinancialsParams{
		ID:              customerID,
		ShopID:          payload.ShopID,
		TotalSpent:      toNumeric(grandTotal),
		OutstandingDues: toNumeric(balanceDue),
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"order": order,
		},
		"message": "order created successfully",
	})
}

type UpdateOrderRequest struct {
	Items            []OrderItemInput   `json:"items"`
	Prescription     *PrescriptionInput `json:"prescription"`
	DiscountType     string             `json:"discount_type"`
	DiscountValue    float64            `json:"discount_value"`
	ExpectedDelivery string             `json:"expected_delivery"`
	Notes            string             `json:"notes"`
}

func (h *OrderHandler) UpdateOrder(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid order ID",
		})
	}

	existing, err := h.db.GetOrderByID(c.Context(), pgdb.GetOrderByIDParams{
		ID:     id,
		ShopID: payload.ShopID,
	})
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "order not found",
		})
	}

	var req UpdateOrderRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid request body",
		})
	}

	var subtotal float64
	var totalItemTax float64
	var discountAmount float64
	var taxableAmount float64
	var grandTotal float64

	type processedItem struct {
		input      OrderItemInput
		taxAmount  float64
		totalPrice float64
	}
	var processedItems []processedItem

	if len(req.Items) > 0 {
		for _, item := range req.Items {
			if item.Quantity <= 0 {
				item.Quantity = 1
			}
			itemSubtotal := (item.UnitPrice * float64(item.Quantity)) - item.DiscountAmount
			if itemSubtotal < 0 {
				itemSubtotal = 0
			}
			itemTax := itemSubtotal * (item.TaxRate / 100.0)
			itemTotal := itemSubtotal + itemTax

			subtotal += (item.UnitPrice * float64(item.Quantity))
			totalItemTax += itemTax

			processedItems = append(processedItems, processedItem{
				input:      item,
				taxAmount:  itemTax,
				totalPrice: itemTotal,
			})
		}

		if req.DiscountType == "percentage" {
			discountAmount = subtotal * (req.DiscountValue / 100.0)
		} else {
			discountAmount = req.DiscountValue
		}
		if discountAmount > subtotal {
			discountAmount = subtotal
		}

		taxableAmount = subtotal - discountAmount
		grandTotal = taxableAmount + totalItemTax

		_ = h.db.DeleteOrderItems(c.Context(), id)
		for _, pi := range processedItems {
			detailsJSON, _ := json.Marshal(pi.input.Details)
			_, _ = h.db.CreateOrderItem(c.Context(), pgdb.CreateOrderItemParams{
				OrderID:        id,
				ProductID:      toInt8Ptr(pi.input.ProductID),
				ItemType:       pi.input.ItemType,
				Name:           pi.input.Name,
				Description:    toText(pi.input.Description),
				Quantity:       int32(pi.input.Quantity),
				UnitPrice:      toNumeric(pi.input.UnitPrice),
				DiscountAmount: toNumeric(pi.input.DiscountAmount),
				TaxRate:        toNumeric(pi.input.TaxRate),
				TaxAmount:      toNumeric(pi.taxAmount),
				TotalPrice:     toNumeric(pi.totalPrice),
				HsnCode:        toText(pi.input.HSNCode),
				Details:        detailsJSON,
			})
		}
	} else {
		subtotal = numericVal(existing.Subtotal)
		discountAmount = numericVal(existing.DiscountAmount)
		taxableAmount = numericVal(existing.TaxableAmount)
		totalItemTax = numericVal(existing.TotalTax)
		grandTotal = numericVal(existing.GrandTotal)
	}

	if req.Prescription != nil {
		rx := req.Prescription
		_ = h.db.DeleteOrderPrescription(c.Context(), id)
		_, _ = h.db.CreateOrderPrescription(c.Context(), pgdb.CreateOrderPrescriptionParams{
			OrderID:               id,
			EyeTestID:             toInt8Ptr(rx.EyeTestID),
			CheckupByType:         toText(rx.CheckupByType),
			DoctorName:            toText(rx.DoctorName),
			HospitalName:          toText(rx.HospitalName),
			DoctorCity:            toText(rx.DoctorCity),
			OpticalShopName:       toText(rx.OpticalShopName),
			OpticalCity:           toText(rx.OpticalCity),
			ExaminerName:          toText(rx.ExaminerName),
			CheckupDate:           toDate(rx.CheckupDate),
			ReSph:                 toNumeric(rx.ReSph),
			ReCyl:                 toNumeric(rx.ReCyl),
			ReAxis:                toInt4(rx.ReAxis),
			ReAdd:                 toNumeric(rx.ReAdd),
			RePd:                  toNumeric(rx.RePd),
			RePrism:               toNumeric(rx.RePrism),
			RePrismBase:           toText(rx.RePrismBase),
			ReVisualAcuity:        toText(rx.ReVisualAcuity),
			LeSph:                 toNumeric(rx.LeSph),
			LeCyl:                 toNumeric(rx.LeCyl),
			LeAxis:                toInt4(rx.LeAxis),
			LeAdd:                 toNumeric(rx.LeAdd),
			LePd:                  toNumeric(rx.LePd),
			LePrism:               toNumeric(rx.LePrism),
			LePrismBase:           toText(rx.LePrismBase),
			LeVisualAcuity:        toText(rx.LeVisualAcuity),
			TotalPd:               toNumeric(rx.TotalPd),
			LensFor:               toText(rx.LensFor),
			LensType:              toText(rx.LensType),
			LensMaterial:          toText(rx.LensMaterial),
			LensCoating:           toText(rx.LensCoating),
			LensSide:              toText(rx.LensSide),
			LensCompany:           toText(rx.LensCompany),
			LensProduct:           toText(rx.LensProduct),
			LensIndex:             toText(rx.LensIndex),
			LensDia:               toText(rx.LensDia),
			Tint:                  toText(rx.Tint),
			ClBaseCurve:           toNumeric(rx.CLBaseCurve),
			ClDiameter:            toNumeric(rx.CLDiameter),
			ClReplacementSchedule: toText(rx.CLReplacementSchedule),
			Notes:                 toText(rx.Notes),
		})
	}

	halfTax := totalItemTax / 2.0
	expectedDelivery := req.ExpectedDelivery
	if expectedDelivery == "" && existing.ExpectedDelivery.Valid {
		expectedDelivery = existing.ExpectedDelivery.Time.Format("2006-01-02")
	}
	notes := req.Notes
	if notes == "" {
		notes = existing.Notes.String
	}

	discType := req.DiscountType
	if discType == "" {
		discType = existing.DiscountType.String
	}

	updated, err := h.db.UpdateOrder(c.Context(), pgdb.UpdateOrderParams{
		ID:               id,
		ShopID:           payload.ShopID,
		Subtotal:         toNumeric(subtotal),
		DiscountType:     toText(discType),
		DiscountValue:    toNumeric(req.DiscountValue),
		DiscountAmount:   toNumeric(discountAmount),
		TaxableAmount:    toNumeric(taxableAmount),
		CgstAmount:       toNumeric(halfTax),
		SgstAmount:       toNumeric(halfTax),
		IgstAmount:       toNumeric(0),
		TotalTax:         toNumeric(totalItemTax),
		GrandTotal:       toNumeric(grandTotal),
		ExpectedDelivery: toDate(expectedDelivery),
		Notes:            toText(notes),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to update order: " + err.Error(),
		})
	}

	_, _ = h.db.CreateOrderStatusHistory(c.Context(), pgdb.CreateOrderStatusHistoryParams{
		OrderID:    id,
		FromStatus: toText(existing.Status),
		ToStatus:   existing.Status,
		ChangedBy:  toInt8(payload.UserID),
		Notes:      toText("Order details updated"),
	})

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"order": updated,
		},
		"message": "order updated successfully",
	})
}

type UpdateOrderStatusRequest struct {
	Status string `json:"status"`
	Notes  string `json:"notes"`
}

func (h *OrderHandler) UpdateOrderStatus(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid order ID",
		})
	}

	var req UpdateOrderStatusRequest
	if err := c.BodyParser(&req); err != nil || req.Status == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "status is required",
		})
	}

	existing, err := h.db.GetOrderByID(c.Context(), pgdb.GetOrderByIDParams{
		ID:     id,
		ShopID: payload.ShopID,
	})
	if err != nil {
		log.Printf("GetOrderByID error (order %d, shop %d): %v", id, payload.ShopID, err)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "order not found",
		})
	}

	updated, err := h.db.UpdateOrderStatus(c.Context(), pgdb.UpdateOrderStatusParams{
		ID:     id,
		ShopID: payload.ShopID,
		Status: req.Status,
	})
	if err != nil {
		log.Printf("UpdateOrderStatus DB error (order %d, shop %d, status %s): %v", id, payload.ShopID, req.Status, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to update order status",
		})
	}

	_, histErr := h.db.CreateOrderStatusHistory(c.Context(), pgdb.CreateOrderStatusHistoryParams{
		OrderID:    id,
		FromStatus: toText(existing.Status),
		ToStatus:   req.Status,
		ChangedBy:  toInt8(payload.UserID),
		Notes:      toText(req.Notes),
	})
	if histErr != nil {
		log.Printf("CreateOrderStatusHistory warning: %v", histErr)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    updated,
		"message": "order status updated",
	})
}

type AddPaymentRequest struct {
	Amount         float64 `json:"amount"`
	PaymentMode    string  `json:"payment_mode"`
	TransactionRef string  `json:"transaction_ref"`
	Notes          string  `json:"notes"`
}

func (h *OrderHandler) AddPayment(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid order ID",
		})
	}

	var req AddPaymentRequest
	if err := c.BodyParser(&req); err != nil || req.Amount <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "payment amount must be greater than 0",
		})
	}

	if req.PaymentMode == "" {
		req.PaymentMode = "cash"
	}

	order, err := h.db.GetOrderByID(c.Context(), pgdb.GetOrderByIDParams{
		ID:     id,
		ShopID: payload.ShopID,
	})
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "order not found",
		})
	}

	// Record payment
	payment, err := h.db.CreateOrderPayment(c.Context(), pgdb.CreateOrderPaymentParams{
		OrderID:        id,
		Amount:         toNumeric(req.Amount),
		PaymentMode:    req.PaymentMode,
		TransactionRef: toText(req.TransactionRef),
		Notes:          toText(req.Notes),
		ReceivedBy:     toInt8(payload.UserID),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to record payment",
		})
	}

	// Update order balance & payment status
	updatedOrder, _ := h.db.UpdateOrderPaymentStatus(c.Context(), pgdb.UpdateOrderPaymentStatusParams{
		ID:         id,
		ShopID:     payload.ShopID,
		AmountPaid: toNumeric(req.Amount),
	})

	// Decrease customer outstanding dues
	_ = h.db.UpdateCustomerFinancials(c.Context(), pgdb.UpdateCustomerFinancialsParams{
		ID:              order.CustomerID,
		ShopID:          payload.ShopID,
		TotalSpent:      toNumeric(0.00),
		OutstandingDues: toNumeric(-req.Amount),
	})

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"payment": payment,
			"order":   updatedOrder,
		},
		"message": "payment recorded successfully",
	})
}

func (h *OrderHandler) ListOrdersDue(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	dateStr := c.Query("date", "")

	targetDate := time.Now()
	if dateStr != "" {
		if t, err := time.Parse("2006-01-02", dateStr); err == nil {
			targetDate = t
		}
	}

	orders, err := h.db.ListOrdersDue(c.Context(), pgdb.ListOrdersDueParams{
		ShopID:       payload.ShopID,
		DeliveryDate: toDate(targetDate.Format("2006-01-02")),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to fetch due orders",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    orders,
	})
}

func (h *OrderHandler) CancelOrder(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid order ID",
		})
	}

	order, err := h.db.GetOrderByID(c.Context(), pgdb.GetOrderByIDParams{
		ID:     id,
		ShopID: payload.ShopID,
	})
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "order not found",
		})
	}

	if order.Status == "cancelled" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "order is already cancelled",
		})
	}

	updated, err := h.db.CancelOrder(c.Context(), pgdb.CancelOrderParams{
		ID:     id,
		ShopID: payload.ShopID,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to cancel order",
		})
	}

	// Restore stock for inventory items
	items, _ := h.db.ListOrderItems(c.Context(), id)
	for _, item := range items {
		if item.ProductID.Valid && item.ProductID.Int64 > 0 {
			_, _ = h.db.UpdateProductStock(c.Context(), pgdb.UpdateProductStockParams{
				ID:           item.ProductID.Int64,
				ShopID:       payload.ShopID,
				CurrentStock: item.Quantity,
			})

			orderIDInt8 := toInt8(id)
			_, _ = h.db.CreateStockMovement(c.Context(), pgdb.CreateStockMovementParams{
				ShopID:        payload.ShopID,
				ProductID:     item.ProductID.Int64,
				MovementType:  "return_in",
				Quantity:      item.Quantity,
				ReferenceType: toText("order_cancel"),
				ReferenceID:   orderIDInt8,
				Notes:         toText(fmt.Sprintf("Stock restored from cancelled Order %s", order.OrderNumber)),
				CreatedBy:     toInt8(payload.UserID),
			})
		}
	}

	_, _ = h.db.CreateOrderStatusHistory(c.Context(), pgdb.CreateOrderStatusHistoryParams{
		OrderID:    id,
		FromStatus: toText(order.Status),
		ToStatus:   "cancelled",
		ChangedBy:  toInt8(payload.UserID),
		Notes:      toText("Order cancelled"),
	})

	return c.JSON(fiber.Map{
		"success": true,
		"data":    updated,
		"message": "order cancelled and inventory restored",
	})
}
