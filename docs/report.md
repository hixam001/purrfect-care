# PurrfectCare — Complete Project Report

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Objectives](#2-objectives)
3. [System Actors](#3-system-actors)
4. [Use Cases](#4-use-cases)
5. [System Architecture](#5-system-architecture)
6. [Technology Stack](#6-technology-stack)
7. [Database Design](#7-database-design)
8. [Data Flow Diagram](#8-data-flow-diagram)
9. [Database Diagram](#9-database-diagram)
10. [Backend API Design](#10-backend-api-design)
11. [Frontend Design](#11-frontend-design)
12. [Mobile Application](#12-mobile-application)
13. [AI Companion — RAG Pipeline](#13-ai-companion--rag-pipeline)
14. [Authentication & Security](#14-authentication--security)
15. [Payment Integration](#15-payment-integration)
16. [Real-Time Chat System](#16-real-time-chat-system)
17. [Deployment Architecture](#17-deployment-architecture)
18. [Row Level Security (RLS) Strategy](#18-row-level-security-rls-strategy)
19. [Key Design Decisions](#19-key-design-decisions)
20. [Migration History](#20-migration-history)

---

## 1. Project Overview

**PurrfectCare** is a full-stack, multi-role SaaS platform designed to serve as an all-in-one digital health ecosystem for cat owners in Pakistan. The platform connects cat owners with nearby veterinarians and pet stores, provides AI-assisted health diagnosis, and manages the complete lifecycle of a cat's medical care — from booking appointments to prescriptions, medical records, and post-visit chat with a vet.

| Property | Value |
|----------|-------|
| **Platform Name** | PurrfectCare |
| **Domain** | Cat health & veterinary services |
| **Target Market** | Pakistan (cat owners, vet clinics, pet stores) |
| **Live Web App** | https://purrfect-care-app.web.app |
| **Backend API** | https://server-vmvwkwachq-uc.a.run.app |
| **Database** | Supabase (PostgreSQL 15) — 28 tables, 25 migrations |
| **Total API Routes** | 13+ FastAPI controllers |
| **AI Model** | Google Gemini 2.0 Flash (chat) + Gemini Embedding 001 (RAG) |

---

## 2. Objectives

1. **Digitise veterinary access** — Allow cat owners to discover, book, and communicate with licensed veterinarians without phone calls or walk-ins.
2. **AI-first health companion** — Provide an RAG-powered symptom checker that gives evidence-based health guidance before a vet visit.
3. **Unified medical records** — Maintain a persistent, role-gated patient history (weight, vaccinations, prescriptions, diagnoses) accessible to both owners and vets.
4. **Commerce integration** — Enable cat product purchasing directly within the health platform, connecting approved pet stores to cat owners.
5. **Multi-stakeholder platform** — Support five distinct user roles with tailored dashboards, access controls, and workflows, all on a single platform.
6. **Security by default** — Enforce Row Level Security (RLS) at the database layer so that data is isolated by role even in the event of an application bug.

---

## 3. System Actors

### Human Actors

| ID | Actor | Description | Access Level |
|----|-------|-------------|-------------|
| A1 | **Cat Owner** | Registers cats, books appointments, chats with vets, shops at stores, uses AI companion | User-level |
| A2 | **Veterinarian (Vet)** | Views appointment queue, manages patient records, chats with owners, prescribes medicines | Vet-level |
| A3 | **Hospital / Clinic Admin** | Registers the clinic, manages vets, services, appointment slots, and reviews | Hospital-level |
| A4 | **Cat Store Owner** | Manages store page, product listings, inventory, and fulfils orders | Store-level |
| A5 | **System Admin** | Full platform control — approves hospitals/stores/vets, manages users and content | Admin-level |

### System / External Actors

| ID | Actor | Type | Description |
|----|-------|------|-------------|
| A6 | **AI Companion** | System | Gemini-powered RAG pipeline for illness diagnosis |
| A7 | **Supabase** | External | PostgreSQL database, Auth, Realtime, and Storage |
| A8 | **Safepay** | External | Pakistani payment gateway for appointment fees and store orders |
| A9 | **Google Gemini API** | External | LLM chat generation + vector embedding |
| A10 | **Notification Service** | External | Push notifications and email (Resend) |

---

## 4. Use Cases

### Cat Owner (A1)

| ID | Use Case |
|----|----------|
| UC-1.1 | Register / Login |
| UC-1.2 | Register a cat (breed, age, weight, medical history) |
| UC-1.3 | Browse nearby hospitals and vet clinics |
| UC-1.4 | Book an appointment (checkup / vaccination / treatment) |
| UC-1.5 | Pay appointment platform fee via Safepay |
| UC-1.6 | Chat with assigned vet in real-time |
| UC-1.7 | Consult the AI Companion with symptoms |
| UC-1.8 | View cat's patient history, prescriptions, and records |
| UC-1.9 | Browse the medicine database |
| UC-1.10 | Browse and purchase from cat stores |
| UC-1.11 | Track orders |
| UC-1.12 | Rate and review hospitals, vets, and stores |
| UC-1.13 | Manage profile and notification preferences |

### Veterinarian (A2)

| ID | Use Case |
|----|----------|
| UC-2.1 | Register as a vet (linked to a hospital) |
| UC-2.2 | View upcoming appointment queue |
| UC-2.3 | Mark appointment status (in progress / completed / no show) |
| UC-2.4 | Chat in real-time with the cat owner |
| UC-2.5 | Create and update patient medical records |
| UC-2.6 | Prescribe medicines from the database |
| UC-2.7 | Add treatment notes and follow-up instructions |
| UC-2.8 | View full patient history |

### Hospital Admin (A3)

| ID | Use Case |
|----|----------|
| UC-3.1 | Register a hospital |
| UC-3.2 | Add and manage vets at the hospital |
| UC-3.3 | Define services (checkup, vaccination, surgery, etc.) |
| UC-3.4 | Configure appointment time slots |
| UC-3.5 | Confirm or cancel appointments |
| UC-3.6 | Create promotional offers |
| UC-3.7 | View appointment analytics |
| UC-3.8 | Respond to patient reviews |

### Cat Store Owner (A4)

| ID | Use Case |
|----|----------|
| UC-4.1 | Register a store |
| UC-4.2 | Manage product catalogue |
| UC-4.3 | Process and fulfil orders |
| UC-4.4 | Create promotional campaigns |
| UC-4.5 | Respond to customer reviews |

### System Admin (A5)

| ID | Use Case |
|----|----------|
| UC-5.1 | Approve / suspend hospitals and stores |
| UC-5.2 | Verify vet licences |
| UC-5.3 | Manage medicine and cat breed databases |
| UC-5.4 | Moderate reviews and content |
| UC-5.5 | View platform-wide analytics |

---

## 5. System Architecture

PurrfectCare follows a **three-tier architecture** with a clear separation between the client layer, backend API layer, and data layer.

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                            │
│                                                                │
│   React 18 Web App (Firebase Hosting CDN)                      │
│   React Native + Expo Mobile App                               │
└───────────────────────────┬────────────────────────────────────┘
                            │ HTTPS / REST
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                    BACKEND API LAYER                           │
│                                                                │
│   FastAPI (Python 3.14) — Firebase Cloud Functions Gen 2       │
│   ├── JWT Auth Middleware                                      │
│   ├── Role-Based Access Guard                                  │
│   ├── Controllers (auth, appointments, hospitals, chat, AI…)   │
│   └── Supabase Service-Role Client (bypasses RLS for admin ops)│
└─────────────┬────────────────────────────────┬─────────────────┘
              │                                │
              ▼                                ▼
┌─────────────────────────┐    ┌───────────────────────────────┐
│    DATA LAYER           │    │      EXTERNAL SERVICES        │
│                         │    │                               │
│  Supabase (PostgreSQL)  │    │  Google Gemini API            │
│  • 28 tables            │    │  • gemini-2.0-flash (chat)    │
│  • 25 RLS migrations    │    │  • gemini-embedding-001 (RAG) │
│  • pgvector (AI)        │    │                               │
│  • PostGIS (geo)        │    │  Safepay (payments)           │
│  • Supabase Auth (JWT)  │    │  Resend (email)               │
│  • Supabase Realtime    │    │                               │
│  • Supabase Storage     │    │                               │
└─────────────────────────┘    └───────────────────────────────┘
```

### Key Architectural Principles

- **Service-role bypass pattern**: Sensitive read operations that would fail due to RLS recursion (e.g. reading `user_profiles` from vet queries) are routed through the FastAPI backend using the Supabase service-role key, which bypasses all RLS policies.
- **JWT-first auth**: The frontend stores a `pc_token` (backend JWT) in `localStorage`. All backend API calls use `Authorization: Bearer <pc_token>`. Supabase session tokens are stored separately and used only for Supabase Realtime subscriptions.
- **Optimistic UI**: Chat messages appear instantly in the UI (optimistic update) before the backend confirms the insert, with automatic rollback on failure.

---

## 6. Technology Stack

### Web Frontend

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite 5 |
| Styling | Vanilla CSS — custom design system (Carafe `#5e4749` / Mint `#dbe8d8`) |
| State Management | React Context API + `useState` / `useEffect` |
| Realtime | Supabase JS Client — Postgres Changes subscription |
| Routing | React Router v6 |
| HTTP | Native `fetch` API with `Authorization: Bearer` headers |
| Build | Vite production build → Firebase Hosting CDN |
| Hosting | Firebase Hosting (global CDN, immutable asset caching) |

### Mobile Application

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 56 |
| Navigation | Expo Router (file-based routing) |
| Auth | Supabase Auth + AsyncStorage |
| Distribution | Expo Go (development) / EAS Build (production) |

### Backend

| Layer | Technology |
|-------|-----------|
| Language / Runtime | Python 3.14 |
| Framework | FastAPI (async ASGI) |
| Server | Uvicorn |
| Deployment | Firebase Cloud Functions Gen 2 (us-central1) |
| Database Client | `supabase-py` (both anon and service-role clients) |
| AI SDK | `google-genai` |
| Payment | Safepay REST API (HMAC webhook verification) |
| Email | Resend API |
| Configuration | Pydantic `Settings` (loaded from `.env`) |

### Database & Infrastructure

| Component | Technology |
|-----------|-----------|
| Database | Supabase — PostgreSQL 15 |
| Vector Search | pgvector extension — cosine similarity (`IVFFLAT` index) |
| Geospatial | PostGIS extension |
| Authentication | Supabase Auth (JWT, refresh token) |
| Storage | Supabase Storage (cat photos, hospital banners) |
| Realtime | Supabase Realtime (Postgres Changes — chat messages) |

---

## 7. Database Design

### Overview

The database contains **28 tables** organised around the **Transaction Pattern** (a structured object modelling framework):

| Player Role | Tables |
|-------------|--------|
| **Participant** | `users`, `user_profiles`, `vets` |
| **SpecificItem** | `cats`, `medical_records` |
| **Item** | `cat_breeds`, `medicines`, `hospital_services`, `products`, `product_categories`, `cat_health_knowledge` |
| **Place** | `hospitals`, `cat_stores` |
| **Transaction** | `appointments`, `appointment_slots`, `orders`, `chat_rooms`, `ai_consultations`, `reviews`, `offers` |
| **TransactionLineItem** | `order_items`, `messages` |
| **SubsequentTransaction** | `treatments`, `prescriptions`, `payments`, `patient_history`, `review_responses` |
| **System** | `notifications` |

### Core Tables Summary

#### `user_profiles` — Platform user registry
Stores name, email, phone, avatar, and role (`cat_owner`, `vet`, `hospital_admin`, `store_owner`, `admin`) for every authenticated user. The `id` (UUID PK) is the internal profile key; `user_id` (UUID FK → `auth.users`) is the Supabase auth UID.

#### `cats` — Cat patient records
Each cat belongs to a cat owner (`owner_id FK → user_profiles.id`). Stores breed, date of birth, weight, known allergies, vaccination status, and avatar.

#### `hospitals` — Vet clinic listings
Stores clinic name, city, address, coordinates (PostGIS GEOGRAPHY), banner image, approval status, and the admin's profile ID.

#### `vets` — Veterinarian profiles
Linked to both a `user_profiles` row and a `hospitals` row. Stores specialization, experience years, bio, rating, and a `is_verified` flag controlled by hospital admins.

#### `appointment_slots` — Bookable time blocks
Each slot belongs to a hospital and optionally a vet. Tracks `start_time`, `end_time`, and `is_booked` (not `is_available` — corrected in a later migration).

#### `appointments` — Booking transactions
The central transaction table. Stores `user_id` (cat owner profile PK), `vet_id`, `cat_id`, `hospital_id`, `service_id`, `slot_id`, `appointment_date`, `status` (`pending`, `confirmed`, `in_progress`, `completed`, `cancelled`, `no_show`), `amount_paid`, `payment_id`.

#### `chat_rooms` — Vet-patient chat threads
One chat room per appointment (`UNIQUE(appointment_id)` — added in migration 025). Links `user_id` (cat owner's `user_profiles.id`) and `vet_id` (`vets.id`). Tracks `last_message_at` and unread counts.

#### `messages` — Chat message log
Each message links to a `chat_room_id` and stores `sender_id` (profile PK), `content`, `sent_at`, and `message_type`.

#### `cat_health_knowledge` — RAG vector store
155 chunks from 21 veterinary markdown articles, each with a 768-dimensional `gemini-embedding-001` embedding stored as a pgvector `VECTOR(768)` column. Searched via the `match_cat_health` Postgres RPC using cosine similarity.

#### `payments` — Payment records
Tracks Safepay transaction tokens, amounts, currency, and status (`pending`, `paid`, `failed`, `refunded`) for both appointment fees and store orders.

### PostgreSQL Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- UUID generation
CREATE EXTENSION IF NOT EXISTS "postgis";      -- Geospatial queries
CREATE EXTENSION IF NOT EXISTS "vector";       -- pgvector for AI
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Trigram search for medicine names
```

---

## 8. Data Flow Diagram

### Level 0 — Context Diagram

*(Diagram image to be inserted here)*

---

### Level 1 — System Decomposition

*(Diagram image to be inserted here)*

---

## 9. Database Diagram

*(Diagram image to be inserted here)*

---

## 10. Backend API Design

### Controller Structure

The FastAPI backend is organised into controllers, each mounted on a dedicated router prefix:

| Controller | Prefix | Responsibility |
|------------|--------|----------------|
| `auth_controller` | `/api/auth` | Registration, login, profile fetch |
| `hospital_controller` | `/api/hospitals` | Hospital listing, vet registration, single vet lookup |
| `appointment_controller` | `/api/appointments` | Booking, status updates, chat room and message endpoints |
| `payment_controller` | `/api/payments` | Safepay session creation and webhook handling |
| `ai_controller` | `/api/ai` | Gemini RAG chat endpoint |
| `order_controller` | `/api/orders` | Store order creation and management |
| `store_controller` | `/api/stores` | Store listing and product catalogue |
| `user_controller` | `/api/users` | Profile updates |
| `subscription_controller` | `/api/subscriptions` | Subscription plan management |

### Key API Endpoints

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /api/auth/register` | Public | Create Supabase auth user + `user_profiles` row |
| `POST /api/auth/login` | Public | Validate credentials, issue JWT + Supabase session tokens |
| `GET /api/auth/me` | Bearer JWT | Return authenticated user's profile |
| `GET /api/hospitals` | Public | List approved hospitals |
| `GET /api/hospitals/{id}/vets` | Public | List verified vets for a hospital (service role) |
| `GET /api/hospitals/vet/{vet_id}` | Public | Get single vet's name and avatar (service role) |
| `POST /api/hospitals/vets` | Hospital admin JWT | Register new vet account |
| `GET /api/appointments/mine` | Vet JWT | Vet's appointment queue |
| `PATCH /api/appointments/{id}/status` | Vet / Hospital admin JWT | Update appointment status |
| `GET /api/appointments/{id}` | Bearer JWT | Single appointment with participant verification (service role) |
| `GET /api/appointments/{id}/chat-room` | Bearer JWT | Get or create chat room (service role) |
| `GET /api/appointments/{id}/messages` | Bearer JWT | Load all chat messages (service role) |
| `POST /api/appointments/{id}/messages` | Bearer JWT | Send a message (service role) |
| `POST /api/payments/appointment-session` | Bearer JWT | Create Safepay checkout session for appointment fee |
| `POST /api/payments/order-session` | Bearer JWT | Create Safepay checkout session for store order |
| `POST /api/payments/webhook` | Safepay HMAC | Receive payment confirmation, update status |
| `POST /api/ai/chat` | Bearer JWT | RAG-powered AI health consultation |

### Auth Middleware

Every protected endpoint passes through `get_current_user`, which:
1. Extracts the `Authorization: Bearer <token>` header.
2. Decodes the JWT using the `JWT_SECRET` environment variable.
3. Returns an `AuthenticatedUser(id=auth_uid)` object for use in the controller.
4. Raises `401 Unauthorized` if the token is missing, expired, or invalid.

### Service-Role Pattern

Several operations require reading across RLS boundaries (e.g. reading `user_profiles` when the caller is a different role). These use the **service-role Supabase client** (injected via `Depends(get_supabase_client)`), which holds the `SUPABASE_SERVICE_ROLE_KEY` and bypasses all RLS policies. This is used for:
- Fetching vet names for chat display
- Creating and reading chat rooms
- Inserting and reading messages
- Verifying appointment participation

---

## 11. Frontend Design

### Page Structure

| Page | Route | Role |
|------|-------|------|
| `LoginPage` | `/login` | All |
| `RegisterPage` | `/register` | All |
| `DashboardPage` | `/dashboard` | Cat Owner |
| `MyCatsPage` | `/my-cats` | Cat Owner |
| `BookingPage` | `/book/:hospitalId` | Cat Owner |
| `PaymentReturnPage` | `/payment-return` | Cat Owner |
| `ChatPage` | `/chat/:appointmentId` | Cat Owner, Vet |
| `ChatsInboxPage` | `/chats` | Cat Owner, Vet |
| `AICompanionPage` | `/ai-companion` | Cat Owner |
| `FindVetsPage` | `/find-vets` | Cat Owner |
| `HospitalDetailPage` | `/hospitals/:id` | Cat Owner |
| `MedicinesPage` | `/medicines` | Cat Owner, Vet |
| `StorePage` | `/stores` | Cat Owner |
| `StoreDetailPage` | `/stores/:id` | Cat Owner |
| `SettingsPage` | `/settings` | All |
| `VetDashboard` | `/vet-dashboard` | Vet |
| `HospitalAdminDashboard` | `/hospital-dashboard` | Hospital Admin |
| `StoreDashboard` | `/store-dashboard` | Store Owner |
| `HospitalRegisterPage` | `/hospital-register` | Hospital Admin |
| `StoreRegisterPage` | `/store-register` | Store Owner |
| `SubscriptionPage` | `/subscription` | All |
| `SystemAdminDashboard` | `/admin` | Admin |
| `SystemAdminLoginPage` | `/admin/login` | Admin |

### Design System

The UI uses a bespoke CSS design system built around two primary palette identities:
- **Carafe** (`#5e4749`) — warm brown-red for primary actions and headings
- **Mint** (`#dbe8d8`) — soft green for backgrounds and success states

Typography is set with **Inter** (Google Fonts). The design uses glassmorphism cards (`backdrop-filter: blur`), smooth CSS transitions, and micro-animations throughout.

### Auth Context

`AuthContext` wraps the entire app and provides:
- `user` — the authenticated user's profile object (from `/api/auth/me`)
- `login(email, password)` — calls backend, stores `pc_token` + Supabase session tokens, sets session
- `logout()` — clears all tokens and Supabase session
- `restore()` — re-establishes both the backend profile and the Supabase session on page load (Supabase `setSession` is awaited before `setUser` to prevent auth state race conditions)

---

## 12. Mobile Application

PurrfectCare includes a companion React Native mobile app built with Expo SDK 56. It shares the same backend API and Supabase project as the web app.

| Property | Value |
|----------|-------|
| Framework | React Native + Expo SDK 56 |
| Navigation | Expo Router (file-based, similar to Next.js) |
| Auth | Supabase Auth + AsyncStorage for token persistence |
| Target | iOS and Android |
| Distribution | Expo Go (development) / EAS Build (production APK/IPA) |

The mobile app covers core cat owner workflows: registration, cat profiles, hospital browsing, appointment booking, AI companion, and store browsing.

---

## 13. AI Companion — RAG Pipeline

PurrfectCare's AI health companion is powered by a **Retrieval-Augmented Generation (RAG)** pipeline built on Google Gemini.

### Pipeline Architecture

```
User symptom query
       │
       ▼
[1] Embed query with gemini-embedding-001 (768-dim, RETRIEVAL_QUERY)
       │
       ▼
[2] Call match_cat_health Postgres RPC (cosine similarity, top-6 chunks)
    — Sequential scan (exact cosine, not approximate IVFFLAT)
       │
       ▼
[3] Inject retrieved chunks into Gemini system prompt as grounding context
       │
       ▼
[4] gemini-2.0-flash generates a grounded, evidence-based response
       │
       ▼
[5] Response returned to user + consultation logged to ai_consultations
```

### Knowledge Base

| Property | Value |
|----------|-------|
| Source articles | 21 veterinary markdown files |
| Total chunks | 155 rows in `cat_health_knowledge` |
| Embedding model | `models/gemini-embedding-001` |
| Embedding dimensions | 768 |
| Embedding task type | `RETRIEVAL_DOCUMENT` |
| Similarity metric | Cosine similarity |
| Index | `ivfflat` (lists=12, `vector_cosine_ops`) |
| Top-k retrieval | 6 chunks per query |
| Match threshold | Configurable (default 0.5) |

### Topics Covered

Feline CKD, diabetes, dental disease, diarrhoea, ear problems, eye problems, FLUTD/urinary issues, lameness, anorexia, behavioural issues, respiratory infections, hyperthyroidism, and more.

---

## 14. Authentication & Security

### Authentication Flow

1. User submits email + password to `POST /api/auth/login`.
2. Backend calls `supabase.auth.sign_in_with_password()` using the service-role admin client.
3. Supabase returns an `access_token` (Supabase JWT) and `refresh_token`.
4. Backend also generates its own `pc_token` (app JWT, signed with `JWT_SECRET`).
5. Frontend stores `pc_token`, `sb_access_token`, and `sb_refresh_token` in `localStorage`.
6. Frontend calls `supabase.auth.setSession({ access_token, refresh_token })` to establish the Supabase client session (awaited before setting user state to avoid race conditions).

### Token Usage

| Token | Used for | Storage |
|-------|----------|---------|
| `pc_token` | All FastAPI backend API calls (`Authorization: Bearer`) | `localStorage` |
| `sb_access_token` | Supabase Realtime channel authentication | `localStorage` |
| `sb_refresh_token` | Supabase token refresh | `localStorage` |

### Role-Based Access Control (RBAC)

Every FastAPI controller resolves the caller's role from the database before performing any operation. Role-specific restrictions are enforced at both the API layer and the database RLS layer:

| Role | Key Permissions |
|------|----------------|
| `cat_owner` | Book appointments, chat, view own cats |
| `vet` | View/update their appointments, prescribe, chat |
| `hospital_admin` | Confirm/cancel appointments, manage vets and slots |
| `store_owner` | Manage products and orders |
| `admin` | Full platform access |

### Password Security

Passwords are hashed using **bcrypt** (via `passlib`) before storage. The raw password is never stored or logged.

---

## 15. Payment Integration

PurrfectCare uses **Safepay** — a Pakistani payment gateway — for processing appointment fees and store order payments.

### Appointment Payment Flow

```
Cat Owner clicks "Pay"
       │
       ▼
POST /api/payments/appointment-session  →  Safepay creates checkout session
       │                                   Returns tracker token + checkout URL
       ▼
Browser redirects to Safepay hosted checkout page
       │
       ▼
Cat Owner completes payment
       │
       ▼
Safepay sends HMAC-signed webhook → POST /api/payments/webhook
       │
       ▼
Backend verifies HMAC signature, updates appointment.amount_paid + status
```

### Store Order Payment

Same flow applies for store orders via `POST /api/payments/order-session`. The webhook updates the `orders.status` and `payments` table.

### Security

Webhook authenticity is verified using HMAC-SHA256 with the `SAFEPAY_SECRET_KEY`. Invalid or tampered webhooks are rejected with `403 Forbidden`.

---

## 16. Real-Time Chat System

### Overview

The vet chat system enables real-time messaging between a cat owner and the assigned veterinarian for a confirmed appointment.

### Architecture

All write and read operations are handled by the **FastAPI backend** using the service-role client (no direct Supabase client queries from the browser for auth-sensitive operations). Supabase Realtime is used only for live message push updates.

### Chat Flow

```
Cat owner opens ChatPage (appointmentId in URL)
       │
       ▼
[1] GET /api/auth/me  →  resolve profile (backend JWT, no Supabase session)
       │
       ▼
[2] GET /api/appointments/{id}  →  verify participant + get vet name
       │  403 if not cat owner or assigned vet
       ▼
[3] GET /api/appointments/{id}/chat-room  →  get or create chat room
       │  (service role — creates room if first visit)
       ▼
[4] GET /api/appointments/{id}/messages  →  load message history
       │
       ▼
[5] Subscribe to Supabase Realtime channel (chat_room_{id})
       │  → live INSERT events push new messages to UI
       ▼
[6] User sends message → POST /api/appointments/{id}/messages
       │  Optimistic UI update (message shown instantly)
       │  Rollback if backend returns error
       ▼
[7] Backend inserts message (service role)
    Realtime event fires → subscription deduplicates optimistic placeholder
```

### Data Model

```
appointments (1) ──── UNIQUE ──── (1) chat_rooms ──── (*) messages
                  appointment_id                    chat_room_id
```

One chat room per appointment, enforced by `UNIQUE(appointment_id)` constraint (migration 025).

### Why Backend-Mediated Chat?

Direct Supabase client queries for chat operations fail when the Supabase browser session is not established (e.g. after page refresh with expired tokens). The backend service-role approach eliminates all session dependencies for auth-sensitive chat operations, making the system session-agnostic and reliable.

---

## 17. Deployment Architecture

### Infrastructure

| Component | Service | Region |
|-----------|---------|--------|
| Frontend | Firebase Hosting | Global CDN |
| Backend API | Firebase Cloud Functions Gen 2 (Cloud Run) | us-central1 |
| Database | Supabase (AWS ap-south-1) | Mumbai |
| AI API | Google Gemini API | Global |
| Payment | Safepay | Pakistan |

### Firebase Configuration

```json
{
  "functions": [{ "source": "backend", "codebase": "default" }],
  "hosting": {
    "public": "frontend/dist",
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

### Environment Variables

The backend reads configuration via Pydantic `Settings` from a `.env` file (ignored by `.gitignore` and `.firebaseignore`):

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon key (for RLS-respecting queries) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (bypasses RLS) |
| `JWT_SECRET` | Secret for signing `pc_token` |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `SAFEPAY_API_KEY` | Safepay merchant key |
| `SAFEPAY_SECRET_KEY` | HMAC secret for webhook verification |
| `RESEND_API_KEY` | Resend email API key |

### CI/CD

Deployments are performed via `npx firebase-tools deploy` which:
1. Reads `frontend/dist/` (pre-built by `npm run build`) and uploads to Firebase Hosting.
2. Packages the `backend/` Python directory and deploys to Cloud Run via Firebase Functions Gen 2.

---

## 18. Row Level Security (RLS) Strategy

Supabase enforces RLS at the PostgreSQL layer. Every table has RLS enabled. The following policies are in effect after all 25 migrations:

| Table | Policy | Description |
|-------|--------|-------------|
| `user_profiles` | SELECT own | `user_id = auth.uid()` |
| `cats` | CRUD own | Owners manage their own cats |
| `hospitals` | SELECT (approved) | Public read of approved listings |
| `hospitals` | INSERT/UPDATE admin | Only hospital admin can write |
| `vets` | SELECT public | Public read (migration 014) |
| `vets` | ALL hospital admin | Hospital admin manages their vets |
| `vets` | ALL own profile | Vet manages own row |
| `appointment_slots` | SELECT public | Anyone can read slots |
| `appointment_slots` | INSERT/UPDATE/DELETE admin | Admin manages slots |
| `appointments` | SELECT owner + vet + hospital | All three parties can view |
| `appointments` | INSERT cat owner | Cat owner can book (migration 024) |
| `appointments` | UPDATE vet + hospital admin | Status updates only |
| `chat_rooms` | SELECT participants | Only cat owner + vet in the room |
| `messages` | SELECT room members | Only chat room participants |
| `messages` | INSERT room members | Participants can send (migration 014) |
| `orders` | SELECT buyer + store | Buyer and store owner |
| `products` | SELECT public (active) | Public can browse products |
| `products` | INSERT/UPDATE/DELETE store owner | Store owner manages own products |
| `payments` | SELECT payer + admin | Payer and system admin |
| `cat_stores` | INSERT store owner | Store owner creates own store |

### Known RLS Bypass Points

Certain read operations require bypassing RLS through the backend service-role client:
- Reading `user_profiles` from a vet context (recursive policy issue — fixed in migrations 022/023).
- Chat room creation, message insert, and message read for the browser chat client (eliminated Supabase browser session dependency).

---

## 19. Key Design Decisions

### 1. Backend-Mediated Chat (vs. Direct Supabase Access)

**Decision**: Route all chat room and message CRUD through the FastAPI backend using the service-role key instead of direct Supabase JS client calls.

**Rationale**: The Supabase JS client sends an `apikey` header only when the client is properly initialised with an active session. After page refresh with expired tokens, the session re-establishment can fail silently, causing all RLS-protected queries to return `406 No API Key`. The backend JWT (`pc_token`) is always in `localStorage` and does not depend on the Supabase session state.

### 2. Optimistic UI for Message Send

**Decision**: Display sent messages immediately in the UI before the backend confirms the insert, with rollback on error.

**Rationale**: Eliminates the perceived latency of a round-trip backend call (Cloud Run cold start can be 2-4 seconds). The rollback mechanism (removing the optimistic placeholder and restoring the input) ensures data integrity is preserved on failure.

### 3. One Chat Room per Appointment (Migration 025)

**Decision**: Drop `UNIQUE(user_id, vet_id)` from `chat_rooms` and replace with `UNIQUE(appointment_id)` with an `appointment_id FK → appointments.id`.

**Rationale**: The old constraint allowed only one chat between a cat owner and a vet globally. A vet may treat the same cat multiple times, and each appointment should have its own isolated chat thread. The new constraint correctly enforces "one chat per appointment".

### 4. Service-Role for Vet Name Display

**Decision**: Fetch the vet's name from the backend (`GET /api/hospitals/vet/{vet_id}`) rather than through the Supabase JS client.

**Rationale**: `user_profiles` has an RLS policy that only allows users to read their own row. A cat owner cannot read a vet's profile row via the Supabase client, causing the nested join (`vets!left(user_profiles!left(...))`) to silently return `null`.

### 5. Transaction Pattern Database Design

**Decision**: Model all tables using the Transaction Pattern (Participant, Item, Place, Transaction, etc.).

**Rationale**: The Transaction Pattern provides a principled, extensible way to model multi-stakeholder business domains. It enforces that every table has a clear role in the system, making the schema easier to reason about, audit, and extend.

---

## 20. Migration History

| # | Migration | Key Change |
|---|-----------|-----------|
| 001 | `initial_schema` | Base schema — all 28 tables, initial RLS policies |
| 002–011 | Various seed and fix migrations | Data corrections, FK adjustments |
| 012 | | Appointment slot `is_available` → `is_booked` |
| 013 | | Products RLS enhancements |
| 014 | `vets_messages_insert_rls` | Added public vets SELECT; added messages SELECT + INSERT policies |
| 015 | `fix_store_owner_rls` | Store owner RLS corrections |
| 016 | | Hospital services RLS |
| 017 | `orders_rls` | Orders RLS policies |
| 018 | | Products INSERT/UPDATE/DELETE for store owners |
| 019 | | Products categories INSERT for authenticated users |
| 020 | `hospitals_public_rls` | Hospitals and services public SELECT |
| 021 | | Additional fixes |
| 022 | `vet_profiles_public_read` | Dropped recursive `user_profiles → vets → user_profiles` policy (caused infinite recursion) |
| 023 | `drop_recursive_policy` | Completed removal of recursive policy |
| 024 | `appointments_insert_rls` | Added cat-owner INSERT policy on `appointments` |
| 025 | `chat_rooms_appointment_id` | Added `appointment_id` FK to `chat_rooms`; dropped `UNIQUE(user_id, vet_id)`; added `UNIQUE(appointment_id)` |

---

*Report generated: June 2026*
*Applied Migrations: 025 | Tables: 28 | API Controllers: 9 | Frontend Pages: 23*
