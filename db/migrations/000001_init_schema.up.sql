-- ====================================================================
-- Initial Schema Migration for Optical Shop Management System (OptiSuite)
-- All primary keys use BIGSERIAL (no UUIDs)
-- Passwords stored in plain text (unhashed) per project constraints
-- ====================================================================

-- 1. SHOPS
CREATE TABLE IF NOT EXISTS shops (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    address_line1 TEXT DEFAULT '',
    address_line2 TEXT DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    state VARCHAR(100) DEFAULT '',
    pin_code VARCHAR(10) DEFAULT '',
    gstin VARCHAR(20) DEFAULT '',
    logo_url TEXT DEFAULT '',
    invoice_prefix VARCHAR(10) DEFAULT 'INV',
    invoice_next_number BIGINT DEFAULT 1,
    order_prefix VARCHAR(10) DEFAULT 'ORD',
    order_next_number BIGINT DEFAULT 1,
    currency_symbol VARCHAR(5) DEFAULT '₹',
    default_tax_rate DECIMAL(5,2) DEFAULT 18.00,
    optometrist_name VARCHAR(255) DEFAULT '',
    eye_testing_fee DECIMAL(10,2) DEFAULT 0.00,
    terms_and_conditions TEXT DEFAULT 'Goods once sold cannot be returned. Thank you for your business!',
    language VARCHAR(5) DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. USERS (Staff / Admin Accounts)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT '',
    phone VARCHAR(20) DEFAULT '',
    role VARCHAR(20) NOT NULL DEFAULT 'staff',
    profile_image_url TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_shop_id ON users(shop_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 3. CUSTOMERS (Patients / Clients)
CREATE TABLE IF NOT EXISTS customers (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) DEFAULT '',
    phone VARCHAR(20) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    date_of_birth DATE,
    gender VARCHAR(10) DEFAULT 'other',
    address_line1 TEXT DEFAULT '',
    address_line2 TEXT DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    state VARCHAR(100) DEFAULT '',
    pin_code VARCHAR(10) DEFAULT '',
    profile_image_url TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    total_spent DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    outstanding_dues DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_shop_id ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(shop_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(shop_id, first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(shop_id, city);

-- 4. CUSTOMER NOTES
CREATE TABLE IF NOT EXISTS customer_notes (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_notes_customer ON customer_notes(customer_id);

-- 5. EYE TESTS (Clinical Refraction Exams)
CREATE TABLE IF NOT EXISTS eye_tests (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    tested_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    test_number VARCHAR(20) NOT NULL,
    test_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    checkup_by_type VARCHAR(20) DEFAULT 'optical',
    doctor_name VARCHAR(255) DEFAULT '',
    hospital_name VARCHAR(255) DEFAULT '',
    doctor_city VARCHAR(100) DEFAULT '',
    optical_shop_name VARCHAR(255) DEFAULT '',
    optical_city VARCHAR(100) DEFAULT '',
    examiner_name VARCHAR(255) DEFAULT '',
    re_sph DECIMAL(6,2) DEFAULT 0.00,
    re_cyl DECIMAL(6,2) DEFAULT 0.00,
    re_axis INTEGER DEFAULT 0,
    re_add DECIMAL(6,2) DEFAULT 0.00,
    re_pd DECIMAL(5,2) DEFAULT 0.00,
    re_prism DECIMAL(5,2) DEFAULT 0.00,
    re_prism_base VARCHAR(10) DEFAULT '',
    re_visual_acuity VARCHAR(20) DEFAULT '',
    le_sph DECIMAL(6,2) DEFAULT 0.00,
    le_cyl DECIMAL(6,2) DEFAULT 0.00,
    le_axis INTEGER DEFAULT 0,
    le_add DECIMAL(6,2) DEFAULT 0.00,
    le_pd DECIMAL(5,2) DEFAULT 0.00,
    le_prism DECIMAL(5,2) DEFAULT 0.00,
    le_prism_base VARCHAR(10) DEFAULT '',
    le_visual_acuity VARCHAR(20) DEFAULT '',
    total_pd DECIMAL(5,2) DEFAULT 0.00,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eye_tests_shop_customer ON eye_tests(shop_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_eye_tests_test_number ON eye_tests(shop_id, test_number);
CREATE INDEX IF NOT EXISTS idx_eye_tests_date ON eye_tests(shop_id, test_date);

-- 6. PRODUCTS (Frames, Lenses, Contact Lenses, Sunglasses, Accessories, Solutions, Services)
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(50) DEFAULT '',
    category VARCHAR(20) NOT NULL,
    brand VARCHAR(100) DEFAULT '',
    model VARCHAR(100) DEFAULT '',
    color VARCHAR(50) DEFAULT '',
    size VARCHAR(50) DEFAULT '',
    description TEXT DEFAULT '',
    purchase_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    hsn_code VARCHAR(20) DEFAULT '',
    gst_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    current_stock INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 5,
    barcode VARCHAR(50) DEFAULT '',
    image_url TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    frame_type VARCHAR(50) DEFAULT '',
    frame_material VARCHAR(50) DEFAULT '',
    frame_shape VARCHAR(50) DEFAULT '',
    temple_length DECIMAL(5,1) DEFAULT 0.0,
    bridge_width DECIMAL(5,1) DEFAULT 0.0,
    lens_width DECIMAL(5,1) DEFAULT 0.0,
    gender_target VARCHAR(10) DEFAULT 'unisex',
    cl_replacement_schedule VARCHAR(20) DEFAULT '',
    cl_base_curve DECIMAL(4,2) DEFAULT 0.00,
    cl_diameter DECIMAL(4,2) DEFAULT 0.00,
    cl_water_content VARCHAR(10) DEFAULT '',
    cl_material VARCHAR(50) DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(shop_id, category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(shop_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(shop_id, name);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(shop_id, current_stock);

-- 7. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

-- 8. STOCK MOVEMENTS (Audit Trail)
CREATE TABLE IF NOT EXISTS stock_movements (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    reference_type VARCHAR(20) DEFAULT '',
    reference_id BIGINT,
    notes TEXT DEFAULT '',
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(shop_id, created_at);

-- 9. ORDERS (Billing / POS Sales)
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    order_number VARCHAR(20) NOT NULL,
    order_type VARCHAR(20) NOT NULL DEFAULT 'spectacles',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_type VARCHAR(10) DEFAULT 'flat',
    discount_value DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    taxable_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    cgst_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    sgst_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    igst_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_tax DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    balance_due DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    expected_delivery DATE,
    delivered_at TIMESTAMPTZ,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_number ON orders(shop_id, order_number);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(shop_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(shop_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_delivery ON orders(shop_id, expected_delivery);

-- 10. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
    item_type VARCHAR(30) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    hsn_code VARCHAR(20) DEFAULT '',
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 11. ORDER PRESCRIPTIONS (Snapshot per Order)
CREATE TABLE IF NOT EXISTS order_prescriptions (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    eye_test_id BIGINT REFERENCES eye_tests(id) ON DELETE SET NULL,
    checkup_by_type VARCHAR(20) DEFAULT 'optical',
    doctor_name VARCHAR(255) DEFAULT '',
    hospital_name VARCHAR(255) DEFAULT '',
    doctor_city VARCHAR(100) DEFAULT '',
    optical_shop_name VARCHAR(255) DEFAULT '',
    optical_city VARCHAR(100) DEFAULT '',
    examiner_name VARCHAR(255) DEFAULT '',
    checkup_date DATE,
    re_sph DECIMAL(6,2) DEFAULT 0.00,
    re_cyl DECIMAL(6,2) DEFAULT 0.00,
    re_axis INTEGER DEFAULT 0,
    re_add DECIMAL(6,2) DEFAULT 0.00,
    re_pd DECIMAL(5,2) DEFAULT 0.00,
    re_prism DECIMAL(5,2) DEFAULT 0.00,
    re_prism_base VARCHAR(10) DEFAULT '',
    re_visual_acuity VARCHAR(20) DEFAULT '',
    le_sph DECIMAL(6,2) DEFAULT 0.00,
    le_cyl DECIMAL(6,2) DEFAULT 0.00,
    le_axis INTEGER DEFAULT 0,
    le_add DECIMAL(6,2) DEFAULT 0.00,
    le_pd DECIMAL(5,2) DEFAULT 0.00,
    le_prism DECIMAL(5,2) DEFAULT 0.00,
    le_prism_base VARCHAR(10) DEFAULT '',
    le_visual_acuity VARCHAR(20) DEFAULT '',
    total_pd DECIMAL(5,2) DEFAULT 0.00,
    lens_for VARCHAR(30) DEFAULT '',
    lens_type VARCHAR(50) DEFAULT '',
    lens_material VARCHAR(50) DEFAULT '',
    lens_coating TEXT DEFAULT '',
    lens_side VARCHAR(10) DEFAULT 'BOTH',
    lens_company VARCHAR(100) DEFAULT '',
    lens_product VARCHAR(100) DEFAULT '',
    lens_index VARCHAR(20) DEFAULT '',
    lens_dia VARCHAR(20) DEFAULT '',
    tint VARCHAR(30) DEFAULT '',
    cl_base_curve DECIMAL(4,2) DEFAULT 0.00,
    cl_diameter DECIMAL(4,2) DEFAULT 0.00,
    cl_replacement_schedule VARCHAR(20) DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_prescriptions_order_id ON order_prescriptions(order_id);

-- 12. ORDER PAYMENTS
CREATE TABLE IF NOT EXISTS order_payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_mode VARCHAR(20) NOT NULL DEFAULT 'cash',
    transaction_ref VARCHAR(100) DEFAULT '',
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT DEFAULT '',
    received_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_payments_order_id ON order_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_date ON order_payments(payment_date);

-- 13. ORDER STATUS HISTORY
CREATE TABLE IF NOT EXISTS order_status_history (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(20) DEFAULT '',
    to_status VARCHAR(20) NOT NULL,
    changed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);

-- 14. VENDORS (Suppliers / Optical Labs)
CREATE TABLE IF NOT EXISTS vendors (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) DEFAULT '',
    phone VARCHAR(20) DEFAULT '',
    email VARCHAR(255) DEFAULT '',
    gstin VARCHAR(20) DEFAULT '',
    address TEXT DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    state VARCHAR(100) DEFAULT '',
    pin_code VARCHAR(10) DEFAULT '',
    notes TEXT DEFAULT '',
    outstanding_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendors_shop_id ON vendors(shop_id);

-- 15. PURCHASE BILLS
CREATE TABLE IF NOT EXISTS purchase_bills (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    vendor_id BIGINT NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    bill_number VARCHAR(50) NOT NULL,
    bill_date DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT DEFAULT '',
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_bills_shop_vendor ON purchase_bills(shop_id, vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_bills_status ON purchase_bills(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_purchase_bills_date ON purchase_bills(shop_id, bill_date);

-- 16. PURCHASE BILL ITEMS
CREATE TABLE IF NOT EXISTS purchase_bill_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_bill_id BIGINT NOT NULL REFERENCES purchase_bills(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_bill_items_bill_id ON purchase_bill_items(purchase_bill_id);

-- 17. VENDOR PAYMENTS
CREATE TABLE IF NOT EXISTS vendor_payments (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    vendor_id BIGINT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    purchase_bill_id BIGINT REFERENCES purchase_bills(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_mode VARCHAR(20) NOT NULL DEFAULT 'cash',
    transaction_ref VARCHAR(100) DEFAULT '',
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT DEFAULT '',
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor ON vendor_payments(shop_id, vendor_id);

-- 18. EXPENSE CATEGORIES
CREATE TABLE IF NOT EXISTS expense_categories (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 19. EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES expense_categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_mode VARCHAR(20) NOT NULL DEFAULT 'cash',
    expense_type VARCHAR(15) NOT NULL DEFAULT 'one_time',
    recurrence VARCHAR(10) DEFAULT '',
    receipt_url TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_shop_date ON expenses(shop_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(shop_id, category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(shop_id, expense_type);

-- 20. ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(30) NOT NULL,
    entity_id BIGINT,
    details TEXT DEFAULT '',
    ip_address VARCHAR(45) DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_shop_date ON activity_logs(shop_id, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id, created_at);

-- 21. SHOP SETTINGS
CREATE TABLE IF NOT EXISTS shop_settings (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_settings_key ON shop_settings(shop_id, setting_key);

-- 22. TRANSLATION CACHE (Dynamic Multilingual Translation Storage)
CREATE TABLE IF NOT EXISTS translation_cache (
    id BIGSERIAL PRIMARY KEY,
    source_text TEXT NOT NULL,
    source_lang VARCHAR(5) NOT NULL DEFAULT 'en',
    target_lang VARCHAR(5) NOT NULL,
    translated_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_translation_cache_lookup ON translation_cache(source_lang, target_lang, MD5(source_text));

-- 23. REPAIRS & SERVICES (Frame Repair & Lens Change Records)
CREATE TABLE IF NOT EXISTS repairs (
    id BIGSERIAL PRIMARY KEY,
    shop_id BIGINT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    repair_number VARCHAR(30) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) DEFAULT '',
    customer_city VARCHAR(100) DEFAULT '',
    repair_type VARCHAR(50) NOT NULL DEFAULT 'frame_repair',
    item_description TEXT DEFAULT '',
    problem_description TEXT DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'received',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    advance_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    balance_due DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    payment_mode VARCHAR(20) NOT NULL DEFAULT 'cash',
    received_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    expected_delivery DATE,
    delivered_at TIMESTAMPTZ,
    technician_name VARCHAR(100) DEFAULT '',
    notes TEXT DEFAULT '',
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_repairs_shop_id ON repairs(shop_id);
CREATE INDEX IF NOT EXISTS idx_repairs_customer ON repairs(customer_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_repairs_number ON repairs(shop_id, repair_number);
CREATE INDEX IF NOT EXISTS idx_repairs_date ON repairs(shop_id, created_at);

-- ====================================================================
-- SEED INITIAL DATA
-- ====================================================================

-- 1. Default Shop
INSERT INTO shops (id, name, phone, email, address_line1, city, state, pin_code, gstin, invoice_prefix, order_prefix, currency_symbol, default_tax_rate, optometrist_name, eye_testing_fee)
VALUES (1, 'Divya Optical', '+918468052090', 'mauryaanurag866@gmail.com', 'Khamaria Manaurveer', 'Khamaria', 'Uttar Pradesh', '221306', '', 'INV', 'ORD', '₹', 18.00, 'Dr. Anurag Maurya', 0.00)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for shops
SELECT setval('shops_id_seq', (SELECT COALESCE(MAX(id), 1) FROM shops));

-- 2. Default Admin User
INSERT INTO users (id, shop_id, username, password, full_name, email, phone, role)
VALUES (1, 1, 'admin', 'Anurag@2003', 'Anurag Maurya', 'mauryaanurag866@gmail.com', '+918468052090', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Reset sequence for users
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));

-- 3. Default Expense Categories
INSERT INTO expense_categories (shop_id, name, is_default)
VALUES 
(1, 'Rent', true),
(1, 'Utilities & Electricity', true),
(1, 'Staff Salary', true),
(1, 'Shop Supplies & Consumables', true),
(1, 'Marketing & Promotion', true),
(1, 'Repairs & Maintenance', true),
(1, 'Equipment & Machinery', true),
(1, 'Other Expenses', true)
ON CONFLICT DO NOTHING;

-- 4. Default Cash Customer
INSERT INTO customers (id, shop_id, first_name, last_name, phone, city, notes)
VALUES (1, 1, 'Cash', 'Customer', '9999999999', 'Khamaria', 'Walk-in cash customer')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for customers
SELECT setval('customers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM customers));

-- 5. Default Frame Types & Lens Options in Shop Settings
INSERT INTO shop_settings (shop_id, setting_key, setting_value)
VALUES 
(1, 'frame_types', '["3 PIECE/RIMLESS","HALF RIMLESS/SUPRA","FULL METAL","FULL SHELL/PLASTIC","GOGGLES"]'),
(1, 'lens_for_options', '["DISTANCE","NEAR","BIFOCAL","PROGRESSIVE"]'),
(1, 'lens_type_options', '["MINERAL LENS","PLASTIC LENS","POLYCARBONATE LENS","TRIVEX LENS","ORGANIC LENS","BLUE CUT","PHOTOCHROMIC"]')
ON CONFLICT (shop_id, setting_key) DO NOTHING;
