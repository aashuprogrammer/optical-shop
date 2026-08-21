-- name: ListVendorPayments :many
SELECT vp.*, v.name as vendor_name, u.full_name as created_by_name
FROM vendor_payments vp
JOIN vendors v ON vp.vendor_id = v.id
LEFT JOIN users u ON vp.created_by = u.id
WHERE vp.shop_id = $1
ORDER BY vp.payment_date DESC
LIMIT $2 OFFSET $3;

-- name: ListVendorPaymentsByVendor :many
SELECT vp.*, u.full_name as created_by_name
FROM vendor_payments vp
LEFT JOIN users u ON vp.created_by = u.id
WHERE vp.vendor_id = $1 AND vp.shop_id = $2
ORDER BY vp.payment_date DESC;

-- name: CreateVendorPayment :one
INSERT INTO vendor_payments (
    shop_id, vendor_id, purchase_bill_id, amount, payment_mode, transaction_ref, notes, created_by
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
)
RETURNING *;
