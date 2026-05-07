# 02 — Swimlane (Activity) Diagrams

> Swimlane diagrams show the flow of activities across different actors/roles for each use case.
> Render these using Mermaid Live Editor (https://mermaid.live) or any Mermaid-compatible viewer.

---

## Swimlane 1: User Registration & Cat Registration

```mermaid
sequenceDiagram
    participant U as Cat Owner
    participant F as Frontend (React)
    participant B as Backend (Python)
    participant DB as Supabase
    participant N as Notification Service

    rect rgb(200, 220, 255)
    Note over U,DB: User Registration Flow
    U->>F: Opens registration page
    U->>F: Enters email, password, name, location
    F->>B: POST /api/auth/register
    B->>DB: Create user in auth.users
    DB-->>B: User created (UUID)
    B->>DB: Insert profile into users table
    DB-->>B: Profile saved
    B->>N: Send welcome email
    N-->>U: Welcome email received
    B-->>F: Registration success + JWT token
    F-->>U: Redirect to dashboard
    end

    rect rgb(200, 255, 220)
    Note over U,DB: Cat Registration Flow
    U->>F: Clicks "Register Cat"
    U->>F: Fills cat details (name, breed, age, weight, medical history)
    F->>B: POST /api/cats
    B->>DB: Validate breed exists in breed_db
    DB-->>B: Breed validated
    B->>DB: Insert into cats table
    DB-->>B: Cat record created
    B-->>F: Cat registered successfully
    F-->>U: Shows cat profile
    end
```

---

## Swimlane 2: Book Appointment (DoorDash-style)

```mermaid
sequenceDiagram
    participant U as Cat Owner
    participant F as Frontend (React)
    participant B as Backend (Python)
    participant G as Location Service
    participant DB as Supabase
    participant P as Payment Gateway
    participant N as Notification Service

    rect rgb(255, 230, 200)
    Note over U,G: Find Nearby Hospitals
    U->>F: Clicks "Find Hospitals"
    F->>G: Request user geolocation
    G-->>F: Lat/Lng coordinates
    F->>B: GET /api/hospitals/nearby?lat=X&lng=Y&radius=10km
    B->>DB: Query hospitals within radius (PostGIS)
    DB-->>B: List of nearby hospitals
    B-->>F: Hospitals with distance, ratings, services
    F-->>U: Displays hospital cards sorted by distance
    end

    rect rgb(220, 200, 255)
    Note over U,DB: Select Hospital & Service
    U->>F: Selects a hospital
    F->>B: GET /api/hospitals/{id}
    B->>DB: Fetch hospital details, services, vets, slots
    DB-->>B: Hospital data
    B-->>F: Hospital page data
    F-->>U: Shows hospital page (services, vets, reviews, offers)
    U->>F: Selects service (checkup/vaccination/treatment)
    U->>F: Selects vet and time slot
    U->>F: Selects which cat
    end

    rect rgb(200, 255, 240)
    Note over U,P: Booking & Payment
    F->>B: POST /api/appointments
    B->>DB: Check slot still available
    DB-->>B: Slot available
    B->>P: Create payment intent
    P-->>B: Payment intent (client_secret)
    B-->>F: Appointment summary + payment intent
    F->>P: Process payment (Stripe Elements)
    P-->>F: Payment confirmed
    F->>B: PUT /api/appointments/{id}/confirm
    B->>DB: Update appointment status = confirmed
    B->>DB: Mark slot as booked
    B->>N: Notify user, vet, hospital
    N-->>U: Appointment confirmation (email + push)
    B-->>F: Booking confirmed
    F-->>U: Shows confirmation page
    end
```

---

## Swimlane 3: Purchase Products (Cat Store — DoorDash-style)

```mermaid
sequenceDiagram
    participant U as Cat Owner
    participant F as Frontend (React)
    participant B as Backend (Python)
    participant G as Location Service
    participant DB as Supabase
    participant P as Payment Gateway
    participant N as Notification Service

    rect rgb(255, 245, 200)
    Note over U,G: Find Nearby Stores
    U->>F: Clicks "Cat Stores"
    F->>G: Request user geolocation
    G-->>F: Lat/Lng coordinates
    F->>B: GET /api/stores/nearby?lat=X&lng=Y
    B->>DB: Query stores within radius
    DB-->>B: List of nearby stores
    B-->>F: Stores with distance, ratings, categories
    F-->>U: Displays store cards sorted by distance
    end

    rect rgb(230, 255, 230)
    Note over U,DB: Browse Store & Add to Cart
    U->>F: Selects a store
    F->>B: GET /api/stores/{id}
    B->>DB: Fetch store details, products, categories, offers
    DB-->>B: Store data
    B-->>F: Store page
    F-->>U: Shows store page (products, offers, reviews)
    U->>F: Browses products by category
    U->>F: Adds items to cart
    F-->>U: Cart updated (local state)
    end

    rect rgb(220, 230, 255)
    Note over U,P: Checkout & Payment
    U->>F: Clicks "Checkout"
    F->>B: POST /api/orders
    B->>DB: Validate items in stock
    DB-->>B: Stock validated
    B->>B: Calculate total + delivery fee
    B->>P: Create payment intent
    P-->>B: Payment intent
    B-->>F: Order summary + payment intent
    F->>P: Process payment
    P-->>F: Payment confirmed
    F->>B: PUT /api/orders/{id}/confirm
    B->>DB: Create order record, update inventory
    B->>N: Notify user + store owner
    N-->>U: Order confirmation
    B-->>F: Order confirmed
    F-->>U: Shows order tracking page
    end
```

---

## Swimlane 4: Vet-User Direct Chat

```mermaid
sequenceDiagram
    participant U as Cat Owner
    participant FU as User Frontend
    participant RT as Supabase Realtime
    participant DB as Supabase
    participant FV as Vet Frontend
    participant V as Veterinarian
    participant N as Notification Service

    rect rgb(240, 220, 255)
    Note over U,V: Initialize Chat
    U->>FU: Opens chat with vet
    FU->>DB: GET /api/chats?vet_id=X&user_id=Y
    DB-->>FU: Chat history (messages)
    FU->>RT: Subscribe to chat channel
    FU-->>U: Display chat window with history
    end

    rect rgb(220, 255, 240)
    Note over U,V: Send & Receive Messages
    U->>FU: Types and sends message
    FU->>DB: INSERT message into messages table
    DB->>RT: Broadcast new message event
    RT->>FV: Real-time message received
    FV-->>V: New message notification
    V->>FV: Reads and types reply
    FV->>DB: INSERT reply into messages table
    DB->>RT: Broadcast reply event
    RT->>FU: Real-time reply received
    FU-->>U: Shows vet's reply
    end

    rect rgb(255, 240, 220)
    Note over N,V: Offline Notification
    U->>FU: Sends message (vet offline)
    FU->>DB: INSERT message
    DB->>N: Trigger push notification
    N-->>V: Push notification "New message from cat owner"
    end
```

---

## Swimlane 5: AI Companion Consultation

```mermaid
sequenceDiagram
    participant U as Cat Owner
    participant F as Frontend (React)
    participant B as Backend (Python)
    participant AI as AI Service
    participant VDB as Vector DB (pgvector)
    participant DB as Supabase

    rect rgb(255, 220, 220)
    Note over U,VDB: Symptom Analysis
    U->>F: Opens AI Companion
    U->>F: Describes symptoms ("My cat is vomiting and has diarrhea")
    F->>B: POST /api/ai/consult {symptoms: "...", cat_id: "..."}
    B->>DB: Fetch cat details (breed, age, allergies, history)
    DB-->>B: Cat profile data
    B->>AI: Generate embedding for symptom text
    AI-->>B: Vector embedding [0.12, -0.34, ...]
    B->>VDB: Similarity search (cosine distance) with cat context
    VDB-->>B: Top 5 matching illness-solution pairs
    end

    rect rgb(220, 255, 220)
    Note over B,U: Generate Recommendation
    B->>AI: Generate natural language response from matches
    AI-->>B: Structured recommendation
    B->>B: Calculate severity score
    B->>DB: Log interaction (query, results, timestamp)
    B-->>F: Response with illnesses, remedies, severity, confidence
    F-->>U: Display AI recommendations
    alt High Severity
        F-->>U: "⚠️ We recommend seeing a vet immediately"
        F-->>U: Show "Book Appointment" button
    else Low Severity
        F-->>U: Show home remedies and monitoring tips
    end
    end
```

---

## Swimlane 6: Hospital Dashboard Customization

```mermaid
sequenceDiagram
    participant HA as Hospital Admin
    participant F as Frontend (React)
    participant B as Backend (Python)
    participant DB as Supabase
    participant S as Storage (Supabase)

    rect rgb(230, 240, 255)
    Note over HA,S: Customize Hospital Page
    HA->>F: Opens Hospital Dashboard
    F->>B: GET /api/hospitals/my-hospital
    B->>DB: Fetch hospital config + page data
    DB-->>B: Current page configuration
    B-->>F: Dashboard data
    F-->>HA: Shows page editor

    HA->>F: Uploads new banner image
    F->>S: Upload image to storage bucket
    S-->>F: Public image URL
    
    HA->>F: Updates description, hours, contact info
    HA->>F: Adds promotional section ("20% off vaccinations")
    HA->>F: Reorders page sections
    HA->>F: Clicks "Preview"
    F-->>HA: Shows preview of changes
    
    HA->>F: Clicks "Publish"
    F->>B: PUT /api/hospitals/{id}/page
    B->>DB: Update hospital page configuration
    DB-->>B: Updated
    B-->>F: Page published
    F-->>HA: "Changes are live!"
    end
```

---

## Swimlane 7: Store Order Processing

```mermaid
sequenceDiagram
    participant SO as Store Owner
    participant F as Frontend (React)
    participant B as Backend (Python)
    participant DB as Supabase
    participant RT as Supabase Realtime
    participant N as Notification Service
    participant U as Cat Owner

    rect rgb(255, 240, 230)
    Note over SO,U: Order Processing Flow
    RT->>F: New order notification (real-time)
    F-->>SO: 🔔 New order received!
    SO->>F: Views order details
    F->>B: GET /api/orders/{id}
    B->>DB: Fetch order details + items
    DB-->>B: Order data
    B-->>F: Order info
    F-->>SO: Shows order (items, quantities, delivery address)

    SO->>F: Clicks "Accept Order"
    F->>B: PUT /api/orders/{id}/status {status: "preparing"}
    B->>DB: Update order status
    B->>N: Notify customer "Order being prepared"
    N-->>U: Push notification
    
    SO->>F: Clicks "Ready for Pickup/Delivery"
    F->>B: PUT /api/orders/{id}/status {status: "ready"}
    B->>DB: Update order status
    B->>N: Notify customer "Order ready"
    N-->>U: Push notification

    SO->>F: Clicks "Completed"
    F->>B: PUT /api/orders/{id}/status {status: "completed"}
    B->>DB: Update order status, finalize payment
    B->>N: Notify customer "Order completed"
    N-->>U: "Your order has been delivered! Rate your experience"
    end
```

---

## Swimlane 8: Admin — Manage Medicine Database

```mermaid
sequenceDiagram
    participant A as System Admin
    participant F as Frontend (React)
    participant B as Backend (Python)
    participant DB as Supabase
    participant AI as AI Service
    participant VDB as Vector DB (pgvector)

    rect rgb(240, 255, 240)
    Note over A,VDB: Add New Medicine
    A->>F: Opens Medicine Management
    F->>B: GET /api/admin/medicines
    B->>DB: Fetch all medicines
    DB-->>B: Medicine list
    B-->>F: Medicines data
    F-->>A: Shows medicine table

    A->>F: Clicks "Add Medicine"
    A->>F: Fills form (name, ingredients, dosage, contraindications)
    A->>F: Adds allergy warnings (e.g. "Not for cats with kidney disease")
    A->>F: Adds breed-specific warnings
    F->>B: POST /api/admin/medicines
    B->>DB: Insert medicine record
    DB-->>B: Medicine created
    B->>AI: Generate embedding for medicine description + uses
    AI-->>B: Vector embedding
    B->>VDB: Store medicine vector for AI search
    VDB-->>B: Stored
    B-->>F: Medicine added successfully
    F-->>A: Updated medicine list
    end
```

---

## Swimlane 9: Vet — Prescribe Medicine & Update Patient Record

```mermaid
sequenceDiagram
    participant V as Veterinarian
    participant F as Frontend (React)
    participant B as Backend (Python)
    participant DB as Supabase
    participant N as Notification Service
    participant U as Cat Owner

    rect rgb(255, 235, 240)
    Note over V,U: During/After Appointment
    V->>F: Opens appointment details
    F->>B: GET /api/appointments/{id}
    B->>DB: Fetch appointment + cat details + history
    DB-->>B: Full context
    B-->>F: Appointment data + patient history
    F-->>V: Shows appointment context

    V->>F: Adds diagnosis notes
    V->>F: Searches medicine database
    F->>B: GET /api/medicines?search=amoxicillin
    B->>DB: Search medicines
    DB-->>B: Matching medicines
    B-->>F: Medicine results
    F-->>V: Shows medicine options with allergy warnings

    V->>F: Selects medicine, sets dosage & duration
    Note over F: System checks for allergies/contraindications against cat profile
    F->>B: POST /api/prescriptions
    B->>DB: Check cat allergies vs medicine contraindications
    alt Contraindication Found
        B-->>F: ⚠️ Warning: Cat has allergy to ingredient X
        F-->>V: Shows allergy warning, asks to proceed or change
    else No Issues
        B->>DB: Create prescription record
        B->>DB: Update patient history
        B->>N: Notify cat owner of new prescription
        N-->>U: "New prescription for [cat name]"
        B-->>F: Prescription created
        F-->>V: Prescription confirmed
    end
    end
```

---

## Summary of All Swimlane Diagrams

| # | Swimlane | Actors Involved | Primary Use Case |
|---|----------|----------------|-----------------|
| 1 | Registration | User, Frontend, Backend, DB, Notification | UC-1.1, UC-1.2 |
| 2 | Book Appointment | User, Frontend, Backend, Location, DB, Payment, Notification | UC-1.5 |
| 3 | Purchase Products | User, Frontend, Backend, Location, DB, Payment, Notification | UC-1.9 |
| 4 | Vet-User Chat | User, Vet, Frontends, Realtime, DB, Notification | UC-1.6, UC-2.4 |
| 5 | AI Consultation | User, Frontend, Backend, AI, Vector DB, DB | UC-1.11 |
| 6 | Hospital Dashboard | Hospital Admin, Frontend, Backend, DB, Storage | UC-3.2 |
| 7 | Order Processing | Store Owner, Frontend, Backend, DB, Realtime, Notification, User | UC-4.5 |
| 8 | Medicine Management | Admin, Frontend, Backend, DB, AI, Vector DB | UC-5.5 |
| 9 | Prescribe Medicine | Vet, Frontend, Backend, DB, Notification, User | UC-2.5 |
