-- name: ListOrderItems :many
SELECT * FROM order_items
WHERE order_id = $1
ORDER BY id ASC;

-- name: CreateOrderItem :one
INSERT INTO order_items (
    order_id, product_id, item_type, name, description,
    quantity, unit_price, discount_amount, tax_rate, tax_amount, total_price, hsn_code, details
) VALUES (
    $1, $2, $3, $4, $5,
    $6, $7, $8, $9, $10, $11, $12, $13
)
RETURNING *;

-- name: DeleteOrderItems :exec
DELETE FROM order_items
WHERE order_id = $1;
