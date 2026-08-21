-- name: ListStockMovementsByProduct :many
SELECT sm.*, u.full_name as created_by_name
FROM stock_movements sm
LEFT JOIN users u ON sm.created_by = u.id
WHERE sm.product_id = $1 AND sm.shop_id = $2
ORDER BY sm.created_at DESC
LIMIT $3 OFFSET $4;

-- name: ListStockMovements :many
SELECT sm.*, p.name as product_name, p.sku as product_sku, u.full_name as created_by_name
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
LEFT JOIN users u ON sm.created_by = u.id
WHERE sm.shop_id = $1
ORDER BY sm.created_at DESC
LIMIT $2 OFFSET $3;

-- name: CreateStockMovement :one
INSERT INTO stock_movements (
    shop_id, product_id, movement_type, quantity, reference_type, reference_id, notes, created_by
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
)
RETURNING *;
