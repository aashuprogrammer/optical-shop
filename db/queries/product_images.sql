-- name: ListProductImages :many
SELECT * FROM product_images
WHERE product_id = $1
ORDER BY sort_order ASC, id ASC;

-- name: CreateProductImage :one
INSERT INTO product_images (
    product_id, image_url, sort_order
) VALUES (
    $1, $2, $3
)
RETURNING *;

-- name: DeleteProductImage :exec
DELETE FROM product_images
WHERE id = $1;
