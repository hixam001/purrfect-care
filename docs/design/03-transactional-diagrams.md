# 03 — Transactional Diagrams

> Transactional diagrams identify the **transaction sets** — the set of objects that must be created, read, updated, or deleted (CRUD) to complete each use case. Each transaction represents a unit of work in the system.

---

## Transaction Set Notation

Each transaction is identified as:
- **T-[UseCase].[Step]** — Transaction identifier
- **Operation**: CREATE / READ / UPDATE / DELETE
- **Objects Involved**: The data objects that participate in the transaction
- **Initiator**: The actor or system component that triggers the transaction

---

## TS-1: User Registration & Login

```mermaid
graph TD
    subgraph "TS-1: User Registration"
        T1_1["T-1.1: CREATE User
        ─────────────
        Object: User
        Fields: email, password_hash, name, 
        phone, location, role='cat_owner'
        Initiator: Cat Owner"]
        
        T1_2["T-1.2: CREATE UserProfile
        ─────────────
        Object: UserProfile
        Fields: user_id, avatar_url, 
        address, city, preferences
        Initiator: System"]
        
        T1_3["T-1.3: CREATE AuthToken
        ─────────────
        Object: AuthToken (JWT)
        Fields: user_id, role, exp
        Initiator: Supabase Auth"]
        
        T1_4["T-1.4: CREATE Notification
        ─────────────
        Object: Notification
        Fields: user_id, type='welcome', 
        channel='email'
        Initiator: Notification Service"]
    end

    T1_1 --> T1_2
    T1_2 --> T1_3
    T1_3 --> T1_4
```

---

## TS-2: Cat Registration

```mermaid
graph TD
    subgraph "TS-2: Cat Registration"
        T2_1["T-2.1: READ CatBreed
        ─────────────
        Object: CatBreed
        Query: Validate breed_id exists
        Initiator: Backend"]
        
        T2_2["T-2.2: CREATE Cat
        ─────────────
        Object: Cat
        Fields: name, breed_id, age, weight, 
        color, gender, owner_id, photo_url
        Initiator: Cat Owner"]
        
        T2_3["T-2.3: CREATE MedicalRecord
        ─────────────
        Object: MedicalRecord
        Fields: cat_id, allergies[], 
        existing_conditions[], vaccination_status
        Initiator: System"]

        T2_4["T-2.4: CREATE PatientHistory
        ─────────────
        Object: PatientHistory
        Fields: cat_id, created_at, 
        initial_notes
        Initiator: System"]
    end

    T2_1 --> T2_2
    T2_2 --> T2_3
    T2_3 --> T2_4
```

---

## TS-3: Book Appointment

```mermaid
graph TD
    subgraph "TS-3: Book Appointment"
        T3_1["T-3.1: READ Hospital[]
        ─────────────
        Object: Hospital
        Query: Find by location radius
        Filter: is_active=true
        Initiator: Location Service"]
        
        T3_2["T-3.2: READ HospitalDetail
        ─────────────
        Objects: Hospital, Service, 
        Vet, AppointmentSlot
        Query: hospital_id = X
        Initiator: Cat Owner"]
        
        T3_3["T-3.3: READ AppointmentSlot
        ─────────────
        Object: AppointmentSlot
        Query: vet_id, date, available=true
        Initiator: System"]
        
        T3_4["T-3.4: CREATE PaymentIntent
        ─────────────
        Object: PaymentIntent
        Fields: amount, currency, user_id
        Initiator: Payment Gateway"]
        
        T3_5["T-3.5: CREATE Appointment
        ─────────────
        Object: Appointment
        Fields: user_id, cat_id, vet_id, 
        hospital_id, service_id, slot_id,
        date, time, status='confirmed',
        payment_id
        Initiator: System"]
        
        T3_6["T-3.6: UPDATE AppointmentSlot
        ─────────────
        Object: AppointmentSlot
        Set: is_booked = true
        Initiator: System"]
        
        T3_7["T-3.7: CREATE Notification[]
        ─────────────
        Object: Notification (x3)
        Recipients: user, vet, hospital
        Type: 'appointment_booked'
        Initiator: Notification Service"]
    end

    T3_1 --> T3_2
    T3_2 --> T3_3
    T3_3 --> T3_4
    T3_4 --> T3_5
    T3_5 --> T3_6
    T3_6 --> T3_7
```

---

## TS-4: Purchase Products (Cat Store)

```mermaid
graph TD
    subgraph "TS-4: Purchase Products"
        T4_1["T-4.1: READ Store[]
        ─────────────
        Object: CatStore
        Query: Find by location radius
        Filter: is_open=true
        Initiator: Location Service"]
        
        T4_2["T-4.2: READ StoreDetail
        ─────────────
        Objects: CatStore, Product, 
        Category, Offer
        Query: store_id = X
        Initiator: Cat Owner"]
        
        T4_3["T-4.3: CREATE Cart
        ─────────────
        Object: Cart / CartItem
        Fields: user_id, store_id, 
        items[{product_id, qty, price}]
        Initiator: Cat Owner (Frontend)"]
        
        T4_4["T-4.4: READ Product[]
        ─────────────
        Object: Product
        Query: Validate stock for each item
        Initiator: System"]
        
        T4_5["T-4.5: CREATE PaymentIntent
        ─────────────
        Object: PaymentIntent
        Fields: amount + delivery_fee
        Initiator: Payment Gateway"]
        
        T4_6["T-4.6: CREATE Order
        ─────────────
        Object: Order
        Fields: user_id, store_id, items[],
        total, delivery_fee, status='pending',
        payment_id, delivery_address
        Initiator: System"]
        
        T4_7["T-4.7: CREATE OrderItem[]
        ─────────────
        Object: OrderItem (per product)
        Fields: order_id, product_id, 
        quantity, unit_price
        Initiator: System"]
        
        T4_8["T-4.8: UPDATE Product[]
        ─────────────
        Object: Product
        Set: stock = stock - quantity
        For each ordered item
        Initiator: System"]
        
        T4_9["T-4.9: CREATE Notification[]
        ─────────────
        Object: Notification (x2)
        Recipients: user, store_owner
        Type: 'order_placed'
        Initiator: Notification Service"]
    end

    T4_1 --> T4_2
    T4_2 --> T4_3
    T4_3 --> T4_4
    T4_4 --> T4_5
    T4_5 --> T4_6
    T4_6 --> T4_7
    T4_7 --> T4_8
    T4_8 --> T4_9
```

---

## TS-5: Vet-User Chat

```mermaid
graph TD
    subgraph "TS-5: Vet-User Chat"
        T5_1["T-5.1: READ/CREATE ChatRoom
        ─────────────
        Object: ChatRoom
        Query: Find by (user_id, vet_id)
        Create if not exists
        Initiator: User or Vet"]
        
        T5_2["T-5.2: READ Message[]
        ─────────────
        Object: Message
        Query: chat_room_id, ordered by timestamp
        Initiator: Frontend"]
        
        T5_3["T-5.3: CREATE Message
        ─────────────
        Object: Message
        Fields: chat_room_id, sender_id,
        content, type='text|image',
        timestamp
        Initiator: User or Vet"]
        
        T5_4["T-5.4: UPDATE ChatRoom
        ─────────────
        Object: ChatRoom
        Set: last_message_at, 
        unread_count++
        Initiator: System"]
        
        T5_5["T-5.5: CREATE Notification
        ─────────────
        Object: Notification
        Type: 'new_message'
        Initiator: Notification Service"]
    end

    T5_1 --> T5_2
    T5_2 --> T5_3
    T5_3 --> T5_4
    T5_4 --> T5_5
```

---

## TS-6: AI Companion Consultation

```mermaid
graph TD
    subgraph "TS-6: AI Consultation"
        T6_1["T-6.1: READ Cat
        ─────────────
        Object: Cat + MedicalRecord
        Query: cat_id, include allergies
        Initiator: Backend"]
        
        T6_2["T-6.2: CREATE Embedding
        ─────────────
        Object: Vector Embedding
        Input: symptom_text
        Output: float[] vector
        Initiator: AI Service (OpenAI)"]
        
        T6_3["T-6.3: READ VectorMatch[]
        ─────────────
        Object: illness_vectors (pgvector)
        Query: cosine_similarity(embedding)
        Filter: top 5 matches
        Initiator: System"]
        
        T6_4["T-6.4: READ Illness[]
        ─────────────
        Object: Illness + Treatment
        Query: illness_ids from vector matches
        Initiator: System"]
        
        T6_5["T-6.5: CREATE AIConsultation
        ─────────────
        Object: AIConsultation
        Fields: user_id, cat_id, query_text,
        results[], confidence_score,
        severity, timestamp
        Initiator: System"]
    end

    T6_1 --> T6_2
    T6_2 --> T6_3
    T6_3 --> T6_4
    T6_4 --> T6_5
```

---

## TS-7: Prescribe Medicine

```mermaid
graph TD
    subgraph "TS-7: Prescribe Medicine"
        T7_1["T-7.1: READ Appointment
        ─────────────
        Object: Appointment + Cat + 
        MedicalRecord
        Query: appointment_id
        Initiator: Vet"]
        
        T7_2["T-7.2: READ Medicine[]
        ─────────────
        Object: Medicine
        Query: search by name/condition
        Include: ingredients, contraindications
        Initiator: Vet"]
        
        T7_3["T-7.3: READ AllergyCheck
        ─────────────
        Object: MedicalRecord × Medicine
        Query: Cross-check cat allergies 
        vs medicine contraindications
        Initiator: System"]
        
        T7_4["T-7.4: CREATE Prescription
        ─────────────
        Object: Prescription
        Fields: appointment_id, cat_id, 
        vet_id, medicine_id, dosage, 
        frequency, duration, notes
        Initiator: Vet"]
        
        T7_5["T-7.5: UPDATE PatientHistory
        ─────────────
        Object: PatientHistory
        Append: new prescription entry
        Initiator: System"]
        
        T7_6["T-7.6: CREATE Notification
        ─────────────
        Object: Notification
        Recipient: cat_owner
        Type: 'new_prescription'
        Initiator: Notification Service"]
    end

    T7_1 --> T7_2
    T7_2 --> T7_3
    T7_3 --> T7_4
    T7_4 --> T7_5
    T7_5 --> T7_6
```

---

## TS-8: Hospital Dashboard Customization

```mermaid
graph TD
    subgraph "TS-8: Customize Hospital Page"
        T8_1["T-8.1: READ HospitalPage
        ─────────────
        Object: HospitalPage
        Query: hospital_id (admin's)
        Initiator: Hospital Admin"]
        
        T8_2["T-8.2: CREATE/UPDATE Media
        ─────────────
        Object: StorageObject
        Action: Upload banner/images
        Storage: Supabase Storage
        Initiator: Hospital Admin"]
        
        T8_3["T-8.3: UPDATE HospitalPage
        ─────────────
        Object: HospitalPage
        Fields: banner_url, description,
        sections[], hours, contact,
        offers[]
        Initiator: Hospital Admin"]
        
        T8_4["T-8.4: CREATE/UPDATE Service[]
        ─────────────
        Object: Service
        Fields: name, description, price,
        duration, category
        Initiator: Hospital Admin"]
    end

    T8_1 --> T8_2
    T8_2 --> T8_3
    T8_3 --> T8_4
```

---

## TS-9: Store Management

```mermaid
graph TD
    subgraph "TS-9: Manage Store & Products"
        T9_1["T-9.1: UPDATE StorePage
        ─────────────
        Object: StorePage
        Fields: banner_url, description,
        layout, hours, delivery_zones
        Initiator: Store Owner"]
        
        T9_2["T-9.2: CREATE Product
        ─────────────
        Object: Product
        Fields: name, description, price,
        category, images[], stock,
        weight, brand
        Initiator: Store Owner"]
        
        T9_3["T-9.3: UPDATE Product
        ─────────────
        Object: Product
        Fields: price, stock, description,
        is_active
        Initiator: Store Owner"]
        
        T9_4["T-9.4: CREATE Offer
        ─────────────
        Object: Offer
        Fields: title, discount_percent,
        valid_from, valid_to,
        applicable_products[]
        Initiator: Store Owner"]

        T9_5["T-9.5: UPDATE OrderStatus
        ─────────────
        Object: Order
        Set: status (preparing→ready→completed)
        Initiator: Store Owner"]
    end

    T9_1 --> T9_2
    T9_2 --> T9_3
    T9_3 --> T9_4
    T9_4 --> T9_5
```

---

## TS-10: Admin Operations

```mermaid
graph TD
    subgraph "TS-10: Admin Management"
        T10_1["T-10.1: READ/UPDATE User
        ─────────────
        Object: User
        Actions: view, suspend, 
        change_role, delete
        Initiator: System Admin"]
        
        T10_2["T-10.2: UPDATE Vet
        ─────────────
        Object: Vet
        Actions: verify_license, 
        approve, suspend
        Initiator: System Admin"]
        
        T10_3["T-10.3: UPDATE Hospital
        ─────────────
        Object: Hospital
        Actions: approve, suspend, 
        feature
        Initiator: System Admin"]
        
        T10_4["T-10.4: CREATE/UPDATE Medicine
        ─────────────
        Object: Medicine
        Actions: add, edit, remove,
        update contraindications
        Initiator: System Admin"]

        T10_5["T-10.5: CREATE/UPDATE CatBreed
        ─────────────
        Object: CatBreed
        Actions: add breed info,
        update characteristics
        Initiator: System Admin"]

        T10_6["T-10.6: CREATE VectorEntry
        ─────────────
        Object: illness_vectors
        Actions: add/update symptom-
        solution pairs with embeddings
        Initiator: System Admin"]
    end
```

---

## Transaction Summary Table

| TS # | Use Case | # Transactions | Objects Touched | CRUD Operations |
|------|----------|---------------|----------------|-----------------|
| TS-1 | User Registration | 4 | User, UserProfile, AuthToken, Notification | C,C,C,C |
| TS-2 | Cat Registration | 4 | CatBreed, Cat, MedicalRecord, PatientHistory | R,C,C,C |
| TS-3 | Book Appointment | 7 | Hospital, Service, Vet, Slot, Payment, Appointment, Notification | R,R,R,C,C,U,C |
| TS-4 | Purchase Products | 9 | Store, Product, Cart, Payment, Order, OrderItem, Notification | R,R,C,R,C,C,C,U,C |
| TS-5 | Vet-User Chat | 5 | ChatRoom, Message, Notification | R/C,R,C,U,C |
| TS-6 | AI Consultation | 5 | Cat, Embedding, VectorMatch, Illness, AIConsultation | R,C,R,R,C |
| TS-7 | Prescribe Medicine | 6 | Appointment, Medicine, MedicalRecord, Prescription, PatientHistory, Notification | R,R,R,C,U,C |
| TS-8 | Hospital Dashboard | 4 | HospitalPage, Media, Service | R,C/U,U,C/U |
| TS-9 | Store Management | 5 | StorePage, Product, Offer, Order | U,C,U,C,U |
| TS-10 | Admin Operations | 6 | User, Vet, Hospital, Medicine, CatBreed, VectorEntry | R/U,U,U,C/U,C/U,C |
