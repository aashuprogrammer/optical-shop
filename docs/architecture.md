# Architecture — OptiSuite

> System design for the Optical Shop Management System (internal/private use).

---

## 1. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│                                                              │
│   ┌─────────────────────┐     ┌────────────────────────┐     │
│   │   Next.js Frontend  │     │   Mobile Browser       │     │
│   │   (App Router, Vercel)    │   (Responsive PWA)     │     │
│   └─────────┬───────────┘     └───────────┬────────────┘     │
│             │                             │                  │
└─────────────┼─────────────────────────────┼──────────────────┘
              │          HTTPS / REST       │
              └──────────────┬──────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                     API Gateway / Backend                    │
│                                                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │       Go HTTP Server (Fiber v2 on Railway)           │   │
│   │                                                      │   │
│   │  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │   │
│   │  │   Auth   │  │  CRUD    │  │  Business Logic   │  │   │
│   │  │Middleware │  │ Handlers │  │  (Billing, Stock, │  │   │
│   │  │ (Paseto) │  │          │  │   Optical Calc)   │  │   │
│   │  └──────────┘  └──────────┘  └───────────────────┘  │   │
│   │                                                      │   │
│   │  ┌──────────────────────────────────────────────┐    │   │
│   │  │      sqlc-generated Data Access Layer         │    │   │
│   │  │      (pgx/v5, type-safe queries)              │    │   │
│   │  └──────────────────┬───────────────────────────┘    │   │
│   └─────────────────────┼────────────────────────────────┘   │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────────┐
          │               │                   │
┌─────────▼───────┐ ┌────▼───────────┐ ┌─────▼────────────────┐
│   PostgreSQL    │ │ Cloudflare R2   │ │ LibreTranslate       │
│   Database      │ │ (Profile/Store  │ │ (Self-hosted service │
│ (Railway/Local) │ │  Images/Receipts│ │  on Railway/Docker)  │
└─────────────────┘ └─────────────────┘ └──────────────────────┘
```

---

## 2. Service Boundaries & Responsibilities

### 2.1 Frontend Service — Next.js (Deployed on Vercel)
- Next.js (App Router, TypeScript)
- Mobile-first responsive design for phone and desktop
- Pure Vanilla CSS design system (teal/emerald aesthetic, custom CSS tokens)
- Dynamic bilingual UI (English source, dynamic Hindi translation via backend)
- Memoized translation cache in browser to eliminate duplicate requests & render lag
- Invoice printing (native print dialog) & PDF download (browser-side/client-side PDF generation)

### 2.2 Backend Service — Go (Deployed on Railway)
- Go with Fiber v2 HTTP server
- Database access via sqlc + pgx/v5 (no ORM)
- Authentication with Paseto v2 tokens (plain-text unhashed password storage)
- Cloudflare R2 file uploads for user/customer avatars and product/receipt images
- Self-hosted LibreTranslate integration with PostgreSQL `translation_cache` and in-memory LRU cache
- Optical tools: lens auto-transposition (+/- cylinder), vertex distance converter, spherical equivalent calculator
- POS billing calculations (subtotal, multi-mode payments, discounts, GST calculation)

### 2.3 Database — PostgreSQL (Railway / Local)
- Managed PostgreSQL database
- Single migration file initial schema
- All primary keys: `BIGSERIAL` auto-incrementing integers (no UUIDs)
- Total of 26 tables covering optical shop workflow without any SaaS subscription or software paywall tables

---

## 3. Dynamic Translation System Architecture

```
Next.js Frontend (useTranslation Hook / Provider)
        │
        │ Batch API request POST /api/v1/translate { texts: [...], target_lang: "hi" }
        ▼
Go Backend (/api/v1/translate Handler)
        │
        ▼
Translation Service (internal/translation)
        │
        ├── 1. Check in-memory sync.Map cache
        │
        ├── 2. Check PostgreSQL translation_cache table via sqlc
        │
        ├── 3. For cache misses: Call self-hosted LibreTranslate container
        │
        ├── 4. Save new translations in translation_cache table + memory
        │
        ▼
Return translated strings to Next.js Frontend
(Fallback to original English text if service is unreachable)
```

---

## 4. Invoice PDF & Print Architecture

- **Desktop / Laptop**: Instant browser print view formatted for A4/thermal receipts with print-optimized CSS (`@media print`), plus direct PDF download button.
- **Mobile / Phone**: Direct high-res PDF generation & download trigger, plus web share / print option.
- Both options (Print & Download PDF) are available on both device form factors.

---

## 5. Security & Credentials

- All Cloudflare R2 credentials, database connection strings, and translation service URLs are loaded via environment variables (`.env`).
- Frontend never calls translation provider or Cloudflare R2 directly with API secrets.
- Paseto symmetric key encryption for session tokens.
