-- name: GetCustomerByID :one
SELECT * FROM customers
WHERE id = $1 AND shop_id = $2 LIMIT 1;

-- name: ListCustomers :many
SELECT * FROM customers
WHERE shop_id = $1 
  AND is_active = true
  AND (
    $2::text = '' OR 
    first_name ILIKE '%' || $2 || '%' OR 
    last_name ILIKE '%' || $2 || '%' OR 
    phone ILIKE '%' || $2 || '%' OR
    city ILIKE '%' || $2 || '%' OR
    pin_code ILIKE '%' || $2 || '%'
  )
  AND (
    $3::text = 'all' OR
    ($3::text = 'with_dues' AND outstanding_dues > 0) OR
    ($3::text = 'without_dues' AND outstanding_dues = 0)
  )
  AND (
    $4::text = '' OR city ILIKE $4
  )
ORDER BY 
  CASE WHEN $5::text = 'name_asc' THEN first_name END ASC,
  CASE WHEN $5::text = 'name_desc' THEN first_name END DESC,
  CASE WHEN $5::text = 'oldest' THEN id END ASC,
  CASE WHEN $5::text = 'newest' OR $5::text = '' THEN id END DESC
LIMIT $6 OFFSET $7;

-- name: CountCustomers :one
SELECT COUNT(*) FROM customers
WHERE shop_id = $1 
  AND is_active = true
  AND (
    $2::text = '' OR 
    first_name ILIKE '%' || $2 || '%' OR 
    last_name ILIKE '%' || $2 || '%' OR 
    phone ILIKE '%' || $2 || '%' OR
    city ILIKE '%' || $2 || '%' OR
    pin_code ILIKE '%' || $2 || '%'
  )
  AND (
    $3::text = 'all' OR
    ($3::text = 'with_dues' AND outstanding_dues > 0) OR
    ($3::text = 'without_dues' AND outstanding_dues = 0)
  )
  AND (
    $4::text = '' OR city ILIKE $4
  );

-- name: GetCustomerStats :one
SELECT 
    COUNT(*) AS total_in_book,
    COUNT(*) FILTER (WHERE created_at >= now() - INTERVAL '7 days') AS new_7d,
    COALESCE(SUM(outstanding_dues), 0)::decimal(12,2) AS total_outstanding
FROM customers
WHERE shop_id = $1 AND is_active = true;

-- name: CreateCustomer :one
INSERT INTO customers (
    shop_id, first_name, last_name, phone, email, date_of_birth, gender,
    address_line1, address_line2, city, state, pin_code, profile_image_url, notes
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
)
RETURNING *;

-- name: UpdateCustomer :one
UPDATE customers
SET 
    first_name = $3,
    last_name = $4,
    phone = $5,
    email = $6,
    date_of_birth = $7,
    gender = $8,
    address_line1 = $9,
    address_line2 = $10,
    city = $11,
    state = $12,
    pin_code = $13,
    profile_image_url = $14,
    notes = $15,
    updated_at = now()
WHERE id = $1 AND shop_id = $2
RETURNING *;

-- name: UpdateCustomerFinancials :exec
UPDATE customers
SET 
    total_spent = total_spent + $3,
    outstanding_dues = outstanding_dues + $4,
    updated_at = now()
WHERE id = $1 AND shop_id = $2;

-- name: SetCustomerOutstandingDues :exec
UPDATE customers
SET 
    outstanding_dues = $3,
    updated_at = now()
WHERE id = $1 AND shop_id = $2;

-- name: SoftDeleteCustomer :exec
UPDATE customers
SET is_active = false, updated_at = now()
WHERE id = $1 AND shop_id = $2;

-- name: GetCustomerCities :many
SELECT DISTINCT city FROM customers
WHERE shop_id = $1 AND city != '' AND is_active = true
ORDER BY city ASC;
