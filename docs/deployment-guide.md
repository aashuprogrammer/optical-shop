# OptiSuite - Deployment & Operations Guide

This guide covers deployment procedures for **OptiSuite (Optical Shop Management System)** across Docker Compose, Railway, and Vercel.

---

## Architecture Overview

```
[ Next.js Frontend (Port 3000) ] 
       |
       | (REST API + Paseto Cookie/Bearer)
       v
[ Go Fiber Backend (Port 8080) ]
       |------------------------|
       v                        v
[ PostgreSQL 16 (Port 5432) ]   [ LibreTranslate Self-Hosted (Port 5000) ]
```

---

## 1. Local / Self-Hosted Docker Compose Deployment

The fastest way to run the full stack locally or on a private store server:

### Prerequisites
- Docker Engine & Docker Compose installed.

### Steps
1. Clone the repository:
   ```bash
   git clone <repo-url> optical-shop
   cd optical-shop
   ```
2. Copy environment file:
   ```bash
   cp .env.example .env
   ```
3. Start all 4 containers (`postgres`, `libretranslate`, `backend`, `frontend`):
   ```bash
   docker compose up --build -d
   ```
4. Access the web interface at **`http://localhost:3000`**.
   - Default Administrator Login:
     - **Username**: `admin`
     - **Password**: `Anurag@2003`

---

## 2. Railway & Vercel Production Deployment

### A. Railway (Backend + PostgreSQL + LibreTranslate)
1. **Create PostgreSQL Database on Railway**:
   - In Railway dashboard, click `New` -> `Database` -> `Add PostgreSQL`.
   - Copy the `DATABASE_URL` from the Railway Connect tab.
2. **Deploy LibreTranslate on Railway**:
   - Click `New` -> `Docker Image` -> enter `libretranslate/libretranslate:latest`.
   - Add environment variable `LT_LOAD_ONLY=en,hi`.
   - Note the internal service domain (e.g. `http://libretranslate.railway.internal:5000`).
3. **Deploy Go Backend on Railway**:
   - Click `New` -> `GitHub Repo` -> select `optical-shop`.
   - Set the root directory to `/`.
   - Configure Environment Variables:
     - `PORT=8080`
     - `DATABASE_URL=<your-railway-postgres-url>`
     - `TOKEN_SYMMETRIC_KEY=01234567890123456789012345678901`
     - `TOKEN_DURATION=24h`
     - `TRANSLATION_SERVICE_URL=http://libretranslate.railway.internal:5000`
   - Generate Railway Public Domain (e.g. `https://optisuite-backend.up.railway.app`).

### B. Vercel (Next.js Frontend)
1. In Vercel dashboard, click `Add New...` -> `Project` -> import `optical-shop`.
2. Set **Root Directory** to `frontend`.
3. Set Environment Variables:
   - `NEXT_PUBLIC_API_URL=https://optisuite-backend.up.railway.app`
4. Deploy!
5. Access your custom store domain (e.g. `https://myopticalshop.vercel.app`).

---

## 3. Database Migrations & Seeding

Migrations are located in `db/migrations/`:
- `000001_init_schema.up.sql` (Creates all 26 tables, indexes, default admin user, default categories, and shop profile)
- `000001_init_schema.down.sql`

To run migrations manually via `golang-migrate`:
```bash
make migrateup
```

---

## 4. Key Operational Features

- **No SaaS / Subscription Restrictions**: Private internal software with 0 subscription locks.
- **Multilingual Support**: Real-time on-demand translation with dual-layer caching (Postgres + memory).
- **Offline / Local Friendly**: Can run completely air-gapped on a local store computer without cloud dependencies.
- **Thermal & Standard A4 Printing**: Native print stylesheet and PDF downloading for both laptops and mobile devices.
