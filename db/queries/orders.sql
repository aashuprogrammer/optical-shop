-- name: GetOrderByID :one
SELECT o.*, c.first_name, c.last_name, c.phone as customer_phone, c.city as customer_city, c.date_of_birth as customer_dob, c.gender as customer_gender, c.address_line1 as customer_address, u.full_name as created_by_name
FROM orders o
JOIN customers c ON o.customer_id = c.id
LEFT JOIN users u ON o.created_by = u.id
WHERE o.id = $1 AND o.shop_id = $2 LIMIT 1;

-- name: GetOrderByNumber :one
SELECT o.*, c.first_name, c.last_name, c.phone as customer_phone, c.city as customer_city, c.date_of_birth as customer_dob, c.gender as customer_gender, c.address_line1 as customer_address, u.full_name as created_by_name
FROM orders o
JOIN customers c ON o.customer_id = c.id
LEFT JOIN users u ON o.created_by = u.id
WHERE o.order_number = $1 AND o.shop_id = $2 LIMIT 1;

-- name: ListOrders :many
SELECT o.*, c.first_name, c.last_name, c.phone as customer_phone, u.full_name as created_by_name
FROM orders o
JOIN customers c ON o.customer_id = c.id
LEFT JOIN users u ON o.created_by = u.id
WHERE o.shop_id = $1
  AND (
    sqlc.arg(search)::text = '' OR
    o.order_number ILIKE '%' || sqlc.arg(search) || '%' OR
    c.first_name ILIKE '%' || sqlc.arg(search) || '%' OR
    c.last_name ILIKE '%' || sqlc.arg(search) || '%' OR
    c.phone ILIKE '%' || sqlc.arg(search) || '%'
  )
  AND (sqlc.arg(status)::text = 'all' OR o.status = sqlc.arg(status))
  AND (sqlc.arg(payment_status)::text = 'all' OR o.payment_status = sqlc.arg(payment_status))
  AND (sqlc.arg(order_type)::text = 'all' OR o.order_type = sqlc.arg(order_type))
  AND (sqlc.narg(from_date)::timestamptz IS NULL OR o.created_at >= sqlc.narg(from_date))
  AND (sqlc.narg(to_date)::timestamptz IS NULL OR o.created_at <= sqlc.narg(to_date))
ORDER BY o.created_at DESC
LIMIT sqlc.arg(limit_count) OFFSET sqlc.arg(offset_count);

-- name: CountOrders :one
SELECT COUNT(*)
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.shop_id = $1
  AND (
    sqlc.arg(search)::text = '' OR
    o.order_number ILIKE '%' || sqlc.arg(search) || '%' OR
    c.first_name ILIKE '%' || sqlc.arg(search) || '%' OR
    c.last_name ILIKE '%' || sqlc.arg(search) || '%' OR
    c.phone ILIKE '%' || sqlc.arg(search) || '%'
  )
  AND (sqlc.arg(status)::text = 'all' OR o.status = sqlc.arg(status))
  AND (sqlc.arg(payment_status)::text = 'all' OR o.payment_status = sqlc.arg(payment_status))
  AND (sqlc.arg(order_type)::text = 'all' OR o.order_type = sqlc.arg(order_type))
  AND (sqlc.narg(from_date)::timestamptz IS NULL OR o.created_at >= sqlc.narg(from_date))
  AND (sqlc.narg(to_date)::timestamptz IS NULL OR o.created_at <= sqlc.narg(to_date));

-- name: ListOrdersByCustomer :many
SELECT o.*, u.full_name as created_by_name
FROM orders o
LEFT JOIN users u ON o.created_by = u.id
WHERE o.customer_id = $1 AND o.shop_id = $2
ORDER BY o.created_at DESC;

-- name: ListOrdersDue :many
SELECT o.*, c.first_name, c.last_name, c.phone as customer_phone
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.shop_id = $1
  AND o.expected_delivery = sqlc.arg(delivery_date)::date
  AND o.status != 'delivered'
  AND o.status != 'cancelled'
ORDER BY o.id ASC;

-- name: CreateOrder :one
INSERT INTO orders (
    shop_id, customer_id, created_by, order_number, order_type, status,
    payment_status, subtotal, discount_type, discount_value, discount_amount,
    taxable_amount, cgst_amount, sgst_amount, igst_amount, total_tax,
    grand_total, amount_paid, balance_due, expected_delivery, notes
) VALUES (
    $1, $2, $3, $4, $5, $6,
    $7, $8, $9, $10, $11,
    $12, $13, $14, $15, $16,
    $17, $18, $19, $20, $21
)
RETURNING *;

-- name: UpdateOrderStatus :one
UPDATE orders
SET 
    status = sqlc.arg(status)::text,
    delivered_at = CASE WHEN sqlc.arg(status)::text = 'delivered' THEN now() ELSE delivered_at END,
    updated_at = now()
WHERE id = $1 AND shop_id = $2
RETURNING *;

-- name: UpdateOrderPaymentStatus :one
UPDATE orders
SET 
    amount_paid = amount_paid + sqlc.arg(amount_paid)::numeric,
    balance_due = grand_total - (amount_paid + sqlc.arg(amount_paid)::numeric),
    payment_status = CASE 
        WHEN (amount_paid + sqlc.arg(amount_paid)::numeric) >= grand_total THEN 'paid'
        WHEN (amount_paid + sqlc.arg(amount_paid)::numeric) > 0 THEN 'partial'
        ELSE 'pending'
    END,
    updated_at = now()
WHERE id = $1 AND shop_id = $2
RETURNING *;

-- name: CancelOrder :one
UPDATE orders
SET status = 'cancelled', updated_at = now()
WHERE id = $1 AND shop_id = $2
RETURNING *;

-- name: UpdateOrder :one
UPDATE orders
SET 
    subtotal = $3,
    discount_type = $4,
    discount_value = $5,
    discount_amount = $6,
    taxable_amount = $7,
    cgst_amount = $8,
    sgst_amount = $9,
    igst_amount = $10,
    total_tax = $11,
    grand_total = $12,
    balance_due = $12 - amount_paid,
    payment_status = CASE 
        WHEN amount_paid >= $12 THEN 'paid'
        WHEN amount_paid > 0 THEN 'partial'
        ELSE 'pending'
    END,
    expected_delivery = $13,
    notes = $14,
    updated_at = now()
WHERE id = $1 AND shop_id = $2
RETURNING *;
