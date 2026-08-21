-- name: GetOrderPrescription :one
SELECT * FROM order_prescriptions
WHERE order_id = $1 LIMIT 1;

-- name: CreateOrderPrescription :one
INSERT INTO order_prescriptions (
    order_id, eye_test_id,
    checkup_by_type, doctor_name, hospital_name, doctor_city,
    optical_shop_name, optical_city, examiner_name, checkup_date,
    re_sph, re_cyl, re_axis, re_add, re_pd, re_prism, re_prism_base, re_visual_acuity,
    le_sph, le_cyl, le_axis, le_add, le_pd, le_prism, le_prism_base, le_visual_acuity,
    total_pd, lens_for, lens_type, lens_material, lens_coating, lens_side,
    lens_company, lens_product, lens_index, lens_dia,
    tint, cl_base_curve, cl_diameter, cl_replacement_schedule, notes
) VALUES (
    $1, $2,
    $3, $4, $5, $6,
    $7, $8, $9, $10,
    $11, $12, $13, $14, $15, $16, $17, $18,
    $19, $20, $21, $22, $23, $24, $25, $26,
    $27, $28, $29, $30, $31, $32,
    $33, $34, $35, $36,
    $37, $38, $39, $40, $41
)
RETURNING *;

-- name: DeleteOrderPrescription :exec
DELETE FROM order_prescriptions
WHERE order_id = $1;
