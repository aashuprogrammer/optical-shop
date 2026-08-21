-- name: GetProductByID :one
SELECT * FROM products
WHERE id = $1 AND shop_id = $2 LIMIT 1;

-- name: ListProducts :many
SELECT * FROM products
WHERE shop_id = $1
  AND is_active = true
  AND (
    $2::text = '' OR
    name ILIKE '%' || $2 || '%' OR
    sku ILIKE '%' || $2 || '%' OR
    brand ILIKE '%' || $2 || '%' OR
    model ILIKE '%' || $2 || '%' OR
    barcode ILIKE '%' || $2 || '%'
  )
  AND ($3::text = 'all' OR category = $3)
  AND (
    $4::text = 'any' OR
    ($4::text = 'in_stock' AND current_stock > 0) OR
    ($4::text = 'out_of_stock' AND current_stock <= 0) OR
    ($4::text = 'low_stock' AND current_stock <= min_stock_level)
  )
ORDER BY 
  CASE WHEN $5::text = 'name_asc' THEN name END ASC,
  CASE WHEN $5::text = 'price_asc' THEN selling_price END ASC,
  CASE WHEN $5::text = 'price_desc' THEN selling_price END DESC,
  CASE WHEN $5::text = 'stock_asc' THEN current_stock END ASC,
  CASE WHEN $5::text = 'type_name' OR $5::text = '' THEN category END ASC, name ASC
LIMIT $6 OFFSET $7;

-- name: CountProducts :one
SELECT COUNT(*) FROM products
WHERE shop_id = $1
  AND is_active = true
  AND (
    $2::text = '' OR
    name ILIKE '%' || $2 || '%' OR
    sku ILIKE '%' || $2 || '%' OR
    brand ILIKE '%' || $2 || '%' OR
    model ILIKE '%' || $2 || '%' OR
    barcode ILIKE '%' || $2 || '%'
  )
  AND ($3::text = 'all' OR category = $3)
  AND (
    $4::text = 'any' OR
    ($4::text = 'in_stock' AND current_stock > 0) OR
    ($4::text = 'out_of_stock' AND current_stock <= 0) OR
    ($4::text = 'low_stock' AND current_stock <= min_stock_level)
  );

-- name: GetLowStockProducts :many
SELECT * FROM products
WHERE shop_id = $1
  AND is_active = true
  AND current_stock <= min_stock_level
ORDER BY current_stock ASC;

-- name: CreateProduct :one
INSERT INTO products (
    shop_id, name, sku, category, brand, model, color, size, description,
    purchase_price, selling_price, hsn_code, gst_rate, current_stock, min_stock_level,
    barcode, image_url, frame_type, frame_material, frame_shape, temple_length,
    bridge_width, lens_width, gender_target, cl_replacement_schedule, cl_base_curve,
    cl_diameter, cl_water_content, cl_material
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9,
    $10, $11, $12, $13, $14, $15,
    $16, $17, $18, $19, $20, $21,
    $22, $23, $24, $25, $26,
    $27, $28, $29
)
RETURNING *;

-- name: UpdateProduct :one
UPDATE products
SET 
    name = $3,
    sku = $4,
    category = $5,
    brand = $6,
    model = $7,
    color = $8,
    size = $9,
    description = $10,
    purchase_price = $11,
    selling_price = $12,
    hsn_code = $13,
    gst_rate = $14,
    min_stock_level = $15,
    barcode = $16,
    image_url = $17,
    frame_type = $18,
    frame_material = $19,
    frame_shape = $20,
    temple_length = $21,
    bridge_width = $22,
    lens_width = $23,
    gender_target = $24,
    cl_replacement_schedule = $25,
    cl_base_curve = $26,
    cl_diameter = $27,
    cl_water_content = $28,
    cl_material = $29,
    updated_at = now()
WHERE id = $1 AND shop_id = $2
RETURNING *;

-- name: UpdateProductStock :one
UPDATE products
SET 
    current_stock = current_stock + $3,
    updated_at = now()
WHERE id = $1 AND shop_id = $2
RETURNING *;

-- name: SoftDeleteProduct :exec
UPDATE products
SET is_active = false, updated_at = now()
WHERE id = $1 AND shop_id = $2;
