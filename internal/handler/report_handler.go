package handler

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"optical-shop/db/pgdb"
	"optical-shop/internal/middleware"
)

type ReportHandler struct {
	db pgdb.Querier
}

func NewReportHandler(db pgdb.Querier) *ReportHandler {
	return &ReportHandler{db: db}
}

func (h *ReportHandler) GetOverviewStats(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	stats, err := h.db.GetDashboardOverviewStats(c.Context(), payload.ShopID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to fetch dashboard stats",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"today_sales":            stats.TodaySales,
			"yesterday_sales":        stats.YesterdaySales,
			"today_orders_count":     stats.TodayOrdersCount,
			"yesterday_orders_count": stats.YesterdayOrdersCount,
			"active_customers":       stats.ActiveCustomers,
			"pending_orders":         stats.PendingOrders,
			"today_eye_tests":        stats.TodayEyeTests,
			"total_inventory":        stats.TotalInventoryQty,
		},
	})
}

func (h *ReportHandler) GetRevenueChart(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	period := c.Query("period", "week")

	now := time.Now()
	var fromDate, toDate time.Time

	switch period {
	case "month":
		fromDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		toDate = now
	case "year":
		fromDate = time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())
		toDate = now
	default: // week (last 7 days)
		fromDate = now.AddDate(0, 0, -6)
		toDate = now
	}

	sales, err := h.db.GetDailySalesForRange(c.Context(), pgdb.GetDailySalesForRangeParams{
		ShopID:  payload.ShopID,
		Column2: toTimestamptz(fromDate),
		Column3: toTimestamptz(toDate),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to fetch revenue chart data",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"sales":  sales,
			"period": period,
		},
	})
}

func (h *ReportHandler) GetGSTReport(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	fromStr := c.Query("from", "")
	toStr := c.Query("to", "")

	fromDate := time.Now().AddDate(0, -1, 0)
	toDate := time.Now()

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

	report, err := h.db.GetGSTSummaryReport(c.Context(), pgdb.GetGSTSummaryReportParams{
		ShopID:  payload.ShopID,
		Column2: toTimestamptz(fromDate),
		Column3: toTimestamptz(toDate),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to generate GST report",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    report,
	})
}

func (h *ReportHandler) GetTopProducts(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	if limit < 1 || limit > 50 {
		limit = 10
	}

	fromDate := time.Now().AddDate(0, -1, 0)
	toDate := time.Now()

	products, err := h.db.GetTopSellingProducts(c.Context(), pgdb.GetTopSellingProductsParams{
		ShopID:  payload.ShopID,
		Column2: toTimestamptz(fromDate),
		Column3: toTimestamptz(toDate),
		Limit:   int32(limit),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to fetch top products",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    products,
	})
}

func (h *ReportHandler) GetStockValuation(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	val, err := h.db.GetStockValuationSummary(c.Context(), payload.ShopID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to calculate stock valuation",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    val,
	})
}

func (h *ReportHandler) GetPaymentModesBreakdown(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	fromDate := time.Now().AddDate(0, -1, 0)
	toDate := time.Now()

	breakdown, err := h.db.GetPaymentModeBreakdown(c.Context(), pgdb.GetPaymentModeBreakdownParams{
		ShopID:  payload.ShopID,
		Column2: toTimestamptz(fromDate),
		Column3: toTimestamptz(toDate),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to fetch payment modes",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    breakdown,
	})
}
