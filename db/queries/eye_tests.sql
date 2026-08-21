-- name: GetEyeTestByID :one
SELECT et.*, c.first_name, c.last_name, c.phone as customer_phone, u.full_name as tested_by_name
FROM eye_tests et
JOIN customers c ON et.customer_id = c.id
LEFT JOIN users u ON et.tested_by = u.id
WHERE et.id = $1 AND et.shop_id = $2 LIMIT 1;

-- name: ListEyeTestsByCustomer :many
SELECT et.*, u.full_name as tested_by_name
FROM eye_tests et
LEFT JOIN users u ON et.tested_by = u.id
WHERE et.customer_id = $1 AND et.shop_id = $2
ORDER BY et.test_date DESC;

-- name: ListEyeTests :many
SELECT et.*, c.first_name, c.last_name, c.phone as customer_phone, u.full_name as tested_by_name
FROM eye_tests et
JOIN customers c ON et.customer_id = c.id
LEFT JOIN users u ON et.tested_by = u.id
WHERE et.shop_id = $1
  AND (
    $2::text = '' OR
    et.test_number ILIKE '%' || $2 || '%' OR
    c.first_name ILIKE '%' || $2 || '%' OR
    c.last_name ILIKE '%' || $2 || '%' OR
    c.phone ILIKE '%' || $2 || '%'
  )
  AND ($3::timestamptz IS NULL OR et.test_date >= $3)
  AND ($4::timestamptz IS NULL OR et.test_date <= $4)
ORDER BY et.test_date DESC
LIMIT $5 OFFSET $6;

-- name: CountEyeTests :one
SELECT COUNT(*)
FROM eye_tests et
JOIN customers c ON et.customer_id = c.id
WHERE et.shop_id = $1
  AND (
    $2::text = '' OR
    et.test_number ILIKE '%' || $2 || '%' OR
    c.first_name ILIKE '%' || $2 || '%' OR
    c.last_name ILIKE '%' || $2 || '%' OR
    c.phone ILIKE '%' || $2 || '%'
  )
  AND ($3::timestamptz IS NULL OR et.test_date >= $3)
  AND ($4::timestamptz IS NULL OR et.test_date <= $4);

-- name: CreateEyeTest :one
INSERT INTO eye_tests (
    shop_id, customer_id, tested_by, test_number, test_date,
    checkup_by_type, doctor_name, hospital_name, doctor_city,
    optical_shop_name, optical_city, examiner_name,
    re_sph, re_cyl, re_axis, re_add, re_pd, re_prism, re_prism_base, re_visual_acuity,
    le_sph, le_cyl, le_axis, le_add, le_pd, le_prism, le_prism_base, le_visual_acuity,
    total_pd, notes
) VALUES (
    $1, $2, $3, $4, $5,
    $6, $7, $8, $9,
    $10, $11, $12,
    $13, $14, $15, $16, $17, $18, $19, $20,
    $21, $22, $23, $24, $25, $26, $27, $28,
    $29, $30
)
RETURNING *;

-- name: UpdateEyeTest :one
UPDATE eye_tests
SET 
    tested_by = $3,
    test_date = $4,
    checkup_by_type = $5,
    doctor_name = $6,
    hospital_name = $7,
    doctor_city = $8,
    optical_shop_name = $9,
    optical_city = $10,
    examiner_name = $11,
    re_sph = $12,
    re_cyl = $13,
    re_axis = $14,
    re_add = $15,
    re_pd = $16,
    re_prism = $17,
    re_prism_base = $18,
    re_visual_acuity = $19,
    le_sph = $20,
    le_cyl = $21,
    le_axis = $22,
    le_add = $23,
    le_pd = $24,
    le_prism = $25,
    le_prism_base = $26,
    le_visual_acuity = $27,
    total_pd = $28,
    notes = $29,
    updated_at = now()
WHERE id = $1 AND shop_id = $2
RETURNING *;

-- name: DeleteEyeTest :exec
DELETE FROM eye_tests
WHERE id = $1 AND shop_id = $2;
