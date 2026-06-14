# 11 — Data Flow Diagram (DeMarco-Yourdon)

> Complete DFD for Purrfect Care.
> **Notation**: Circles/Bubbles = Processes, Two parallel horizontal lines = Data Stores, Rectangles = External Entities, Arrows = Data Flows.

---

## Level 0 — Context Diagram

```plantuml
@startuml
scale max 1024 width
skinparam wrapWidth 200
skinparam maxMessageSize 150
skinparam usecaseBackgroundColor white
skinparam usecaseBorderColor black
skinparam rectangleBackgroundColor white
skinparam rectangleBorderColor black

rectangle "👤 Cat Owner" as CO
rectangle "👨‍⚕️ Veterinarian" as VT
rectangle "🏥 Hospital Admin" as HA
rectangle "🏪 Store Owner" as SO
rectangle "🔑 System Admin" as SA
rectangle "💳 Safepay API" as STRIPE
rectangle "🤖 Gemini API" as GEMINI
rectangle "📧 Resend" as SENDGRID
rectangle "🔔 Firebase CM" as FIREBASE

usecase "<size:24><b>0</b></size>\n<size:20>Purrfect Care</size>\n<size:20>System</size>" as PC

CO --> PC : Registration, Login, Cat Data,\nBooking Requests, Orders,\nChat Messages, Symptoms,\nReviews
PC --> CO : Auth Tokens, Cat Profiles,\nAppointment Confirmations,\nOrder Status, AI Recommendations,\nPrescriptions, Notifications

VT --> PC : Credentials, Availability,\nDiagnosis, Prescriptions,\nChat Responses
PC --> VT : Appointment Queue,\nPatient Records, Chat Messages,\nNotifications

HA --> PC : Hospital Info, Services,\nOffers, Page Config,\nReview Responses
PC --> HA : Dashboard Stats,\nAppointment Data, Reviews,\nNotifications

SO --> PC : Store Info, Products,\nOffers, Order Updates,\nReview Responses
PC --> SO : Order Queue, Analytics,\nReviews, Notifications

SA --> PC : Approvals, Verifications,\nMedicine Data, Breed Data,\nHealth Knowledge
PC --> SA : Pending Approvals, KPIs,\nUser Reports, System Alerts

PC --> STRIPE : Payment Intents, Refunds
STRIPE --> PC : Payment Confirmations,\nWebhook Events

PC --> GEMINI : Embedding Requests (768-dim),\nChat Generation Requests
GEMINI --> PC : Vector Embeddings,\nGrounded AI Answers

PC --> SENDGRID : Email Requests
PC --> FIREBASE : Push Notifications
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
rectangle "🤖 Gemini API" as GEMINI

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

'''' P1 Authentication
CO --> P1 : credentials
VT --> P1 : credentials
P1 --> D1 : user record
P1 --> D2 : profile
P1 --> CO : token
P1 --> VT : token

'''' P2 Cat Management
CO --> P2 : cat data
P2 --> D3
P2 --> D5
P2 --> D6
P2 --> D4 : breed lookup
P2 --> CO : cat profile

'''' P3 Hospital & Appointment
CO --> P3 : booking request
VT --> P3 : availability
P3 --> D8
P3 --> D9
P3 --> D10
P3 --> D11
P3 --> D7 : vet record
P3 --> CO : confirmation
P3 --> VT : appointment queue

'''' P5 Chat
CO --> P5 : message
VT --> P5 : message
P5 --> D17
P5 --> D18

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

'''' P4 Store & Order (incl. mobile store dashboard product management)
CO --> P4 : order
SO --> P4 : store/product data, stock updates
P4 --> D12
P4 --> D13
P4 --> D14
P4 --> D15
P4 --> D16
P4 --> CO : order status
P4 --> SO : order queue
P4 --> P9 : payment request

'''' P8 Review & Offer
CO --> P8 : review
HA --> P8 : offer/response
SO --> P8 : offer/response
P8 --> D24
P8 --> D25
P8 --> D26

'''' P9 Payment
P9 --> STRIPE : payment intent
STRIPE --> P9 : confirmation
P9 --> D27
P9 --> D11 : status
P9 --> D15 : status
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
P10 --> D28
P10 --> CO : push/email
P10 --> VT : push/email
P10 --> HA : push/email
P10 --> SO : push/email
P10 --> SG : email
P10 --> FB : push

'''' P11 Admin
SA --> P11 : approvals, data
P11 --> D1
P11 --> D7
P11 --> D8
P11 --> D12
P11 --> D21
P11 --> D4
P11 --> SA : reports
@enduml
```

---

## Data Store ↔ Entity Mapping

| Store ID | DB Table | Domain | Accessed By Processes |
|----------|----------|--------|-----------------------|
| D1 | `users` | Participant | P1, P11 |
| D2 | `user_profiles` | Participant | P1 |
| D3 | `cats` | Specific Item | P2, P6 |
| D4 | `cat_breeds` | Item | P2, P11 |
| D5 | `medical_records` | Specific Item | P2, P6, P7 |
| D6 | `patient_history` | Subsequent Tx | P2, P7 |
| D7 | `vets` | Participant | P3, P11 |
| D8 | `hospitals` | Place | P3, P11 |
| D9 | `hospital_services` | Item | P3 |
| D10 | `appointment_slots` | Transaction | P3 |
| D11 | `appointments` | Transaction | P3, P9 |
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
| D27 | `payments` | Subsequent Tx | P9 |
| D28 | `notifications` | System | P10 |

**Coverage: 28/28 data stores • 11 processes • 5 external entities • 4 external systems**

> **Note — External Systems**: Safepay replaces Stripe for payments; Resend replaces SendGrid for email; Google Gemini API (gemini-embedding-001 + gemini-2.0-flash) replaces OpenAI for all AI workloads.
