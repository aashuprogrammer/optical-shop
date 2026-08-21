-- name: ListActivityLogs :many
SELECT al.*, u.full_name as user_name, u.username
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.shop_id = $1
ORDER BY al.created_at DESC
LIMIT $2 OFFSET $3;

-- name: CreateActivityLog :one
INSERT INTO activity_logs (
    shop_id, user_id, action, entity_type, entity_id, details, ip_address
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
RETURNING *;
