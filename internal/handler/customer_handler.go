package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"optical-shop/db/pgdb"
	"optical-shop/internal/middleware"
)

type CustomerHandler struct {
	db pgdb.Querier
}

func NewCustomerHandler(db pgdb.Querier) *CustomerHandler {
	return &CustomerHandler{db: db}
}

func (h *CustomerHandler) ListCustomers(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	search := c.Query("search", "")
	filter := c.Query("filter", "all")
	city := c.Query("city", "")
	sort := c.Query("sort", "newest")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.Query("limit", "25"))
	if limit < 1 || limit > 100 {
		limit = 25
	}
	offset := (page - 1) * limit

	customers, err := h.db.ListCustomers(c.Context(), pgdb.ListCustomersParams{
		ShopID:  payload.ShopID,
		Column2: search,
		Column3: filter,
		Column4: city,
		Column5: sort,
		Limit:   int32(limit),
		Offset:  int32(offset),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to fetch customers",
		})
	}

	totalCount, _ := h.db.CountCustomers(c.Context(), pgdb.CountCustomersParams{
		ShopID:  payload.ShopID,
		Column2: search,
		Column3: filter,
		Column4: city,
	})

	stats, _ := h.db.GetCustomerStats(c.Context(), payload.ShopID)

	totalPages := (int(totalCount) + limit - 1) / limit

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"customers": customers,
			"pagination": fiber.Map{
				"total":       totalCount,
				"page":        page,
				"limit":       limit,
				"total_pages": totalPages,
			},
			"stats": fiber.Map{
				"in_book":           stats.TotalInBook,
				"new_7d":            stats.New7d,
				"total_outstanding": stats.TotalOutstanding,
			},
		},
	})
}

func (h *CustomerHandler) GetCustomer(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid customer ID",
		})
	}

	customer, err := h.db.GetCustomerByID(c.Context(), pgdb.GetCustomerByIDParams{
		ID:     id,
		ShopID: payload.ShopID,
	})
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "customer not found",
		})
	}

	eyeTests, _ := h.db.ListEyeTestsByCustomer(c.Context(), pgdb.ListEyeTestsByCustomerParams{
		CustomerID: customer.ID,
		ShopID:     payload.ShopID,
	})

	orders, _ := h.db.ListOrdersByCustomer(c.Context(), pgdb.ListOrdersByCustomerParams{
		CustomerID: customer.ID,
		ShopID:     payload.ShopID,
	})

	notes, _ := h.db.ListCustomerNotes(c.Context(), customer.ID)

	var activeJobs int64
	for _, o := range orders {
		if o.Status != "delivered" && o.Status != "cancelled" {
			activeJobs++
		}
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"customer": customer,
			"metrics": fiber.Map{
				"active_jobs":      activeJobs,
				"total_orders":     len(orders),
				"total_eye_tests":  len(eyeTests),
				"total_spent":      customer.TotalSpent,
				"outstanding_dues": customer.OutstandingDues,
			},
			"eye_tests": eyeTests,
			"orders":    orders,
			"notes":     notes,
		},
	})
}

type CreateCustomerRequest struct {
	FirstName       string `json:"first_name"`
	LastName        string `json:"last_name"`
	Phone           string `json:"phone"`
	Email           string `json:"email"`
	DateOfBirth     string `json:"date_of_birth"`
	Gender          string `json:"gender"`
	AddressLine1    string `json:"address_line1"`
	AddressLine2    string `json:"address_line2"`
	City            string `json:"city"`
	State           string `json:"state"`
	PinCode         string `json:"pin_code"`
	ProfileImageUrl string `json:"profile_image_url"`
	Notes           string `json:"notes"`
}

func (h *CustomerHandler) CreateCustomer(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	var req CreateCustomerRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid request body",
		})
	}

	if req.FirstName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "first name is required",
		})
	}

	customer, err := h.db.CreateCustomer(c.Context(), pgdb.CreateCustomerParams{
		ShopID:          payload.ShopID,
		FirstName:       req.FirstName,
		LastName:        toText(req.LastName),
		Phone:           toText(req.Phone),
		Email:           toText(req.Email),
		DateOfBirth:     toDate(req.DateOfBirth),
		Gender:          toText(req.Gender),
		AddressLine1:    toText(req.AddressLine1),
		AddressLine2:    toText(req.AddressLine2),
		City:            toText(req.City),
		State:           toText(req.State),
		PinCode:         toText(req.PinCode),
		ProfileImageUrl: toText(req.ProfileImageUrl),
		Notes:           toText(req.Notes),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to create customer",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    customer,
		"message": "customer created successfully",
	})
}

func (h *CustomerHandler) UpdateCustomer(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid customer ID",
		})
	}

	var req CreateCustomerRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid request body",
		})
	}

	customer, err := h.db.UpdateCustomer(c.Context(), pgdb.UpdateCustomerParams{
		ID:              id,
		ShopID:          payload.ShopID,
		FirstName:       req.FirstName,
		LastName:        toText(req.LastName),
		Phone:           toText(req.Phone),
		Email:           toText(req.Email),
		DateOfBirth:     toDate(req.DateOfBirth),
		Gender:          toText(req.Gender),
		AddressLine1:    toText(req.AddressLine1),
		AddressLine2:    toText(req.AddressLine2),
		City:            toText(req.City),
		State:           toText(req.State),
		PinCode:         toText(req.PinCode),
		ProfileImageUrl: toText(req.ProfileImageUrl),
		Notes:           toText(req.Notes),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to update customer",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    customer,
		"message": "customer updated successfully",
	})
}

func (h *CustomerHandler) DeleteCustomer(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid customer ID",
		})
	}

	err = h.db.SoftDeleteCustomer(c.Context(), pgdb.SoftDeleteCustomerParams{
		ID:     id,
		ShopID: payload.ShopID,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to delete customer",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "customer removed successfully",
	})
}

func (h *CustomerHandler) AddNote(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid customer ID",
		})
	}

	var req struct {
		Note string `json:"note"`
	}
	if err := c.BodyParser(&req); err != nil || req.Note == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "note content is required",
		})
	}

	note, err := h.db.CreateCustomerNote(c.Context(), pgdb.CreateCustomerNoteParams{
		CustomerID: id,
		UserID:     toInt8(payload.UserID),
		Note:       req.Note,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to save note",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    note,
	})
}

func (h *CustomerHandler) ListCities(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	cities, err := h.db.GetCustomerCities(c.Context(), payload.ShopID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to fetch cities",
		})
	}

	var nonNullCities []string
	for _, c := range cities {
		if c.Valid && c.String != "" {
			nonNullCities = append(nonNullCities, c.String)
		}
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    nonNullCities,
	})
}
