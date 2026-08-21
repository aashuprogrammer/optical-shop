# Implementation Plan — OptiSuite

> Phased build order from schema to deployment.

---

## Phase 0: Project Scaffolding (Day 1)

### 0.1 Repository Structure
- Create the full directory structure as defined in `architecture.md`
- Initialize Go module (`go mod init`)
- Initialize Next.js project (App Router, TypeScript)
- Create `.env.example` with all required variables
- Create `docker-compose.yml` for local dev (Postgres 15)

### 0.2 Configuration Files
- Set up `sqlc.yml` (provided by user)
- Set up `Makefile` (provided by user)
- Ensure compatibility with user's existing config

### 0.3 Docker Local Dev
- Postgres container with volume persistence
- Backend container with hot-reload (Air or similar)
- Frontend container with `npm run dev`

**Deliverable**: Running `docker-compose up` starts all three services, Postgres is accessible.

---

## Phase 1: Database Schema & sqlc (Days 2-3)

### 1.1 Single Migration File
- Write `000001_init_schema.up.sql` with all 28 tables as defined in `database-schema.md`
- Write `000001_init_schema.down.sql` (DROP all tables in reverse dependency order)
- Include all indexes and constraints
- Seed default data:
  - One shop row (Demo Optical)
  - One admin user (manual credentials)
  - Default expense categories (Rent, Utilities, Salary, Marketing, Supplies, Maintenance, Other)

### 1.2 sqlc Queries
- Write `.sql` query files for each module in `db/queries/`
- Run `sqlc generate` to produce type-safe Go code
- Verify generated code compiles

**Deliverable**: `make migrateup` creates full schema; `make sqlc` generates Go code without errors.

---

## Phase 2: Backend Core (Days 4-7)

### 2.1 Server Bootstrap
- Fiber v2 HTTP server setup
- Configuration loading from `.env`
- Database connection pool (pgx/v5)
- Structured logging (zerolog)
- CORS middleware
- Request ID middleware
- Error handling middleware

### 2.2 Auth Module
- Paseto v2 token maker (create + verify)
- Login handler (`POST /api/v1/auth/login`)
  - Plain-text password comparison
  - Generate Paseto token with user + shop payload
  - Set httpOnly cookie
- Auth middleware (extract + verify token on every request)
- `GET /api/v1/auth/me` — return current user info
- `POST /api/v1/auth/logout` — clear cookie
- Role-based authorization middleware

### 2.3 File Upload Module
- Cloudflare R2 client (AWS S3-compatible SDK)
- Upload handler (`POST /api/v1/upload`)
- File validation (type, size)
- Path generation per entity type
- Return public URL

**Deliverable**: Login works, token is issued, protected routes reject unauthorized requests, file upload stores to R2.

---

## Phase 3: Core Business Modules — Backend (Days 8-16)

### 3.1 Customer Module (Days 8-9)
- CRUD handlers for customers
- Customer notes CRUD
- Search (name, phone, city, address, pin)
- Sorting and filtering (with dues, by city)
- Customer metrics (active jobs, avg retail, eye tests, invoices)
- Customer history aggregation
- Pagination

### 3.2 Product / Inventory Module (Days 9-10)
- CRUD handlers for products (all categories)
- Category-aware field validation (frame fields, CL fields, etc.)
- Search and multi-filter
- Stock adjustment endpoint
- Stock movement logging
- Low-stock alert query
- Product image management

### 3.3 Eye Test Module (Days 10-11)
- CRUD handlers for eye tests
- Auto-generate test number (ET-001, ET-002, ...)
- Search by test number, customer name, phone
- Date range filtering
- Optical utility endpoints:
  - Auto-transpose (plus/minus cylinder)
  - Spectacle-to-contact lens conversion
  - Spherical equivalent calculation

### 3.4 Order / Billing Module (Days 11-14)
- Create order (multi-step: customer, items, prescription, payment)
- Billing calculations:
  - Line item totals
  - Subtotal
  - Discount (flat or percentage)
  - GST calculation (CGST + SGST)
  - Grand total
  - Balance due
- Order prescription snapshot (copy from eye test or manual entry)
- Payment recording (multiple payments per order)
- Status transitions with history logging
- Stock deduction on order creation
- Stock restoration on order cancellation
- Order search and filtering
- Auto-generate order number (ORD-1, ORD-2, ...)
- Update customer denormalized fields (total_spent, outstanding_dues)

### 3.5 Purchases & Vendors Module (Days 14-15)
- Vendor CRUD
- Purchase bill CRUD with line items
- Stock increase on purchase bill creation (stock_movements)
- Vendor payment recording
- Vendor ledger aggregation
- Bill status management

### 3.6 Offers Module (Day 15)
- Offer CRUD
- Coupon validation endpoint
- Usage tracking
- Auto-expire check

### 3.7 Expenses Module (Day 15)
- Expense CRUD
- Expense category CRUD
- Summary aggregation (total, one-time, recurring)
- Date range filtering

### 3.8 Membership Module (Day 16)
- Tier CRUD
- Card issuance
- Points add/redeem
- Auto-expiry check

### 3.9 Notifications (Day 16)
- Create notifications (called internally by other modules)
- List/read notifications for current user
- Mark read / mark all read
- Notification types: order_due, low_stock, payment_received

### 3.10 Reports / Dashboard (Day 16)
- Dashboard overview endpoint (KPIs)
- Revenue chart data endpoint
- Orders due today
- Sales report (daily/monthly)
- GST report
- Outstanding dues report
- Top-selling products
- Stock valuation
- Payment mode breakdown
- Staff performance

### 3.11 Activity Logging (Throughout)
- Log create/update/delete actions for auditable entities
- Login/logout logging

**Deliverable**: All REST endpoints functional, tested with HTTP client (Postman/curl).

---

## Phase 4: Frontend Foundation (Days 17-20)

### 4.1 Next.js Setup
- App Router structure
- Layout hierarchy (root → auth → dashboard)
- Global CSS with design tokens from `ui-plan.md`
- Google Fonts (Inter, Noto Sans Devanagari, JetBrains Mono)
- API client utility (fetch wrapper with auth)
- Auth context/provider
- Route protection (redirect to login if no token)

### 4.2 Design System Components
Build all core UI components:
- Button, Input, Select, Textarea, DatePicker
- Card, Modal, Drawer, Toast
- Badge, Avatar, Skeleton, EmptyState
- Tabs, Stepper, SearchInput
- DataTable, Pagination

### 4.3 Layout Components
- Sidebar (desktop) with collapse toggle
- Bottom navigation (mobile)
- Top bar (shop name, notifications, user menu)
- Responsive container
- Page transition wrapper (framer-motion)

### 4.4 i18n Setup
- Configure `next-intl`
- Create `en.json` and `hi.json` with all static strings
- Language switcher component
- Dynamic translation API integration

**Deliverable**: Running frontend with design system, layout, auth flow (login → dashboard redirect), language switching.

---

## Phase 5: Frontend Modules (Days 21-32)

### 5.1 Dashboard / Home (Days 21-22)
- KPI cards with count-up animation
- Quick action cards (New Order: Spectacles, Contact Lenses, etc.)
- Revenue chart (recharts bar chart)
- Orders due today section
- Notification bell with badge
- Mobile: bottom nav, swipeable notification carousel

### 5.2 Customers (Days 22-24)
- Customer list with search, sort, filter
- Split view (desktop): list + detail panel
- Customer detail panel (metrics, history)
- Full profile page
- Add/edit customer form (with image upload)
- Mobile: card-based list, tap to open profile

### 5.3 Orders (Days 24-28)
- Order list with status tabs and search
- Order detail view with progress stepper
- **Order creation wizard** (the most complex UI):
  - Step 1: Customer selection/creation
  - Step 2: Prescription entry (PrescriptionForm component)
  - Step 3: Product selection (search inventory, add line items)
  - Step 4: Pricing & payment (auto-calculations, payment mode)
- Payment recording modal
- Status update flow
- Mobile: full-screen stepper, bottom-sheet for actions

### 5.4 Products (Days 28-29)
- Product list with type filter tabs
- Product detail panel
- Add/edit product form (category-specific fields)
- Stock adjustment modal
- Low-stock indicators

### 5.5 Eye Tests (Days 29-30)
- Eye test list with date range filter
- Eye test form (prescription entry)
- Eye test detail view
- Lens power tools page (transposition calculator, CL converter)

### 5.6 Purchases (Day 30)
- Purchase bills list
- New purchase bill form (vendor select, line items)
- Vendor list + detail
- Vendor ledger view
- Payment recording

### 5.7 Offers, Expenses, Membership (Day 31)
- Offers: list with overview cards, create form
- Expenses: list with date filters, overview cards, create form
- Membership: tiers list, issued cards list, create tier form

### 5.8 Reports (Day 31)
- Reports dashboard with charts
- Date range selector
- Export functionality (future: PDF/CSV)

### 5.9 Settings (Day 32)
- Shop profile editor
- Tax/GST configuration
- Invoice settings
- User management (admin only)
- Language preference toggle
- Activity log viewer

### 5.10 Chatbot Widget (Day 32)
- Floating action button (bottom-right)
- Expandable chat panel
- Pre-built FAQ responses
- Simple message interface

**Deliverable**: All frontend screens implemented, connected to backend API.

---

## Phase 6: Integration & Polish (Days 33-36)

### 6.1 Full Integration Testing
- End-to-end flows: login → create customer → create eye test → create order → payment → delivery
- Verify all calculations (billing, GST, stock)
- Test responsive behavior on multiple viewport sizes
- Test Hindi language mode

### 6.2 Translation Service
- Set up translation API integration (Google Translate or similar)
- Implement two-tier caching (in-memory + DB)
- Translate dynamic content in customer notes, product descriptions
- Test cache hit/miss behavior

### 6.3 UI Polish
- Loading states / skeletons for all data-fetching screens
- Error states with retry
- Empty states with illustrations
- Micro-animations refinement
- Toast notifications for CRUD operations
- Keyboard shortcuts (desktop)
- Print-friendly invoice view

### 6.4 Performance
- Optimize database queries (analyze slow queries)
- Frontend: lazy loading for non-critical routes
- Image optimization (Next.js Image component)
- API response caching where appropriate

---

## Phase 7: Docker & Deployment (Days 37-38)

### 7.1 Dockerfiles
- Backend Dockerfile (multi-stage: build → minimal runtime)
- Frontend Dockerfile (multi-stage: build → nginx serve)
- Production docker-compose with proper networking

### 7.2 Production Configuration
- Environment variable documentation
- Health check endpoints
- Graceful shutdown handling
- Database connection retry logic

---

## Phase 8: Testing & Bug Fixes (Days 39-42)

- Run full test suite (see `testing-plan.md`)
- Fix identified bugs
- Accessibility audit
- Cross-browser testing (Chrome, Firefox, Safari on mobile)
- Final review of all screens against reference product

---

## Timeline Summary

| Phase | Days | Duration | Focus |
|-------|------|----------|-------|
| 0 | 1 | 1 day | Scaffolding |
| 1 | 2-3 | 2 days | Database + sqlc |
| 2 | 4-7 | 4 days | Backend core (auth, upload) |
| 3 | 8-16 | 9 days | Backend modules |
| 4 | 17-20 | 4 days | Frontend foundation |
| 5 | 21-32 | 12 days | Frontend modules |
| 6 | 33-36 | 4 days | Integration & polish |
| 7 | 37-38 | 2 days | Docker & deployment |
| 8 | 39-42 | 4 days | Testing & fixes |
| **Total** | | **~42 days** | |

---

## Makefile Commands Expected

The following commands should exist in the Makefile:

| Command | Action |
|---------|--------|
| `make dev` | Start backend dev server with hot-reload |
| `make migrateup` | Run all pending migrations |
| `make migrateup1` | Run one migration up |
| `make migratedown` | Rollback all migrations |
| `make migratedown1` | Rollback one migration |
| `make migratedrop` | Drop all tables (force) |
| `make sqlc` | Generate sqlc Go code |

> **Note**: User has confirmed they will provide the Makefile and sqlc.yml themselves. The project structure is designed to be compatible with the standard sqlc + golang-migrate workflow.
