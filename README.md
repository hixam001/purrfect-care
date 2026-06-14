# Purrfect Care

An all-in-one cat health platform connecting owners with veterinarians, featuring appointment booking, a medicine database, an AI health companion powered by Google Gemini RAG, a cat store, and a patient health record system.

---

## Features

| Area | What it does |
|------|-------------|
| **AI Health Companion** | RAG pipeline — 768-dim Gemini embeddings + pgvector similarity search + Gemini chat generation |
| **Vet Chat** | Real-time owner ↔ veterinarian messaging via Supabase Realtime |
| **Appointments** | Book checkups, vaccinations, and treatments at approved hospitals |
| **Cat Profiles** | Full patient records: weight, breed, allergies, vaccination history, prescriptions |
| **Medicine Database** | Searchable catalogue with allergy/breed warnings and prescription flags |
| **Cat Store** | Browse and order from approved pet stores with delivery tracking |
| **Reviews & Offers** | Rate hospitals, vets and stores; redeem promotions |
| **Multi-role Auth** | cat_owner · vet · hospital_admin · store_owner · admin — all via Supabase Auth |

---

## Tech Stack

### Web Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite |
| Styling | Vanilla CSS (Carafe `#5e4749` / Mint `#dbe8d8` design system) |
| State | React Context + Supabase Realtime |
| Hosting | Firebase Hosting (CDN) |

### Mobile App
| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 56 |
| Navigation | Expo Router (file-based) |
| Auth | Supabase Auth (AsyncStorage) |
| Distribution | Expo Go (dev) / EAS Build (prod) |

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Python 3.14 · FastAPI · uvicorn (ASGI) |
| Deployment | Firebase Cloud Functions Gen 2 (us-central1) |
| Database client | supabase-py |
| AI | google-genai SDK |
| Payments | Safepay |
| Email | Resend |

### Database & AI
| Component | Technology |
|-----------|-----------|
| Database | Supabase (PostgreSQL 15) |
| Vector search | pgvector extension — cosine similarity |
| Geospatial | PostGIS extension |
| RAG embeddings | `models/gemini-embedding-001` (768-dim, RETRIEVAL_DOCUMENT) |
| Chat generation | `models/gemini-2.0-flash` |
| Auth | Supabase Auth (JWT) |
| Storage | Supabase Storage |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                       Clients                            │
│  React Web (Firebase Hosting)   Expo Mobile App          │
└────────────────┬────────────────────────┬────────────────┘
                 │ HTTPS                  │ HTTPS
                 ▼                        ▼
┌──────────────────────────────────────────────────────────┐
│         FastAPI  (Firebase Cloud Functions Gen 2)         │
│  /api/ai/chat   /api/auth   /api/appointments  /api/...  │
└──────┬──────────────────────────────────────┬────────────┘
       │ Supabase Client                       │ google-genai
       ▼                                       ▼
┌────────────────────┐              ┌──────────────────────┐
│  Supabase (Postgres│              │   Google Gemini API   │
│  • 28 tables       │              │  gemini-embedding-001 │
│  • pgvector        │              │  gemini-2.0-flash     │
│  • PostGIS         │◄─ RPC ──────►│                      │
│  • Realtime        │              └──────────────────────┘
│  • Auth / Storage  │
└────────────────────┘
```

---

## RAG Pipeline (AI Health Companion)

1. **Ingest** (`backend/rag/ingest.py`) — 21 Markdown knowledge files → 155 chunks, each embedded with `gemini-embedding-001` (768-dim, `RETRIEVAL_DOCUMENT`) and stored in `cat_health_knowledge`.
2. **Query** — User message embedded with `gemini-embedding-001` (`RETRIEVAL_QUERY`).
3. **Retrieve** — `match_cat_health` Postgres RPC runs cosine similarity search (`MATCH_THRESHOLD = 0.55`, `MATCH_COUNT = 6`).
4. **Generate** — Top-K chunks injected into a grounded prompt; `gemini-2.0-flash` generates the answer.

Knowledge covers: CKD, diabetes, hyperthyroidism, FLUTD, URI, vomiting/GI, diarrhea, asthma, dental disease, lameness, skin/allergies, ear problems, eye problems, parasites, obesity, anorexia, behaviour, vaccines, polydipsia.

---

## Local Development

### Prerequisites
- Python 3.12+, Node.js 20+, Expo CLI

### Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Copy .env.example → .env.local and fill in secrets
cp .env.example .env.local

uvicorn app.main:app --reload --port 8000
```

### Web Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

### Mobile App

```bash
cd mobile
npm install
npx expo start       # scan QR with Expo Go
```

### Re-ingest RAG Knowledge Base

```bash
cd backend
source venv/bin/activate
python3 rag/ingest.py
```

---

## Deployment

### Backend (Firebase Cloud Functions)

```bash
# Secrets must be in Firebase Secret Manager:
#   GEMINI_API_KEY · SUPABASE_URL · SUPABASE_ANON_KEY · SUPABASE_SERVICE_ROLE_KEY
firebase deploy --only functions
```

### Web Frontend

```bash
cd frontend && npm run build
firebase deploy --only hosting
```

### Mobile App

```bash
npx eas build --platform android   # or ios
```

---

## Environment Variables

### `backend/.env` — Non-secret (tracked, safe to commit)

```env
APP_ENV=development
APP_DEBUG=true
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://purrfect-care-app.web.app
GEMINI_EMBEDDING_MODEL=models/gemini-embedding-001
GEMINI_CHAT_MODEL=models/gemini-2.0-flash
SAFEPAY_ENV=sandbox
```

### `backend/.env.local` — Secrets (never commit, not read by Firebase CLI)

```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
SAFEPAY_SECRET_KEY=...
SAFEPAY_WEBHOOK_SECRET=...
RESEND_API_KEY=...
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...   # public anon key — safe to expose
```

---

## Database

28 PostgreSQL tables managed in Supabase. Migrations in `backend/migrations/`:

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | All 28 tables, indexes, RLS policies |
| `002_vector_search_rag.sql` | `cat_health_knowledge` table + `match_cat_health` RPC |
| `003_add_email_to_user_profiles.sql` | Added `email` column to `user_profiles` |

---

## Project Structure

```
purrfect-care/
├── backend/                    # FastAPI — Firebase Cloud Functions
│   ├── app/
│   │   ├── config.py           # Pydantic settings
│   │   ├── controllers/        # Route handlers
│   │   ├── services/           # Business logic (ai_service.py, auth_service.py …)
│   │   ├── models/             # Pydantic request/response schemas
│   │   ├── middleware/         # Auth, rate limiter, CORS, error handler
│   │   └── repositories/      # Data access layer
│   ├── migrations/             # SQL migration files (run in Supabase SQL editor)
│   ├── rag/
│   │   ├── ingest.py           # RAG knowledge ingestion script
│   │   └── knowledge/          # 21 Markdown knowledge files (feline_*.md, merck_*.md)
│   ├── main.py                 # Firebase Cloud Functions entry point
│   └── requirements.txt
├── frontend/                   # React + Vite web app
│   ├── src/
│   │   ├── pages/              # Route pages (web + mobile layouts)
│   │   ├── components/         # Shared UI components
│   │   ├── context/            # Auth context
│   │   └── lib/                # Supabase client
│   └── index.html
├── mobile/                     # Expo React Native app
│   ├── app/                    # Expo Router pages
│   ├── context/                # Auth context
│   └── lib/                    # Supabase client
├── docs/design/                # Architecture & design documents (11 files)
├── firebase.json               # Firebase Hosting + Functions config
└── README.md
```

---

## Design Documents

| # | Document |
|---|---------|
| 01 | [Actors & Use Cases](docs/design/01-actors-usecases.md) |
| 02 | [Swimlane Diagrams](docs/design/02-swimlane-diagrams.md) |
| 03 | [Transactional Diagrams](docs/design/03-transactional-diagrams.md) |
| 04 | [Object Diagram](docs/design/04-object-diagram.md) |
| 05 | [Sequence Diagrams](docs/design/05-sequence-diagrams.md) |
| 06 | [Partial Class Diagrams](docs/design/06-partial-class-diagrams.md) |
| 07 | [Complete Class Diagram](docs/design/07-complete-class-diagram.md) |
| 08 | [Database Diagram & Schema](docs/design/08-database-diagram.md) |
| 09 | [Component & Deployment](docs/design/09-component-deployment.md) |
| 10 | [Transactional Interfaces](docs/design/10-transactional-interfaces.md) |
| 11 | [Data Flow Diagram](docs/design/11-data-flow-diagram.md) |
