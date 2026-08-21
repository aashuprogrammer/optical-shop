package config

import (
	"log"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                  string
	DatabaseURL           string
	TokenSymmetricKey     string
	TokenDuration         time.Duration
	R2AccessKeyID         string
	R2SecretAccessKey     string
	R2Endpoint            string
	R2BucketName          string
	R2PublicURL           string
	ProfilesFolder    string
	CORSOrigins       []string
}

func LoadConfig() *Config {
	// Try loading .env if present
	if err := godotenv.Load(); err != nil {
		log.Println("Note: .env file not found or couldn't be loaded, reading from environment variables")
	}

	port := getEnv("PORT", "5000")
	dbURL := getEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/optical_shop?sslmode=disable")
	tokenKey := getEnv("TOKEN_SYMMETRIC_KEY", "qwertyuioplkjhgfdsazxcvbnm578145") // 32 characters

	// Token duration
	durationStr := getEnv("TOKEN_DURATION", "24h")
	duration, err := time.ParseDuration(durationStr)
	if err != nil {
		duration = 24 * time.Hour
	}

	corsStr := getEnv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
	var corsOrigins []string
	for _, origin := range strings.Split(corsStr, ",") {
		trimmed := strings.TrimSpace(origin)
		if trimmed != "" {
			corsOrigins = append(corsOrigins, trimmed)
		}
	}

	return &Config{
		Port:              port,
		DatabaseURL:       dbURL,
		TokenSymmetricKey: tokenKey,
		TokenDuration:     duration,
		R2AccessKeyID:     getEnv("R2_ACCESS_KEY_ID", ""),
		R2SecretAccessKey: getEnv("R2_SECRET_ACCESS_KEY", ""),
		R2Endpoint:        getEnv("R2_ENDPOINT", ""),
		R2BucketName:      getEnv("R2_BUCKET_NAME", "optical-shop"),
		R2PublicURL:       getEnv("R2_PUBLIC_URL", ""),
		ProfilesFolder:    getEnv("PROFILES_FOLDER", "profiles"),
		CORSOrigins:       corsOrigins,
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return fallback
}
