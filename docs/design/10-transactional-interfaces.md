# 10 — Transactional Interfaces

> This document identifies all transactional interfaces in the system, categorized by type: **User Interfaces (UI)**, **System Interfaces**, and **External Interfaces**.

---

## Interface Classification

| Type | Description | Example |
|------|-------------|---------|
| **User Interface (UI)** | Screens/pages the user interacts with | Login Page, Hospital Listing |
| **System Interface** | Internal service-to-service communication | AuthService → UserRepository |
| **External Interface** | Communication with 3rd-party systems | Backend → Stripe API |

---

## 1. User Interfaces (UI Boundaries)

### 1.1 Authentication Interfaces

| Interface ID | Name | Actor(s) | Transactions | Description |
|-------------|------|----------|-------------|-------------|
| UI-001 | Registration Page | All actors | T-1.1, T-1.2 | Email/password/name/location form with role selection |
| UI-002 | Login Page | All actors | T-1.3 | Email/password login, social auth buttons |
| UI-003 | Forgot Password Page | All actors | — | Password reset via email |

### 1.2 Cat Owner Interfaces

| Interface ID | Name | Actor(s) | Transactions | Description |
|-------------|------|----------|-------------|-------------|
| UI-010 | User Dashboard | Cat Owner | — | Overview: cats, upcoming appointments, orders, notifications |
| UI-011 | Cat Registration Form | Cat Owner | T-2.1, T-2.2, T-2.3 | Form: name, breed (dropdown), age, weight, allergies |
| UI-012 | Cat Profile Page | Cat Owner | — | Cat details, medical record, patient history timeline |
| UI-013 | Cat Breed Browser | Cat Owner | — | Searchable breed encyclopedia with filters |
| UI-014 | Cat Breed Detail Page | Cat Owner | — | Breed info: photo, characteristics, health issues |
| UI-020 | Hospital Listing Page | Cat Owner | T-3.1 | DoorDash-style card list, sorted by distance, with filters |
| UI-021 | Hospital Detail Page | Cat Owner | T-3.2 | Hospital page: banner, services, vets, reviews, offers |
| UI-022 | Appointment Booking Form | Cat Owner | T-3.3, T-3.4, T-3.5 | Service/vet/slot/cat selection → payment → confirmation |
| UI-023 | Appointment History | Cat Owner | — | List of past and upcoming appointments |
| UI-024 | Appointment Detail | Cat Owner | — | Details, prescriptions, notes, review option |
| UI-030 | Store Listing Page | Cat Owner | T-4.1 | DoorDash-style store cards sorted by distance |
| UI-031 | Store Detail Page | Cat Owner | T-4.2 | Store page: products by category, offers, reviews |
| UI-032 | Product Detail | Cat Owner | — | Product info, images, reviews, add to cart |
| UI-033 | Shopping Cart | Cat Owner | T-4.3, T-4.4 | Cart items, quantities, subtotal, delivery fee |
| UI-034 | Checkout Page | Cat Owner | T-4.5, T-4.6, T-4.7 | Payment form, delivery address, order confirmation |
| UI-035 | Order History | Cat Owner | — | Past and active orders with status tracking |
| UI-040 | Chat List | Cat Owner | T-5.1 | List of chat rooms with vets |
| UI-041 | Chat Window | Cat Owner | T-5.2, T-5.3, T-5.4 | Real-time messaging interface |
| UI-050 | AI Companion Chat | Cat Owner | T-6.1–T-6.5 | Chat-style interface for symptom input + recommendations |
| UI-051 | AI Consultation History | Cat Owner | — | Past AI consultations and results |
| UI-060 | Medicine Search | Cat Owner, Vet | T-7.2 | Searchable medicine database with details |
| UI-061 | Medicine Detail Page | Cat Owner, Vet | — | Full medicine info: ingredients, contraindications, warnings |
| UI-070 | Review Form | Cat Owner | — | Star rating + text review submission |
| UI-071 | Profile Settings | Cat Owner | — | Edit profile, location, notifications, payment methods |

### 1.3 Veterinarian Interfaces

| Interface ID | Name | Actor(s) | Transactions | Description |
|-------------|------|----------|-------------|-------------|
| UI-100 | Vet Dashboard | Vet | — | Today's appointments, unread messages, patient queue |
| UI-101 | Vet Registration Form | Vet | — | License number, specialization, qualifications, bio |
| UI-102 | Appointment Queue | Vet | T-7.1 | List of scheduled appointments with patient info |
| UI-103 | Patient Examination View | Vet | T-7.1, T-7.2, T-7.3 | Cat info, medical record, history, prescribe action |
| UI-104 | Prescription Form | Vet | T-7.4, T-7.5 | Medicine search, dosage, frequency, instructions |
| UI-105 | Availability Manager | Vet | — | Set/edit available time slots |
| UI-106 | Vet Chat List | Vet | T-5.1 | Patient chat rooms |
| UI-107 | Vet Chat Window | Vet | T-5.2, T-5.3 | Chat with cat owners |

### 1.4 Hospital Admin Interfaces

| Interface ID | Name | Actor(s) | Transactions | Description |
|-------------|------|----------|-------------|-------------|
| UI-200 | Hospital Dashboard | Hospital Admin | — | Overview: appointments, revenue, ratings |
| UI-201 | Hospital Registration Form | Hospital Admin | — | Register hospital: name, address, location, contact |
| UI-202 | Page Customizer | Hospital Admin | T-8.1, T-8.2, T-8.3 | WYSIWYG editor: banner, sections, description, hours |
| UI-203 | Service Manager | Hospital Admin | T-8.4 | CRUD services: name, price, duration, category |
| UI-204 | Staff Manager | Hospital Admin | — | Add/remove vets, assign to hospital |
| UI-205 | Appointment Manager | Hospital Admin | — | View/manage all hospital appointments |
| UI-206 | Offer Manager | Hospital Admin | — | Create/edit promotional offers |
| UI-207 | Hospital Analytics | Hospital Admin | — | Charts: appointments, revenue, ratings over time |
| UI-208 | Review Manager | Hospital Admin | — | View and respond to reviews |

### 1.5 Store Owner Interfaces

| Interface ID | Name | Actor(s) | Transactions | Description |
|-------------|------|----------|-------------|-------------|
| UI-300 | Store Dashboard | Store Owner | — | Overview: orders, revenue, inventory alerts |
| UI-301 | Store Registration Form | Store Owner | — | Register store: name, address, location, delivery zones |
| UI-302 | Store Page Customizer | Store Owner | T-9.1 | WYSIWYG editor for store public page |
| UI-303 | Product Manager | Store Owner | T-9.2, T-9.3 | CRUD products: name, price, images, stock, category |
| UI-304 | Inventory Manager | Store Owner | — | Stock levels, low-stock alerts |
| UI-305 | Order Queue | Store Owner | T-9.5 | Incoming orders with accept/preparing/ready actions |
| UI-306 | Offer Manager | Store Owner | T-9.4 | Create/edit promotional offers |
| UI-307 | Store Analytics | Store Owner | — | Charts: sales, top products, revenue |
| UI-308 | Review Manager | Store Owner | — | View and respond to reviews |

### 1.6 System Admin Interfaces

| Interface ID | Name | Actor(s) | Transactions | Description |
|-------------|------|----------|-------------|-------------|
| UI-400 | Admin Dashboard | Admin | — | System-wide KPIs, alerts, pending approvals |
| UI-401 | User Management | Admin | T-10.1 | User table: search, filter, view, suspend, delete |
| UI-402 | Vet Verification | Admin | T-10.2 | Verify vet licenses, approve/reject |
| UI-403 | Hospital Approval | Admin | T-10.3 | Approve/reject hospital registrations |
| UI-404 | Store Approval | Admin | T-10.4 | Approve/reject store registrations |
| UI-405 | Medicine Manager | Admin | T-10.4 | CRUD medicines with allergy/contraindication data |
| UI-406 | Breed Manager | Admin | T-10.5 | CRUD cat breed entries |
| UI-407 | AI Data Manager | Admin | T-10.6 | CRUD illness-symptom pairs + regenerate embeddings |
| UI-408 | System Analytics | Admin | — | Platform-wide charts and metrics |
| UI-409 | Content Moderation | Admin | — | Review reports, moderate content |

---

## 2. System Interfaces (Internal)

### 2.1 Controller → Service Interfaces

| Interface ID | Source | Target | Protocol | Operations |
|-------------|--------|--------|----------|------------|
| SI-001 | AuthController | AuthService | Method call | register(), login(), verifyToken(), refreshToken() |
| SI-002 | CatController | CatService | Method call | registerCat(), getCatsByOwner(), updateCat() |
| SI-003 | HospitalController | HospitalService | Method call | findNearby(), getDetails(), updatePage() |
| SI-004 | AppointmentController | AppointmentService | Method call | create(), confirm(), cancel(), getByUser() |
| SI-005 | ChatController | ChatService | Method call | getOrCreateChat(), sendMessage(), getMessages() |
| SI-006 | OrderController | OrderService | Method call | createOrder(), confirmOrder(), updateStatus() |
| SI-007 | PrescriptionController | PrescriptionService | Method call | prescribe(), checkContraindications() |
| SI-008 | AIController | AIService | Method call | consult(), getHistory() |
| SI-009 | MedicineController | MedicineService | Method call | search(), create(), update() |
| SI-010 | ReviewController | ReviewService | Method call | create(), getByTarget(), respond() |
| SI-011 | AdminController | Multiple Services | Method call | manage*() operations across all domains |

### 2.2 Service → Repository Interfaces

| Interface ID | Source | Target | Protocol | Operations |
|-------------|--------|--------|----------|------------|
| SI-020 | AuthService | UserRepository | Method call | createProfile(), findByEmail(), findById() |
| SI-021 | CatService | CatRepository | Method call | create(), findByOwner(), findById() |
| SI-022 | CatService | BreedRepository | Method call | findById(), findAll(), search() |
| SI-023 | CatService | MedicalRecordRepo | Method call | createInitialRecord(), getAllergies() |
| SI-024 | HospitalService | HospitalRepository | Method call | findByRadius(), updatePageConfig() |
| SI-025 | AppointmentService | AppointmentRepository | Method call | create(), updateStatus(), findByUser() |
| SI-026 | AppointmentService | SlotRepository | Method call | checkAvailability(), markBooked() |
| SI-027 | ChatService | ChatRepository | Method call | findByParticipants(), create() |
| SI-028 | ChatService | MessageRepository | Method call | create(), findByChatRoom() |
| SI-029 | OrderService | OrderRepository | Method call | create(), updateStatus(), findByStore() |
| SI-030 | OrderService | ProductRepository | Method call | validateStock(), decrementStock() |
| SI-031 | PrescriptionService | PrescriptionRepository | Method call | create(), findByCat() |
| SI-032 | PrescriptionService | MedicineRepository | Method call | search(), getContraindications() |
| SI-033 | AIService | VectorDBRepository | Method call | similaritySearch(), store() |
| SI-034 | AIService | EmbeddingService | Method call | generateEmbedding() |
| SI-035 | All Services | NotificationService | Method call | sendEmail(), sendPush() |

### 2.3 Service → Service Interfaces (Cross-Domain)

| Interface ID | Source | Target | Purpose |
|-------------|--------|--------|---------|
| SI-040 | PrescriptionService | MedicalRecordRepo | Check cat allergies before prescribing |
| SI-041 | AIService | CatRepository | Fetch cat breed/medical context for AI |
| SI-042 | AppointmentService | NotificationService | Send booking confirmations |
| SI-043 | OrderService | NotificationService | Send order status updates |
| SI-044 | ChatService | NotificationService | Send offline message alerts |

---

## 3. External Interfaces

| Interface ID | Source | External System | Protocol | Purpose |
|-------------|--------|----------------|----------|---------|
| EI-001 | AuthService | Supabase Auth (GoTrue) | REST/HTTP | User authentication, JWT token generation |
| EI-002 | ChatService | Supabase Realtime | WebSocket | Real-time chat message broadcasting |
| EI-003 | StorageService | Supabase Storage | REST/S3 | Upload/download images and files |
| EI-004 | All Repositories | Supabase PostgreSQL | TCP/SQL | Database CRUD operations |
| EI-005 | AppointmentService | Stripe | REST/HTTPS | Create payment intents, process payments |
| EI-006 | OrderService | Stripe | REST/HTTPS | Store order payments, refunds |
| EI-007 | EmbeddingService | OpenAI API | REST/HTTPS | Generate text embeddings (text-embedding-3-small) |
| EI-008 | NotificationService | SendGrid | REST/HTTPS | Send transactional emails |
| EI-009 | NotificationService | Firebase CM | REST/HTTPS | Send push notifications |
| EI-010 | GeoLocationService | Browser Geolocation API | JavaScript | Get user's current location |
| EI-011 | HospitalRepository | PostGIS | SQL Extension | Geospatial distance queries (ST_DWithin) |
| EI-012 | VectorDBRepository | pgvector | SQL Extension | Cosine similarity search on embeddings |

---

## Interface Count Summary

| Category | Count |
|----------|-------|
| **User Interfaces (UI)** | 50 screens |
| **System Interfaces (Internal)** | 44 interfaces |
| **External Interfaces** | 12 integrations |
| **Total** | **106 interfaces** |
