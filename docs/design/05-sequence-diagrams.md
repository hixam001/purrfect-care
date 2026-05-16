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

## SD-11: Store Dashboard Customization

```mermaid
sequenceDiagram
    actor SO as Store Owner
    participant SDV as StoreDashboardView
    participant SC as StoreController
    participant SS as StoreService
    participant SR as StoreRepository
    participant PR as ProductRepository
    participant PCR as ProductCategoryRepo
    participant STG as StorageService
    participant DB as Supabase

    SO->>SDV: Open Dashboard → "Customize Store Page"
    SDV->>SC: GET /api/stores/my-store
    SC->>SC: Auth middleware (store_owner role)
    SC->>SS: getMyStore(ownerUserId)
    SS->>SR: findByOwner(ownerUserId)
    SR->>DB: SELECT * FROM cat_stores WHERE owner_user_id = ?
    DB-->>SR: store
    SS->>PR: findByStore(storeId)
    PR->>DB: SELECT * FROM products WHERE store_id = ?
    DB-->>PR: products[]
    SS->>PCR: findAll()
    PCR->>DB: SELECT * FROM product_categories ORDER BY sort_order
    DB-->>PCR: categories[]
    SS-->>SC: {store, products, categories, pageConfig}
    SC-->>SDV: 200 {dashboardData}
    SDV-->>SO: Show store page editor

    SO->>SDV: Upload banner image
    SDV->>STG: uploadImage(file, "store-assets")
    STG->>DB: Upload to Supabase Storage bucket
    DB-->>STG: publicUrl
    STG-->>SDV: bannerUrl

    SO->>SDV: Add/edit product
    SDV->>SC: POST /api/stores/{id}/products {name, price, stock, category_id, images}
    SC->>SS: createProduct(storeId, productData)
    SS->>PR: create(productData)
    PR->>DB: INSERT INTO products (...)
    DB-->>PR: product
    SS-->>SC: product
    SC-->>SDV: 201 {product}

    SO->>SDV: Update delivery zones & fee
    SO->>SDV: Save all page changes
    SDV->>SC: PUT /api/stores/{id}/page {banner_url, page_config, delivery_zones, delivery_fee, hours}
    SC->>SS: updateStorePage(storeId, pageData)
    SS->>SR: updatePageConfig(storeId, pageData)
    SR->>DB: UPDATE cat_stores SET page_config=?, banner_url=?, delivery_zones=?, delivery_fee=? WHERE id=?
    DB-->>SR: updated
    SR-->>SS: updatedStore
    SS-->>SC: success
    SC-->>SDV: 200 {store}
    SDV-->>SO: "Store page is live! ✓"
```

---

## SD-12: Review & Rating

```mermaid
sequenceDiagram
    actor U as Cat Owner
    actor BO as Business Owner
    participant RV as ReviewView
    participant BOD as BusinessDashboard
    participant RC as ReviewController
    participant RS as ReviewService
    participant RR as ReviewRepository
    participant NS as NotificationService
    participant DB as Supabase

    U->>RV: Open review form (after appointment/order)
    U->>RV: Set rating (1-5) + write comment
    RV->>RC: POST /api/reviews {target_type, target_id, rating, comment}
    RC->>RC: Auth middleware
    RC->>RS: createReview(userId, reviewData)
    RS->>RS: Verify user had appointment/order with target
    RS->>RR: create(reviewData)
    RR->>DB: INSERT INTO reviews (user_id, hospital_id/store_id/vet_id, rating, comment)
    DB-->>RR: review
    RS->>RR: recalculateRating(targetType, targetId)
    RR->>DB: UPDATE hospitals/cat_stores/vets SET rating=AVG(reviews.rating), total_reviews=COUNT(*)
    DB-->>RR: updated
    RS->>NS: notifyBusinessOwner(targetOwnerId, reviewSummary)
    NS-->>RS: notified
    RS-->>RC: review
    RC-->>RV: 201 {review}
    RV-->>U: "Thanks for your review! ✓"

    Note over BO,BOD: Business responds to review
    BO->>BOD: View review in dashboard
    BOD->>RC: GET /api/reviews?target_id=X
    RC->>RS: getReviewsForTarget(targetType, targetId)
    RS->>RR: findByTarget(targetType, targetId)
    RR->>DB: SELECT r.*, rr.* FROM reviews r LEFT JOIN review_responses rr ON r.id=rr.review_id WHERE target_id=?
    DB-->>RR: reviews[]
    RS-->>RC: reviews
    RC-->>BOD: 200 {reviews}
    BOD-->>BO: Show reviews list

    BO->>BOD: Write response to review
    BOD->>RC: POST /api/reviews/{id}/respond {response_text}
    RC->>RS: respondToReview(reviewId, responderId, responseText)
    RS->>RR: createResponse(reviewId, responderId, responseText)
    RR->>DB: INSERT INTO review_responses (review_id, responder_id, response_text)
    DB-->>RR: reviewResponse
    RS->>NS: notifyReviewer(reviewerUserId, "Business responded")
    NS-->>RS: notified
    RS-->>RC: reviewResponse
    RC-->>BOD: 201 {response}
    BOD-->>BO: "Response published ✓"
```

---

## SD-13: Offer/Promotion Management

```mermaid
sequenceDiagram
    actor HA as Hospital Admin / Store Owner
    participant OFV as OfferManagerView
    participant OFC as OfferController
    participant OFS as OfferService
    participant OFR as OfferRepository
    participant DB as Supabase

    HA->>OFV: Open Offer Manager
    OFV->>OFC: GET /api/offers?owner_id=X
    OFC->>OFC: Auth middleware (hospital_admin / store_owner)
    OFC->>OFS: getOffersByOwner(userId, targetType)
    OFS->>OFR: findByOwner(hospitalId or storeId)
    OFR->>DB: SELECT * FROM offers WHERE hospital_id=? OR store_id=? ORDER BY valid_from DESC
    DB-->>OFR: offers[]
    OFS-->>OFC: offers
    OFC-->>OFV: 200 {offers}
    OFV-->>HA: Show offers list (active/expired)

    HA->>OFV: Click "Create Offer" → Fill form
    OFV->>OFC: POST /api/offers {title, description, discount_percent, promo_code, valid_from, valid_to, applicable_items[]}
    OFC->>OFS: createOffer(ownerId, offerData)
    OFS->>OFS: Validate date range (valid_from < valid_to)
    OFS->>OFR: create(offerData)
    OFR->>DB: INSERT INTO offers (...)
    DB-->>OFR: offer
    OFS-->>OFC: offer
    OFC-->>OFV: 201 {offer}
    OFV-->>HA: "Offer created! ✓"

    HA->>OFV: Toggle offer active/inactive
    OFV->>OFC: PATCH /api/offers/{id} {is_active: false}
    OFC->>OFS: updateOffer(offerId, {is_active: false})
    OFS->>OFR: update(offerId, data)
    OFR->>DB: UPDATE offers SET is_active=? WHERE id=?
    DB-->>OFR: updated
    OFS-->>OFC: updatedOffer
    OFC-->>OFV: 200 {offer}
    OFV-->>HA: Offer deactivated
```

---

## SD-14: Order Fulfillment (Store Owner)

```mermaid
sequenceDiagram
    actor SO as Store Owner
    actor U as Cat Owner
    participant SOV as StoreOrderView
    participant OC as OrderController
    participant OS as OrderService
    participant OR as OrderRepository
    participant PG as StripeGateway
    participant NS as NotificationService
    participant RT as Supabase Realtime
    participant DB as Supabase

    Note over RT,SOV: New order placed by customer
    RT->>SOV: Real-time event: new_order
    SOV-->>SO: 🔔 "New order received!"

    SO->>SOV: View order details
    SOV->>OC: GET /api/orders/{id}
    OC->>OS: getOrderDetails(orderId)
    OS->>OR: findById(orderId)
    OR->>DB: SELECT o.*, oi.*, p.name FROM orders o JOIN order_items oi JOIN products p WHERE o.id=?
    DB-->>OR: {order, items[]}
    OS-->>OC: orderDetails
    OC-->>SOV: 200 {order, items, customer}
    SOV-->>SO: Show order (items, qty, address, notes)

    SO->>SOV: Click "Accept Order"
    SOV->>OC: PUT /api/orders/{id}/status {status: "preparing"}
    OC->>OC: Auth middleware (store_owner)
    OC->>OS: updateOrderStatus(orderId, "preparing")
    OS->>OR: updateStatus(orderId, "preparing")
    OR->>DB: UPDATE orders SET status='preparing', updated_at=now()
    DB-->>OR: updated
    OS->>NS: notifyCustomer(userId, "Your order is being prepared")
    NS-->>OS: sent
    OS-->>OC: updatedOrder
    OC-->>SOV: 200 {order}

    SO->>SOV: Click "Ready for Pickup/Delivery"
    SOV->>OC: PUT /api/orders/{id}/status {status: "ready"}
    OC->>OS: updateOrderStatus(orderId, "ready")
    OS->>OR: updateStatus(orderId, "ready")
    OR->>DB: UPDATE orders SET status='ready'
    OS->>NS: notifyCustomer(userId, "Your order is ready!")
    OS-->>OC: updatedOrder
    OC-->>SOV: 200 {order}

    SO->>SOV: Click "Completed"
    SOV->>OC: PUT /api/orders/{id}/status {status: "delivered"}
    OC->>OS: updateOrderStatus(orderId, "delivered")
    OS->>OR: updateStatus(orderId, "delivered")
    OR->>DB: UPDATE orders SET status='delivered', delivered_at=now()
    OS->>NS: notifyCustomer(userId, "Order delivered! Rate your experience")
    OS-->>OC: updatedOrder
    OC-->>SOV: 200 {order}
    SOV-->>SO: Order completed ✓

    alt Store Owner Rejects Order
        SO->>SOV: Click "Reject Order" + reason
        SOV->>OC: PUT /api/orders/{id}/status {status: "cancelled", reason: "..."}
        OC->>OS: cancelOrder(orderId, reason)
        OS->>OR: updateStatus(orderId, "cancelled")
        OR->>DB: UPDATE orders SET status='cancelled'
        OS->>PG: refundPayment(paymentId)
        PG-->>OS: refunded
        OS->>NS: notifyCustomer(userId, "Order cancelled. Refund issued.")
        OS-->>OC: cancelledOrder
        OC-->>SOV: 200 {order, refund}
        SOV-->>SO: Order cancelled + refund processed
    end
```

---

## SD-15: Admin Management Operations

```mermaid
sequenceDiagram
    actor A as System Admin
    participant ADV as AdminDashboardView
    participant ADC as AdminController
    participant ADS as AdminService
    participant UR as UserRepository
    participant VR as VetRepository
    participant HR as HospitalRepository
    participant STR as StoreRepository
    participant NS as NotificationService
    participant DB as Supabase

    A->>ADV: Open Admin Dashboard
    ADV->>ADC: GET /api/admin/dashboard
    ADC->>ADC: Auth middleware (admin role)
    ADC->>ADS: getDashboardStats()
    ADS->>DB: SELECT COUNT(*) FROM users/vets/hospitals/cat_stores grouped by status
    DB-->>ADS: stats
    ADS-->>ADC: {totalUsers, pendingVets, pendingHospitals, pendingStores}
    ADC-->>ADV: 200 {dashboard}
    ADV-->>A: Show admin KPIs + pending approvals

    Note over A,ADV: Vet Verification Flow
    A->>ADV: Click "Pending Vets"
    ADV->>ADC: GET /api/admin/vets?status=unverified
    ADC->>ADS: getPendingVets()
    ADS->>VR: findUnverified()
    VR->>DB: SELECT v.*, u.name, u.email FROM vets v JOIN users u WHERE v.is_verified=false
    DB-->>VR: pendingVets[]
    ADS-->>ADC: vets
    ADC-->>ADV: 200 {vets}
    ADV-->>A: Show pending vet list with documents

    A->>ADV: Click "Approve" on a vet
    ADV->>ADC: PUT /api/admin/vets/{id}/verify {action: "approve"}
    ADC->>ADS: verifyVet(vetId, "approve")
    ADS->>VR: update(vetId, {is_verified: true, verified_at: now()})
    VR->>DB: UPDATE vets SET is_verified=true, verified_at=now() WHERE id=?
    DB-->>VR: updated
    ADS->>NS: notifyVet(vetUserId, "Your profile has been verified!")
    NS-->>ADS: sent
    ADS-->>ADC: verifiedVet
    ADC-->>ADV: 200 {vet}
    ADV-->>A: Vet verified ✓

    Note over A,ADV: Hospital Approval Flow
    A->>ADV: Review pending hospital
    ADV->>ADC: PUT /api/admin/hospitals/{id}/approve {action: "approve"}
    ADC->>ADS: approveHospital(hospitalId, "approve")
    ADS->>HR: update(hospitalId, {is_approved: true})
    HR->>DB: UPDATE hospitals SET is_approved=true WHERE id=?
    ADS->>NS: notifyHospitalAdmin(adminUserId, "Hospital approved!")
    ADS-->>ADC: approvedHospital
    ADC-->>ADV: 200 {hospital}

    Note over A,ADV: Store Approval Flow
    A->>ADV: Review pending store
    ADV->>ADC: PUT /api/admin/stores/{id}/approve {action: "approve"}
    ADC->>ADS: approveStore(storeId, "approve")
    ADS->>STR: update(storeId, {is_approved: true})
    STR->>DB: UPDATE cat_stores SET is_approved=true WHERE id=?
    ADS->>NS: notifyStoreOwner(ownerUserId, "Store approved!")
    ADS-->>ADC: approvedStore
    ADC-->>ADV: 200 {store}

    Note over A,ADV: User Suspension Flow
    A->>ADV: Click "Suspend" on user
    ADV->>ADC: PUT /api/admin/users/{id}/suspend {reason: "..."}
    ADC->>ADS: suspendUser(userId, reason)
    ADS->>UR: update(userId, {is_active: false})
    UR->>DB: UPDATE users SET is_active=false WHERE id=?
    ADS->>NS: notifyUser(userId, "Account suspended: " + reason)
    ADS-->>ADC: suspended
    ADC-->>ADV: 200 {user}
    ADV-->>A: User suspended
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
| `StoreDashboardView` | SD-11 |
| `ReviewView` | SD-12 |
| `BusinessDashboard` | SD-12 |
| `OfferManagerView` | SD-13 |
| `StoreOrderView` | SD-14 |
| `AdminDashboardView` | SD-15 |

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
| `OrderController` | SD-8, SD-14 |
| `MedicineController` | SD-10 |
| `StoreController` | SD-11 |
| `ReviewController` | SD-12 |
| `OfferController` | SD-13 |
| `AdminController` | SD-15 |

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
| `OrderService` | SD-8, SD-14 |
| `MedicineService` | SD-10 |
| `StoreService` | SD-11 |
| `ReviewService` | SD-12 |
| `OfferService` | SD-13 |
| `AdminService` | SD-15 |
| `NotificationService` | SD-1, SD-4, SD-5, SD-7, SD-8, SD-12, SD-14, SD-15 |
| `GeoLocationService` | SD-3, SD-8 |
| `StorageService` | SD-9, SD-11 |

### Repository Interfaces (Data Access)
| Interface | Used In |
|-----------|---------|
| `UserRepository` | SD-1, SD-15 |
| `CatRepository` | SD-2, SD-6 |
| `BreedRepository` | SD-2 |
| `MedicalRecordRepo` | SD-2, SD-7 |
| `HospitalRepository` | SD-3, SD-9, SD-15 |
| `AppointmentRepository` | SD-4 |
| `SlotRepository` | SD-4 |
| `ChatRepository` | SD-5 |
| `MessageRepository` | SD-5 |
| `IllnessRepository` | SD-6 |
| `VectorDBRepository` | SD-6 |
| `ConsultationLogRepo` | SD-6 |
| `PrescriptionRepository` | SD-7 |
| `PatientHistoryRepo` | SD-7 |
| `OrderRepository` | SD-8, SD-14 |
| `ProductRepository` | SD-8, SD-11 |
| `MedicineRepository` | SD-10 |
| `VectorRepository` | SD-10 |
| `StoreRepository` | SD-11, SD-15 |
| `ProductCategoryRepo` | SD-11 |
| `ReviewRepository` | SD-12 |
| `OfferRepository` | SD-13 |
| `VetRepository` | SD-15 |

### External Gateway Interfaces
| Interface | Used In |
|-----------|---------|
| `StripeGateway` | SD-4, SD-8, SD-14 |
| `Supabase Auth` | SD-1 |
| `Supabase Realtime` | SD-5, SD-14 |
| `Supabase Storage` | SD-9, SD-11 |

---

## SD ↔ TS Cross-Reference

| SD # | Sequence Diagram | Transaction Set |
|------|-----------------|----------------|
| SD-1 | User Registration | TS-1 |
| SD-2 | Cat Registration | TS-2 |
| SD-3 | Browse Nearby Hospitals | TS-3 (part 1) |
| SD-4 | Book Appointment | TS-3 (part 2) |
| SD-5 | Vet-User Chat | TS-5 |
| SD-6 | AI Consultation | TS-7 |
| SD-7 | Prescribe Medicine | TS-6 |
| SD-8 | Purchase Products | TS-4 |
| SD-9 | Hospital Dashboard | TS-8 |
| SD-10 | Manage Medicine DB | TS-13 (medicines) |
| SD-11 | Store Dashboard | TS-9 |
| SD-12 | Review & Rating | TS-10 |
| SD-13 | Offer Management | TS-11 |
| SD-14 | Order Fulfillment | TS-12 |
| SD-15 | Admin Operations | TS-13 (users/vets/hospitals/stores) |
