# PurrfectCare — Project Report

---

## ABSTRACT

PurrfectCare is a full-stack, multi-role Software-as-a-Service (SaaS) platform developed to serve as a comprehensive digital health ecosystem for cat owners in Pakistan. The platform addresses a significant gap in the domestic pet care industry — the absence of a centralised, technology-driven solution for discovering veterinary services, booking appointments, managing feline medical records, and purchasing pet products within a single, unified experience.

The system supports five distinct user roles — Cat Owner, Veterinarian, Hospital Admin, Store Owner, and System Admin — each with a purpose-built dashboard, tailored access controls, and a dedicated workflow. The web application is built using React 18 with Vite, styled through a bespoke CSS design system, and deployed via Firebase Hosting on a global CDN. The backend is implemented in Python using the FastAPI framework, deployed to Google Cloud Run through Firebase Cloud Functions Gen 2, and communicates with a Supabase-hosted PostgreSQL 15 database comprising 28 tables and 25 schema migrations.

A core technical innovation of the platform is its backend-mediated chat architecture, wherein all chat room and message operations are routed through the FastAPI service layer using a Supabase service-role key. This bypasses Row Level Security (RLS) and eliminates the session-state fragility inherent in direct browser-to-Supabase communication. Real-time message delivery is achieved through Supabase Realtime Postgres Changes subscriptions, combined with optimistic UI updates to minimise perceived latency.

The platform integrates a Retrieval-Augmented Generation (RAG) AI companion powered by Google Gemini 2.0 Flash and the Gemini Embedding 001 model. The RAG pipeline indexes 155 veterinary knowledge chunks across 21 clinical topics stored as pgvector embeddings, enabling contextually grounded feline health guidance before a vet visit. Payment processing is handled via Safepay, a Pakistani payment gateway, with HMAC-verified webhooks ensuring secure transaction completion.

Security is enforced at every layer: bcrypt password hashing, JWT-based authentication, role-based API guards, and comprehensive Supabase RLS policies ensure that user data remains strictly isolated by role across the entire platform.

---

## INTRODUCTION

PurrfectCare is a full-stack, multi-role SaaS platform designed to serve as an all-in-one digital health ecosystem for cat owners in Pakistan. The platform connects cat owners with nearby veterinarians and pet stores, provides AI-assisted health diagnosis, and manages the complete lifecycle of a cat's medical care — from booking appointments to prescriptions, medical records, and post-visit chat with a vet. The live web application is accessible at https://purrfect-care-app.web.app, backed by an API hosted at https://server-vmvwkwachq-uc.a.run.app.

The primary objective of PurrfectCare is to digitise veterinary access in Pakistan — allowing cat owners to discover, book, and communicate with licensed veterinarians without phone calls or walk-ins. Alongside this, the platform provides an AI-first health companion that gives evidence-based health guidance through a RAG-powered symptom checker before a vet visit even takes place.

A second major objective is the maintenance of unified medical records. The system keeps a persistent, role-gated patient history — including weight logs, vaccination records, prescriptions, and diagnoses — accessible to both owners and vets. Commerce integration is also built into the platform, enabling cat product purchasing directly within the health ecosystem without leaving the application.

PurrfectCare is designed as a true multi-stakeholder platform, supporting five distinct user roles with tailored dashboards, access controls, and workflows, all on a single deployment. Security is treated as a first-class concern: Row Level Security is enforced at the database layer so that data is isolated by role even in the event of an application-level bug.

---

## FEATURES

PurrfectCare is designed around five human actor types, each with a distinct set of platform capabilities.

The Cat Owner is the primary user of the platform. They can register and log in, then register one or more cats with breed, age, weight, and medical history. They can browse nearby hospitals and vet clinics, book an appointment for a checkup, vaccination, or treatment, and pay the platform fee via Safepay. Once an appointment is confirmed, the owner can engage in real-time chat with the assigned vet and consult the AI Companion for symptom guidance at any time. The owner can also view their cat's full patient history, prescriptions, and medical records; browse the medicine database; purchase products from cat stores; track orders; and leave reviews for hospitals, vets, and stores.

The Veterinarian can register a vet account linked to a hospital and view their upcoming appointment queue. They can update appointment status — marking it as in progress, completed, or no show — and engage in real-time chat with the cat owner. Vets can create and update patient medical records, prescribe medicines from the platform database, and add treatment notes and follow-up instructions. Full patient history across all visits is accessible from the vet dashboard.

The Hospital Admin can register their clinic and add vets to its roster. They define services such as checkups, vaccinations, and surgeries, and configure appointment time slots. When bookings arrive, the admin can confirm or cancel them, create promotional offers, view appointment analytics, and respond to patient reviews.

The Store Owner registers their store and manages the product catalogue. They process and fulfil incoming orders, create promotional campaigns, and respond to customer reviews.

The System Admin holds full platform authority. They approve or suspend hospital and store registrations, verify vet licences, manage the medicine and cat breed databases, moderate reviews and content, and monitor platform-wide analytics.

On the technology side, the web application is built with React 18 and Vite 5. Styling is handled through a bespoke vanilla CSS design system built around a Carafe (#5e4749) and Mint (#dbe8d8) colour palette with Inter as the primary typeface. The backend is written in Python 3.14 using FastAPI with the Uvicorn ASGI server, deployed to Firebase Cloud Functions Gen 2. The database is Supabase PostgreSQL 15 with the pgvector, PostGIS, and pg_trgm extensions. A React Native and Expo SDK 56 mobile application targets both iOS and Android.

---

## DATABASE DESIGN

The database contains 28 tables organised using the Transaction Pattern — a structured object modelling framework that assigns every table a clear role in the system. Participant tables include users, user_profiles, and vets. SpecificItem tables cover cats and medical_records. Item tables hold reference data: cat_breeds, medicines, hospital_services, products, product_categories, and cat_health_knowledge. Place tables are hospitals and cat_stores. The central Transaction tables are appointments, appointment_slots, orders, chat_rooms, ai_consultations, reviews, and offers. TransactionLineItem tables are order_items and messages. SubsequentTransaction tables include treatments, prescriptions, payments, patient_history, and review_responses. The System table is notifications.

The user_profiles table is the platform's user registry, storing name, email, phone, avatar, and role (cat_owner, vet, hospital_admin, store_owner, or admin) for every authenticated user. The cats table represents feline patient records, each linked to an owner through an owner_id foreign key. The hospitals table holds vet clinic listings with geographic coordinates stored as a PostGIS GEOGRAPHY column for proximity queries. The vets table links each veterinarian to both a user profile and a hospital, storing their specialisation, experience, and a verification flag managed by the hospital admin.

The appointments table is the central transaction record, storing the cat owner's profile ID, the assigned vet, cat, hospital, service, time slot, appointment datetime, status (pending, confirmed, in_progress, completed, cancelled, or no_show), amount paid, and payment reference. The chat_rooms table holds one chat thread per appointment, enforced by a UNIQUE(appointment_id) constraint introduced in migration 025. The messages table stores each chat message with sender ID, content, timestamp, and type.

The cat_health_knowledge table is the RAG vector store, containing 155 chunks from 21 veterinary markdown articles. Each row holds a 768-dimensional vector embedding generated by gemini-embedding-001, stored using the pgvector extension. Queries use cosine similarity via the match_cat_health Postgres RPC. The payments table tracks Safepay transaction tokens, amounts, currency, and payment status for both appointment fees and store orders.

The schema uses four PostgreSQL extensions: uuid-ossp for UUID generation, PostGIS for geospatial hospital proximity queries, pgvector for AI embedding similarity search, and pg_trgm for trigram-based medicine name search. The schema evolved through 25 migrations applied sequentially, the most significant of which added RLS policies, fixed recursive policy chains, introduced the appointment booking policy, and restructured chat rooms to be per-appointment rather than per owner-vet pair.

### Entity Relationship Diagram (ERD)

*(Diagram image to be inserted here)*

---

## Data Flow Diagram (DFD)

### Context Diagram (Level 0)

*(Diagram image to be inserted here)*

### Level 1 DFD

*(Diagram image to be inserted here)*

---

## IMPLEMENTATION

PurrfectCare follows a three-tier architecture with a clear separation between the client layer, the backend API layer, and the data layer. The client layer consists of a React 18 web application deployed on Firebase Hosting's global CDN, and a React Native mobile application built with Expo SDK 56. The backend API layer is a FastAPI application running on Google Cloud Run via Firebase Cloud Functions Gen 2, exposing more than thirteen controllers mounted on dedicated route prefixes. The data layer is Supabase PostgreSQL 15, accessed via both the anon key (respecting RLS) and the service-role key (bypassing RLS for trusted backend operations).

The FastAPI backend is organised into controllers. The auth_controller handles user registration, login, profile retrieval, token refresh, and password reset. The hospital_controller manages clinic listings, vet onboarding, and individual vet lookups. The appointment_controller covers booking, status updates, and all chat room and message endpoints. The payment_controller manages Safepay session creation and HMAC-verified webhook handling. The ai_controller exposes the RAG-powered health consultation endpoint. The order_controller and store_controller manage store commerce, while the user_controller and subscription_controller handle profile updates and subscription management.

Every protected endpoint passes through the get_current_user dependency, which decodes the Bearer JWT using the JWT_SECRET and returns an authenticated user object. Role-specific access is enforced within each controller by resolving the caller's role from the database before performing any operation.

The frontend exposes more than twenty pages covering all five user roles. The design system is built around the Carafe (#5e4749) and Mint (#dbe8d8) palette with Inter typography, glassmorphism cards using backdrop-filter blur, smooth CSS transitions, and hover micro-animations. The AuthContext wraps the entire application, providing the authenticated user profile, login, logout, and session restore functions. All backend API calls use the native fetch API with Authorization: Bearer headers, while Supabase Realtime subscriptions use the Supabase JS client.

The AI Companion is powered by a Retrieval-Augmented Generation pipeline. When a cat owner submits a symptom query, the backend embeds it using gemini-embedding-001 with the RETRIEVAL_QUERY task type, producing a 768-dimensional vector. The backend calls the match_cat_health Postgres RPC, which performs a cosine similarity search against the 155-row cat_health_knowledge table, returning the top six most relevant chunks. These chunks are injected into a system prompt as grounding context, and gemini-2.0-flash generates the final evidence-based response. The consultation is logged to the ai_consultations table for the user's history.

Authentication uses a dual-token approach. The backend generates a pc_token (a backend-signed JWT) alongside the Supabase access_token and refresh_token. The frontend stores all three in localStorage. The pc_token is used for all FastAPI calls, while the Supabase tokens are used exclusively for Realtime channel authentication. Passwords are hashed with bcrypt before storage. Role-based access is enforced at both the API layer (FastAPI controller guards) and the database layer (Supabase RLS policies).

Payment processing uses Safepay, a Pakistani payment gateway. When a cat owner initiates payment, the backend creates a Safepay checkout session and returns the hosted checkout URL. After payment, Safepay sends an HMAC-SHA256-signed webhook to the backend. The signature is verified using the SAFEPAY_SECRET_KEY; invalid webhooks are rejected with 403 Forbidden. Valid webhooks trigger a database update for the appointment's amount_paid and payment status.

The real-time chat system routes all operations through the FastAPI service layer using the service-role Supabase client. When a user opens the chat page, the system verifies their identity and appointment participation through the backend. It then gets or creates the chat room (one per appointment, enforced by a UNIQUE constraint) and loads message history. The browser subscribes to a Supabase Realtime Postgres Changes channel for live message delivery. Outgoing messages use an optimistic UI update — the message appears immediately and is rolled back on backend failure.

The frontend is deployed to Firebase Hosting on a global CDN. The backend runs on Cloud Run in us-central1. The database is hosted on Supabase in the AWS ap-south-1 (Mumbai) region for low latency to Pakistani users. Supabase enforces Row Level Security on all 28 tables, with 25 migrations applied sequentially to define and refine access policies across all user roles.

---

## CONCLUSION

PurrfectCare successfully demonstrates the design and implementation of a production-ready, multi-role veterinary health platform tailored for the Pakistani market. The project integrates a modern React frontend, a FastAPI Python backend, a Supabase PostgreSQL database with Row Level Security, real-time chat, an AI-powered RAG health companion, and a local payment gateway — all within a unified, coherent system architecture.

The database design — built on the Transaction Pattern with 28 tables and 25 migrations — provides a principled, extensible schema that cleanly separates concerns between participants, transactions, and items. The backend-mediated chat architecture solved a fundamental reliability problem with browser-based Supabase session management, demonstrating that routing sensitive operations through a trusted service layer is superior to relying on client-side session state.

The RAG AI companion, grounded in 155 veterinary knowledge chunks embedded with Google Gemini, shows how large language models can be constrained to produce domain-specific, evidence-based responses rather than generic hallucinations. The dual-token authentication model and the comprehensive RLS policy set ensure that no user can access data outside their role boundary, even in the presence of application-level errors.

Future enhancements to the platform could include push notification delivery for appointment reminders, a prescription PDF generation feature, integration with Pakistan-specific mapping APIs for more accurate hospital proximity search, and expansion of the RAG knowledge base to cover a broader range of feline conditions. The platform's modular architecture and clean controller separation make these extensions straightforward to implement without disrupting the existing system.

---

*Report generated: June 2026*
*Applied Migrations: 025 | Tables: 28 | API Controllers: 9 | Frontend Pages: 23*
