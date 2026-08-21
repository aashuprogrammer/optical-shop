-- name: ListShopSettings :many
SELECT * FROM shop_settings
WHERE shop_id = $1
ORDER BY setting_key ASC;

-- name: GetShopSetting :one
SELECT * FROM shop_settings
WHERE shop_id = $1 AND setting_key = $2 LIMIT 1;

-- name: UpsertShopSetting :one
INSERT INTO shop_settings (
    shop_id, setting_key, setting_value
) VALUES (
    $1, $2, $3
)
ON CONFLICT (shop_id, setting_key)
DO UPDATE SET setting_value = $3, updated_at = now()
RETURNING *;
