-- name: GetRepairByID :one
SELECT r.*, u.full_name as created_by_name
FROM repairs r
LEFT JOIN users u ON r.created_by = u.id
WHERE r.id = $1 AND r.shop_id = $2 LIMIT 1;

-- name: GetRepairByNumber :one
SELECT r.*, u.full_name as created_by_name
FROM repairs r
LEFT JOIN users u ON r.created_by = u.id
WHERE r.repair_number = $1 AND r.shop_id = $2 LIMIT 1;

-- name: ListRepairs :many
SELECT r.*, u.full_name as created_by_name
FROM repairs r
LEFT JOIN users u ON r.created_by = u.id
WHERE r.shop_id = $1
  AND (
    sqlc.arg(search)::text = '' OR
    r.repair_number ILIKE '%' || sqlc.arg(search) || '%' OR
    r.customer_name ILIKE '%' || sqlc.arg(search) || '%' OR
    r.customer_phone ILIKE '%' || sqlc.arg(search) || '%'
  )
  AND (sqlc.arg(status)::text = 'all' OR r.status = sqlc.arg(status))
  AND (sqlc.arg(repair_type)::text = 'all' OR r.repair_type = sqlc.arg(repair_type))
ORDER BY r.id DESC
LIMIT sqlc.arg(limit_count) OFFSET sqlc.arg(offset_count);

-- name: CountRepairs :one
SELECT COUNT(*)
FROM repairs r
WHERE r.shop_id = $1
  AND (
    sqlc.arg(search)::text = '' OR
    r.repair_number ILIKE '%' || sqlc.arg(search) || '%' OR
    r.customer_name ILIKE '%' || sqlc.arg(search) || '%' OR
    r.customer_phone ILIKE '%' || sqlc.arg(search) || '%'
  )
  AND (sqlc.arg(status)::text = 'all' OR r.status = sqlc.arg(status))
  AND (sqlc.arg(repair_type)::text = 'all' OR r.repair_type = sqlc.arg(repair_type));

-- name: GetRepairStats :one
SELECT 
    COUNT(*) AS total_repairs,
    COUNT(*) FILTER (WHERE status = 'received') AS count_received,
    COUNT(*) FILTER (WHERE status = 'in_progress') AS count_in_progress,
    COUNT(*) FILTER (WHERE status = 'ready') AS count_ready,
    COUNT(*) FILTER (WHERE status = 'delivered') AS count_delivered,
    COALESCE(SUM(total_amount), 0)::decimal(12,2) AS total_amount,
    COALESCE(SUM(balance_due), 0)::decimal(12,2) AS total_pending_dues
FROM repairs
WHERE shop_id = $1;

-- name: CreateRepair :one
INSERT INTO repairs (
    shop_id, customer_id, repair_number, customer_name, customer_phone,
    customer_city, repair_type, item_description, problem_description,
    status, total_amount, advance_paid, balance_due, payment_mode,
    expected_delivery, technician_name, notes, created_by
) VALUES (
    $1, $2, $3, $4, $5,
    $6, $7, $8, $9,
    $10, $11, $12, $13, $14,
    $15, $16, $17, $18
)
RETURNING *;

-- name: UpdateRepair :one
UPDATE repairs
SET 
    customer_name = $3,
    customer_phone = $4,
    customer_city = $5,
    repair_type = $6,
    item_description = $7,
    problem_description = $8,
    status = $9,
    total_amount = $10,
    advance_paid = $11,
    balance_due = $12,
    payment_mode = $13,
    expected_delivery = $14,
    delivered_at = CASE WHEN $9 = 'delivered' AND delivered_at IS NULL THEN now() ELSE delivered_at END,
    technician_name = $15,
    notes = $16,
    updated_at = now()
WHERE id = $1 AND shop_id = $2
RETURNING *;

-- name: UpdateRepairStatus :one
UPDATE repairs
SET 
    status = sqlc.arg(status)::text,
    delivered_at = CASE WHEN sqlc.arg(status)::text = 'delivered' THEN now() ELSE delivered_at END,
    updated_at = now()
WHERE id = $1 AND shop_id = $2
RETURNING *;

-- name: DeleteRepair :exec
DELETE FROM repairs
WHERE id = $1 AND shop_id = $2;
