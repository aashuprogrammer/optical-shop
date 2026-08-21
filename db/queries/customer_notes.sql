-- name: ListCustomerNotes :many
SELECT cn.*, u.full_name as author_name
FROM customer_notes cn
LEFT JOIN users u ON cn.user_id = u.id
WHERE cn.customer_id = $1
ORDER BY cn.created_at DESC;

-- name: CreateCustomerNote :one
INSERT INTO customer_notes (
    customer_id, user_id, note
) VALUES (
    $1, $2, $3
)
RETURNING *;

-- name: DeleteCustomerNote :exec
DELETE FROM customer_notes
WHERE id = $1;
