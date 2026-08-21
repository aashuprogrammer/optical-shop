-- name: GetExpenseByID :one
SELECT e.*, ec.name as category_name, u.full_name as created_by_name
FROM expenses e
LEFT JOIN expense_categories ec ON e.category_id = ec.id
LEFT JOIN users u ON e.created_by = u.id
WHERE e.id = $1 AND e.shop_id = $2 LIMIT 1;

-- name: ListExpenses :many
SELECT e.*, ec.name as category_name, u.full_name as created_by_name
FROM expenses e
LEFT JOIN expense_categories ec ON e.category_id = ec.id
LEFT JOIN users u ON e.created_by = u.id
WHERE e.shop_id = $1
  AND (sqlc.arg(category_id)::bigint = 0 OR e.category_id = sqlc.arg(category_id))
  AND (sqlc.arg(expense_type)::text = 'all' OR e.expense_type = sqlc.arg(expense_type))
  AND (sqlc.narg(from_date)::date IS NULL OR e.expense_date >= sqlc.narg(from_date))
  AND (sqlc.narg(to_date)::date IS NULL OR e.expense_date <= sqlc.narg(to_date))
ORDER BY e.expense_date DESC, e.id DESC
LIMIT sqlc.arg(limit_count) OFFSET sqlc.arg(offset_count);

-- name: CountExpenses :one
SELECT COUNT(*)
FROM expenses e
WHERE e.shop_id = $1
  AND (sqlc.arg(category_id)::bigint = 0 OR e.category_id = sqlc.arg(category_id))
  AND (sqlc.arg(expense_type)::text = 'all' OR e.expense_type = sqlc.arg(expense_type))
  AND (sqlc.narg(from_date)::date IS NULL OR e.expense_date >= sqlc.narg(from_date))
  AND (sqlc.narg(to_date)::date IS NULL OR e.expense_date <= sqlc.narg(to_date));

-- name: GetExpensesSummary :one
SELECT 
    COALESCE(SUM(amount), 0)::decimal(12,2) AS total_amount,
    COALESCE(SUM(amount) FILTER (WHERE expense_type = 'one_time'), 0)::decimal(12,2) AS one_time_amount,
    COALESCE(SUM(amount) FILTER (WHERE expense_type = 'recurring'), 0)::decimal(12,2) AS recurring_amount
FROM expenses
WHERE shop_id = $1
  AND (sqlc.narg(from_date)::date IS NULL OR expense_date >= sqlc.narg(from_date))
  AND (sqlc.narg(to_date)::date IS NULL OR expense_date <= sqlc.narg(to_date));

-- name: CreateExpense :one
INSERT INTO expenses (
    shop_id, category_id, title, amount, expense_date, payment_mode,
    expense_type, recurrence, receipt_url, notes, created_by
) VALUES (
    $1, $2, $3, $4, $5, $6,
    $7, $8, $9, $10, $11
)
RETURNING *;

-- name: UpdateExpense :one
UPDATE expenses
SET 
    category_id = $3,
    title = $4,
    amount = $5,
    expense_date = $6,
    payment_mode = $7,
    expense_type = $8,
    recurrence = $9,
    receipt_url = $10,
    notes = $11,
    updated_at = now()
WHERE id = $1 AND shop_id = $2
RETURNING *;

-- name: DeleteExpense :exec
DELETE FROM expenses
WHERE id = $1 AND shop_id = $2;
