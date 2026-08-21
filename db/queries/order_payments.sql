-- name: ListOrderPayments :many
SELECT op.*, u.full_name as received_by_name
FROM order_payments op
LEFT JOIN users u ON op.received_by = u.id
WHERE op.order_id = $1
ORDER BY op.payment_date ASC, op.id ASC;

-- name: CreateOrderPayment :one
INSERT INTO order_payments (
    order_id, amount, payment_mode, transaction_ref, notes, received_by
) VALUES (
    $1, $2, $3, $4, $5, $6
)
RETURNING *;

-- name: GetTotalPaidForOrder :one
SELECT COALESCE(SUM(amount), 0)::decimal(12,2)
FROM order_payments
WHERE order_id = $1;
