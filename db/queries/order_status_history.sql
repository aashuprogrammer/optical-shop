-- name: ListOrderStatusHistory :many
SELECT osh.*, u.full_name as changed_by_name
FROM order_status_history osh
LEFT JOIN users u ON osh.changed_by = u.id
WHERE osh.order_id = $1
ORDER BY osh.created_at ASC;

-- name: CreateOrderStatusHistory :one
INSERT INTO order_status_history (
    order_id, from_status, to_status, changed_by, notes
) VALUES (
    $1, $2, $3, $4, $5
)
RETURNING *;
