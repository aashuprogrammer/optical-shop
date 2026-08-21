package handler

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"optical-shop/db/pgdb"
	"optical-shop/internal/middleware"
)

type ProductHandler struct {
	db pgdb.Querier
}

func NewProductHandler(db pgdb.Querier) *ProductHandler {
	return &ProductHandler{db: db}
}

func (h *ProductHandler) ListProducts(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	search := c.Query("search", "")
	category := c.Query("category", "all")
	stock := c.Query("stock", "any")
	sort := c.Query("sort", "type_name")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.Query("limit", "25"))
	if limit < 1 || limit > 100 {
		limit = 25
	}
	offset := (page - 1) * limit

	products, err := h.db.ListProducts(c.Context(), pgdb.ListProductsParams{
		ShopID:  payload.ShopID,
		Column2: search,
		Column3: category,
		Column4: stock,
		Column5: sort,
		Limit:   int32(limit),
		Offset:  int32(offset),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to fetch products",
		})
	}

	totalCount, _ := h.db.CountProducts(c.Context(), pgdb.CountProductsParams{
		ShopID:  payload.ShopID,
		Column2: search,
		Column3: category,
		Column4: stock,
	})

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"products": products,
			"pagination": fiber.Map{
				"total": totalCount,
				"page":  page,
				"limit": limit,
			},
		},
	})
}

func (h *ProductHandler) GetProduct(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid product ID",
		})
	}

	product, err := h.db.GetProductByID(c.Context(), pgdb.GetProductByIDParams{
		ID:     id,
		ShopID: payload.ShopID,
	})
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"error":   "product not found",
		})
	}

	images, _ := h.db.ListProductImages(c.Context(), product.ID)

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"product": product,
			"images":  images,
		},
	})
}

type CreateProductRequest struct {
	Name                  string  `json:"name"`
	SKU                   string  `json:"sku"`
	Category              string  `json:"category"`
	Brand                 string  `json:"brand"`
	Model                 string  `json:"model"`
	Color                 string  `json:"color"`
	Size                  string  `json:"size"`
	Description           string  `json:"description"`
	PurchasePrice         float64 `json:"purchase_price"`
	SellingPrice          float64 `json:"selling_price"`
	HSNCode               string  `json:"hsn_code"`
	GSTRate               float64 `json:"gst_rate"`
	CurrentStock          int     `json:"current_stock"`
	MinStockLevel         int     `json:"min_stock_level"`
	Barcode               string  `json:"barcode"`
	ImageURL              string  `json:"image_url"`
	FrameType             string  `json:"frame_type"`
	FrameMaterial         string  `json:"frame_material"`
	FrameShape            string  `json:"frame_shape"`
	TempleLength          float64 `json:"temple_length"`
	BridgeWidth           float64 `json:"bridge_width"`
	LensWidth             float64 `json:"lens_width"`
	GenderTarget          string  `json:"gender_target"`
	CLReplacementSchedule string  `json:"cl_replacement_schedule"`
	CLBaseCurve           float64 `json:"cl_base_curve"`
	CLDiameter            float64 `json:"cl_diameter"`
	CLWaterContent        string  `json:"cl_water_content"`
	CLMaterial            string  `json:"cl_material"`
}

func (h *ProductHandler) CreateProduct(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	var req CreateProductRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid request body",
		})
	}

	if req.Name == "" || req.Category == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "product name and category are required",
		})
	}

	minStock := int32(req.MinStockLevel)
	if minStock <= 0 {
		minStock = 5
	}

	product, err := h.db.CreateProduct(c.Context(), pgdb.CreateProductParams{
		ShopID:                payload.ShopID,
		Name:                  req.Name,
		Sku:                   toText(req.SKU),
		Category:              req.Category,
		Brand:                 toText(req.Brand),
		Model:                 toText(req.Model),
		Color:                 toText(req.Color),
		Size:                  toText(req.Size),
		Description:           toText(req.Description),
		PurchasePrice:         toNumeric(req.PurchasePrice),
		SellingPrice:          toNumeric(req.SellingPrice),
		HsnCode:               toText(req.HSNCode),
		GstRate:               toNumeric(req.GSTRate),
		CurrentStock:          int32(req.CurrentStock),
		MinStockLevel:         minStock,
		Barcode:               toText(req.Barcode),
		ImageUrl:              toText(req.ImageURL),
		FrameType:             toText(req.FrameType),
		FrameMaterial:         toText(req.FrameMaterial),
		FrameShape:            toText(req.FrameShape),
		TempleLength:          toNumeric(req.TempleLength),
		BridgeWidth:           toNumeric(req.BridgeWidth),
		LensWidth:             toNumeric(req.LensWidth),
		GenderTarget:          toText(req.GenderTarget),
		ClReplacementSchedule: toText(req.CLReplacementSchedule),
		ClBaseCurve:           toNumeric(req.CLBaseCurve),
		ClDiameter:            toNumeric(req.CLDiameter),
		ClWaterContent:        toText(req.CLWaterContent),
		ClMaterial:            toText(req.CLMaterial),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to create product",
		})
	}

	if req.CurrentStock > 0 {
		_, _ = h.db.CreateStockMovement(c.Context(), pgdb.CreateStockMovementParams{
			ShopID:        payload.ShopID,
			ProductID:     product.ID,
			MovementType:  "purchase_in",
			Quantity:      int32(req.CurrentStock),
			ReferenceType: toText("manual"),
			Notes:         toText("Initial opening stock"),
			CreatedBy:     toInt8(payload.UserID),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data":    product,
		"message": "product added to inventory",
	})
}

func (h *ProductHandler) UpdateProduct(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid product ID",
		})
	}

	var req CreateProductRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid request body",
		})
	}

	minStock := int32(req.MinStockLevel)

	product, err := h.db.UpdateProduct(c.Context(), pgdb.UpdateProductParams{
		ID:                    id,
		ShopID:                payload.ShopID,
		Name:                  req.Name,
		Sku:                   toText(req.SKU),
		Category:              req.Category,
		Brand:                 toText(req.Brand),
		Model:                 toText(req.Model),
		Color:                 toText(req.Color),
		Size:                  toText(req.Size),
		Description:           toText(req.Description),
		PurchasePrice:         toNumeric(req.PurchasePrice),
		SellingPrice:          toNumeric(req.SellingPrice),
		HsnCode:               toText(req.HSNCode),
		GstRate:               toNumeric(req.GSTRate),
		MinStockLevel:         minStock,
		Barcode:               toText(req.Barcode),
		ImageUrl:              toText(req.ImageURL),
		FrameType:             toText(req.FrameType),
		FrameMaterial:         toText(req.FrameMaterial),
		FrameShape:            toText(req.FrameShape),
		TempleLength:          toNumeric(req.TempleLength),
		BridgeWidth:           toNumeric(req.BridgeWidth),
		LensWidth:             toNumeric(req.LensWidth),
		GenderTarget:          toText(req.GenderTarget),
		ClReplacementSchedule: toText(req.CLReplacementSchedule),
		ClBaseCurve:           toNumeric(req.CLBaseCurve),
		ClDiameter:            toNumeric(req.CLDiameter),
		ClWaterContent:        toText(req.CLWaterContent),
		ClMaterial:            toText(req.CLMaterial),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to update product",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    product,
		"message": "product updated successfully",
	})
}

type StockAdjustRequest struct {
	Quantity     int    `json:"quantity"` // positive for add, negative for remove
	MovementType string `json:"movement_type"`
	Notes        string `json:"notes"`
}

func (h *ProductHandler) AdjustStock(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid product ID",
		})
	}

	var req StockAdjustRequest
	if err := c.BodyParser(&req); err != nil || req.Quantity == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "non-zero adjustment quantity is required",
		})
	}

	if req.MovementType == "" {
		if req.Quantity > 0 {
			req.MovementType = "adjustment_in"
		} else {
			req.MovementType = "adjustment_out"
		}
	}

	product, err := h.db.UpdateProductStock(c.Context(), pgdb.UpdateProductStockParams{
		ID:           id,
		ShopID:       payload.ShopID,
		CurrentStock: int32(req.Quantity),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to adjust stock level",
		})
	}

	_, _ = h.db.CreateStockMovement(c.Context(), pgdb.CreateStockMovementParams{
		ShopID:        payload.ShopID,
		ProductID:     id,
		MovementType:  req.MovementType,
		Quantity:      int32(req.Quantity),
		ReferenceType: toText("manual"),
		Notes:         toText(req.Notes),
		CreatedBy:     toInt8(payload.UserID),
	})

	return c.JSON(fiber.Map{
		"success": true,
		"data":    product,
		"message": "stock updated successfully",
	})
}

func (h *ProductHandler) GetLowStockProducts(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	items, err := h.db.GetLowStockProducts(c.Context(), payload.ShopID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to fetch low stock products",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    items,
	})
}

func (h *ProductHandler) DeleteProduct(c *fiber.Ctx) error {
	payload := middleware.GetAuthPayload(c)
	id, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "invalid product ID",
		})
	}

	err = h.db.SoftDeleteProduct(c.Context(), pgdb.SoftDeleteProductParams{
		ID:     id,
		ShopID: payload.ShopID,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "failed to delete product",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "product deleted successfully",
	})
}
