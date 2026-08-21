-- name: ListExpenseCategories :many
SELECT * FROM expense_categories
WHERE shop_id = $1
ORDER BY is_default DESC, name ASC;

-- name: CreateExpenseCategory :one
INSERT INTO expense_categories (
    shop_id, name, is_default
) VALUES (
    $1, $2, $3
)
RETURNING *;

-- name: DeleteExpenseCategory :exec
DELETE FROM expense_categories
WHERE id = $1 AND shop_id = $2;
