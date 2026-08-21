# API Contracts — OptiSuite

> REST API endpoints per module. Base URL: `/api/v1`
>
> All endpoints (except `/auth/login`) require a valid Paseto token via `Authorization: Bearer <token>` header or `token` cookie.
>
> Standard response envelope:
> ```json
> { "success": true, "data": {...}, "message": "OK" }
> { "success": false, "error": "error message", "code": "ERROR_CODE" }
> ```

---

## 1. Authentication

### POST `/api/v1/auth/login`
Login with username and password.

**Request:**
```json
{
  "username": "shopowner",
  "password": "plaintext_password"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "v2.local.xxxxxx...",
    "user": {
      "id": 1,
      "shop_id": 1,
      "username": "shopowner",
      "full_name": "Shop Owner",
      "role": "admin",
      "profile_image_url": "https://..."
    },
    "shop": {
      "id": 1,
      "name": "Demo Optical",
      "logo_url": "https://...",
      "language": "en"
    }
  }
}
```

**Errors:** `401 INVALID_CREDENTIALS`, `403 ACCOUNT_DISABLED`

### POST `/api/v1/auth/logout`
Invalidate session (clear cookie).

### GET `/api/v1/auth/me`
Get current authenticated user info.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "shop": { ... }
  }
}
```

---

## 2. Dashboard / Reports

### GET `/api/v1/dashboard/overview`
Get dashboard KPI data.

**Query params:** `?period=today|week|month|year`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "today_sales": 15000.00,
    "today_sales_change_pct": 12.5,
    "total_orders": 42,
    "total_orders_change_pct": 5.0,
    "active_customers": 120,
    "active_customers_change_pct": 3.2,
    "pending_orders": 8,
    "pending_orders_change_pct": -2.0,
    "today_eye_tests": 3,
    "total_inventory": 450
  }
}
```

### GET `/api/v1/dashboard/revenue-chart`
Revenue chart data.

**Query params:** `?period=week|month|year&from=2025-01-01&to=2025-01-31`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "labels": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    "values": [3560, 2640, 0, 0, 0, 0, 0],
    "total": 6200
  }
}
```

### GET `/api/v1/dashboard/orders-due`
Orders due for delivery today.

**Query params:** `?date=2025-07-30`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 7,
      "order_number": "ORD-7",
      "customer_name": "John Doe",
      "expected_delivery": "2025-07-30",
      "status": "ready",
      "grand_total": 1200.00
    }
  ]
}
```

### GET `/api/v1/reports/sales`
Sales report.

**Query params:** `?from=2025-01-01&to=2025-01-31&group_by=day|month`

### GET `/api/v1/reports/gst`
GST tax report.

**Query params:** `?from=2025-01-01&to=2025-01-31`

### GET `/api/v1/reports/outstanding`
Outstanding dues report.

### GET `/api/v1/reports/top-products`
Top selling products.

**Query params:** `?from=2025-01-01&to=2025-01-31&limit=20`

### GET `/api/v1/reports/stock-valuation`
Stock valuation summary.

### GET `/api/v1/reports/payment-modes`
Payment mode breakdown.

**Query params:** `?from=2025-01-01&to=2025-01-31`

### GET `/api/v1/reports/staff-performance`
Staff sales performance.

**Query params:** `?from=2025-01-01&to=2025-01-31`

### GET `/api/v1/reports/expenses`
Expense summary report.

**Query params:** `?from=2025-01-01&to=2025-01-31`

---

## 3. Customers

### GET `/api/v1/customers`
List customers with filtering, sorting, pagination.

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | | Search name, phone, city, address, pin |
| `sort` | string | `name_asc` | name_asc, name_desc, newest, oldest |
| `filter` | string | `all` | all, with_dues, without_dues |
| `city` | string | | Filter by city |
| `page` | int | 1 | Page number |
| `limit` | int | 25 | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": 1,
        "first_name": "Cash",
        "last_name": "Customer",
        "phone": "9876543210",
        "city": "Mumbai",
        "total_spent": 15000.00,
        "outstanding_dues": 500.00,
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 25,
      "total_pages": 6
    },
    "stats": {
      "in_book": 150,
      "showing": 25,
      "new_7d": 5
    }
  }
}
```

### GET `/api/v1/customers/:id`
Get customer detail with summary metrics.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "customer": { ... },
    "metrics": {
      "active_jobs": 2,
      "avg_retail": 3500.00,
      "eye_tests": 3,
      "invoices": 5
    },
    "history": [
      {
        "type": "order",
        "id": 7,
        "date": "2025-07-29T12:43:00Z",
        "summary": "ORD-7 - Spectacles - Rs.1200.00",
        "status": "pending"
      }
    ]
  }
}
```

### POST `/api/v1/customers`
Create a new customer.

**Request:**
```json
{
  "first_name": "Rahul",
  "last_name": "Sharma",
  "phone": "9876543210",
  "email": "rahul@example.com",
  "date_of_birth": "1990-05-15",
  "gender": "male",
  "address_line1": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pin_code": "400001",
  "notes": "Prefers progressive lenses"
}
```

### PUT `/api/v1/customers/:id`
Update customer details.

### DELETE `/api/v1/customers/:id`
Soft-delete a customer (set `is_active = false`).

### GET `/api/v1/customers/:id/notes`
List notes for a customer.

### POST `/api/v1/customers/:id/notes`
Add a note to a customer.

---

## 4. Eye Tests

### GET `/api/v1/eye-tests`
List eye tests.

**Query params:** `search`, `from`, `to`, `customer_id`, `page`, `limit`

### GET `/api/v1/eye-tests/:id`
Get eye test detail.

### POST `/api/v1/eye-tests`
Create a new eye test.

**Request:**
```json
{
  "customer_id": 1,
  "test_date": "2025-07-29T12:00:00Z",
  "re_sph": -4.75,
  "re_cyl": -0.50,
  "re_axis": 90,
  "re_add": 1.50,
  "re_pd": 32.5,
  "re_prism": 0.5,
  "re_prism_base": "up",
  "re_visual_acuity": "6/6",
  "le_sph": -2.00,
  "le_cyl": -0.75,
  "le_axis": 85,
  "le_add": 1.50,
  "le_pd": 32.0,
  "le_prism": null,
  "le_prism_base": null,
  "le_visual_acuity": "6/9",
  "doctor_name": "Dr. Patel",
  "notes": "Patient complaints of headache"
}
```

### PUT `/api/v1/eye-tests/:id`
Update an eye test.

### DELETE `/api/v1/eye-tests/:id`
Delete an eye test.

### POST `/api/v1/eye-tests/transpose`
Auto-transpose prescription (utility endpoint, no DB write).

**Request:**
```json
{
  "sph": -2.00,
  "cyl": 1.50,
  "axis": 90
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "sph": -0.50,
    "cyl": -1.50,
    "axis": 180
  }
}
```

### POST `/api/v1/eye-tests/convert-to-cl`
Spectacle-to-contact lens power conversion (utility endpoint, no DB write).

**Request:**
```json
{
  "sph": -6.00,
  "cyl": -1.50,
  "axis": 90,
  "vertex_distance": 12
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "cl_sph": -5.58,
    "cl_cyl": -1.37,
    "cl_axis": 90,
    "spherical_equivalent": -6.29
  }
}
```

---

## 5. Orders

### GET `/api/v1/orders`
List orders.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search order number, customer name, phone |
| `status` | string | pending, processing, ready, delivered, cancelled |
| `payment_status` | string | pending, partial, paid |
| `order_type` | string | spectacles, contact_lens, accessories, repair |
| `from` | date | Start date |
| `to` | date | End date |
| `page` | int | Page number |
| `limit` | int | Items per page |

### GET `/api/v1/orders/:id`
Get full order detail (items, prescription, payments, status history).

**Response (200):**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 7,
      "order_number": "ORD-7",
      "order_type": "contact_lens",
      "status": "pending",
      "payment_status": "pending",
      "customer": {
        "id": 1,
        "first_name": "Test",
        "last_name": "User",
        "phone": "8951060494"
      },
      "subtotal": 1200.00,
      "discount_type": "flat",
      "discount_value": 0,
      "discount_amount": 0,
      "taxable_amount": 1200.00,
      "cgst_amount": 0,
      "sgst_amount": 0,
      "total_tax": 0,
      "grand_total": 1200.00,
      "amount_paid": 0,
      "balance_due": 1200.00,
      "expected_delivery": "2025-07-31",
      "notes": "",
      "created_at": "2025-07-29T12:43:00Z"
    },
    "items": [
      {
        "id": 1,
        "item_type": "contact_lens",
        "name": "bnl - Normal (Monthly)",
        "quantity": 2,
        "unit_price": 600.00,
        "total_price": 1200.00
      }
    ],
    "prescription": {
      "re_sph": -4.75,
      "le_sph": -2.00
    },
    "payments": [],
    "status_history": [
      {
        "from_status": null,
        "to_status": "pending",
        "changed_by": "shopowner",
        "created_at": "2025-07-29T12:43:00Z"
      }
    ]
  }
}
```

### POST `/api/v1/orders`
Create a new order.

**Request:**
```json
{
  "customer_id": 1,
  "order_type": "spectacles",
  "items": [
    {
      "product_id": 5,
      "item_type": "frame",
      "quantity": 1,
      "unit_price": 2500.00
    },
    {
      "product_id": null,
      "item_type": "lens",
      "name": "Progressive Anti-Reflective",
      "quantity": 2,
      "unit_price": 3000.00
    }
  ],
  "prescription": {
    "eye_test_id": 3,
    "re_sph": -2.00,
    "re_cyl": -0.50,
    "re_axis": 90,
    "re_add": 1.50,
    "re_pd": 32.5,
    "le_sph": -1.75,
    "le_cyl": -0.25,
    "le_axis": 85,
    "le_add": 1.50,
    "le_pd": 32.0,
    "lens_type": "progressive",
    "lens_material": "polycarbonate",
    "lens_coating": "anti_reflective,blue_cut"
  },
  "discount_type": "percentage",
  "discount_value": 10,
  "payment": {
    "amount": 5000.00,
    "payment_mode": "upi",
    "transaction_ref": "UPI123456"
  },
  "expected_delivery": "2025-08-05",
  "notes": "Rush order - customer traveling"
}
```

### PUT `/api/v1/orders/:id`
Update order details.

### PATCH `/api/v1/orders/:id/status`
Update order status.

**Request:**
```json
{
  "status": "processing",
  "notes": "Sent to lab"
}
```

### POST `/api/v1/orders/:id/payments`
Record a payment against an order.

**Request:**
```json
{
  "amount": 500.00,
  "payment_mode": "cash",
  "notes": "Advance payment"
}
```

### DELETE `/api/v1/orders/:id`
Cancel an order (sets status to cancelled).

---

## 6. Products / Inventory

### GET `/api/v1/products`
List products.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search name, code, brand, price |
| `category` | string | frame, lens, contact_lens, accessories |
| `stock` | string | any, in_stock, out_of_stock, low_stock |
| `sort` | string | type_name, name_asc, price_asc, price_desc, stock_asc |
| `page` | int | Page number |
| `limit` | int | Items per page |

### GET `/api/v1/products/:id`
Get product detail.

### POST `/api/v1/products`
Create a new product.

**Request:**
```json
{
  "name": "Ray-Ban Aviator RB3025",
  "sku": "RB-3025-GOLD",
  "category": "frame",
  "brand": "Ray-Ban",
  "model": "RB3025",
  "color": "Gold",
  "size": "58-14-135",
  "purchase_price": 3500.00,
  "selling_price": 7500.00,
  "hsn_code": "9004",
  "gst_rate": 18.00,
  "current_stock": 10,
  "min_stock_level": 3,
  "frame_type": "full_rim",
  "frame_material": "metal",
  "frame_shape": "aviator",
  "gender_target": "unisex"
}
```

### PUT `/api/v1/products/:id`
Update product.

### DELETE `/api/v1/products/:id`
Soft-delete product.

### POST `/api/v1/products/:id/stock-adjust`
Manual stock adjustment.

**Request:**
```json
{
  "quantity": -2,
  "movement_type": "damage_out",
  "notes": "Broken during display"
}
```

### GET `/api/v1/products/low-stock`
Get products below minimum stock level.

---

## 7. Purchases & Vendors

### GET `/api/v1/vendors`
List vendors.

### POST `/api/v1/vendors`
Create vendor.

### PUT `/api/v1/vendors/:id`
Update vendor.

### GET `/api/v1/purchase-bills`
List purchase bills.

**Query params:** `search`, `status`, `vendor_id`, `from`, `to`, `page`, `limit`

### GET `/api/v1/purchase-bills/:id`
Get purchase bill detail (with items).

### POST `/api/v1/purchase-bills`
Create purchase bill (also creates stock_movements for each item).

**Request:**
```json
{
  "vendor_id": 1,
  "bill_number": "VEND-2025-001",
  "bill_date": "2025-07-25",
  "due_date": "2025-08-25",
  "items": [
    {
      "product_id": 5,
      "quantity": 20,
      "unit_price": 3500.00,
      "tax_rate": 18.00
    }
  ],
  "notes": "Quarterly frame order"
}
```

### POST `/api/v1/purchase-bills/:id/payments`
Record payment for a purchase bill.

### GET `/api/v1/vendor-payments`
List vendor payment history.

### GET `/api/v1/vendors/:id/ledger`
Get vendor ledger (bills + payments chronologically).

---

## 8. Offers

### GET `/api/v1/offers`
List offers.

**Query params:** `status` (active/all/expired), `page`, `limit`

### GET `/api/v1/offers/:id`
Get offer detail.

### POST `/api/v1/offers`
Create offer.

**Request:**
```json
{
  "name": "Monsoon Sale",
  "description": "20% off on all frames",
  "discount_type": "percentage",
  "discount_value": 20,
  "applicable_categories": "frame",
  "min_order_amount": 1000,
  "start_date": "2025-07-01",
  "end_date": "2025-07-31",
  "usage_limit": 100,
  "per_customer_limit": 1,
  "coupon_code": "MONSOON20"
}
```

### PUT `/api/v1/offers/:id`
Update offer.

### DELETE `/api/v1/offers/:id`
Delete offer.

### POST `/api/v1/offers/validate`
Validate a coupon code for a given order (check eligibility, limits).

**Request:**
```json
{
  "coupon_code": "MONSOON20",
  "customer_id": 1,
  "order_total": 5000.00,
  "categories": ["frame"]
}
```

---

## 9. Expenses

### GET `/api/v1/expenses`
List expenses.

**Query params:** `from`, `to`, `category_id`, `expense_type`, `page`, `limit`

### GET `/api/v1/expenses/:id`
Get expense detail.

### POST `/api/v1/expenses`
Create expense.

**Request:**
```json
{
  "category_id": 1,
  "title": "Electricity bill - July",
  "amount": 2500.00,
  "expense_date": "2025-07-15",
  "payment_mode": "bank_transfer",
  "expense_type": "recurring",
  "recurrence": "monthly",
  "notes": "July 2025 bill"
}
```

### PUT `/api/v1/expenses/:id`
Update expense.

### DELETE `/api/v1/expenses/:id`
Delete expense.

### GET `/api/v1/expense-categories`
List expense categories.

### POST `/api/v1/expense-categories`
Create expense category.

### GET `/api/v1/expenses/summary`
Expense summary (total, one-time, recurring, purchases).

**Query params:** `from`, `to`

---

## 10. Membership & Loyalty

### GET `/api/v1/membership-tiers`
List tiers.

### POST `/api/v1/membership-tiers`
Create tier.

### PUT `/api/v1/membership-tiers/:id`
Update tier.

### GET `/api/v1/membership-cards`
List issued cards.

**Query params:** `status`, `customer_id`, `tier_id`, `page`, `limit`

### POST `/api/v1/membership-cards`
Issue a membership card to a customer.

**Request:**
```json
{
  "customer_id": 1,
  "tier_id": 2
}
```

### POST `/api/v1/membership-cards/:id/add-points`
Add loyalty points.

**Request:**
```json
{
  "points": 50,
  "order_id": 7,
  "notes": "Points for ORD-7"
}
```

### POST `/api/v1/membership-cards/:id/redeem-points`
Redeem loyalty points.

---

## 11. Campaigns

### GET `/api/v1/campaigns`
List campaigns.

### POST `/api/v1/campaigns`
Create campaign.

**Request:**
```json
{
  "name": "Welcome Campaign",
  "message": "Hello [Customer Name], visit us for new arrivals!",
  "target_filter": { "city": "Mumbai", "days_since_last_visit": 30 }
}
```

### GET `/api/v1/campaigns/:id`
Get campaign detail with recipient list.

---

## 12. Notifications

### GET `/api/v1/notifications`
Get notifications for current user.

**Query params:** `unread_only=true`, `page`, `limit`

### PATCH `/api/v1/notifications/:id/read`
Mark notification as read.

### PATCH `/api/v1/notifications/read-all`
Mark all as read.

---

## 13. File Uploads

### POST `/api/v1/upload`
Upload a file to Cloudflare R2.

**Request:** `multipart/form-data`
| Field | Type | Description |
|-------|------|-------------|
| `file` | File | The file to upload |
| `category` | string | profile, product, shop_logo, receipt |
| `entity_id` | int | Optional: related entity ID |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "https://pub-xxx.r2.dev/profiles/1/customers/42/photo.jpg",
    "key": "profiles/1/customers/42/photo.jpg"
  }
}
```

---

## 14. Translation Service

### POST `/api/v1/translate`
Translate dynamic content.

**Request:**
```json
{
  "texts": ["Good morning, welcome to our shop!", "Your order is ready for pickup"],
  "target_lang": "hi"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "translations": [
      { "source": "Good morning, welcome to our shop!", "translated": "सुप्रभात, हमारी दुकान में आपका स्वागत है!" },
      { "source": "Your order is ready for pickup", "translated": "आपका ऑर्डर पिकअप के लिए तैयार है" }
    ],
    "from_cache": [true, false]
  }
}
```

---

## 15. Settings

### GET `/api/v1/settings`
Get all settings for the current shop.

### PUT `/api/v1/settings`
Update settings.

**Request:**
```json
{
  "settings": [
    { "key": "invoice_prefix", "value": "INV" },
    { "key": "default_tax_rate", "value": "18" },
    { "key": "language", "value": "hi" }
  ]
}
```

### GET `/api/v1/settings/shop-profile`
Get shop profile details.

### PUT `/api/v1/settings/shop-profile`
Update shop profile (name, address, GSTIN, logo, etc.).

### GET `/api/v1/users`
List staff users (admin only).

### POST `/api/v1/users`
Create a staff user (admin only).

### PUT `/api/v1/users/:id`
Update a staff user.

### DELETE `/api/v1/users/:id`
Deactivate a staff user.

### GET `/api/v1/activity-logs`
Get activity logs.

**Query params:** `user_id`, `entity_type`, `action`, `from`, `to`, `page`, `limit`

---

## Pagination Standard

All list endpoints support cursor-based or offset pagination:

```json
{
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 25,
    "total_pages": 6,
    "has_next": true,
    "has_prev": false
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Wrong username or password |
| `TOKEN_EXPIRED` | 401 | Paseto token has expired |
| `TOKEN_INVALID` | 401 | Malformed or tampered token |
| `FORBIDDEN` | 403 | Insufficient role/permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Invalid request body |
| `DUPLICATE_ENTRY` | 409 | Unique constraint violation |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
