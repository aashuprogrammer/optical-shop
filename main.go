package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"optical-shop/db/pgdb"
	"optical-shop/internal/config"
	"optical-shop/internal/server"
	"optical-shop/internal/storage"
	"optical-shop/internal/token"
)

func main() {
	cfg := config.LoadConfig()

	log.Printf("Starting OptiSuite Optical Shop Management System on port %s...", cfg.Port)

	// 1. PostgreSQL Connection Pool
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	poolConfig, err := pgxpool.ParseConfig(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Unable to parse database URL: %v", err)
	}
	poolConfig.MaxConns = 25
	poolConfig.MinConns = 2
	poolConfig.MaxConnLifetime = 1 * time.Hour
	poolConfig.MaxConnIdleTime = 30 * time.Minute

	dbPool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		log.Printf("Warning: Failed to connect to database: %v. Running in offline/degraded mode.", err)
	} else {
		defer dbPool.Close()
		log.Println("Connected to PostgreSQL database successfully.")
	}

	var queries pgdb.Querier
	if dbPool != nil {
		queries = pgdb.New(dbPool)
	}

	// 2. Token Maker (Paseto v2)
	tokenMaker, err := token.NewPasetoMaker(cfg.TokenSymmetricKey)
	if err != nil {
		log.Fatalf("Failed to create Paseto token maker: %v", err)
	}

	// 3. Cloudflare R2 Storage Service
	r2Service, err := storage.NewR2Service(cfg)
	if err != nil {
		log.Printf("Warning: Failed to initialize R2 storage: %v", err)
	}

	// 4. Initialize Server
	srv := server.NewServer(cfg, queries, tokenMaker, r2Service)

	// Graceful shutdown channel
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	go func() {
		if err := srv.Listen(); err != nil {
			log.Printf("Server stopped: %v", err)
		}
	}()

	<-quit
	log.Println("Shutting down OptiSuite gracefully...")
}
