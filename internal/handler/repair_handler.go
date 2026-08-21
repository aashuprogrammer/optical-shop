package handler

import (
	"fmt"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"optical-shop/db/pgdb"
	"optical-shop/internal/middleware"
)

type RepairHandler struct {
	db pgdb.Querier
}

func NewRepairHandler(db pgdb.Querier) *RepairHandler {
	return &RepairHandler{db: db}
}

func (h *RepairHandler) ListRepairs(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	search := c.Query("search", "")
	status := c.Query("status", "all")
	repairType := c.Query("repair_type", "all")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.Query("limit", "25"))
	if limit < 1 || limit > 100 {
		limit = 25
	}
	offset := (page - 1) * limit

	repairs, err := h.db.ListRepairs(c.Context(), pgdb.ListRepairsParams{
		ShopID:      payload.ShopID,
		Search:      search,
		Status:      status,
		RepairType:  repairType,
		LimitCount:  int32(limit),
		OffsetCount: int32(offset),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to fetch repairs",
		})
	}

	totalCount, _ := h.db.CountRepairs(c.Context(), pgdb.CountRepairsParams{
		ShopID:     payload.ShopID,
		Search:     search,
		Status:     status,
		RepairType: repairType,
	})

	stats, _ := h.db.GetRepairStats(c.Context(), payload.ShopID)

	totalPages := (int(totalCount) + limit - 1) / limit

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"repairs": repairs,
			"pagination": fiber.Map{
				"total":       totalCount,
				"page":        page,
				"limit":       limit,
				"total_pages": totalPages,
			},
			"stats": stats,
		},
	})
}

func (h *RepairHandler) GetRepair(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid repair ID",
		})
	}

	repair, err := h.db.GetRepairByID(c.Context(), pgdb.GetRepairByIDParams{
		ID:     id,
		ShopID: payload.ShopID,
	})
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "repair record not found",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    repair,
	})
}

func (h *RepairHandler) GetRepairStats(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	stats, err := h.db.GetRepairStats(c.Context(), payload.ShopID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to fetch repair statistics",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    stats,
	})
}

type CreateRepairRequest struct {
	CustomerID         *int64  `json:"customer_id"`
	CustomerName       string  `json:"customer_name"`
	CustomerPhone      string  `json:"customer_phone"`
	CustomerCity       string  `json:"customer_city"`
	RepairType         string  `json:"repair_type"` // 'frame_repair', 'lens_change', 'both', 'other'
	ItemDescription    string  `json:"item_description"`
	ProblemDescription string  `json:"problem_description"`
	Status             string  `json:"status"` // 'received', 'in_progress', 'ready', 'delivered', 'cancelled'
	TotalAmount        float64 `json:"total_amount"`
	AdvancePaid        float64 `json:"advance_paid"`
	PaymentMode        string  `json:"payment_mode"`
	ExpectedDelivery   string  `json:"expected_delivery"`
	TechnicianName     string  `json:"technician_name"`
	Notes              string  `json:"notes"`
}

func (h *RepairHandler) CreateRepair(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	var req CreateRepairRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid request body",
		})
	}

	if req.CustomerName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "customer name is required",
		})
	}

	if req.RepairType == "" {
		req.RepairType = "frame_repair"
	}
	if req.Status == "" {
		req.Status = "received"
	}
	if req.PaymentMode == "" {
		req.PaymentMode = "cash"
	}

	// Auto-generate repair number: REP-<timestamp_suffix>
	repairNumber := fmt.Sprintf("REP-%s-%04d", time.Now().Format("060102"), time.Now().Unix()%10000)
	balanceDue := req.TotalAmount - req.AdvancePaid
	if balanceDue < 0 {
		balanceDue = 0
	}

	repair, err := h.db.CreateRepair(c.Context(), pgdb.CreateRepairParams{
		ShopID:             payload.ShopID,
		CustomerID:         toInt8Ptr(req.CustomerID),
		RepairNumber:       repairNumber,
		CustomerName:       req.CustomerName,
		CustomerPhone:      toText(req.CustomerPhone),
		CustomerCity:       toText(req.CustomerCity),
		RepairType:         req.RepairType,
		ItemDescription:    toText(req.ItemDescription),
		ProblemDescription: toText(req.ProblemDescription),
		Status:             req.Status,
		TotalAmount:        toNumeric(req.TotalAmount),
		AdvancePaid:        toNumeric(req.AdvancePaid),
		BalanceDue:         toNumeric(balanceDue),
		PaymentMode:        req.PaymentMode,
		ExpectedDelivery:   toDate(req.ExpectedDelivery),
		TechnicianName:     toText(req.TechnicianName),
		Notes:              toText(req.Notes),
		CreatedBy:          toInt8(payload.UserID),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to create repair record: " + err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    repair,
		"message": "repair record created successfully",
	})
}

func (h *RepairHandler) UpdateRepair(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid repair ID",
		})
	}

	var req CreateRepairRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid request body",
		})
	}

	balanceDue := req.TotalAmount - req.AdvancePaid
	if balanceDue < 0 {
		balanceDue = 0
	}

	repair, err := h.db.UpdateRepair(c.Context(), pgdb.UpdateRepairParams{
		ID:                 id,
		ShopID:             payload.ShopID,
		CustomerName:       req.CustomerName,
		CustomerPhone:      toText(req.CustomerPhone),
		CustomerCity:       toText(req.CustomerCity),
		RepairType:         req.RepairType,
		ItemDescription:    toText(req.ItemDescription),
		ProblemDescription: toText(req.ProblemDescription),
		Status:             req.Status,
		TotalAmount:        toNumeric(req.TotalAmount),
		AdvancePaid:        toNumeric(req.AdvancePaid),
		BalanceDue:         toNumeric(balanceDue),
		PaymentMode:        req.PaymentMode,
		ExpectedDelivery:   toDate(req.ExpectedDelivery),
		TechnicianName:     toText(req.TechnicianName),
		Notes:              toText(req.Notes),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to update repair record: " + err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    repair,
		"message": "repair record updated successfully",
	})
}

type UpdateStatusRequest struct {
	Status string `json:"status"`
}

func (h *RepairHandler) UpdateRepairStatus(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid repair ID",
		})
	}

	var req UpdateStatusRequest
	if err := c.BodyParser(&req); err != nil || req.Status == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "valid status is required",
		})
	}

	repair, err := h.db.UpdateRepairStatus(c.Context(), pgdb.UpdateRepairStatusParams{
		ID:     id,
		ShopID: payload.ShopID,
		Status: req.Status,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to update status",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    repair,
		"message": "repair status updated successfully",
	})
}

func (h *RepairHandler) DeleteRepair(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid repair ID",
		})
	}

	if err := h.db.DeleteRepair(c.Context(), pgdb.DeleteRepairParams{
		ID:     id,
		ShopID: payload.ShopID,
	}); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to delete repair record",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "repair record deleted successfully",
	})
}
