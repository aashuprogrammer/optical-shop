-- name: GetPurchaseBillByID :one
SELECT pb.*, v.name as vendor_name, u.full_name as created_by_name
FROM purchase_bills pb
JOIN vendors v ON pb.vendor_id = v.id
LEFT JOIN users u ON pb.created_by = u.id
WHERE pb.id = $1 AND pb.shop_id = $2 LIMIT 1;

-- name: ListPurchaseBills :many
SELECT pb.*, v.name as vendor_name, u.full_name as created_by_name
FROM purchase_bills pb
JOIN vendors v ON pb.vendor_id = v.id
LEFT JOIN users u ON pb.created_by = u.id
WHERE pb.shop_id = $1
  AND (
    sqlc.arg(search)::text = '' OR
    pb.bill_number ILIKE '%' || sqlc.arg(search) || '%' OR
    v.name ILIKE '%' || sqlc.arg(search) || '%'
  )
  AND (sqlc.arg(status)::text = 'all' OR pb.status = sqlc.arg(status))
  AND (sqlc.arg(vendor_id)::bigint = 0 OR pb.vendor_id = sqlc.arg(vendor_id))
  AND (sqlc.narg(from_date)::date IS NULL OR pb.bill_date >= sqlc.narg(from_date))
  AND (sqlc.narg(to_date)::date IS NULL OR pb.bill_date <= sqlc.narg(to_date))
ORDER BY pb.bill_date DESC, pb.id DESC
LIMIT sqlc.arg(limit_count) OFFSET sqlc.arg(offset_count);

-- name: CountPurchaseBills :one
SELECT COUNT(*)
FROM purchase_bills pb
JOIN vendors v ON pb.vendor_id = v.id
WHERE pb.shop_id = $1
  AND (
    sqlc.arg(search)::text = '' OR
    pb.bill_number ILIKE '%' || sqlc.arg(search) || '%' OR
    v.name ILIKE '%' || sqlc.arg(search) || '%'
  )
  AND (sqlc.arg(status)::text = 'all' OR pb.status = sqlc.arg(status))
  AND (sqlc.arg(vendor_id)::bigint = 0 OR pb.vendor_id = sqlc.arg(vendor_id))
  AND (sqlc.narg(from_date)::date IS NULL OR pb.bill_date >= sqlc.narg(from_date))
  AND (sqlc.narg(to_date)::date IS NULL OR pb.bill_date <= sqlc.narg(to_date));

-- name: CreatePurchaseBill :one
INSERT INTO purchase_bills (
    shop_id, vendor_id, bill_number, bill_date, due_date,
    subtotal, tax_amount, total_amount, amount_paid, balance, status, notes, created_by
) VALUES (
    $1, $2, $3, $4, $5,
    $6, $7, $8, $9, $10, $11, $12, $13
)
RETURNING *;

-- name: UpdatePurchaseBillPayment :one
UPDATE purchase_bills
SET 
    amount_paid = amount_paid + $3,
    balance = total_amount - (amount_paid + $3),
    status = CASE 
        WHEN (amount_paid + $3) >= total_amount THEN 'paid'
        WHEN (amount_paid + $3) > 0 THEN 'partial'
        ELSE 'pending'
    END,
    updated_at = now()
WHERE id = $1 AND shop_id = $2
RETURNING *;
