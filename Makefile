DB_URL=postgresql://neondb_owner:npg_hUz5S0ZiAJPc@ep-snowy-scene-ay3cytlk-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

dev:
	go run main.go

migrateup:
	migrate -path ./db/migrations -database "$(DB_URL)" -verbose up

migrateup1:
	migrate -path ./db/migrations -database "$(DB_URL)" -verbose up 1

migratedown:
	migrate -path ./db/migrations -database "$(DB_URL)" -verbose down

migratedown1:
	migrate -path ./db/migrations -database "$(DB_URL)" -verbose down 1

migratedrop:
	migrate -path ./db/migrations -database "$(DB_URL)" -verbose drop -f

sqlc:
	sqlc generate

.PHONY: dev migrateup migrateup1 migratedown migratedown1 migratedrop sqlc
