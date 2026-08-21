package handler

import (
	"fmt"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"optical-shop/db/pgdb"
	"optical-shop/internal/middleware"
	"optical-shop/internal/optical"
)

type EyeTestHandler struct {
	db pgdb.Querier
}

func NewEyeTestHandler(db pgdb.Querier) *EyeTestHandler {
	return &EyeTestHandler{db: db}
}

func (h *EyeTestHandler) ListEyeTests(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	search := c.Query("search", "")
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

	tests, err := h.db.ListEyeTests(c.Context(), pgdb.ListEyeTestsParams{
		ShopID:  payload.ShopID,
		Column2: search,
		Column3: toTimestamptz(fromDate),
		Column4: toTimestamptz(toDate),
		Limit:   int32(limit),
		Offset:  int32(offset),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to fetch eye tests",
		})
	}

	totalCount, _ := h.db.CountEyeTests(c.Context(), pgdb.CountEyeTestsParams{
		ShopID:  payload.ShopID,
		Column2: search,
		Column3: toTimestamptz(fromDate),
		Column4: toTimestamptz(toDate),
	})

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"eye_tests": tests,
			"pagination": fiber.Map{
				"total": totalCount,
				"page":  page,
				"limit": limit,
			},
		},
	})
}

func (h *EyeTestHandler) GetEyeTest(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid eye test ID",
		})
	}

	test, err := h.db.GetEyeTestByID(c.Context(), pgdb.GetEyeTestByIDParams{
		ID:     id,
		ShopID: payload.ShopID,
	})
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "eye test record not found",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    test,
	})
}

type CreateEyeTestRequest struct {
	CustomerID      int64   `json:"customer_id"`
	TestDate        string  `json:"test_date"`
	CheckupByType   string  `json:"checkup_by_type"` // dr, optical
	DoctorName      string  `json:"doctor_name"`
	HospitalName    string  `json:"hospital_name"`
	DoctorCity      string  `json:"doctor_city"`
	OpticalShopName string  `json:"optical_shop_name"`
	OpticalCity     string  `json:"optical_city"`
	ExaminerName    string  `json:"examiner_name"`
	ReSph           float64 `json:"re_sph"`
	ReCyl           float64 `json:"re_cyl"`
	ReAxis          int     `json:"re_axis"`
	ReAdd           float64 `json:"re_add"`
	RePd            float64 `json:"re_pd"`
	RePrism         float64 `json:"re_prism"`
	RePrismBase     string  `json:"re_prism_base"`
	ReVisualAcuity  string  `json:"re_visual_acuity"`
	LeSph           float64 `json:"le_sph"`
	LeCyl           float64 `json:"le_cyl"`
	LeAxis          int     `json:"le_axis"`
	LeAdd           float64 `json:"le_add"`
	LePd            float64 `json:"le_pd"`
	LePrism         float64 `json:"le_prism"`
	LePrismBase     string  `json:"le_prism_base"`
	LeVisualAcuity  string  `json:"le_visual_acuity"`
	TotalPd         float64 `json:"total_pd"`
	Notes           string  `json:"notes"`
}

func (h *EyeTestHandler) CreateEyeTest(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	var req CreateEyeTestRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid request body",
		})
	}

	if req.CustomerID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "customer ID is required",
		})
	}

	testDate := time.Now()
	if req.TestDate != "" {
		if t, err := time.Parse("2006-01-02", req.TestDate); err == nil {
			testDate = t
		}
	}

	testNumber := fmt.Sprintf("ET-%d", time.Now().Unix()%1000000)

	test, err := h.db.CreateEyeTest(c.Context(), pgdb.CreateEyeTestParams{
		ShopID:          payload.ShopID,
		CustomerID:      req.CustomerID,
		TestedBy:        toInt8(payload.UserID),
		TestNumber:      testNumber,
		TestDate:        toTimestamptz(testDate),
		CheckupByType:   toText(req.CheckupByType),
		DoctorName:      toText(req.DoctorName),
		HospitalName:    toText(req.HospitalName),
		DoctorCity:      toText(req.DoctorCity),
		OpticalShopName: toText(req.OpticalShopName),
		OpticalCity:     toText(req.OpticalCity),
		ExaminerName:    toText(req.ExaminerName),
		ReSph:           toNumeric(req.ReSph),
		ReCyl:           toNumeric(req.ReCyl),
		ReAxis:          toInt4(req.ReAxis),
		ReAdd:           toNumeric(req.ReAdd),
		RePd:            toNumeric(req.RePd),
		RePrism:         toNumeric(req.RePrism),
		RePrismBase:     toText(req.RePrismBase),
		ReVisualAcuity:  toText(req.ReVisualAcuity),
		LeSph:           toNumeric(req.LeSph),
		LeCyl:           toNumeric(req.LeCyl),
		LeAxis:          toInt4(req.LeAxis),
		LeAdd:           toNumeric(req.LeAdd),
		LePd:            toNumeric(req.LePd),
		LePrism:         toNumeric(req.LePrism),
		LePrismBase:     toText(req.LePrismBase),
		LeVisualAcuity:  toText(req.LeVisualAcuity),
		TotalPd:         toNumeric(req.TotalPd),
		Notes:           toText(req.Notes),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to save eye test record: " + err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    test,
		"message": "eye test completed successfully",
	})
}

func (h *EyeTestHandler) Transpose(c *fiber.Ctx) error {
	var req optical.TransposeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid request body",
		})
	}

	result := optical.Transpose(req.Sph, req.Cyl, req.Axis)
	return c.JSON(fiber.Map{
		"success": true,
		"data":    result,
	})
}

func (h *EyeTestHandler) ConvertToCL(c *fiber.Ctx) error {
	var req optical.CLConvertRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid request body",
		})
	}

	result := optical.ConvertSpectacleToCL(req.Sph, req.Cyl, req.Axis, req.VertexDistance)
	return c.JSON(fiber.Map{
		"success": true,
		"data":    result,
	})
}
