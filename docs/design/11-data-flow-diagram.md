# 11 — Data Flow Diagram (DeMarco-Yourdon)

> Complete DFD for Purrfect Care.
> **Notation**: Circles/Bubbles = Processes, Two parallel horizontal lines = Data Stores, Rectangles = External Entities, Arrows = Data Flows.

---

## Level 0 — Context Diagram

```plantuml
@startuml Level_0_Context
scale max 1600 width
skinparam nodesep 110
skinparam ranksep 130
skinparam defaultFontSize 12
skinparam defaultFontName Arial
skinparam wrapWidth 160
skinparam ArrowColor #444444
skinparam ArrowFontSize 11

skinparam rectangle {
  BackgroundColor #F7F9FC
  BorderColor     #4A6FA5
  FontStyle       bold
  FontSize        12
}
skinparam usecase {
  BackgroundColor #E8F5E9
  BorderColor     #2E7D32
  FontColor       #1B5E20
}

' ── Central system ──────────────────────────────────────────
usecase "<size:22><b>0</b></size>\n<size:17><b>PurrfectCare</b></size>\n<size:13><b>System</b></size>\n<size:10>FastAPI · Cloud Run\nSupabase PostgreSQL</size>" as PC

' ── Human Actors ────────────────────────────────────────────
rectangle "👤\n<b>Cat Owner</b>"      as CO
rectangle "👨‍⚕️\n<b>Veterinarian</b>"   as VT
rectangle "🏥\n<b>Hospital Admin</b>"  as HA
rectangle "🏪\n<b>Store Owner</b>"     as SO
rectangle "🔑\n<b>System Admin</b>"    as SA

' ── External Services ────────────────────────────────────────
rectangle "💳\n<b>Safepay API</b>"    as STRIPE
rectangle "🤖\n<b>Gemini API</b>"     as GEMINI
rectangle "📧\n<b>Resend / FCM</b>"   as NOTIFY

' ── Data Flows ───────────────────────────────────────────────

' Cat Owner  (left)
CO -right-> PC : Registration · Login\nCat Data · Booking Request\nChat Message · AI Query\nOrder · Review
PC -left->  CO : Auth Token · Cat Profile\nAppointment Confirmation\nAI Recommendation\nPrescription · Order Status\nNotification

' Veterinarian  (right)
VT -left->  PC : Credentials · Availability\nDiagnosis · Prescription\nChat Response
PC -right-> VT : Appointment Queue\nPatient Record\nChat Message · Notification

' System Admin  (top)
SA -down->  PC : Approval · Verification\nMedicine Data · Breed Data\nHealth Knowledge
PC -up->    SA : Pending Approvals · KPIs\nUser Reports · System Alerts

' Hospital Admin  (bottom-left)
HA -up->   PC : Hospital Info · Services\nSlot Schedules · Vet Registration\nOffer · Review Response
PC -down-> HA : Dashboard Stats\nAppointment Data · Reviews\nNotification

' Store Owner  (bottom-right)
SO -up->   PC : Store Info · Products\nOffer · Order Update\nReview Response
PC -down-> SO : Order Queue · Analytics\nReviews · Notification

' Safepay  (bottom)
STRIPE -up-> PC : Payment Confirmation\nWebhook Event (HMAC)
PC -down->   STRIPE : Payment Session\nRefund Request

' Gemini  (bottom)
GEMINI -up-> PC : Vector Embedding\nGrounded AI Answer
PC -down->   GEMINI : Embed Request (768-dim)\nChat Generation Request

' Notify  (bottom, one-way)
PC -down-> NOTIFY : Email Request\nPush Notification

@enduml
```

---

## Level 1 — System Decomposition

> To improve readability, the Level 1 diagram is broken down into three logical subsystems based on the Level 0 Context Diagram.

### Level 1a — Core User & Medical Subsystem
*Handles interactions for Cat Owners and Veterinarians regarding medical and core platform features.*

```plantuml
@startuml
scale max 1024 width
skinparam wrapWidth 200
skinparam maxMessageSize 150
skinparam usecaseBackgroundColor white
skinparam usecaseBorderColor black
skinparam rectangleBackgroundColor white
skinparam rectangleBorderColor black

skinparam rectangle<<DataStore>> {
    BorderColor transparent
    BackgroundColor transparent
    Shadowing false
}

'''' External Entities
rectangle "👤 Cat Owner" as CO
rectangle "👨‍⚕️ Veterinarian" as VT
rectangle "🏥 Hospital Admin" as HA
rectangle "🤖 Gemini API" as GEMINI

'''' Internal API Layer (FastAPI / Cloud Run with service-role key)
rectangle "☁️ FastAPI\nBackend API" as API

'''' Processes
usecase "1\nAuth &\nUser Mgmt" as P1
usecase "2\nCat\nManagement" as P2
usecase "3\nHospital &\nAppointment" as P3
usecase "5\nChat\nSystem" as P5
usecase "6\nAI Health\nCompanion\n(RAG)" as P6
usecase "7\nPrescription\n& Medicine" as P7

'''' Data Stores (DeMarco-Yourdon Horizontal Lines via Unicode Box Drawing)
rectangle "━━━━━━━━━━━━━━━\n   D1 users   \n━━━━━━━━━━━━━━━" <<DataStore>> as D1
rectangle "━━━━━━━━━━━━━━━\n D2 user_profiles \n━━━━━━━━━━━━━━━" <<DataStore>> as D2
rectangle "━━━━━━━━━━━━━━━\n   D3 cats   \n━━━━━━━━━━━━━━━" <<DataStore>> as D3
rectangle "━━━━━━━━━━━━━━━\n  D4 cat_breeds  \n━━━━━━━━━━━━━━━" <<DataStore>> as D4
rectangle "━━━━━━━━━━━━━━━\n D5 medical_records \n━━━━━━━━━━━━━━━" <<DataStore>> as D5
rectangle "━━━━━━━━━━━━━━━\n D6 patient_history \n━━━━━━━━━━━━━━━" <<DataStore>> as D6
rectangle "━━━━━━━━━━━━━━━\n   D7 vets   \n━━━━━━━━━━━━━━━" <<DataStore>> as D7
rectangle "━━━━━━━━━━━━━━━\n  D8 hospitals  \n━━━━━━━━━━━━━━━" <<DataStore>> as D8
rectangle "━━━━━━━━━━━━━━━\n D9 hospital_services \n━━━━━━━━━━━━━━━" <<DataStore>> as D9
rectangle "━━━━━━━━━━━━━━━\n D10 appointment_slots \n━━━━━━━━━━━━━━━" <<DataStore>> as D10
rectangle "━━━━━━━━━━━━━━━\n D11 appointments \n━━━━━━━━━━━━━━━" <<DataStore>> as D11
rectangle "━━━━━━━━━━━━━━━\n  D17 chat_rooms  \n━━━━━━━━━━━━━━━" <<DataStore>> as D17
rectangle "━━━━━━━━━━━━━━━\n   D18 messages   \n━━━━━━━━━━━━━━━" <<DataStore>> as D18
rectangle "━━━━━━━━━━━━━━━\n D19 ai_consultations \n━━━━━━━━━━━━━━━" <<DataStore>> as D19
rectangle "━━━━━━━━━━━━━━━\n D20 cat_health_knowledge \n━━━━━━━━━━━━━━━" <<DataStore>> as D20
rectangle "━━━━━━━━━━━━━━━\n  D21 medicines  \n━━━━━━━━━━━━━━━" <<DataStore>> as D21
rectangle "━━━━━━━━━━━━━━━\n D22 prescriptions \n━━━━━━━━━━━━━━━" <<DataStore>> as D22
rectangle "━━━━━━━━━━━━━━━\n  D23 treatments  \n━━━━━━━━━━━━━━━" <<DataStore>> as D23

'''' P1 Authentication (via FastAPI backend — issues JWT + Supabase session)
CO --> P1 : credentials
VT --> P1 : credentials
HA --> P1 : credentials
P1 --> API : create user request
P1 --> API : validate credentials
API --> D1 : write user record
API --> D2 : write profile
P1 --> CO : JWT token
P1 --> CO : Supabase session
P1 --> VT : JWT token
P1 --> VT : Supabase session
P1 --> HA : JWT token
P1 --> HA : Supabase session

'''' P2 Cat Management
CO --> P2 : cat data
P2 --> D3 : write cat
P2 --> D5 : write medical record
P2 --> D6 : write history
P2 --> D4 : breed lookup
P2 --> CO : cat profile

'''' P3 Hospital & Appointment
CO --> P3 : booking request
CO --> P3 : slot selection
CO --> P3 : cat selection
VT --> P3 : availability slots
HA --> P3 : slot schedules
HA --> P3 : vet registration request
P3 --> API : GET vets (service role bypass)
API --> D7 : read vet records
API --> D2 : read vet profile names
P3 --> API : POST register vet
API --> D1 : create auth user
API --> D2 : create vet profile
API --> D7 : create vet record
P3 --> D8 : read hospital info
P3 --> D9 : read services
P3 --> D10 : read available slots
P3 --> D10 : mark slot as booked
P3 --> D11 : insert appointment
P3 --> CO : booking confirmation
P3 --> VT : appointment queue

'''' P5 Chat (all R/W via FastAPI backend — service role; realtime push via Supabase)
CO --> P5 : open chat (appointment ID)
VT --> P5 : open chat (appointment ID)
P5 --> D11 : verify participant (GET /api/appointments/{id})
P5 --> D17 : get / create chat room (GET /api/appointments/{id}/chat-room)
P5 --> D18 : load messages (GET /api/appointments/{id}/messages)
CO --> P5 : send message (POST /api/appointments/{id}/messages)
VT --> P5 : send message (POST /api/appointments/{id}/messages)
P5 --> D18 : insert message (service role)
P5 --> CO : realtime message push
P5 --> VT : realtime message push

'''' P6 AI Companion (RAG)
CO --> P6 : symptoms / question
P6 --> GEMINI : embed question (768-dim)
GEMINI --> P6 : query vector
P6 --> D20 : cosine similarity search
GEMINI --> P6 : grounded answer
P6 --> D19 : log consultation
P6 --> CO : AI recommendations

'''' P7 Prescription & Medicine
VT --> P7 : prescription
P7 --> D5 : allergy check
P7 --> D21
P7 --> D22
P7 --> D23
P7 --> D6 : history entry
P7 --> CO : prescription details
@enduml
```

### Level 1b — Commerce & Business Subsystem
*Handles interactions for Store Owners, Hospital Admins, and Cat Owners regarding orders, offers, and payments.*

```plantuml
@startuml
scale max 1024 width
skinparam wrapWidth 200
skinparam maxMessageSize 150
skinparam usecaseBackgroundColor white
skinparam usecaseBorderColor black
skinparam rectangleBackgroundColor white
skinparam rectangleBorderColor black

skinparam rectangle<<DataStore>> {
    BorderColor transparent
    BackgroundColor transparent
    Shadowing false
}

'''' External Entities
rectangle "👤 Cat Owner" as CO
rectangle "🏥 Hospital Admin" as HA
rectangle "🏪 Store Owner" as SO
rectangle "💳 Safepay" as STRIPE

'''' Processes
usecase "4\nStore &\nOrder" as P4
usecase "8\nReview &\nOffer" as P8
usecase "9\nPayment\nProcessing" as P9

'''' Data Stores (Only relevant ones)
rectangle "━━━━━━━━━━━━━━━\n D11 appointments \n━━━━━━━━━━━━━━━" <<DataStore>> as D11
rectangle "━━━━━━━━━━━━━━━\n  D12 cat_stores  \n━━━━━━━━━━━━━━━" <<DataStore>> as D12
rectangle "━━━━━━━━━━━━━━━\n   D13 products   \n━━━━━━━━━━━━━━━" <<DataStore>> as D13
rectangle "━━━━━━━━━━━━━━━\n D14 product_categories \n━━━━━━━━━━━━━━━" <<DataStore>> as D14
rectangle "━━━━━━━━━━━━━━━\n    D15 orders    \n━━━━━━━━━━━━━━━" <<DataStore>> as D15
rectangle "━━━━━━━━━━━━━━━\n  D16 order_items  \n━━━━━━━━━━━━━━━" <<DataStore>> as D16
rectangle "━━━━━━━━━━━━━━━\n   D24 reviews   \n━━━━━━━━━━━━━━━" <<DataStore>> as D24
rectangle "━━━━━━━━━━━━━━━\n D25 review_responses \n━━━━━━━━━━━━━━━" <<DataStore>> as D25
rectangle "━━━━━━━━━━━━━━━\n    D26 offers    \n━━━━━━━━━━━━━━━" <<DataStore>> as D26
rectangle "━━━━━━━━━━━━━━━\n   D27 payments   \n━━━━━━━━━━━━━━━" <<DataStore>> as D27

'''' P4 Store & Order
CO --> P4 : place order
SO --> P4 : store info
SO --> P4 : product data
SO --> P4 : stock update
P4 --> D12 : read/write store
P4 --> D13 : read/write product
P4 --> D14 : read category
P4 --> D15 : write order
P4 --> D16 : write order items
P4 --> CO : order status
P4 --> SO : order queue
P4 --> P9 : payment request

'''' P8 Review & Offer
CO --> P8 : review
HA --> P8 : offer
HA --> P8 : review response
SO --> P8 : offer
SO --> P8 : review response
P8 --> D24 : write review
P8 --> D25 : write review response
P8 --> D26 : write offer

'''' P9 Payment
P9 --> STRIPE : payment session
P9 --> STRIPE : refund
STRIPE --> P9 : payment confirmation
STRIPE --> P9 : webhook event
P9 --> D27 : write payment record
P9 --> D11 : update appointment status
P9 --> D15 : update order status
@enduml
```

### Level 1c — Platform Admin & Notification Subsystem
*Handles system-wide administration and external notifications.*

```plantuml
@startuml
scale max 1024 width
skinparam wrapWidth 200
skinparam maxMessageSize 150
skinparam usecaseBackgroundColor white
skinparam usecaseBorderColor black
skinparam rectangleBackgroundColor white
skinparam rectangleBorderColor black

skinparam rectangle<<DataStore>> {
    BorderColor transparent
    BackgroundColor transparent
    Shadowing false
}

'''' External Entities
rectangle "🔑 System Admin" as SA
rectangle "👤 Cat Owner" as CO
rectangle "👨‍⚕️ Veterinarian" as VT
rectangle "🏥 Hospital Admin" as HA
rectangle "🏪 Store Owner" as SO
rectangle "📧 Resend" as SG
rectangle "🔔 Firebase CM" as FB

'''' Processes
usecase "10\nNotification\nEngine" as P10
usecase "11\nAdmin\nPanel" as P11

'''' Data Stores (Only relevant ones)
rectangle "━━━━━━━━━━━━━━━\n   D1 users   \n━━━━━━━━━━━━━━━" <<DataStore>> as D1
rectangle "━━━━━━━━━━━━━━━\n  D4 cat_breeds  \n━━━━━━━━━━━━━━━" <<DataStore>> as D4
rectangle "━━━━━━━━━━━━━━━\n   D7 vets   \n━━━━━━━━━━━━━━━" <<DataStore>> as D7
rectangle "━━━━━━━━━━━━━━━\n  D8 hospitals  \n━━━━━━━━━━━━━━━" <<DataStore>> as D8
rectangle "━━━━━━━━━━━━━━━\n  D12 cat_stores  \n━━━━━━━━━━━━━━━" <<DataStore>> as D12
rectangle "━━━━━━━━━━━━━━━\n D20 cat_health_knowledge \n━━━━━━━━━━━━━━━" <<DataStore>> as D20
rectangle "━━━━━━━━━━━━━━━\n  D21 medicines  \n━━━━━━━━━━━━━━━" <<DataStore>> as D21
rectangle "━━━━━━━━━━━━━━━\n D28 notifications \n━━━━━━━━━━━━━━━" <<DataStore>> as D28

'''' P10 Notification
P10 --> D28 : log notification
P10 --> CO : push notification
P10 --> CO : email
P10 --> VT : push notification
P10 --> VT : email
P10 --> HA : push notification
P10 --> HA : email
P10 --> SO : push notification
P10 --> SO : email
P10 --> SG : email request
P10 --> FB : push request

'''' P11 Admin
SA --> P11 : approval action
SA --> P11 : verification action
SA --> P11 : medicine data
SA --> P11 : breed data
SA --> P11 : health knowledge
P11 --> D1 : update user
P11 --> D7 : verify vet
P11 --> D8 : approve hospital
P11 --> D12 : approve store
P11 --> D21 : manage medicine
P11 --> D4 : manage breed
P11 --> SA : approval report
P11 --> SA : KPI report
P11 --> SA : user report
P11 --> SA : system alert
@enduml
```

---

## Data Store ↔ Entity Mapping

| Store ID | DB Table | Domain | Accessed By Processes |
|----------|----------|--------|-----------------------|
| D1 | `users` | Participant | P1 (via FastAPI service role), P11 |
| D2 | `user_profiles` | Participant | P1 (via FastAPI service role), P3 (vet name lookup via service role) |
| D3 | `cats` | Specific Item | P2, P6 |
| D4 | `cat_breeds` | Item | P2, P11 |
| D5 | `medical_records` | Specific Item | P2, P6, P7 |
| D6 | `patient_history` | Subsequent Tx | P2, P7 |
| D7 | `vets` | Participant | P3 (listing via FastAPI service role; slot/booking via Supabase anon RLS), P11 |
| D8 | `hospitals` | Place | P3, P11 |
| D9 | `hospital_services` | Item | P3 |
| D10 | `appointment_slots` | Transaction | P3 (is_booked flag; public SELECT RLS) |
| D11 | `appointments` | Transaction | P3 (INSERT by cat owner — migration 024 RLS), P9 |
| D12 | `cat_stores` | Place | P4, P11 |
| D13 | `products` | Item | P4 |
| D14 | `product_categories` | Item | P4 |
| D15 | `orders` | Transaction | P4, P9 |
| D16 | `order_items` | Line Item | P4 |
| D17 | `chat_rooms` | Transaction | P5 |
| D18 | `messages` | Line Item | P5 |
| D19 | `ai_consultations` | Transaction | P6 |
| D20 | `cat_health_knowledge` | RAG Knowledge Base | P6 |
| D21 | `medicines` | Item | P7, P11 |
| D22 | `prescriptions` | Subsequent Tx | P7 |
| D23 | `treatments` | Subsequent Tx | P7 |
| D24 | `reviews` | Transaction | P8 |
| D25 | `review_responses` | Subsequent Tx | P8 |
| D26 | `offers` | Transaction | P8 |
| D27 | `payments` | Subsequent Tx | P9 (Safepay webhook via FastAPI) |
| D28 | `notifications` | System | P10 |

**Coverage: 28/28 data stores • 11 processes • 6 external entities • 4 external systems**

> **Architecture note**: Auth (P1) and vet registration/listing (P3) route through the FastAPI Cloud Run backend using the Supabase **service-role key**, bypassing RLS for cross-table operations. All other Supabase reads/writes use the **anon key** bound by row-level security. Safepay replaces Stripe for payments; Resend replaces SendGrid for email; Google Gemini API (gemini-embedding-001 + gemini-2.0-flash) handles all AI workloads.
