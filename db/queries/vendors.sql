-- name: GetVendorByID :one
SELECT * FROM vendors
WHERE id = $1 AND shop_id = $2 LIMIT 1;

-- name: ListVendors :many
SELECT * FROM vendors
WHERE shop_id = $1 AND is_active = true
ORDER BY name ASC;

-- name: CreateVendor :one
INSERT INTO vendors (
    shop_id, name, contact_person, phone, email, gstin, address, city, state, pin_code, notes
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
)
RETURNING *;

-- name: UpdateVendor :one
UPDATE vendors
SET 
    name = $3,
    contact_person = $4,
    phone = $5,
    email = $6,
    gstin = $7,
    address = $8,
    city = $9,
    state = $10,
    pin_code = $11,
    notes = $12,
    updated_at = now()
WHERE id = $1 AND shop_id = $2
RETURNING *;

-- name: UpdateVendorBalance :exec
UPDATE vendors
SET 
    outstanding_balance = outstanding_balance + $3,
    updated_at = now()
WHERE id = $1 AND shop_id = $2;

-- name: SoftDeleteVendor :exec
UPDATE vendors
SET is_active = false, updated_at = now()
WHERE id = $1 AND shop_id = $2;
