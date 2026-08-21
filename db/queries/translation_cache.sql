-- name: GetTranslation :one
SELECT * FROM translation_cache
WHERE source_lang = $1 AND target_lang = $2 AND source_text = $3
LIMIT 1;

-- name: GetBatchTranslations :many
SELECT source_text, translated_text FROM translation_cache
WHERE source_lang = $1 AND target_lang = $2 AND source_text = ANY(sqlc.arg(source_texts)::text[]);

-- name: UpsertTranslation :one
INSERT INTO translation_cache (
    source_text, source_lang, target_lang, translated_text
) VALUES (
    $1, $2, $3, $4
)
ON CONFLICT (source_lang, target_lang, MD5(source_text))
DO UPDATE SET 
    translated_text = EXCLUDED.translated_text,
    updated_at = now()
RETURNING *;

-- name: GetAllTranslationsForLanguage :many
SELECT source_text, translated_text FROM translation_cache
WHERE source_lang = $1 AND target_lang = $2;
