# Testing Plan — OptiSuite

> Unit, integration, and E2E coverage plan per module.

---

## 1. Testing Strategy Overview

| Level | Tool | Scope | Coverage Target |
|-------|------|-------|-----------------|
| **Unit tests** (Backend) | Go `testing` + `testify` | Business logic, calculations, utilities | 90%+ for critical logic |
| **Unit tests** (Frontend) | Jest + React Testing Library | Components, hooks, utilities | 80%+ for components |
| **Integration tests** (Backend) | Go `testing` + test DB | API handlers + database queries | All CRUD endpoints |
| **E2E tests** | Playwright | Full user flows in browser | Critical paths |
| **Manual testing** | Browser + devices | UI/UX, responsive behavior | All screens |

---

## 2. Backend Unit Tests

### 2.1 Auth Module
| Test | Description |
|------|-------------|
| `TestCreatePasetoToken` | Valid token creation with correct payload |
| `TestVerifyPasetoToken` | Valid token verification |
| `TestExpiredToken` | Reject expired token |
| `TestInvalidToken` | Reject tampered/malformed token |
| `TestLoginSuccess` | Correct credentials → token returned |
| `TestLoginWrongPassword` | Wrong password → 401 |
| `TestLoginInactiveUser` | Inactive account → 403 |
| `TestAuthMiddleware` | Protected route with/without token |
| `TestRoleAuthorization` | Admin-only endpoint rejects staff |

### 2.2 Optical Calculations
| Test | Description |
|------|-------------|
| `TestTransposePlusToMinus` | +2.00/+1.00x090 → +3.00/-1.00x180 |
| `TestTransposeMinusToPlus` | -3.00/-1.50x180 → -4.50/+1.50x090 |
| `TestTransposeAxisWrapAround` | Axis > 180 wraps correctly |
| `TestTransposeZeroCyl` | 0 CYL → no change |
| `TestCLConversionLowPower` | Power < 4D → minimal change |
| `TestCLConversionHighMinus` | -8.00D spectacle → correct CL power |
| `TestCLConversionHighPlus` | +6.00D spectacle → correct CL power |
| `TestCLConversionCustomVertex` | Non-standard vertex distance |
| `TestSphericalEquivalent` | SPH + CYL/2 correct |

### 2.3 Billing Calculations
| Test | Description |
|------|-------------|
| `TestLineItemTotal` | Quantity * unit price |
| `TestSubtotal` | Sum of line items |
| `TestFlatDiscount` | Subtotal - flat amount |
| `TestPercentageDiscount` | Subtotal * (pct/100) |
| `TestDiscountExceedsSubtotal` | Capped at subtotal |
| `TestGSTCalculation` | Taxable * rate; split CGST/SGST |
| `TestGrandTotal` | Taxable + tax |
| `TestBalanceDue` | Grand total - amount paid |
| `TestPartialPayment` | Multiple payments, balance updates |
| `TestFullPayment` | Balance = 0, status = paid |
| `TestPaymentExceedsTotal` | Reject overpayment |

### 2.4 Stock Management
| Test | Description |
|------|-------------|
| `TestStockDeductionOnOrder` | Stock decreases on order create |
| `TestStockRestorationOnCancel` | Stock increases on order cancel |
| `TestStockIncreaseOnPurchase` | Stock increases on purchase bill |
| `TestLowStockAlert` | Triggered at threshold |
| `TestManualAdjustment` | Positive and negative adjustments |
| `TestStockCannotGoNegative` | Reject if insufficient stock |

### 2.5 Membership Points
| Test | Description |
|------|-------------|
| `TestPointsEarned` | floor(total/100) * rate |
| `TestPointsRedeemSuccess` | Balance decreases |
| `TestPointsRedeemExceedsBalance` | Reject |
| `TestExpiredCard` | Reject operations on expired card |

---

## 3. Backend Integration Tests

All integration tests run against a real (test) PostgreSQL database.

### 3.1 Database Setup
- Use a separate test database (or transaction rollback pattern)
- Run migrations before test suite
- Seed minimal required data (shop, admin user)
- Clean up after each test

### 3.2 API Endpoint Tests

#### Customers API
| Test | Method | Endpoint | Assertions |
|------|--------|----------|------------|
| List customers | GET | `/api/v1/customers` | 200, pagination, correct count |
| Search customers | GET | `/api/v1/customers?search=Rahul` | Filters correctly |
| Get customer | GET | `/api/v1/customers/1` | 200, correct data |
| Create customer | POST | `/api/v1/customers` | 201, customer in DB |
| Update customer | PUT | `/api/v1/customers/1` | 200, fields updated |
| Delete customer | DELETE | `/api/v1/customers/1` | 200, soft-deleted |
| Customer with dues | GET | `/api/v1/customers?filter=with_dues` | Only customers with balance > 0 |

#### Orders API
| Test | Method | Endpoint | Assertions |
|------|--------|----------|------------|
| Create spectacle order | POST | `/api/v1/orders` | 201, correct totals, stock deducted |
| Create CL order | POST | `/api/v1/orders` | 201, CL fields saved |
| Create accessories order | POST | `/api/v1/orders` | 201, no prescription |
| List orders by status | GET | `/api/v1/orders?status=pending` | Correct filtering |
| Update order status | PATCH | `/api/v1/orders/1/status` | Status changed, history logged |
| Record payment | POST | `/api/v1/orders/1/payments` | Amount updated, payment_status changes |
| Cancel order | DELETE | `/api/v1/orders/1` | Status=cancelled, stock restored |

#### Products API
| Test | Method | Endpoint | Assertions |
|------|--------|----------|------------|
| Create frame product | POST | `/api/v1/products` | 201, frame fields saved |
| Create CL product | POST | `/api/v1/products` | 201, CL fields saved |
| List by category | GET | `/api/v1/products?category=frame` | Correct filtering |
| Stock adjustment | POST | `/api/v1/products/1/stock-adjust` | Stock updated, movement logged |
| Low stock query | GET | `/api/v1/products/low-stock` | Only items below threshold |

#### Eye Tests API
| Test | Method | Endpoint | Assertions |
|------|--------|----------|------------|
| Create eye test | POST | `/api/v1/eye-tests` | 201, test number auto-generated |
| Get with prescription | GET | `/api/v1/eye-tests/1` | All fields correct |
| Transpose utility | POST | `/api/v1/eye-tests/transpose` | Correct calculation |
| CL conversion utility | POST | `/api/v1/eye-tests/convert-to-cl` | Correct calculation |

#### Purchases API
| Test | Method | Endpoint | Assertions |
|------|--------|----------|------------|
| Create purchase bill | POST | `/api/v1/purchase-bills` | 201, stock increased |
| Record vendor payment | POST | `/api/v1/purchase-bills/1/payments` | Balance updated |
| Vendor ledger | GET | `/api/v1/vendors/1/ledger` | Chronological entries |

#### Reports API
| Test | Method | Endpoint | Assertions |
|------|--------|----------|------------|
| Dashboard overview | GET | `/api/v1/dashboard/overview` | Correct KPI values |
| Revenue chart | GET | `/api/v1/dashboard/revenue-chart` | Correct daily totals |
| Sales report | GET | `/api/v1/reports/sales` | Correct aggregations |
| GST report | GET | `/api/v1/reports/gst` | Correct tax breakdowns |

#### Translation API
| Test | Method | Endpoint | Assertions |
|------|--------|----------|------------|
| Translate text | POST | `/api/v1/translate` | 200, translation returned |
| Cache hit | POST | `/api/v1/translate` | Same text → from_cache = true |

---

## 4. Frontend Unit Tests

### 4.1 Component Tests

| Component | Tests |
|-----------|-------|
| `Button` | Renders variants, handles click, shows loading, disabled state |
| `Input` | Renders with label, shows error, handles change |
| `Select` | Opens dropdown, selects option, shows placeholder |
| `Badge` | Renders correct color for each status |
| `Modal` | Opens, closes, renders children, backdrop click |
| `Toast` | Appears, auto-dismisses, manual dismiss |
| `SearchInput` | Debounces input, clears on X |
| `Pagination` | Correct page numbers, handles click |
| `PrescriptionForm` | All fields render, validation, auto-transpose button |
| `OrderProgressStepper` | Correct step highlighted per status |
| `KPICard` | Shows value, change indicator, correct color |
| `PaymentSummary` | Correct calculations from props |
| `StatusBadge` | Correct color per status |

### 4.2 Hook Tests

| Hook | Tests |
|------|-------|
| `useAuth` | Returns user, handles login/logout |
| `useTranslation` | Returns translated strings, switches locale |
| `usePagination` | Correct page state management |
| `useDebounce` | Delays value update |

### 4.3 Utility Tests

| Utility | Tests |
|---------|-------|
| `formatCurrency` | Correct ₹ formatting |
| `formatDate` | Correct date formatting |
| `calculateBillTotals` | Correct client-side calculations |
| `transposePresciption` | Client-side transposition |
| `apiClient` | Attaches token, handles errors |

---

## 5. End-to-End Tests (Playwright)

### 5.1 Critical User Flows

| Flow | Steps | Assertions |
|------|-------|------------|
| **Login** | Enter credentials → submit | Dashboard loads, user menu shows name |
| **Create Customer** | Navigate → fill form → save | Customer appears in list, detail shows correct data |
| **Create Eye Test** | Select customer → enter Rx → save | Eye test in list, prescription data correct |
| **Create Spectacle Order** | Select customer → enter Rx → add frame + lens → set payment → save | Order in list, correct status, stock reduced |
| **Record Payment** | Open order → add payment → save | Amount paid updated, balance due correct |
| **Update Order Status** | Open order → change to Processing → Ready → Delivered | Stepper updates, history logged |
| **Add Product** | Navigate → fill form → save | Product in list with correct stock |
| **Create Purchase Bill** | Select vendor → add items → save | Bill in list, stock increased |
| **Language Switch** | Settings → change to Hindi | All UI labels switch to Hindi |

### 5.2 Responsive Tests

| Test | Viewport | Assertions |
|------|----------|------------|
| Mobile navigation | 375px | Bottom nav visible, sidebar hidden |
| Desktop navigation | 1440px | Sidebar visible, bottom nav hidden |
| Order form mobile | 375px | Steps are vertical, full-width |
| Customer list mobile | 375px | Single column, no split view |
| Dashboard mobile | 375px | Cards stack vertically |

---

## 6. Manual Testing Checklist

### 6.1 Cross-Browser
- [ ] Chrome (latest) — Desktop + Mobile
- [ ] Firefox (latest) — Desktop
- [ ] Safari — iOS Mobile
- [ ] Edge — Desktop

### 6.2 Device Testing
- [ ] iPhone SE (375px)
- [ ] iPhone 14 Pro (393px)
- [ ] Samsung Galaxy S23 (360px)
- [ ] iPad (768px)
- [ ] Laptop (1366px)
- [ ] Desktop (1920px)

### 6.3 Accessibility
- [ ] Keyboard-only navigation through all forms
- [ ] Screen reader announces all form labels and errors
- [ ] Color contrast meets WCAG AA
- [ ] Reduced motion preference respected
- [ ] All images have alt text
- [ ] Focus indicators visible on all interactive elements

### 6.4 Data Integrity
- [ ] Create order → verify stock decreased
- [ ] Cancel order → verify stock restored
- [ ] Multiple payments → verify totals match
- [ ] Delete customer → verify orders unaffected
- [ ] Hindi mode → all labels translated
- [ ] Large numbers (>₹99,99,999) display correctly

### 6.5 Edge Cases
- [ ] Login with wrong password (3 times)
- [ ] Create order with 0 quantity (should be rejected)
- [ ] Create order with product out of stock
- [ ] Very long customer name (256 chars)
- [ ] Upload oversized file (>5MB image)
- [ ] Upload wrong file type (.exe)
- [ ] Session expiry while editing a form
- [ ] Network offline while submitting form

---

## 7. Test Data

### Seed Data for Testing
```sql
-- Shop
INSERT INTO shops (name, phone, gstin) VALUES ('Test Optical', '9876543210', '27XXXXX1234Z1Z5');

-- Admin user
INSERT INTO users (shop_id, username, password, full_name, role) VALUES (1, 'admin', 'admin123', 'Admin User', 'admin');

-- Staff user
INSERT INTO users (shop_id, username, password, full_name, role) VALUES (1, 'staff', 'staff123', 'Staff User', 'staff');

-- Sample customers
INSERT INTO customers (shop_id, first_name, last_name, phone, city) VALUES
(1, 'Rahul', 'Sharma', '9876543211', 'Mumbai'),
(1, 'Priya', 'Patel', '9876543212', 'Delhi'),
(1, 'Cash', 'Customer', NULL, NULL);

-- Sample products
INSERT INTO products (shop_id, name, sku, category, brand, selling_price, current_stock, gst_rate) VALUES
(1, 'Ray-Ban Aviator RB3025', 'RB-3025', 'frame', 'Ray-Ban', 7500.00, 10, 18.00),
(1, 'Crizal UV Single Vision', 'CRIZAL-SV', 'lens', 'Essilor', 3000.00, 50, 18.00),
(1, 'Acuvue Moist Daily', 'ACUVUE-D', 'contact_lens', 'Johnson & Johnson', 1500.00, 30, 18.00);

-- Default expense categories
INSERT INTO expense_categories (shop_id, name, is_default) VALUES
(1, 'Rent', true),
(1, 'Utilities', true),
(1, 'Salary', true),
(1, 'Marketing', true),
(1, 'Supplies', true),
(1, 'Maintenance', true),
(1, 'Other', true);
```

---

## 8. CI/CD Integration (Future)

| Step | Tool | Trigger |
|------|------|---------|
| Lint (Go) | `golangci-lint` | On PR |
| Lint (TS) | `eslint` | On PR |
| Unit tests (Go) | `go test ./...` | On PR |
| Unit tests (Frontend) | `npm test` | On PR |
| Integration tests | `go test -tags integration` | On merge to main |
| E2E tests | Playwright | On merge to main |
| Build Docker images | Docker Build | On tag |
| Deploy | Docker Compose | Manual |
