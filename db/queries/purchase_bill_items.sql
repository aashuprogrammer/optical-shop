-- name: ListPurchaseBillItems :many
SELECT * FROM purchase_bill_items
WHERE purchase_bill_id = $1
ORDER BY id ASC;

-- name: CreatePurchaseBillItem :one
INSERT INTO purchase_bill_items (
    purchase_bill_id, product_id, name, quantity, unit_price, tax_rate, tax_amount, total_price
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
)
RETURNING *;
