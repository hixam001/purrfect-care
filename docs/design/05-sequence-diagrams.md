# 05 — Sequence Diagrams

> Sequence diagrams show the interactions between objects/interfaces over time for each use case. 
> Each diagram identifies the interfaces (UI, Controller, Service, Repository) involved.

---

## Interface Layers (MVC + Middleware)

| Layer | Type | Naming Convention | Example |
|-------|------|-------------------|---------|
| **Boundary (UI)** | React Component | `XxxView` / `XxxPage` | `HospitalListView` |
| **Controller** | Python REST Controller | `XxxController` | `AppointmentController` |
| **Service (Middleware)** | Business Logic | `XxxService` | `AppointmentService` |
| **Repository** | Data Access | `XxxRepository` | `AppointmentRepo` |
| **External** | 3rd Party | `XxxGateway` / `XxxClient` | `StripeGateway` |

---

## SD-1: User Registration

```mermaid
sequenceDiagram
    actor U as Cat Owner
    participant RV as RegistrationView
    participant AC as AuthController
    participant AS as AuthService
    participant UR as UserRepository
    participant SB as Supabase Auth
    participant NS as NotificationService

    U->>RV: Fill registration form
    RV->>RV: Validate input (client-side)
    RV->>AC: POST /api/auth/register {email, password, name, location}
    AC->>AC: Validate request schema
    AC->>AS: register(userData)
    AS->>SB: createUser(email, password)
    SB-->>AS: authUser {id, jwt}
    AS->>UR: createProfile(userId, name, location)
    UR->>SB: INSERT INTO users (...)
    SB-->>UR: userRecord
    UR-->>AS: userProfile
    AS->>NS: sendWelcomeEmail(email, name)
    NS-->>AS: emailQueued
    AS-->>AC: {user, token}
    AC-->>RV: 201 {user, jwt_token}
    RV->>RV: Store token in localStorage
    RV-->>U: Redirect to Dashboard
```

---

## SD-2: Cat Registration

```mermaid
sequenceDiagram
    actor U as Cat Owner
    participant CV as CatRegistrationView
    participant CC as CatController
    participant CS as CatService
    participant CR as CatRepository
    participant BR as BreedRepository
    participant MR as MedicalRecordRepo
    participant DB as Supabase

    U->>CV: Fill cat details form
    CV->>CV: Validate input
    CV->>CC: POST /api/cats {name, breed_id, age, weight, ...}
    CC->>CC: Authenticate user (JWT middleware)
    CC->>CS: registerCat(userId, catData)
    CS->>BR: findById(breed_id)
    BR->>DB: SELECT FROM cat_breeds WHERE id = ?
    DB-->>BR: breedRecord
    BR-->>CS: breed (validated)
    CS->>CR: create(catData)
    CR->>DB: INSERT INTO cats (...)
    DB-->>CR: catRecord
    CR-->>CS: cat
    CS->>MR: createInitialRecord(catId, allergies, conditions)
    MR->>DB: INSERT INTO medical_records (...)
    DB-->>MR: medicalRecord
    MR-->>CS: record
    CS-->>CC: {cat, medicalRecord}
    CC-->>CV: 201 {cat}
    CV-->>U: Show cat profile page
```

---

## SD-3: Browse Nearby Hospitals (DoorDash-style)

```mermaid
sequenceDiagram
    actor U as Cat Owner
    participant HLV as HospitalListView
    participant HC as HospitalController
    participant HS as HospitalService
    participant HR as HospitalRepository
    participant GS as GeoLocationService
    participant DB as Supabase

    U->>HLV: Click "Find Hospitals"
    HLV->>GS: getCurrentLocation()
    GS-->>HLV: {lat: 40.71, lng: -74.00}
    HLV->>HC: GET /api/hospitals/nearby?lat=40.71&lng=-74.00&radius=10
    HC->>HC: Auth middleware
    HC->>HS: findNearby(lat, lng, radius)
    HS->>HR: findByRadius(lat, lng, radius)
    HR->>DB: SELECT *, ST_Distance(location, point) as distance<br/>FROM hospitals<br/>WHERE ST_DWithin(location, point, radius)<br/>AND is_active = true<br/>ORDER BY distance
    DB-->>HR: hospitalList[]
    HR-->>HS: hospitals[]
    HS->>HS: Enrich with ratings, service counts
    HS-->>HC: enrichedHospitals[]
    HC-->>HLV: 200 {hospitals: [...], total: N}
    HLV->>HLV: Render hospital cards with distance
    HLV-->>U: Display sorted hospital list
```

---

## SD-4: Book Appointment

```mermaid
sequenceDiagram
    actor U as Cat Owner
    participant HPV as HospitalPageView
    participant BAV as BookAppointmentView
    participant APC as AppointmentController
    participant APS as AppointmentService
    participant APR as AppointmentRepository
    participant SR as SlotRepository
    participant PG as StripeGateway
    participant NS as NotificationService
    participant DB as Supabase

    U->>HPV: Select hospital
    HPV->>APC: GET /api/hospitals/{id}/details
    APC->>APS: getHospitalDetails(hospitalId)
    APS-->>APC: {hospital, services, vets, slots, offers}
    APC-->>HPV: Hospital page data
    HPV-->>U: Show hospital page

    U->>BAV: Select service, vet, slot, cat
    BAV->>APC: POST /api/appointments {hospital_id, vet_id, service_id, slot_id, cat_id}
    APC->>APC: Auth middleware
    APC->>APS: createAppointment(userId, appointmentData)
    
    APS->>SR: checkAvailability(slotId)
    SR->>DB: SELECT is_booked FROM appointment_slots WHERE id = ?
    DB-->>SR: {is_booked: false}
    SR-->>APS: slotAvailable = true
    
    APS->>PG: createPaymentIntent(amount, userId)
    PG-->>APS: {clientSecret, paymentIntentId}
    APS-->>APC: {appointmentPreview, clientSecret}
    APC-->>BAV: 200 {preview, clientSecret}
    
    BAV->>PG: confirmPayment(clientSecret, cardDetails)
    PG-->>BAV: paymentConfirmed
    
    BAV->>APC: PUT /api/appointments/{id}/confirm {payment_id}
    APC->>APS: confirmAppointment(appointmentId, paymentId)
    APS->>APR: create(appointmentData)
    APR->>DB: INSERT INTO appointments (...) 
    DB-->>APR: appointment
    APS->>SR: markBooked(slotId)
    SR->>DB: UPDATE appointment_slots SET is_booked = true
    
    APS->>NS: notifyAll([user, vet, hospital], appointmentDetails)
    NS-->>APS: notificationsSent
    APS-->>APC: confirmedAppointment
    APC-->>BAV: 200 {appointment, confirmation}
    BAV-->>U: Show confirmation page
```

---

## SD-5: Vet-User Chat

```mermaid
sequenceDiagram
    actor U as Cat Owner
    actor V as Veterinarian
    participant UCV as UserChatView
    participant VCV as VetChatView
    participant CHC as ChatController
    participant CHS as ChatService
    participant CHR as ChatRepository
    participant MR as MessageRepository
    participant RT as Supabase Realtime
    participant NS as NotificationService
    participant DB as Supabase

    U->>UCV: Open chat with vet
    UCV->>CHC: GET /api/chats?vet_id=X
    CHC->>CHS: getOrCreateChatRoom(userId, vetId)
    CHS->>CHR: findByParticipants(userId, vetId)
    CHR->>DB: SELECT FROM chat_rooms WHERE user_id=? AND vet_id=?
    DB-->>CHR: chatRoom (or null)
    alt Chat room doesn't exist
        CHS->>CHR: create(userId, vetId)
        CHR->>DB: INSERT INTO chat_rooms (...)
    end
    CHS->>MR: getMessages(chatRoomId, limit=50)
    MR->>DB: SELECT FROM messages WHERE chat_room_id=? ORDER BY sent_at DESC
    DB-->>MR: messages[]
    CHS-->>CHC: {chatRoom, messages}
    CHC-->>UCV: 200 {chatRoom, messages}
    UCV->>RT: subscribe('chat:' + chatRoomId)
    UCV-->>U: Display chat with history

    U->>UCV: Type and send message
    UCV->>CHC: POST /api/chats/{id}/messages {content, type}
    CHC->>CHS: sendMessage(chatRoomId, senderId, content)
    CHS->>MR: create(chatRoomId, senderId, content)
    MR->>DB: INSERT INTO messages (...)
    DB-->>MR: message
    CHS->>CHR: updateLastMessage(chatRoomId)
    DB->>RT: Broadcast message to channel
    RT->>VCV: New message event
    VCV-->>V: Display new message
    CHS->>NS: notifyIfOffline(recipientId, message)
    CHS-->>CHC: messageSent
    CHC-->>UCV: 201 {message}
```

---

## SD-6: AI Companion Consultation

```mermaid
sequenceDiagram
    actor U as Cat Owner
    participant AIV as AICompanionView
    participant AIC as AIController
    participant AIS as AIService
    participant EMB as EmbeddingService
    participant VDB as VectorDBRepository
    participant CR as CatRepository
    participant IR as IllnessRepository
    participant LR as ConsultationLogRepo
    participant DB as Supabase

    U->>AIV: Describe symptoms
    AIV->>AIC: POST /api/ai/consult {symptoms: "...", cat_id: "..."}
    AIC->>AIC: Auth middleware
    AIC->>AIS: consult(userId, catId, symptoms)
    
    AIS->>CR: findWithMedicalRecord(catId)
    CR->>DB: SELECT c.*, mr.* FROM cats c JOIN medical_records mr ...
    DB-->>CR: {cat, medicalRecord}
    CR-->>AIS: catContext (breed, allergies, conditions)
    
    AIS->>EMB: generateEmbedding(symptoms)
    EMB->>EMB: OpenAI API → text-embedding-3-small
    EMB-->>AIS: vector[1536]
    
    AIS->>VDB: similaritySearch(vector, limit=5)
    VDB->>DB: SELECT *, 1-(embedding <=> query_vector) as similarity<br/>FROM illness_records<br/>ORDER BY similarity DESC<br/>LIMIT 5
    DB-->>VDB: matches[] with similarity scores
    VDB-->>AIS: rankedMatches[]
    
    AIS->>IR: getDetails(matchedIllnessIds)
    IR->>DB: SELECT * FROM illness_records WHERE id IN (...)
    DB-->>IR: illnesses[]
    IR-->>AIS: illnessDetails[]
    
    AIS->>AIS: filterByBreed(illnesses, catBreed)
    AIS->>AIS: calculateSeverity(matches, catContext)
    AIS->>AIS: generateRecommendation(illnesses, catContext)
    
    AIS->>LR: logConsultation(userId, catId, query, results)
    LR->>DB: INSERT INTO ai_consultations (...)
    
    AIS-->>AIC: {illnesses[], remedies[], severity, confidence, seeVet: bool}
    AIC-->>AIV: 200 {recommendation}
    AIV->>AIV: Render results with severity indicator
    AIV-->>U: Display AI recommendations
```

---

## SD-7: Prescribe Medicine

```mermaid
sequenceDiagram
    actor V as Veterinarian
    participant APV as AppointmentDetailView
    participant RXC as PrescriptionController
    participant RXS as PrescriptionService
    participant MED as MedicineRepository
    participant MRC as MedicalRecordRepo
    participant RXR as PrescriptionRepository
    participant PHR as PatientHistoryRepo
    participant NS as NotificationService
    participant DB as Supabase

    V->>APV: Open appointment details
    APV->>RXC: GET /api/appointments/{id}/context
    RXC->>RXS: getAppointmentContext(appointmentId)
    RXS-->>RXC: {appointment, cat, medicalRecord, history}
    RXC-->>APV: Full context
    APV-->>V: Show patient info + history

    V->>APV: Search medicines
    APV->>RXC: GET /api/medicines?search=amoxicillin
    RXC->>MED: search("amoxicillin")
    MED->>DB: SELECT * FROM medicines WHERE name ILIKE '%amoxicillin%'
    DB-->>MED: medicines[]
    MED-->>RXC: matchingMedicines
    RXC-->>APV: Medicine options
    APV-->>V: Show medicines with details

    V->>APV: Select medicine, set dosage
    APV->>RXC: POST /api/prescriptions {appointment_id, medicine_id, dosage, frequency, duration}
    RXC->>RXC: Auth middleware (vet role check)
    RXC->>RXS: prescribe(vetId, prescriptionData)
    
    RXS->>MRC: getCatAllergies(catId)
    MRC->>DB: SELECT allergies FROM medical_records WHERE cat_id = ?
    DB-->>MRC: allergies[]
    RXS->>MED: getContraindications(medicineId)
    MED->>DB: SELECT contraindications, allergy_warnings FROM medicines WHERE id = ?
    DB-->>MED: warnings
    
    RXS->>RXS: checkContraindications(allergies, warnings)
    alt Contraindication Found
        RXS-->>RXC: {warning: "Cat allergic to penicillin", proceed: false}
        RXC-->>APV: 409 {conflict: allergyWarning}
        APV-->>V: ⚠️ Allergy warning displayed
    else Safe to Prescribe
        RXS->>RXR: create(prescriptionData)
        RXR->>DB: INSERT INTO prescriptions (...)
        DB-->>RXR: prescription
        RXS->>PHR: addEntry(catId, "prescription", prescriptionId)
        PHR->>DB: INSERT INTO patient_history (...)
        RXS->>NS: notifyOwner(catOwnerId, prescriptionDetails)
        NS-->>RXS: notified
        RXS-->>RXC: prescription
        RXC-->>APV: 201 {prescription}
        APV-->>V: Prescription confirmed ✓
    end
```

---

## SD-8: Purchase Products (Cat Store)

```mermaid
sequenceDiagram
    actor U as Cat Owner
    participant SLV as StoreListView
    participant SPV as StorePageView
    participant CTV as CartView
    participant OC as OrderController
    participant OS as OrderService
    participant OR as OrderRepository
    participant PR as ProductRepository
    participant PG as StripeGateway
    participant NS as NotificationService
    participant GS as GeoLocationService
    participant DB as Supabase

    U->>SLV: Click "Cat Stores"
    SLV->>GS: getLocation()
    GS-->>SLV: {lat, lng}
    SLV->>OC: GET /api/stores/nearby?lat=X&lng=Y
    OC->>OS: findNearbyStores(lat, lng)
    OS-->>OC: stores[]
    OC-->>SLV: Store list
    SLV-->>U: Display store cards

    U->>SPV: Select store
    SPV->>OC: GET /api/stores/{id}
    OC->>OS: getStoreDetails(storeId)
    OS-->>OC: {store, products, categories, offers}
    OC-->>SPV: Store page data
    SPV-->>U: Show store page with products

    U->>CTV: Add items, proceed to checkout
    CTV->>OC: POST /api/orders {store_id, items[], delivery_address}
    OC->>OC: Auth middleware
    OC->>OS: createOrder(userId, orderData)
    OS->>PR: validateStock(items[])
    PR->>DB: SELECT id, stock FROM products WHERE id IN (...)
    DB-->>PR: stockLevels[]
    PR-->>OS: allInStock = true
    
    OS->>OS: calculateTotal(items, deliveryFee)
    OS->>PG: createPaymentIntent(total)
    PG-->>OS: {clientSecret}
    OS-->>OC: {orderPreview, clientSecret}
    OC-->>CTV: 200 {preview}

    CTV->>PG: confirmPayment(clientSecret)
    PG-->>CTV: confirmed
    CTV->>OC: PUT /api/orders/{id}/confirm {payment_id}
    OC->>OS: confirmOrder(orderId, paymentId)
    OS->>OR: create(orderData)
    OR->>DB: INSERT INTO orders (...) + INSERT INTO order_items (...)
    OS->>PR: decrementStock(items[])
    PR->>DB: UPDATE products SET stock = stock - qty WHERE ...
    OS->>NS: notifyParties(userId, storeOwnerId, orderDetails)
    OS-->>OC: confirmedOrder
    OC-->>CTV: 200 {order}
    CTV-->>U: Order confirmation + tracking
```

---

## SD-9: Hospital Dashboard Customization

```mermaid
sequenceDiagram
    actor HA as Hospital Admin
    participant HDV as HospitalDashboardView
    participant HC as HospitalController
    participant HS as HospitalService
    participant HR as HospitalRepository
    participant SS as StorageService
    participant DB as Supabase

    HA->>HDV: Open Dashboard → "Customize Page"
    HDV->>HC: GET /api/hospitals/my-hospital
    HC->>HC: Auth middleware (hospital_admin role)
    HC->>HS: getMyHospital(adminUserId)
    HS->>HR: findByAdmin(adminUserId)
    HR->>DB: SELECT * FROM hospitals WHERE admin_user_id = ?
    DB-->>HR: hospital
    HR-->>HS: hospitalData
    HS-->>HC: {hospital, pageConfig, services}
    HC-->>HDV: 200 {dashboardData}
    HDV-->>HA: Show page editor

    HA->>HDV: Upload banner, edit sections
    HDV->>SS: uploadImage(file)
    SS->>DB: Upload to Supabase Storage bucket
    DB-->>SS: publicUrl
    SS-->>HDV: imageUrl

    HA->>HDV: Save changes
    HDV->>HC: PUT /api/hospitals/{id}/page {banner_url, description, sections, hours, offers}
    HC->>HS: updatePage(hospitalId, pageData)
    HS->>HR: updatePageConfig(hospitalId, pageData)
    HR->>DB: UPDATE hospitals SET page_config = ?, banner_url = ?, ... WHERE id = ?
    DB-->>HR: updated
    HR-->>HS: updatedHospital
    HS-->>HC: success
    HC-->>HDV: 200 {hospital}
    HDV-->>HA: "Changes published! ✓"
```

---

## SD-10: Admin — Manage Medicine Database

```mermaid
sequenceDiagram
    actor A as System Admin
    participant AMV as AdminMedicineView
    participant MC as MedicineController
    participant MS as MedicineService
    participant MR as MedicineRepository
    participant ES as EmbeddingService
    participant VR as VectorRepository
    participant DB as Supabase

    A->>AMV: Open Medicine Management
    AMV->>MC: GET /api/admin/medicines?page=1
    MC->>MC: Auth middleware (admin role)
    MC->>MS: listMedicines(page, limit)
    MS->>MR: findAll(page, limit)
    MR->>DB: SELECT * FROM medicines ORDER BY name LIMIT ? OFFSET ?
    DB-->>MR: medicines[]
    MR-->>MS: paginatedList
    MS-->>MC: {medicines, total, page}
    MC-->>AMV: 200 {data}
    AMV-->>A: Show medicine table

    A->>AMV: Click "Add Medicine" → Fill form
    AMV->>MC: POST /api/admin/medicines {name, ingredients, contraindications, ...}
    MC->>MS: createMedicine(medicineData)
    MS->>MR: create(medicineData)
    MR->>DB: INSERT INTO medicines (...)
    DB-->>MR: medicine
    
    MS->>ES: generateEmbedding(name + description + uses)
    ES-->>MS: vector[1536]
    MS->>VR: storeVector(medicineId, vector)
    VR->>DB: UPDATE medicines SET embedding = ? WHERE id = ?
    DB-->>VR: stored
    
    MS-->>MC: {medicine, vectorStored: true}
    MC-->>AMV: 201 {medicine}
    AMV-->>A: Medicine added to list ✓
```

---

## Interfaces Identified (Summary)

### Boundary Interfaces (React Views)
| Interface | Used In |
|-----------|---------|
| `RegistrationView` | SD-1 |
| `CatRegistrationView` | SD-2 |
| `HospitalListView` | SD-3 |
| `HospitalPageView` | SD-4 |
| `BookAppointmentView` | SD-4 |
| `UserChatView` | SD-5 |
| `VetChatView` | SD-5 |
| `AICompanionView` | SD-6 |
| `AppointmentDetailView` | SD-7 |
| `StoreListView` | SD-8 |
| `StorePageView` | SD-8 |
| `CartView` | SD-8 |
| `HospitalDashboardView` | SD-9 |
| `AdminMedicineView` | SD-10 |

### Controller Interfaces (Python REST)
| Interface | Used In |
|-----------|---------|
| `AuthController` | SD-1 |
| `CatController` | SD-2 |
| `HospitalController` | SD-3, SD-9 |
| `AppointmentController` | SD-4 |
| `ChatController` | SD-5 |
| `AIController` | SD-6 |
| `PrescriptionController` | SD-7 |
| `OrderController` | SD-8 |
| `MedicineController` | SD-10 |

### Service Interfaces (Business Logic / Middleware)
| Interface | Used In |
|-----------|---------|
| `AuthService` | SD-1 |
| `CatService` | SD-2 |
| `HospitalService` | SD-3, SD-9 |
| `AppointmentService` | SD-4 |
| `ChatService` | SD-5 |
| `AIService` | SD-6 |
| `EmbeddingService` | SD-6, SD-10 |
| `PrescriptionService` | SD-7 |
| `OrderService` | SD-8 |
| `MedicineService` | SD-10 |
| `NotificationService` | SD-1, SD-4, SD-5, SD-7, SD-8 |
| `GeoLocationService` | SD-3, SD-8 |
| `StorageService` | SD-9 |

### Repository Interfaces (Data Access)
| Interface | Used In |
|-----------|---------|
| `UserRepository` | SD-1 |
| `CatRepository` | SD-2, SD-6 |
| `BreedRepository` | SD-2 |
| `MedicalRecordRepo` | SD-2, SD-7 |
| `HospitalRepository` | SD-3, SD-9 |
| `AppointmentRepository` | SD-4 |
| `SlotRepository` | SD-4 |
| `ChatRepository` | SD-5 |
| `MessageRepository` | SD-5 |
| `IllnessRepository` | SD-6 |
| `VectorDBRepository` | SD-6 |
| `ConsultationLogRepo` | SD-6 |
| `PrescriptionRepository` | SD-7 |
| `PatientHistoryRepo` | SD-7 |
| `OrderRepository` | SD-8 |
| `ProductRepository` | SD-8 |
| `MedicineRepository` | SD-10 |
| `VectorRepository` | SD-10 |

### External Gateway Interfaces
| Interface | Used In |
|-----------|---------|
| `StripeGateway` | SD-4, SD-8 |
| `Supabase Auth` | SD-1 |
| `Supabase Realtime` | SD-5 |
| `Supabase Storage` | SD-9 |
