# Purrfect Care — Technical Report

**Project Title:** Purrfect Care — AI-Powered Cat Health Platform
**Version:** 1.0.0
**Date:** June 2026
**Status:** Deployed and Live

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [System Architecture](#3-system-architecture)
4. [Actors and Use Cases](#4-actors-and-use-cases)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Technology Stack](#7-technology-stack)
8. [Database Design](#8-database-design)
9. [Data Flow Diagram](#9-data-flow-diagram)
10. [AI and RAG Pipeline](#10-ai-and-rag-pipeline)
11. [Backend Architecture](#11-backend-architecture)
12. [Frontend Architecture](#12-frontend-architecture)
13. [Mobile Application](#13-mobile-application)
14. [Security Design](#14-security-design)
15. [Deployment and Infrastructure](#15-deployment-and-infrastructure)
16. [API Reference Summary](#16-api-reference-summary)
17. [Testing](#17-testing)
18. [Environment Configuration](#18-environment-configuration)
19. [Project Structure](#19-project-structure)
20. [Conclusion](#20-conclusion)

---

## 1. Executive Summary

Purrfect Care is a full-stack, multi-platform digital health ecosystem built for cat owners, veterinarians, veterinary hospitals, and pet stores. The platform integrates appointment booking, real-time veterinarian messaging, AI-powered health consultation, a medicine database, location-based hospital and store discovery, product ordering with live inventory management, and a comprehensive patient health record system.

The system is deployed across three tiers: a React web application hosted on Firebase Hosting, a React Native mobile application built with Expo, and a Python FastAPI backend deployed as a Firebase Cloud Function (Gen 2). Data persistence is provided by Supabase (PostgreSQL 15) with pgvector for AI similarity search and PostGIS for geospatial queries.

The AI Health Companion uses a Retrieval-Augmented Generation (RAG) pipeline built on Google Gemini embeddings and generative models, grounded in a curated knowledge base of 21 veterinary documents covering 19 feline health conditions.

---

## 2. Project Overview

### 2.1 Problem Statement

Cat owners frequently lack access to timely, reliable veterinary guidance. Identifying reputable clinics, communicating with veterinarians, managing pet health records, obtaining medicine information, and purchasing pet supplies are fragmented across multiple unconnected services. This results in delayed care, uninformed decisions, and poor health outcomes for cats.

### 2.2 Objectives

- Provide a single platform connecting cat owners with verified veterinarians and hospitals.
- Enable AI-assisted health triage to help owners assess symptom severity before a clinic visit.
- Digitise and centralise patient health records, prescriptions, and treatment histories.
- Offer a proximity-based discovery model for hospitals and stores, similar to food delivery platforms.
- Provide store owners and hospital admins with independent dashboards for inventory, appointments, and analytics.

### 2.3 Scope

| In Scope | Out of Scope |
|----------|-------------|
| Multi-role authentication and authorisation | Telemedicine video calls |
| Appointment booking and management | Insurance processing |
| Real-time vet-owner chat | Third-party logistics integration |
| AI health consultation (RAG) | Wearable device data ingestion |
| Medicine database with allergy checking | Prescription drug dispensing |
| Location-based hospital and store discovery | In-app advertising |
| Store product ordering and order tracking | International multi-currency support |
| Patient health records and prescriptions | Laboratory result import |
| Hospital and store admin dashboards | Government regulatory filings |

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
+----------------------------------------------------------+
|                        Clients                           |
|  React Web App (Firebase Hosting)   Expo Mobile App      |
+-----------------------------+----------------------------+
                              | HTTPS
                              v
+----------------------------------------------------------+
|        FastAPI  (Firebase Cloud Functions Gen 2)          |
|  /api/ai/chat   /api/auth   /api/appointments  /api/...  |
+----------+--------------------------------------+---------+
           | Supabase Client                      | google-genai SDK
           v                                      v
+----------------------+            +----------------------+
|  Supabase (Postgres) |            |  Google Gemini API   |
|  28 tables           |            |  gemini-embedding-001|
|  pgvector            |            |  gemini-2.0-flash    |
|  PostGIS             |            +----------------------+
|  Realtime            |
|  Auth / Storage      |
+----------------------+
```

### 3.2 Tier Summary

| Tier | Component | Technology | Hosting |
|------|-----------|------------|---------|
| Presentation (Web) | React SPA | React 18 + Vite | Firebase Hosting |
| Presentation (Mobile) | Native App | React Native + Expo SDK 56 | Expo Go / EAS Build |
| API | REST Backend | Python 3.14 + FastAPI | Firebase Cloud Functions Gen 2 |
| Data | Primary Database | PostgreSQL 15 | Supabase Cloud |
| Data | Vector Store | pgvector extension | Supabase Cloud |
| Data | Geospatial | PostGIS extension | Supabase Cloud |
| Data | Real-time | Supabase Realtime (Phoenix) | Supabase Cloud |
| Auth | Identity | Supabase Auth (GoTrue + JWT) | Supabase Cloud |
| Storage | File Storage | Supabase Storage (S3-compatible) | Supabase Cloud |
| AI | Embeddings | gemini-embedding-001 (768-dim) | Google Cloud |
| AI | Generation | gemini-2.0-flash | Google Cloud |
| Payments | Processing | Safepay | Safepay Cloud |
| Email | Transactional | Resend | Resend Cloud |

---

## 4. Actors and Use Cases

### 4.1 Primary Actors

| ID | Actor | Role | Access Level |
|----|-------|------|-------------|
| A1 | Cat Owner | Registers cats, books appointments, shops, consults AI | Authenticated user |
| A2 | Veterinarian | Manages appointments, records, prescriptions, chats | Vet-level |
| A3 | Hospital Admin | Manages hospital dashboard, services, slots, staff, offers | Hospital-level |
| A4 | Store Owner | Manages store products, inventory, orders, promotions | Store-level |
| A5 | System Admin | Full platform control, verification, moderation | Admin |

### 4.2 System and External Actors

| ID | Actor | Type |
|----|-------|------|
| A6 | AI Companion | Internal system — RAG pipeline |
| A7 | Supabase | External — Database, Auth, Realtime, Storage |
| A8 | Payment Gateway | External — Safepay |
| A9 | Geolocation Service | External — browser Geolocation API |
| A10 | Notification Service | External — push, email, SMS |

### 4.3 Key Use Cases by Actor

#### Cat Owner
| UC ID | Use Case |
|-------|----------|
| UC-1.1 | Register and log in via email |
| UC-1.2 | Register cat with breed, age, weight, medical history |
| UC-1.4 | Browse nearby hospitals (location-sorted) |
| UC-1.5 | Book appointment at hospital with service and slot selection |
| UC-1.6 | Real-time chat with assigned veterinarian |
| UC-1.7 | View cat patient history, past appointments, prescriptions |
| UC-1.8 | Browse nearby cat stores (location-sorted) |
| UC-1.9 | Add products to cart and place order from a store |
| UC-1.10 | Search medicine database for drug information |
| UC-1.11 | Consult AI companion with symptom description |
| UC-1.14 | Rate and review hospitals, stores, and vets |

#### Veterinarian
| UC ID | Use Case |
|-------|----------|
| UC-2.2 | View scheduled appointments |
| UC-2.3 | Create and update cat patient records and diagnoses |
| UC-2.4 | Chat with cat owners in real time |
| UC-2.5 | Prescribe medicine with allergy contraindication checking |
| UC-2.9 | Add post-appointment treatment notes |

#### Hospital Admin
| UC ID | Use Case |
|-------|----------|
| UC-3.1 | Register hospital on the platform |
| UC-3.3 | Manage services (name, price, duration) |
| UC-3.4 | Manage staff (assign vets to hospital) |
| UC-3.5 | Configure appointment slots |
| UC-3.7 | Create promotional offers |

#### Store Owner
| UC ID | Use Case |
|-------|----------|
| UC-4.1 | Register store on the platform |
| UC-4.3 | Add, edit, and remove products |
| UC-4.4 | Track and update stock quantities |
| UC-4.5 | View and process incoming orders |
| UC-4.9 | Set operating hours and delivery configuration |

#### System Admin
| UC ID | Use Case |
|-------|----------|
| UC-5.2 | Verify veterinarian licenses |
| UC-5.3 | Approve or suspend hospital registrations |
| UC-5.4 | Approve or suspend store registrations |
| UC-5.5 | Manage medicine database entries |
| UC-5.8 | View platform-wide analytics |

---

## 5. Functional Requirements

### 5.1 Authentication and Authorisation

- FR-AUTH-01: Users register with name, email, and password. Passwords are validated for minimum length.
- FR-AUTH-02: Five distinct roles exist: cat_owner, vet, hospital_admin, store_owner, admin.
- FR-AUTH-03: JWT tokens issued by Supabase Auth are validated on every protected API request.
- FR-AUTH-04: Role-based access control (RBAC) enforced at the API middleware layer. Endpoints require specific roles.
- FR-AUTH-05: Row Level Security (RLS) policies on all PostgreSQL tables enforce data isolation.

### 5.2 Cat Management

- FR-CAT-01: Owners register one or more cats with name, breed, gender, age, weight, and neutering status.
- FR-CAT-02: Each cat has a medical record containing allergies, existing conditions, and vaccination history.
- FR-CAT-03: Medical history is viewable by the owner and by vets assigned to the cat's hospital.

### 5.3 Appointment System

- FR-APPT-01: Users discover nearby hospitals via PostGIS distance query sorted by proximity.
- FR-APPT-02: Each hospital exposes services and appointment slots. Slots are marked as booked on reservation.
- FR-APPT-03: Appointment statuses follow the lifecycle: pending → confirmed → completed | cancelled | no_show.
- FR-APPT-04: Notifications are issued to all three parties (owner, vet, hospital) on status change.

### 5.4 Real-Time Chat

- FR-CHAT-01: Chat rooms are created between a cat owner and a vet upon appointment confirmation.
- FR-CHAT-02: Messages are delivered in real time via Supabase Realtime WebSocket subscriptions.
- FR-CHAT-03: Message types supported: text, image, prescription_share, voice_note.
- FR-CHAT-04: Chat history is persisted in PostgreSQL and loaded on room entry.

### 5.5 AI Health Companion

- FR-AI-01: Users input free-text symptom descriptions of minimum 10 characters.
- FR-AI-02: The system embeds the query using gemini-embedding-001 (768-dim, RETRIEVAL_QUERY task type).
- FR-AI-03: A pgvector cosine similarity search against the knowledge base retrieves the top 6 chunks above a 0.55 similarity threshold.
- FR-AI-04: Retrieved chunks are injected into a structured prompt. gemini-2.0-flash generates the response.
- FR-AI-05: High-severity outputs include a recommendation to seek veterinary care.
- FR-AI-06: AI consultations are stored in the illness_records table for continuity.

### 5.6 Medicine Database

- FR-MED-01: Medicines are searchable by name, ingredient, or category.
- FR-MED-02: Each medicine record includes dosage, contraindications, allergy warnings, and prescription flag.
- FR-MED-03: Vets can prescribe from the medicine database. The system checks the cat's allergy list for contraindications before confirming.
- FR-MED-04: Prescriptions are stored in the patient record and visible to the owner.

### 5.7 Store and Ordering

- FR-STORE-01: Store owners register their store. The platform admin approves before public listing.
- FR-STORE-02: The store list is shown sorted by name. Each store card displays rating, delivery fee, and location.
- FR-STORE-03: Tapping a store opens its product catalogue with category filtering and search.
- FR-STORE-04: Users add products to a session cart. Quantities are bounded by stock_quantity.
- FR-STORE-05: Placing an order creates an orders record and corresponding order_items rows in a single transaction.
- FR-STORE-06: Order status follows: pending → confirmed → preparing → ready → out_for_delivery → delivered | cancelled | refunded.
- FR-STORE-07: Store owners view and update order status from their dashboard.
- FR-STORE-08: Store owners add products with name, price, discount price, stock quantity, images, and category.

### 5.8 Reviews and Offers

- FR-REV-01: Cat owners submit star ratings (1-5) and written reviews for hospitals, stores, and vets.
- FR-REV-02: Reviews are limited to users who have completed an appointment or received an order.
- FR-REV-03: Hospital and store admins can respond to reviews.
- FR-OFF-01: Hospitals and stores create time-bounded offers with discount percentages. Displayed on their public page.

---

## 6. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-01 | Performance | API endpoints must respond within 500ms under normal load |
| NFR-02 | Performance | AI consultation endpoint must respond within 5 seconds |
| NFR-03 | Scalability | Backend deployed as serverless Cloud Function; scales to demand automatically |
| NFR-04 | Availability | Firebase Hosting and Supabase each provide 99.9% uptime SLAs |
| NFR-05 | Security | All client-server communication is HTTPS (TLS 1.2+) |
| NFR-06 | Security | JWT tokens expire; refresh flow handled by Supabase Auth client |
| NFR-07 | Security | Supabase RLS policies enforce row-level data isolation per user |
| NFR-08 | Security | Secrets (API keys, DB credentials) stored in Firebase Secret Manager |
| NFR-09 | Maintainability | Backend follows MVC pattern: controllers, services, repositories, models |
| NFR-10 | Maintainability | 118 automated tests cover models, middleware, and API endpoints |
| NFR-11 | Usability | Web interface is responsive; automatically switches to mobile layout on small screens |
| NFR-12 | Usability | Mobile app supports iOS and Android via Expo |
| NFR-13 | Compliance | Passwords are never stored; Supabase Auth handles credential hashing |

---

## 7. Technology Stack

### 7.1 Web Frontend

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 18 |
| Build Tool | Vite | 5 |
| Styling | Vanilla CSS (custom design system) | — |
| Routing | React Router | v6 |
| State | React Context + Supabase Realtime | — |
| Database Client | supabase-js | v2 |
| Hosting | Firebase Hosting (CDN) | — |
| Design System | Carafe (#5e4749) / Mint (#dbe8d8) palette | — |

### 7.2 Mobile Application

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React Native | 0.76 |
| Platform | Expo SDK | 56 |
| Navigation | Expo Router (file-based) | 4 |
| Auth | Supabase Auth + AsyncStorage | — |
| Icons | @expo/vector-icons (Ionicons) | — |
| Distribution | Expo Go (development) / EAS Build (production) | — |

### 7.3 Backend

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | Python | 3.14 |
| Framework | FastAPI | 0.115 |
| Server | uvicorn (ASGI) | — |
| Validation | Pydantic v2 | 2.x |
| Database Client | supabase-py | v2 |
| AI SDK | google-genai | — |
| Deployment | Firebase Cloud Functions Gen 2 | — |
| Payments | Safepay | — |
| Email | Resend | — |

### 7.4 Database and AI

| Component | Technology |
|-----------|-----------|
| Database | Supabase (PostgreSQL 15) |
| Vector Search | pgvector — cosine similarity |
| Geospatial | PostGIS extension |
| RAG Embeddings | models/gemini-embedding-001 (768-dim, RETRIEVAL_DOCUMENT) |
| Chat Generation | models/gemini-2.0-flash |
| Auth | Supabase Auth (JWT, GoTrue) |
| Storage | Supabase Storage (S3-compatible) |

---

## 8. Database Design

### 8.1 Overview

The database consists of 28 PostgreSQL tables managed in Supabase. All tables have Row Level Security (RLS) enabled. Geospatial data (hospital and store locations) uses PostGIS geography columns. The AI knowledge base uses a pgvector column of 768 dimensions.

### 8.2 Migrations

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | All 28 tables, indexes, foreign keys, and RLS policies |
| `002_vector_search_rag.sql` | `cat_health_knowledge` table + `match_cat_health` Postgres RPC |
| `003_add_email_to_user_profiles.sql` | Added `email` column to `user_profiles` |
| `004_store_product_rls.sql` | RLS policies for store product management by store owners |

### 8.3 Core Tables

| Table | Primary Key | Description |
|-------|-------------|-------------|
| `user_profiles` | `id` (UUID, FK → auth.users) | Extended user data: name, role, avatar, location |
| `cats` | `id` (UUID) | Cat profiles: breed, age, weight, neutering status |
| `cat_medical_records` | `id` (UUID, FK → cats) | Allergies, conditions, vaccination history |
| `vets` | `id` (UUID, FK → user_profiles) | License, specialization, experience, verification status |
| `hospitals` | `id` (UUID) | Name, address, PostGIS location, operating hours, rating |
| `hospital_services` | `id` (UUID, FK → hospitals) | Service name, price, duration |
| `appointment_slots` | `id` (UUID, FK → hospitals) | Date, time, duration, vet assignment, availability |
| `appointments` | `id` (UUID) | Booking linking cat, vet, hospital, service, slot |
| `chat_rooms` | `id` (UUID) | Links owner and vet, tied to appointment |
| `messages` | `id` (UUID, FK → chat_rooms) | Content, type (text/image/prescription_share) |
| `cat_stores` | `id` (UUID) | Store name, address, PostGIS location, delivery fee |
| `product_categories` | `id` (UUID, FK → cat_stores) | Category label per store |
| `products` | `id` (UUID, FK → cat_stores) | Name, price, discount price, images, stock quantity |
| `orders` | `id` (UUID) | Store order with subtotal, delivery fee, status |
| `order_items` | `id` (UUID, FK → orders) | Product, quantity, unit price snapshot |
| `medicines` | `id` (UUID) | Drug name, dosage, ingredients, allergy warnings |
| `prescriptions` | `id` (UUID) | Vet-issued prescription linking cat, medicine, dosage |
| `treatments` | `id` (UUID) | Post-appointment treatment notes and follow-ups |
| `reviews` | `id` (UUID) | Star rating and comment for hospital, vet, or store |
| `offers` | `id` (UUID) | Time-bounded discount linked to hospital or store |
| `payments` | `id` (UUID) | Payment record linked to appointment or order |
| `notifications` | `id` (UUID) | Push/email/SMS notification log |
| `cat_health_knowledge` | `id` (UUID) | RAG chunks with 768-dim embedding vector |

### 8.4 Database Diagram

*Diagram to be inserted below.*

---

## 9. Data Flow Diagram

### 9.1 Context Level (Level 0)

The system receives inputs from five user types (Cat Owner, Vet, Hospital Admin, Store Owner, System Admin) and three external systems (Gemini API, Safepay, Supabase Auth). It outputs health guidance, appointment confirmations, order confirmations, prescriptions, and notifications.

### 9.2 Level 1 — Major Processes

| Process | Inputs | Outputs | Data Store |
|---------|--------|---------|------------|
| P1: User Management | Registration data, login credentials | JWT token, user profile | user_profiles, auth.users |
| P2: Appointment Booking | Hospital ID, slot ID, cat ID, service ID | Appointment record, notifications | appointments, appointment_slots |
| P3: AI Consultation | Symptom text | Health guidance, severity | cat_health_knowledge (pgvector), illness_records |
| P4: Order Management | Cart items, store ID, delivery address | Order record, order items | orders, order_items, products |
| P5: Chat | Message content, room ID | Real-time message delivery | messages, chat_rooms |
| P6: Prescription | Medicine ID, dosage, cat ID | Prescription record, allergy check | prescriptions, medicines, cat_medical_records |

### 9.3 Data Flow Diagram

*Diagram to be inserted below.*

---

## 10. AI and RAG Pipeline

### 10.1 Knowledge Base

The RAG knowledge base consists of 21 Markdown documents covering 19 feline health conditions:

| Document | Conditions Covered |
|----------|-------------------|
| `feline_ckd.md` | Chronic Kidney Disease |
| `feline_diabetes.md` | Feline Diabetes |
| `feline_hyperthyroidism.md` | Hyperthyroidism |
| `feline_flutd_urinary.md` | FLUTD / Urinary blockage |
| `feline_uri.md` | Upper Respiratory Infection |
| `feline_vomiting_gi.md` | Vomiting / GI disease |
| `feline_diarrhea.md` | Diarrhea |
| `merck_feline_asthma.md` | Feline Asthma |
| `feline_dental_disease.md` | Dental disease |
| `feline_lameness.md` | Lameness / Musculoskeletal |
| `feline_skin_allergies.md` | Skin and allergic conditions |
| `feline_ear_problems.md` | Ear diseases |
| `feline_eye_problems.md` | Eye conditions |
| `feline_parasites_worms.md` | Parasites and worms |
| `feline_obesity.md` | Obesity |
| `feline_anorexia.md` | Anorexia |
| `feline_behaviour.md` | Behavioural issues |
| `feline_vaccines_preventive.md` | Vaccines and preventive care |
| `feline_polydipsia_pupd.md` | Polydipsia / PU/PD |
| `feline_ckd.md` (extended) | Advanced CKD staging |
| `merck_feline_asthma.md` (extended) | Asthma management protocols |

### 10.2 Ingestion Pipeline

1. Each Markdown file is read and chunked into segments of approximately 300-500 words.
2. Each chunk is embedded using the Gemini API: `models/gemini-embedding-001` with task type `RETRIEVAL_DOCUMENT`.
3. The resulting 768-dimensional vector is stored in the `cat_health_knowledge` table alongside the raw text chunk.
4. Total: 155 chunks stored across all 21 documents.

### 10.3 Query Pipeline

1. The user submits a symptom description (minimum 10 characters).
2. The text is embedded using `models/gemini-embedding-001` with task type `RETRIEVAL_QUERY`.
3. The `match_cat_health` Postgres RPC performs cosine similarity search: `MATCH_THRESHOLD = 0.55`, `MATCH_COUNT = 6`.
4. The top-K retrieved chunks are assembled into a grounded prompt context.
5. `models/gemini-2.0-flash` generates a structured health guidance response.
6. The response includes possible conditions, home care steps, severity level, and a vet referral recommendation.

### 10.4 Severity Classification

| Level | Definition | System Action |
|-------|-----------|---------------|
| LOW | Mild, self-resolving symptoms | Home care steps provided |
| MODERATE | Symptoms warranting monitoring | Vet visit recommended within days |
| HIGH | Significant or worsening symptoms | Urgent vet visit strongly recommended |
| CRITICAL | Emergency symptoms | Immediate emergency care instructed |

---

## 11. Backend Architecture

### 11.1 MVC Pattern

The FastAPI backend follows a strict MVC-inspired layered architecture:

```
Controllers  →  Services  →  Repositories  →  Supabase (PostgreSQL)
     ↓               ↓
  Models           External APIs (Gemini, Safepay, Resend)
```

### 11.2 Layer Responsibilities

| Layer | Location | Responsibility |
|-------|----------|---------------|
| Controllers | `app/controllers/` | Route definitions, HTTP request/response handling, input validation delegation |
| Services | `app/services/` | Business logic, orchestration across repositories, external API calls |
| Repositories | `app/repositories/` | All Supabase query logic, data access abstraction |
| Models | `app/models/` | 14 Pydantic v2 schema files defining request bodies, response shapes, and enums |
| Middleware | `app/middleware/` | JWT authentication, role-based access guard, rate limiter, CORS, error handler |
| Config | `app/config.py` | Pydantic Settings loading from environment variables and Firebase Secret Manager |

### 11.3 Middleware Stack

Requests pass through the following middleware in order:

1. CORS middleware — restricts origins to allowed frontend URLs
2. Rate limiter — prevents request flooding per client IP
3. JWT auth middleware — validates Supabase JWT tokens
4. Role guard — enforces endpoint-level role requirements
5. Request validator — Pydantic model validation
6. Error handler — structured JSON error responses

### 11.4 Key Controllers

| Controller | Base Path | Description |
|------------|-----------|-------------|
| AuthController | `/api/auth` | Registration, login, profile updates |
| CatController | `/api/cats` | Cat profiles and medical records |
| HospitalController | `/api/hospitals` | Hospital listing, services, slots |
| AppointmentController | `/api/appointments` | Booking, status management |
| ChatController | `/api/chat` | Chat rooms and message history |
| StoreController | `/api/stores` | Store listing and product catalogue |
| OrderController | `/api/orders` | Order placement and status |
| AIController | `/api/ai` | RAG consultation endpoint |
| MedicineController | `/api/medicines` | Medicine search and detail |
| PrescriptionController | `/api/prescriptions` | Prescription creation and retrieval |
| ReviewController | `/api/reviews` | Review submission and listing |
| OfferController | `/api/offers` | Offer creation and listing |

### 11.5 Pydantic Models (14 Schema Files)

| File | Key Classes |
|------|-------------|
| `user.py` | UserCreate, UserUpdate, UserResponse, Role |
| `cat.py` | CatCreate, CatUpdate, MedicalRecordCreate, CatBreedResponse |
| `vet.py` | VetCreate, VetUpdate, VetResponse |
| `hospital.py` | HospitalCreate, HospitalServiceCreate, SlotCreate |
| `appointment.py` | AppointmentCreate, AppointmentStatus |
| `medicine.py` | MedicineCreate, PrescriptionBase |
| `prescription.py` | PrescriptionCreate, PrescriptionStatus |
| `treatment.py` | TreatmentCreate, TreatmentResponse |
| `chat.py` | MessageCreate, MessageType, ChatRoomCreate |
| `store.py` | CatStoreCreate, ProductCreate, ProductCategoryCreate |
| `order.py` | OrderCreate, OrderItemCreate, OrderStatus |
| `payment.py` | PaymentCreate, PaymentStatus |
| `review.py` | ReviewCreate, ReviewResponse |
| `offer.py` | OfferCreate, OfferResponse |
| `notification.py` | NotificationCreate, NotificationType (14 types), NotificationChannel |
| `ai.py` | AIConsultRequest, SeverityLevel, IllnessRecordCreate |

---

## 12. Frontend Architecture

### 12.1 Design System

The web application uses a custom design system based on two primary colour families:

| Token | Value | Usage |
|-------|-------|-------|
| Carafe | `#5e4749` | Primary interactive elements, headers |
| Carafe Light | `#7a5e60` | Secondary text, muted elements |
| Mint | `#dbe8d8` | Background, page surface |
| Mint Border | `#b8ceb5` | Borders, dividers |
| Olive | `#4a6741` | Success states, call-to-action |
| Amber | `#B87C2A` | Star ratings, featured badges |
| Espresso | `#3a2c2d` | Primary text |
| Surface White | `#ffffff` | Cards, panels |

Typography: Plus Jakarta Sans (display weight) and system sans-serif for body text.

### 12.2 Page Structure

| Page | Route | Role Access |
|------|-------|-------------|
| Home / Landing | `/` | Public |
| Login | `/login` | Public |
| Register | `/register` | Public |
| Dashboard | `/dashboard` | cat_owner |
| My Cats | `/my-cats` | cat_owner |
| Find Hospitals | `/find-vets` | Authenticated |
| Hospital Detail | `/hospital/:id` | Authenticated |
| AI Companion | `/ai-companion` | Authenticated |
| Cat Store | `/store` | Authenticated |
| Store Detail | `/store/:storeId` | Authenticated |
| Booking | `/booking/:hospitalId` | cat_owner |
| Chat | `/chat/:roomId` | Authenticated |
| Medicines | `/medicines` | Authenticated |
| Hospital Admin Dashboard | `/hospital-admin` | hospital_admin |
| Store Dashboard | `/store-register` | store_owner |
| System Admin | `/admin` | admin |
| Settings | `/settings` | Authenticated |

### 12.3 Responsive Strategy

The application uses the `useIsMobile()` hook (based on `window.innerWidth < 768`) to conditionally render either the desktop page or its mobile-optimised counterpart. Mobile pages use the `MobileLayout` component providing a sticky header and a five-tab fixed bottom navigation bar (Home, My Cats, Hospitals, AI Chat, Store).

---

## 13. Mobile Application

### 13.1 Navigation Structure

The Expo Router application uses file-based routing:

```
app/
  (auth)/
    login.jsx          — Sign-in screen
    register.jsx       — Registration screen
  (tabs)/
    _layout.jsx        — Five-tab bar (Home, My Cats, Hospitals, AI Chat, Stores)
    dashboard.jsx      — Home dashboard
    my-cats.jsx        — Cat list and health records
    hospitals.jsx      — Nearby hospital list → hospital detail
    ai-chat.jsx        — AI health consultation
    stores.jsx         — Nearby store list → store detail + ordering
  hospital/[id].jsx    — Hospital detail with services and booking
  store-detail/[storeId].jsx — Store product catalogue with cart and ordering
  store-dashboard.jsx  — Store owner management dashboard
  settings.jsx         — Account settings
  index.jsx            — Auth redirect
  _layout.jsx          — Root layout with AuthContext
```

### 13.2 Stores Tab Flow

1. `stores.jsx` — Displays a scrollable list of approved stores with rating, delivery fee, and location.
2. Tapping a store navigates to `store-detail/[storeId].jsx`.
3. The store detail screen loads the store's product catalogue from Supabase.
4. Users add products to a session cart using inline +/- quantity controls.
5. A floating "View Cart" button opens a bottom sheet displaying line items, subtotal, delivery fee, and total.
6. Tapping "Place Order" creates an `orders` row and `order_items` rows in Supabase directly.

### 13.3 Hospitals Tab Flow

1. `hospitals.jsx` — Displays a scrollable list of approved hospitals with rating, address, and phone.
2. Tapping a hospital navigates to `/hospital/[id]`.
3. The hospital detail screen shows services, vets, available slots, and a booking flow.

### 13.4 Store Dashboard

Store owners access `store-dashboard.jsx` to:
- View all orders (filterable by status)
- Update order status (preparing, ready, out_for_delivery, delivered)
- Add new products with name, description, price, stock quantity
- View and edit existing product inventory

---

## 14. Security Design

### 14.1 Authentication

- All authentication is delegated to Supabase Auth (GoTrue).
- Passwords are hashed using bcrypt; the application never handles plaintext passwords.
- JWTs are issued with configurable expiry. Refresh tokens are handled by the Supabase client SDK.
- Email verification is enforced before account activation.

### 14.2 Authorisation

- The backend middleware validates the JWT signature on every protected request.
- The `role_guard` middleware extracts the user role from the JWT claims and rejects requests where the role does not match the endpoint requirement.
- Supabase RLS policies provide a second enforcement layer at the database level, ensuring that even a misconfigured API cannot expose data across role boundaries.

### 14.3 Secrets Management

- Production secrets (GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SAFEPAY_SECRET_KEY, RESEND_API_KEY) are stored in Firebase Secret Manager.
- The `backend/.env` file contains only non-secret configuration values and is tracked in version control.
- The `backend/.env.local` file (containing secrets) is excluded from version control via `.gitignore`.

### 14.4 Input Validation

- All request bodies are validated by Pydantic v2 models before reaching controller logic.
- String fields have explicit `min_length` and `max_length` constraints.
- Numeric fields have `ge` (greater-than-or-equal) and `le` constraints.
- Email fields use `EmailStr` (email-validator) for RFC 5322 compliance.

---

## 15. Deployment and Infrastructure

### 15.1 Live URLs

| Service | URL |
|---------|-----|
| Web Application | https://purrfect-care-app.web.app |
| Backend API | https://server-vmvwkwachq-uc.a.run.app |
| Firebase Console | https://console.firebase.google.com/project/purrfect-care-app |

### 15.2 Backend Deployment

The FastAPI application is deployed as a Firebase Cloud Function (Gen 2, Python 3.14, us-central1 region). The function entry point is `backend/main.py`, which wraps the ASGI app using the Firebase Functions Python SDK.

```bash
# Deploy backend
firebase deploy --only functions
```

Dependencies are declared in `backend/requirements.txt`. Build-time files (venv, __pycache__, .env) are excluded via `firebase.json` ignore rules.

### 15.3 Frontend Deployment

The React application is built with Vite and deployed to Firebase Hosting as static files.

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

The `firebase.json` `rewrites` configuration forwards all routes to `index.html` to support client-side routing.

### 15.4 Mobile Deployment

The Expo React Native app is distributed via:
- **Development:** Expo Go application (scan QR code from `npx expo start`)
- **Production:** EAS Build service producing APK (Android) or IPA (iOS) bundles

```bash
npx eas build --platform android
npx eas build --platform ios
```

### 15.5 Database Setup

Migrations are plain SQL files executed in the Supabase SQL editor in numbered order. The pgvector extension must be enabled before running `002_vector_search_rag.sql`.

---

## 16. API Reference Summary

### 16.1 Base URL

```
https://server-vmvwkwachq-uc.a.run.app
```

### 16.2 Authentication

All protected endpoints require an `Authorization: Bearer <token>` header where the token is a Supabase JWT.

### 16.3 Core Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Health check |
| POST | `/api/auth/register` | None | User registration |
| POST | `/api/auth/login` | None | User login |
| GET | `/api/cats` | Owner | List user's cats |
| POST | `/api/cats` | Owner | Register new cat |
| GET | `/api/hospitals` | Auth | List hospitals (with optional geospatial sort) |
| GET | `/api/hospitals/{id}` | Auth | Hospital detail with services |
| POST | `/api/appointments` | Owner | Book appointment |
| PATCH | `/api/appointments/{id}` | Auth | Update appointment status |
| GET | `/api/chat/{room_id}/messages` | Auth | Load message history |
| POST | `/api/ai/chat` | Auth | Submit symptom query to RAG pipeline |
| GET | `/api/stores` | Auth | List stores |
| GET | `/api/stores/{id}/products` | Auth | List store products |
| POST | `/api/orders` | Owner | Place order |
| PATCH | `/api/orders/{id}/status` | StoreOwner | Update order status |
| GET | `/api/medicines` | Auth | Search medicine database |
| POST | `/api/prescriptions` | Vet | Issue prescription |
| POST | `/api/reviews` | Owner | Submit review |
| POST | `/api/offers` | HospAdmin/StoreOwner | Create offer |

### 16.4 Response Format

All responses are JSON. Successful responses return HTTP 200 with a data payload. Errors return an appropriate HTTP status code and a JSON body:

```json
{
  "detail": "Error description",
  "code": "ERROR_CODE"
}
```

---

## 17. Testing

### 17.1 Test Suite

The backend includes 118 automated tests covering:

| Test Module | Tests | Coverage Area |
|-------------|-------|---------------|
| `test_models.py` | 62 | All 14 Pydantic schema files — valid inputs, invalid inputs, enum values, defaults |
| `test_app.py` | 38 | FastAPI route registration, health check, CORS, middleware chain |
| `test_middleware.py` | 12 | JWT validation, role guard, rate limiter |
| `test_utils.py` | 6 | Coordinate validators, pagination helpers |

### 17.2 Running Tests

```bash
cd backend
source venv/bin/activate
python3 -m pytest tests/ -v
```

**Result:** 118 passed, 0 failed.

### 17.3 Test Strategy

- Unit tests for all model validation rules (field constraints, enum membership, default values).
- Integration tests for API endpoint availability and response shape.
- All tests run against a local FastAPI instance without a live database connection.

---

## 18. Environment Configuration

### 18.1 Backend — `backend/.env` (tracked, non-secret)

```env
APP_ENV=production
APP_DEBUG=false
CORS_ORIGINS=https://purrfect-care-app.web.app,http://localhost:5173
GEMINI_EMBEDDING_MODEL=models/gemini-embedding-001
GEMINI_CHAT_MODEL=models/gemini-2.0-flash
SAFEPAY_ENV=sandbox
```

### 18.2 Backend Secrets (Firebase Secret Manager)

| Secret Name | Description |
|-------------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `SAFEPAY_SECRET_KEY` | Safepay payment secret |
| `SAFEPAY_WEBHOOK_SECRET` | Safepay webhook verification secret |
| `RESEND_API_KEY` | Resend transactional email key |

### 18.3 Frontend — `frontend/.env`

```env
VITE_API_URL=https://server-vmvwkwachq-uc.a.run.app
VITE_SUPABASE_URL=<supabase_project_url>
VITE_SUPABASE_ANON_KEY=<supabase_anon_key>
```

### 18.4 Mobile — `mobile/lib/supabase.js`

Supabase URL and anon key are embedded in the Supabase client initialisation. AsyncStorage is used as the session persistence layer on device.

---

## 19. Project Structure

```
purrfect-care/
├── backend/                         FastAPI — Firebase Cloud Functions
│   ├── app/
│   │   ├── config.py                Pydantic Settings
│   │   ├── main.py                  FastAPI app instance and router registration
│   │   ├── database.py              Supabase client initialisation
│   │   ├── controllers/             Route handlers (12 controllers)
│   │   ├── services/                Business logic and external API clients
│   │   ├── models/                  14 Pydantic v2 schema files + __init__.py
│   │   ├── middleware/              Auth, RBAC, rate limiter, CORS, error handler
│   │   └── repositories/           Data access layer (Supabase queries)
│   ├── migrations/                  4 SQL migration files
│   ├── rag/
│   │   ├── ingest.py                RAG knowledge ingestion script
│   │   └── knowledge/               21 Markdown veterinary documents
│   ├── tests/                       118 automated tests
│   ├── main.py                      Firebase Cloud Functions entry point
│   └── requirements.txt
├── frontend/                        React + Vite web application
│   ├── src/
│   │   ├── App.jsx                  Router configuration
│   │   ├── index.css                Global design system
│   │   ├── pages/                   Route pages (desktop + mobile variants)
│   │   ├── components/              Shared UI components
│   │   ├── context/                 AuthContext
│   │   ├── hooks/                   useIsMobile, useScrollReveal
│   │   └── lib/                     Supabase client
│   └── index.html
├── mobile/                          Expo React Native application
│   ├── app/                         Expo Router pages (file-based routing)
│   ├── context/                     AuthContext
│   ├── lib/                         Supabase client
│   └── theme/                       Design tokens
├── docs/
│   └── design/                      11 design documents (UML diagrams, schemas)
├── firebase.json                    Firebase Hosting + Functions configuration
├── .gitignore
└── README.md
```

---

## 20. Conclusion

Purrfect Care delivers a comprehensive, production-grade cat health platform that addresses the fragmented nature of feline healthcare services. The system provides:

- **End-to-end appointment management** from hospital discovery through booking, treatment, and follow-up prescription.
- **Real-time communication** between cat owners and veterinarians via WebSocket-backed chat.
- **AI-powered health triage** grounded in a curated veterinary knowledge base, reducing unnecessary clinic visits while escalating critical cases appropriately.
- **Location-aware commerce** enabling store discovery and product ordering with full inventory lifecycle management.
- **Multi-role dashboards** empowering hospitals, stores, and administrators with purpose-built management tools.

The architecture is designed for maintainability (strict MVC layering, 118-test suite), security (RLS at the database level, JWT at the API level, secrets in managed storage), and scalability (serverless Cloud Functions, Supabase managed infrastructure).

---

*End of Report*
