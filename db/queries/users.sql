-- name: GetUserByUsername :one
SELECT * FROM users
WHERE username = $1 LIMIT 1;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1 LIMIT 1;

-- name: ListUsersByShop :many
SELECT * FROM users
WHERE shop_id = $1
ORDER BY id ASC;

-- name: CreateUser :one
INSERT INTO users (
    shop_id, username, password, full_name, email, phone, role, profile_image_url, is_active
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9
)
RETURNING *;

-- name: UpdateUser :one
UPDATE users
SET 
    full_name = $2,
    email = $3,
    phone = $4,
    role = $5,
    profile_image_url = $6,
    is_active = $7,
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: UpdateUserPassword :one
UPDATE users
SET password = $2, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: UpdateLastLogin :exec
UPDATE users
SET last_login_at = now(), updated_at = now()
WHERE id = $1;

-- name: DeleteUser :exec
DELETE FROM users
WHERE id = $1;
