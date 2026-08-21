-- name: GetShopByID :one
SELECT * FROM shops
WHERE id = $1 LIMIT 1;

-- name: UpdateShopProfile :one
UPDATE shops
SET 
    name = $2,
    phone = $3,
    email = $4,
    address_line1 = $5,
    address_line2 = $6,
    city = $7,
    state = $8,
    pin_code = $9,
    gstin = $10,
    logo_url = $11,
    invoice_prefix = $12,
    order_prefix = $13,
    currency_symbol = $14,
    default_tax_rate = $15,
    optometrist_name = $16,
    eye_testing_fee = $17,
    terms_and_conditions = $18,
    language = $19,
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: IncrementAndGetNextOrderNumber :one
UPDATE shops
SET order_next_number = order_next_number + 1, updated_at = now()
WHERE id = $1
RETURNING order_prefix, order_next_number - 1 AS order_number;

-- name: IncrementAndGetNextInvoiceNumber :one
UPDATE shops
SET invoice_next_number = invoice_next_number + 1, updated_at = now()
WHERE id = $1
RETURNING invoice_prefix, invoice_next_number - 1 AS invoice_number;
