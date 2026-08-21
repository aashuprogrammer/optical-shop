package server

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"optical-shop/db/pgdb"
	"optical-shop/internal/config"
	"optical-shop/internal/handler"
	"optical-shop/internal/middleware"
	"optical-shop/internal/storage"
	"optical-shop/internal/token"
)

type Server struct {
	app        *fiber.App
	cfg        *config.Config
	db         pgdb.Querier
	tokenMaker *token.PasetoMaker
}

func NewServer(cfg *config.Config, db pgdb.Querier, tokenMaker *token.PasetoMaker, r2Storage *storage.R2Service) *Server {
	app := fiber.New(fiber.Config{
		AppName:      "OptiSuite Backend API",
		ServerHeader: "Fiber",
		BodyLimit:    20 * 1024 * 1024, // 20 MB max for file uploads
	})

	// Middlewares
	app.Use(recover.New())
	app.Use(logger.New())

	// CORS
	corsAllowOrigins := strings.Join(cfg.CORSOrigins, ", ")
	if corsAllowOrigins == "" {
		corsAllowOrigins = "*"
	}
	app.Use(cors.New(cors.Config{
		AllowOrigins:     corsAllowOrigins,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, Cookie",
		AllowMethods:     "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
		AllowCredentials: true,
	}))

	// Serve local uploads if directory exists
	app.Static("/uploads", "./uploads")

	// Handlers
	authH := handler.NewAuthHandler(db, tokenMaker, cfg)
	shopH := handler.NewShopHandler(db)
	customerH := handler.NewCustomerHandler(db)
	eyetestH := handler.NewEyeTestHandler(db)
	productH := handler.NewProductHandler(db)
	orderH := handler.NewOrderHandler(db)
	repairH := handler.NewRepairHandler(db)
	vendorH := handler.NewVendorHandler(db)
	purchaseH := handler.NewPurchaseHandler(db)
	expenseH := handler.NewExpenseHandler(db)
	reportH := handler.NewReportHandler(db)
	settingsH := handler.NewSettingsHandler(db)
	uploadH := handler.NewUploadHandler(r2Storage)

	// Health Check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "healthy",
			"service": "OptiSuite API",
		})
	})

	api := app.Group("/api/v1")

	// Public Routes
	api.Post("/auth/login", authH.Login)

	// Protected Routes
	authMiddleware := middleware.AuthMiddleware(tokenMaker)
	protected := api.Group("", authMiddleware)

	// Auth
	protected.Get("/auth/me", authH.Me)
	protected.Post("/auth/logout", authH.Logout)
	protected.Put("/auth/password", authH.UpdatePassword)
	protected.Put("/auth/profile-photo", authH.UpdateProfilePhoto)

	// Shop Profile
	protected.Get("/shop", shopH.GetShopProfile)
	protected.Put("/shop", middleware.RequireRole("admin"), shopH.UpdateShopProfile)

	// Customers
	protected.Get("/customers", customerH.ListCustomers)
	protected.Get("/customers/cities", customerH.ListCities)
	protected.Get("/customers/:id", customerH.GetCustomer)
	protected.Post("/customers", customerH.CreateCustomer)
	protected.Put("/customers/:id", customerH.UpdateCustomer)
	protected.Delete("/customers/:id", customerH.DeleteCustomer)
	protected.Post("/customers/:id/notes", customerH.AddNote)

	// Eye Tests
	protected.Get("/eye-tests", eyetestH.ListEyeTests)
	protected.Get("/eye-tests/:id", eyetestH.GetEyeTest)
	protected.Post("/eye-tests", eyetestH.CreateEyeTest)
	protected.Post("/eye-tests/transpose", eyetestH.Transpose)
	protected.Post("/eye-tests/convert-to-cl", eyetestH.ConvertToCL)
	protected.Post("/eye-tests/convert-cl", eyetestH.ConvertToCL)

	// Products
	protected.Get("/products", productH.ListProducts)
	protected.Get("/products/low-stock", productH.GetLowStockProducts)
	protected.Get("/products/:id", productH.GetProduct)
	protected.Post("/products", productH.CreateProduct)
	protected.Put("/products/:id", productH.UpdateProduct)
	protected.Post("/products/:id/stock-adjust", productH.AdjustStock)
	protected.Post("/products/:id/stock", productH.AdjustStock)
	protected.Delete("/products/:id", productH.DeleteProduct)

	// Orders & POS Billing
	protected.Get("/orders", orderH.ListOrders)
	protected.Get("/orders/due", orderH.ListOrdersDue)
	protected.Get("/orders/:id", orderH.GetOrder)
	protected.Post("/orders", orderH.CreateOrder)
	protected.Put("/orders/:id", orderH.UpdateOrder)
	protected.Patch("/orders/:id/status", orderH.UpdateOrderStatus)
	protected.Put("/orders/:id/status", orderH.UpdateOrderStatus)
	protected.Post("/orders/:id/payments", orderH.AddPayment)
	protected.Post("/orders/:id/cancel", orderH.CancelOrder)
	protected.Delete("/orders/:id", orderH.CancelOrder)

	// Repairs & Services (Dedicated Repairing Section)
	protected.Get("/repairs", repairH.ListRepairs)
	protected.Get("/repairs/stats", repairH.GetRepairStats)
	protected.Get("/repairs/:id", repairH.GetRepair)
	protected.Post("/repairs", repairH.CreateRepair)
	protected.Put("/repairs/:id", repairH.UpdateRepair)
	protected.Patch("/repairs/:id/status", repairH.UpdateRepairStatus)
	protected.Delete("/repairs/:id", repairH.DeleteRepair)

	// Vendors
	protected.Get("/vendors", vendorH.ListVendors)
	protected.Get("/vendors/:id", vendorH.GetVendor)
	protected.Post("/vendors", vendorH.CreateVendor)
	protected.Put("/vendors/:id", vendorH.UpdateVendor)
	protected.Delete("/vendors/:id", vendorH.DeleteVendor)

	// Purchases
	protected.Get("/purchase-bills", purchaseH.ListBills)
	protected.Get("/purchase-bills/:id", purchaseH.GetBill)
	protected.Post("/purchase-bills", purchaseH.CreateBill)
	protected.Post("/purchase-bills/payments", purchaseH.RecordPayment)
	protected.Get("/purchases/bills", purchaseH.ListBills)
	protected.Get("/purchases/bills/:id", purchaseH.GetBill)
	protected.Post("/purchases/bills", purchaseH.CreateBill)
	protected.Post("/purchases/payments", purchaseH.RecordPayment)

	// Expenses
	protected.Get("/expenses", expenseH.ListExpenses)
	protected.Get("/expenses/categories", expenseH.ListCategories)
	protected.Post("/expenses", expenseH.CreateExpense)
	protected.Post("/expenses/categories", expenseH.CreateCategory)
	protected.Delete("/expenses/:id", expenseH.DeleteExpense)

	// Reports & Analytics
	protected.Get("/reports/overview", reportH.GetOverviewStats)
	protected.Get("/reports/revenue-chart", reportH.GetRevenueChart)
	protected.Get("/reports/revenue", reportH.GetRevenueChart)
	protected.Get("/reports/gst", reportH.GetGSTReport)
	protected.Get("/reports/top-products", reportH.GetTopProducts)
	protected.Get("/reports/stock-valuation", reportH.GetStockValuation)
	protected.Get("/reports/payment-modes", reportH.GetPaymentModesBreakdown)

	// Settings & User Management
	protected.Get("/settings", settingsH.ListSettings)
	protected.Put("/settings", middleware.RequireRole("admin"), settingsH.UpsertSetting)
	protected.Post("/settings", middleware.RequireRole("admin"), settingsH.UpsertSetting)
	protected.Get("/settings/users", middleware.RequireRole("admin"), settingsH.ListUsers)
	protected.Post("/settings/users", middleware.RequireRole("admin"), settingsH.CreateUser)
	protected.Put("/settings/users/:id", middleware.RequireRole("admin"), settingsH.UpdateUser)
	protected.Delete("/settings/users/:id", middleware.RequireRole("admin"), settingsH.DeleteUser)
	protected.Get("/settings/activity-logs", middleware.RequireRole("admin"), settingsH.ListActivityLogs)

	// File Upload
	protected.Post("/upload", uploadH.Upload)

	return &Server{
		app:        app,
		cfg:        cfg,
		db:         db,
		tokenMaker: tokenMaker,
	}
}

func (s *Server) Listen() error {
	addr := ":" + s.cfg.Port
	return s.app.Listen(addr)
}
