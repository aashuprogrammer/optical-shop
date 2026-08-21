# Database Schema — OptiSuite

> Complete schema for the single initial migration file.
> All primary keys are `BIGSERIAL` (auto-incrementing). No UUIDs anywhere.
> No software membership, subscription, or trial tables.
> Passwords stored as plain text.

---

## Entity Relationship Overview

```
shops ──┬── users
        ├── customers ──┬── eye_tests
        │               └── customer_notes
        ├── products ──┬── product_images
        │              └── stock_movements
        ├── orders ──┬── order_items ── products
        │            ├── order_prescriptions
        │            ├── order_payments
        │            └── order_status_history
        ├── vendors ──┬── purchase_bills ── purchase_bill_items
        │             └── vendor_payments
        ├── offers ── (order applied discount)
        ├── expenses
        ├── expense_categories
        ├── campaigns ── campaign_recipients
        ├── notifications
        ├── activity_logs
        └── shop_settings
        
translation_cache (system-wide cache for dynamic UI translation)
```

---

## Table Definitions

### 1. `shops`
The root store entity. Represents the optical shop.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `name` | `VARCHAR(255)` | `NOT NULL` | Shop display name |
| `phone` | `VARCHAR(20)` | | Shop contact number |
| `email` | `VARCHAR(255)` | | Shop email |
| `address_line1` | `TEXT` | | Address line 1 |
| `address_line2` | `TEXT` | | Address line 2 |
| `city` | `VARCHAR(100)` | | City |
| `state` | `VARCHAR(100)` | | State |
| `pin_code` | `VARCHAR(10)` | | PIN / Postal code |
| `gstin` | `VARCHAR(20)` | | GST identification number |
| `logo_url` | `TEXT` | | Cloudflare R2 URL for shop logo |
| `invoice_prefix` | `VARCHAR(10)` | `DEFAULT 'INV'` | Prefix for invoices |
| `invoice_next_number` | `BIGINT` | `DEFAULT 1` | Running counter |
| `order_prefix` | `VARCHAR(10)` | `DEFAULT 'ORD'` | Prefix for customer orders |
| `order_next_number` | `BIGINT` | `DEFAULT 1` | Running counter |
| `currency_symbol` | `VARCHAR(5)` | `DEFAULT '₹'` | Default currency prefix |
| `default_tax_rate` | `DECIMAL(5,2)` | `DEFAULT 18.00` | Default GST % |
| `optometrist_name` | `VARCHAR(255)` | | Default optometrist/doctor name |
| `eye_testing_fee` | `DECIMAL(10,2)` | `DEFAULT 0.00` | Standard eye test fee |
| `terms_and_conditions` | `TEXT` | | Invoice footer notes/T&C |
| `language` | `VARCHAR(5)` | `DEFAULT 'en'` | Default language ('en' / 'hi') |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

---

### 2. `users`
Staff / owner login accounts. Accounts are created manually in the database.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `shop_id` | `BIGINT` | `NOT NULL REFERENCES shops(id)` | |
| `username` | `VARCHAR(100)` | `NOT NULL UNIQUE` | Unique login username |
| `password` | `TEXT` | `NOT NULL` | **Plain text, unhashed** |
| `full_name` | `VARCHAR(255)` | `NOT NULL` | User full name |
| `email` | `VARCHAR(255)` | | User email |
| `phone` | `VARCHAR(20)` | | User phone |
| `role` | `VARCHAR(20)` | `NOT NULL DEFAULT 'staff'` | admin, manager, staff, viewer |
| `profile_image_url` | `TEXT` | | Cloudflare R2 URL |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT true` | Active flag |
| `last_login_at` | `TIMESTAMPTZ` | | Last login timestamp |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Indexes:**
- `idx_users_shop_id` ON `(shop_id)`
- `idx_users_username` ON `(username)`

---

### 3. `customers`
Customer / Patient directory.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `shop_id` | `BIGINT` | `NOT NULL REFERENCES shops(id)` | |
| `first_name` | `VARCHAR(100)` | `NOT NULL` | Customer first name |
| `last_name` | `VARCHAR(100)` | `DEFAULT ''` | Customer last name |
| `phone` | `VARCHAR(20)` | | Primary phone number |
| `email` | `VARCHAR(255)` | | Email address |
| `date_of_birth` | `DATE` | | Date of birth |
| `gender` | `VARCHAR(10)` | | male, female, other |
| `address_line1` | `TEXT` | | Address |
| `address_line2` | `TEXT` | | Address line 2 |
| `city` | `VARCHAR(100)` | | City |
| `state` | `VARCHAR(100)` | | State |
| `pin_code` | `VARCHAR(10)` | | PIN code |
| `profile_image_url` | `TEXT` | | Cloudflare R2 URL |
| `notes` | `TEXT` | | Free-text notes |
| `total_spent` | `DECIMAL(12,2)` | `DEFAULT 0.00` | Running total spent |
| `outstanding_dues` | `DECIMAL(12,2)` | `DEFAULT 0.00` | Unpaid balance across all orders |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT true` | Soft-deletion flag |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Indexes:**
- `idx_customers_shop_id` ON `(shop_id)`
- `idx_customers_phone` ON `(shop_id, phone)`
- `idx_customers_name` ON `(shop_id, first_name, last_name)`
- `idx_customers_city` ON `(shop_id, city)`

---

### 4. `customer_notes`
Chronological notes on customers.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `customer_id` | `BIGINT` | `NOT NULL REFERENCES customers(id) ON DELETE CASCADE` | |
| `user_id` | `BIGINT` | `REFERENCES users(id)` | Note author |
| `note` | `TEXT` | `NOT NULL` | Note content |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

---

### 5. `eye_tests`
Full clinical refraction / eye test records.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `shop_id` | `BIGINT` | `NOT NULL REFERENCES shops(id)` | |
| `customer_id` | `BIGINT` | `NOT NULL REFERENCES customers(id)` | |
| `tested_by` | `BIGINT` | `REFERENCES users(id)` | Optometrist / staff user ID |
| `test_number` | `VARCHAR(20)` | `NOT NULL` | e.g., ET-001 |
| `test_date` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |
| `re_sph` | `DECIMAL(6,2)` | | Right Eye Sphere |
| `re_cyl` | `DECIMAL(6,2)` | | Right Eye Cylinder |
| `re_axis` | `INTEGER` | | Right Eye Axis (0-180) |
| `re_add` | `DECIMAL(6,2)` | | Right Eye Near Add |
| `re_pd` | `DECIMAL(5,2)` | | Right Eye PD (mm) |
| `re_prism` | `DECIMAL(5,2)` | | Right Eye Prism |
| `re_prism_base` | `VARCHAR(10)` | | up, down, in, out |
| `re_visual_acuity` | `VARCHAR(20)` | | e.g., 6/6 |
| `le_sph` | `DECIMAL(6,2)` | | Left Eye Sphere |
| `le_cyl` | `DECIMAL(6,2)` | | Left Eye Cylinder |
| `le_axis` | `INTEGER` | | Left Eye Axis (0-180) |
| `le_add` | `DECIMAL(6,2)` | | Left Eye Near Add |
| `le_pd` | `DECIMAL(5,2)` | | Left Eye PD (mm) |
| `le_prism` | `DECIMAL(5,2)` | | Left Eye Prism |
| `le_prism_base` | `VARCHAR(10)` | | up, down, in, out |
| `le_visual_acuity` | `VARCHAR(20)` | | e.g., 6/6 |
| `doctor_name` | `VARCHAR(255)` | | Doctor / Refractionist name |
| `notes` | `TEXT` | | Clinical observations |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Indexes:**
- `idx_eye_tests_shop_customer` ON `(shop_id, customer_id)`
- `idx_eye_tests_test_number` ON `(shop_id, test_number)`
- `idx_eye_tests_date` ON `(shop_id, test_date)`

---

### 6. `products`
Optical inventory catalog (Frames, Lenses, Contact Lenses, Accessories, Solutions, Services).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `shop_id` | `BIGINT` | `NOT NULL REFERENCES shops(id)` | |
| `name` | `VARCHAR(255)` | `NOT NULL` | Product title |
| `sku` | `VARCHAR(50)` | | Barcode / SKU / Model code |
| `category` | `VARCHAR(20)` | `NOT NULL` | frame, lens, contact_lens, accessories, solution, service |
| `brand` | `VARCHAR(100)` | | Brand name |
| `model` | `VARCHAR(100)` | | Model number |
| `color` | `VARCHAR(50)` | | Frame/lens color |
| `size` | `VARCHAR(50)` | | Frame size (e.g., 52-18-140) |
| `description` | `TEXT` | | Product details |
| `purchase_price` | `DECIMAL(10,2)` | `DEFAULT 0.00` | Cost / Purchase price |
| `selling_price` | `DECIMAL(10,2)` | `NOT NULL DEFAULT 0.00` | Retail price / MRP |
| `hsn_code` | `VARCHAR(20)` | | GST HSN code (e.g., 9004) |
| `gst_rate` | `DECIMAL(5,2)` | `DEFAULT 18.00` | Tax % (0, 5, 12, 18, 28) |
| `current_stock` | `INTEGER` | `NOT NULL DEFAULT 0` | Available stock count |
| `min_stock_level` | `INTEGER` | `DEFAULT 5` | Low stock alert threshold |
| `barcode` | `VARCHAR(50)` | | Scannable barcode |
| `image_url` | `TEXT` | | Primary image URL |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT true` | Active flag |
| `frame_type` | `VARCHAR(20)` | | full_rim, half_rim, rimless |
| `frame_material` | `VARCHAR(30)` | | metal, plastic, acetate, titanium, etc. |
| `frame_shape` | `VARCHAR(30)` | | rectangular, round, aviator, cat_eye, oval, etc. |
| `temple_length` | `DECIMAL(5,1)` | | mm |
| `bridge_width` | `DECIMAL(5,1)` | | mm |
| `lens_width` | `DECIMAL(5,1)` | | mm |
| `gender_target` | `VARCHAR(10)` | | male, female, unisex, kids |
| `cl_replacement_schedule` | `VARCHAR(20)` | | daily, weekly, biweekly, monthly, quarterly, yearly |
| `cl_base_curve` | `DECIMAL(4,2)` | | Contact lens BC (e.g., 8.6) |
| `cl_diameter` | `DECIMAL(4,2)` | | Contact lens DIA (e.g., 14.2) |
| `cl_water_content` | `VARCHAR(10)` | | e.g., "58%" |
| `cl_material` | `VARCHAR(50)` | | Hydrogel, Silicone Hydrogel, etc. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Indexes:**
- `idx_products_shop_id` ON `(shop_id)`
- `idx_products_category` ON `(shop_id, category)`
- `idx_products_sku` ON `(shop_id, sku)`
- `idx_products_name` ON `(shop_id, name)`
- `idx_products_stock` ON `(shop_id, current_stock)` WHERE `is_active = true`

---

### 7. `product_images`
Multiple image gallery per product.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `product_id` | `BIGINT` | `NOT NULL REFERENCES products(id) ON DELETE CASCADE` | |
| `image_url` | `TEXT` | `NOT NULL` | Cloudflare R2 URL |
| `sort_order` | `INTEGER` | `DEFAULT 0` | Display order |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

---

### 8. `stock_movements`
Complete audit trail for every inventory change.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `shop_id` | `BIGINT` | `NOT NULL REFERENCES shops(id)` | |
| `product_id` | `BIGINT` | `NOT NULL REFERENCES products(id)` | |
| `movement_type` | `VARCHAR(20)` | `NOT NULL` | purchase_in, sale_out, adjustment, return_in, damage_out |
| `quantity` | `INTEGER` | `NOT NULL` | Delta (+in, -out) |
| `reference_type` | `VARCHAR(20)` | | order, purchase_bill, manual |
| `reference_id` | `BIGINT` | | Related entity ID |
| `notes` | `TEXT` | | Reason or details |
| `created_by` | `BIGINT` | `REFERENCES users(id)` | Staff member |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Indexes:**
- `idx_stock_movements_product` ON `(product_id)`
- `idx_stock_movements_date` ON `(shop_id, created_at)`

---

### 9. `orders`
POS bills & custom eyewear orders.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `shop_id` | `BIGINT` | `NOT NULL REFERENCES shops(id)` | |
| `customer_id` | `BIGINT` | `NOT NULL REFERENCES customers(id)` | |
| `created_by` | `BIGINT` | `REFERENCES users(id)` | Salesperson user ID |
| `order_number` | `VARCHAR(20)` | `NOT NULL` | e.g., ORD-001 |
| `order_type` | `VARCHAR(20)` | `NOT NULL` | spectacles, contact_lens, accessories, repair, service |
| `status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'pending'` | pending, processing, ready, delivered, cancelled |
| `payment_status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'pending'` | pending, partial, paid |
| `subtotal` | `DECIMAL(12,2)` | `NOT NULL DEFAULT 0.00` | Sum of item totals before discount |
| `discount_type` | `VARCHAR(10)` | `DEFAULT 'flat'` | flat, percentage |
| `discount_value` | `DECIMAL(10,2)` | `DEFAULT 0.00` | Input value |
| `discount_amount` | `DECIMAL(12,2)` | `DEFAULT 0.00` | Total discount ₹ |
| `taxable_amount` | `DECIMAL(12,2)` | `DEFAULT 0.00` | Subtotal - discount |
| `cgst_amount` | `DECIMAL(10,2)` | `DEFAULT 0.00` | Central GST ₹ |
| `sgst_amount` | `DECIMAL(10,2)` | `DEFAULT 0.00` | State GST ₹ |
| `igst_amount` | `DECIMAL(10,2)` | `DEFAULT 0.00` | Inter-state GST ₹ |
| `total_tax` | `DECIMAL(10,2)` | `DEFAULT 0.00` | Total tax ₹ |
| `grand_total` | `DECIMAL(12,2)` | `NOT NULL DEFAULT 0.00` | Taxable + Tax |
| `amount_paid` | `DECIMAL(12,2)` | `DEFAULT 0.00` | Total advance & payments received |
| `balance_due` | `DECIMAL(12,2)` | `DEFAULT 0.00` | Grand total - amount paid |
| `expected_delivery` | `DATE` | | Target delivery date |
| `delivered_at` | `TIMESTAMPTZ` | | Actual delivery date |
| `notes` | `TEXT` | | Internal notes / lab instructions |
| `offer_id` | `BIGINT` | `REFERENCES offers(id)` | Linked promotional offer |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Indexes:**
- `idx_orders_shop_id` ON `(shop_id)`
- `idx_orders_customer_id` ON `(customer_id)`
- `idx_orders_number` ON `(shop_id, order_number)` UNIQUE
- `idx_orders_status` ON `(shop_id, status)`
- `idx_orders_payment_status` ON `(shop_id, payment_status)`
- `idx_orders_date` ON `(shop_id, created_at)`
- `idx_orders_delivery` ON `(shop_id, expected_delivery)` WHERE `status != 'delivered' AND status != 'cancelled'`

---

### 10. `order_items`
Individual line items in an order.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `order_id` | `BIGINT` | `NOT NULL REFERENCES orders(id) ON DELETE CASCADE` | |
| `product_id` | `BIGINT` | `REFERENCES products(id)` | NULL for custom/service items |
| `item_type` | `VARCHAR(20)` | `NOT NULL` | frame, lens, contact_lens, accessories, service |
| `name` | `VARCHAR(255)` | `NOT NULL` | Snapshot of product name |
| `description` | `TEXT` | | Item description |
| `quantity` | `INTEGER` | `NOT NULL DEFAULT 1` | Quantity |
| `unit_price` | `DECIMAL(10,2)` | `NOT NULL` | Price per unit |
| `discount_amount` | `DECIMAL(10,2)` | `DEFAULT 0.00` | Line-item discount |
| `tax_rate` | `DECIMAL(5,2)` | `DEFAULT 0.00` | GST % |
| `tax_amount` | `DECIMAL(10,2)` | `DEFAULT 0.00` | GST ₹ |
| `total_price` | `DECIMAL(10,2)` | `NOT NULL` | Final line total |
| `hsn_code` | `VARCHAR(20)` | | Snapshot of HSN code |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Index:**
- `idx_order_items_order_id` ON `(order_id)`

---

### 11. `order_prescriptions`
Prescription snapshot attached to an order.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `order_id` | `BIGINT` | `NOT NULL REFERENCES orders(id) ON DELETE CASCADE` | |
| `eye_test_id` | `BIGINT` | `REFERENCES eye_tests(id)` | Optional source eye test |
| `re_sph` | `DECIMAL(6,2)` | | Right Eye SPH |
| `re_cyl` | `DECIMAL(6,2)` | | Right Eye CYL |
| `re_axis` | `INTEGER` | | Right Eye AXIS |
| `re_add` | `DECIMAL(6,2)` | | Right Eye ADD |
| `re_pd` | `DECIMAL(5,2)` | | Right Eye PD |
| `re_prism` | `DECIMAL(5,2)` | | Right Eye Prism |
| `re_prism_base` | `VARCHAR(10)` | | Right Eye Prism Base |
| `re_visual_acuity` | `VARCHAR(20)` | | |
| `le_sph` | `DECIMAL(6,2)` | | Left Eye SPH |
| `le_cyl` | `DECIMAL(6,2)` | | Left Eye CYL |
| `le_axis` | `INTEGER` | | Left Eye AXIS |
| `le_add` | `DECIMAL(6,2)` | | Left Eye ADD |
| `le_pd` | `DECIMAL(5,2)` | | Left Eye PD |
| `le_prism` | `DECIMAL(5,2)` | | Left Eye Prism |
| `le_prism_base` | `VARCHAR(10)` | | Left Eye Prism Base |
| `le_visual_acuity` | `VARCHAR(20)` | | |
| `lens_type` | `VARCHAR(30)` | | single_vision, bifocal, progressive, etc. |
| `lens_material` | `VARCHAR(30)` | | cr39, polycarbonate, high_index, etc. |
| `lens_coating` | `TEXT` | | anti_reflective, blue_cut, photochromic, etc. |
| `tint` | `VARCHAR(30)` | | clear, brown, gray, etc. |
| `cl_base_curve` | `DECIMAL(4,2)` | | Contact Lens Base Curve |
| `cl_diameter` | `DECIMAL(4,2)` | | Contact Lens Diameter |
| `cl_replacement_schedule` | `VARCHAR(20)` | | daily, monthly, yearly, etc. |
| `notes` | `TEXT` | | Fitting/dispensing notes |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Index:**
- `idx_order_prescriptions_order_id` ON `(order_id)` UNIQUE

---

### 12. `order_payments`
Payment transactions against customer orders (advances, final payments, installments).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `order_id` | `BIGINT` | `NOT NULL REFERENCES orders(id) ON DELETE CASCADE` | |
| `amount` | `DECIMAL(10,2)` | `NOT NULL` | Payment amount ₹ |
| `payment_mode` | `VARCHAR(20)` | `NOT NULL` | cash, card, upi, bank_transfer |
| `transaction_ref` | `VARCHAR(100)` | | UPI ref, UTR, Card auth code |
| `payment_date` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |
| `notes` | `TEXT` | | |
| `received_by` | `BIGINT` | `REFERENCES users(id)` | Staff user |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Indexes:**
- `idx_order_payments_order_id` ON `(order_id)`
- `idx_order_payments_date` ON `(payment_date)`

---

### 13. `order_status_history`
Audit history of order status changes.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `order_id` | `BIGINT` | `NOT NULL REFERENCES orders(id) ON DELETE CASCADE` | |
| `from_status` | `VARCHAR(20)` | | Previous state |
| `to_status` | `VARCHAR(20)` | `NOT NULL` | New state |
| `changed_by` | `BIGINT` | `REFERENCES users(id)` | |
| `notes` | `TEXT` | | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Index:**
- `idx_order_status_history_order_id` ON `(order_id)`

---

### 14. `vendors`
Optical distributors, lens labs, frame suppliers.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `shop_id` | `BIGINT` | `NOT NULL REFERENCES shops(id)` | |
| `name` | `VARCHAR(255)` | `NOT NULL` | Vendor/Company name |
| `contact_person` | `VARCHAR(255)` | | Contact person |
| `phone` | `VARCHAR(20)` | | Phone number |
| `email` | `VARCHAR(255)` | | Email |
| `gstin` | `VARCHAR(20)` | | Vendor GSTIN |
| `address` | `TEXT` | | Vendor address |
| `city` | `VARCHAR(100)` | | City |
| `state` | `VARCHAR(100)` | | State |
| `pin_code` | `VARCHAR(10)` | | PIN code |
| `notes` | `TEXT` | | Notes / credit terms |
| `outstanding_balance` | `DECIMAL(12,2)` | `DEFAULT 0.00` | Unpaid balance to vendor |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT true` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Index:**
- `idx_vendors_shop_id` ON `(shop_id)`

---

### 15. `purchase_bills`
Inward supplier bills for frame/lens stock replenishment.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `shop_id` | `BIGINT` | `NOT NULL REFERENCES shops(id)` | |
| `vendor_id` | `BIGINT` | `NOT NULL REFERENCES vendors(id)` | |
| `bill_number` | `VARCHAR(50)` | `NOT NULL` | Supplier's invoice number |
| `bill_date` | `DATE` | `NOT NULL` | Bill date |
| `due_date` | `DATE` | | Due date |
| `subtotal` | `DECIMAL(12,2)` | `DEFAULT 0.00` | |
| `tax_amount` | `DECIMAL(10,2)` | `DEFAULT 0.00` | |
| `total_amount` | `DECIMAL(12,2)` | `NOT NULL DEFAULT 0.00` | |
| `amount_paid` | `DECIMAL(12,2)` | `DEFAULT 0.00` | |
| `balance` | `DECIMAL(12,2)` | `DEFAULT 0.00` | |
| `status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'pending'` | pending, partial, paid, cancelled |
| `notes` | `TEXT` | | |
| `created_by` | `BIGINT` | `REFERENCES users(id)` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Indexes:**
- `idx_purchase_bills_shop_vendor` ON `(shop_id, vendor_id)`
- `idx_purchase_bills_status` ON `(shop_id, status)`
- `idx_purchase_bills_date` ON `(shop_id, bill_date)`

---

### 16. `purchase_bill_items`
Line items on a purchase bill.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `purchase_bill_id` | `BIGINT` | `NOT NULL REFERENCES purchase_bills(id) ON DELETE CASCADE` | |
| `product_id` | `BIGINT` | `REFERENCES products(id)` | Product received |
| `name` | `VARCHAR(255)` | `NOT NULL` | Item title snapshot |
| `quantity` | `INTEGER` | `NOT NULL DEFAULT 1` | Quantity added |
| `unit_price` | `DECIMAL(10,2)` | `NOT NULL` | Cost rate |
| `tax_rate` | `DECIMAL(5,2)` | `DEFAULT 0.00` | GST % |
| `tax_amount` | `DECIMAL(10,2)` | `DEFAULT 0.00` | GST ₹ |
| `total_price` | `DECIMAL(10,2)` | `NOT NULL` | Total cost |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Index:**
- `idx_purchase_bill_items_bill_id` ON `(purchase_bill_id)`

---

### 17. `vendor_payments`
Payments made to suppliers/vendors.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `shop_id` | `BIGINT` | `NOT NULL REFERENCES shops(id)` | |
| `vendor_id` | `BIGINT` | `NOT NULL REFERENCES vendors(id)` | |
| `purchase_bill_id` | `BIGINT` | `REFERENCES purchase_bills(id)` | Optional specific bill |
| `amount` | `DECIMAL(10,2)` | `NOT NULL` | Payment amount ₹ |
| `payment_mode` | `VARCHAR(20)` | `NOT NULL` | cash, card, upi, bank_transfer |
| `transaction_ref` | `VARCHAR(100)` | | Bank ref / cheque number |
| `payment_date` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |
| `notes` | `TEXT` | | |
| `created_by` | `BIGINT` | `REFERENCES users(id)` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Index:**
- `idx_vendor_payments_vendor` ON `(shop_id, vendor_id)`

---

### 18. `offers`
Promotional offers & discounts configured by the shop.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `shop_id` | `BIGINT` | `NOT NULL REFERENCES shops(id)` | |
| `name` | `VARCHAR(255)` | `NOT NULL` | Offer name (e.g. Diwali Offer) |
| `description` | `TEXT` | | Description |
| `discount_type` | `VARCHAR(10)` | `NOT NULL` | flat, percentage |
| `discount_value` | `DECIMAL(10,2)` | `NOT NULL` | Discount amount / % |
| `applicable_categories` | `TEXT` | | frame,lens,contact_lens,accessories,all |
| `min_order_amount` | `DECIMAL(10,2)` | `DEFAULT 0.00` | Minimum order value |
| `coupon_code` | `VARCHAR(50)` | | Optional coupon code |
| `start_date` | `DATE` | `NOT NULL` | |
| `end_date` | `DATE` | `NOT NULL` | |
| `usage_limit` | `INTEGER` | `DEFAULT 0` | 0 = unlimited |
| `per_customer_limit` | `INTEGER` | `DEFAULT 0` | 0 = unlimited |
| `times_used` | `INTEGER` | `DEFAULT 0` | Usage counter |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT true` | |
| `created_by` | `BIGINT` | `REFERENCES users(id)` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Indexes:**
- `idx_offers_shop_id` ON `(shop_id)`
- `idx_offers_active` ON `(shop_id, is_active, start_date, end_date)`
- `idx_offers_coupon` ON `(shop_id, coupon_code)` WHERE `coupon_code IS NOT NULL`

---

### 19. `expense_categories`
Expense categories (Rent, Utilities, Staff Salary, Shop Supplies, etc.).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `shop_id` | `BIGINT` | `NOT NULL REFERENCES shops(id)` | |
| `name` | `VARCHAR(100)` | `NOT NULL` | Category name |
| `is_default` | `BOOLEAN` | `DEFAULT false` | Pre-seeded default category |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

---

### 20. `expenses`
Operational expenses incurred by the shop.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `shop_id` | `BIGINT` | `NOT NULL REFERENCES shops(id)` | |
| `category_id` | `BIGINT` | `REFERENCES expense_categories(id)` | |
| `title` | `VARCHAR(255)` | `NOT NULL` | Expense description |
| `amount` | `DECIMAL(10,2)` | `NOT NULL` | Expense amount ₹ |
| `expense_date` | `DATE` | `NOT NULL` | Date incurred |
| `payment_mode` | `VARCHAR(20)` | `DEFAULT 'cash'` | cash, card, upi, bank_transfer |
| `expense_type` | `VARCHAR(15)` | `NOT NULL DEFAULT 'one_time'` | one_time, recurring |
| `recurrence` | `VARCHAR(10)` | | daily, weekly, monthly, yearly |
| `receipt_url` | `TEXT` | | Cloudflare R2 URL for receipt |
| `notes` | `TEXT` | | |
| `created_by` | `BIGINT` | `REFERENCES users(id)` | Staff member |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Indexes:**
- `idx_expenses_shop_date` ON `(shop_id, expense_date)`
- `idx_expenses_category` ON `(shop_id, category_id)`
- `idx_expenses_type` ON `(shop_id, expense_type)`

---

### 21. `campaigns`
Customer communication & WhatsApp marketing campaigns.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `shop_id` | `BIGINT` | `NOT NULL REFERENCES shops(id)` | |
| `name` | `VARCHAR(255)` | | Campaign title |
| `message` | `TEXT` | `NOT NULL` | Message template text |
| `image_url` | `TEXT` | | Cloudflare R2 URL |
| `target_filter` | `TEXT` | | JSON filter rules (city, days_since_visit) |
| `total_recipients` | `INTEGER` | `DEFAULT 0` | Recipient count |
| `sent_count` | `INTEGER` | `DEFAULT 0` | Sent count |
| `status` | `VARCHAR(15)` | `DEFAULT 'draft'` | draft, scheduled, sent |
| `scheduled_at` | `TIMESTAMPTZ` | | |
| `sent_at` | `TIMESTAMPTZ` | | |
| `created_by` | `BIGINT` | `REFERENCES users(id)` | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

---

### 22. `campaign_recipients`
Individual customer recipients for campaigns.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `campaign_id` | `BIGINT` | `NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE` | |
| `customer_id` | `BIGINT` | `NOT NULL REFERENCES customers(id)` | |
| `status` | `VARCHAR(15)` | `DEFAULT 'pending'` | pending, sent, failed |
| `sent_at` | `TIMESTAMPTZ` | | |

**Index:**
- `idx_campaign_recipients_campaign` ON `(campaign_id)`

---

### 23. `notifications`
Internal shop notifications (Orders due today, Low stock alerts, Payment dues).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `shop_id` | `BIGINT` | `NOT NULL REFERENCES shops(id)` | |
| `user_id` | `BIGINT` | `REFERENCES users(id)` | Target user (NULL = all staff) |
| `title` | `VARCHAR(255)` | `NOT NULL` | |
| `message` | `TEXT` | | |
| `notification_type` | `VARCHAR(30)` | `NOT NULL` | order_due, low_stock, payment_received, eye_test_due |
| `reference_type` | `VARCHAR(20)` | | order, customer, product |
| `reference_id` | `BIGINT` | | Target entity ID |
| `is_read` | `BOOLEAN` | `DEFAULT false` | Read status |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Indexes:**
- `idx_notifications_shop_user` ON `(shop_id, user_id, is_read)`
- `idx_notifications_date` ON `(shop_id, created_at)`

---

### 24. `activity_logs`
Audit log of shop staff operations.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `shop_id` | `BIGINT` | `NOT NULL REFERENCES shops(id)` | |
| `user_id` | `BIGINT` | `REFERENCES users(id)` | |
| `action` | `VARCHAR(50)` | `NOT NULL` | create, update, delete, login, status_change |
| `entity_type` | `VARCHAR(30)` | `NOT NULL` | order, customer, product, eye_test, expense |
| `entity_id` | `BIGINT` | | |
| `details` | `TEXT` | | JSON payload of changes |
| `ip_address` | `VARCHAR(45)` | | |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Indexes:**
- `idx_activity_logs_shop_date` ON `(shop_id, created_at)`
- `idx_activity_logs_user` ON `(user_id, created_at)`

---

### 25. `shop_settings`
Key-value configuration store for shop custom options.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `shop_id` | `BIGINT` | `NOT NULL REFERENCES shops(id)` | |
| `setting_key` | `VARCHAR(100)` | `NOT NULL` | Config key |
| `setting_value` | `TEXT` | | JSON / string value |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Index:**
- `idx_shop_settings_key` ON `(shop_id, setting_key)` UNIQUE

---

### 26. `translation_cache`
Production translation cache for dynamic UI translation (English -> Hindi).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | |
| `source_text` | `TEXT` | `NOT NULL` | English UI source string |
| `source_lang` | `VARCHAR(5)` | `NOT NULL DEFAULT 'en'` | Source language ('en') |
| `target_lang` | `VARCHAR(5)` | `NOT NULL` | Target language ('hi') |
| `translated_text` | `TEXT` | `NOT NULL` | Translated string |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |

**Index:**
- `idx_translation_cache_lookup` ON `(source_lang, target_lang, MD5(source_text))` UNIQUE

---

## Summary — Table Count

| # | Table | Purpose |
|---|-------|---------|
| 1 | `shops` | Optical shop details & invoice configuration |
| 2 | `users` | Staff & admin accounts (unhashed plain text password) |
| 3 | `customers` | Patient / customer directory |
| 4 | `customer_notes` | Customer consultation / follow-up notes |
| 5 | `eye_tests` | Refraction exam records & optical prescriptions |
| 6 | `products` | Optical catalog (frames, lenses, accessories, contact lenses) |
| 7 | `product_images` | Product gallery |
| 8 | `stock_movements` | Inventory audit trail |
| 9 | `orders` | Sales orders, bills, and custom eyewear jobs |
| 10 | `order_items` | Products and services in an order |
| 11 | `order_prescriptions` | Snapshot of prescription attached to an order |
| 12 | `order_payments` | Customer payments (advances, partial, full) |
| 13 | `order_status_history` | Order workflow transitions audit |
| 14 | `vendors` | Optical suppliers and lens labs |
| 15 | `purchase_bills` | Vendor purchase bills |
| 16 | `purchase_bill_items` | Line items on purchase bills |
| 17 | `vendor_payments` | Outgoing payments to vendors |
| 18 | `offers` | Promotional deals & discounts |
| 19 | `expense_categories` | Categorization for shop expenses |
| 20 | `expenses` | Shop operational expense records |
| 21 | `campaigns` | Customer WhatsApp marketing campaigns |
| 22 | `campaign_recipients` | Target recipients for campaigns |
| 23 | `notifications` | Internal shop notifications |
| 24 | `activity_logs` | Staff actions audit log |
| 25 | `shop_settings` | Custom shop key-value settings |
| 26 | `translation_cache` | Dynamic translation caching (English -> Hindi) |
| **Total** | **26 tables** | |
