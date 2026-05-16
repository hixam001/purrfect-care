# 02 — Swimlane / Workflow Diagrams

> **Swimlane diagrams** (also called workflow diagrams) are **activity diagrams** where activities are organized into **lanes** — one per actor/role. They show the **flow of work** across actors using activities, decisions, forks, joins, and transitions.
>
> **How to render**: Use [PlantUML Online](https://www.plantuml.com/plantuml/uml) for the PlantUML code, or [Mermaid Live](https://mermaid.live) for the Mermaid code.

---

## Swimlane 1: User Registration & Cat Registration

### PlantUML (True Swimlane)

```plantuml
@startuml
|Cat Owner|
start
:Opens Registration Page;
:Fills registration form
(email, password, name, phone, location);
:Submits form;

|System (Backend)|
:Validates input data;
if (Valid?) then (yes)
    :Hash password;
    |Supabase|
    :Create user in auth.users;
    :Generate UUID;
    :Insert profile into users table;
    |System (Backend)|
    :Generate JWT token;
    |Notification Service|
    :Send welcome email;
    |Cat Owner|
    :Receives welcome email;
    :Redirected to Dashboard;
else (no)
    |System (Backend)|
    :Return validation errors;
    |Cat Owner|
    :Shows error messages;
    :Correct and resubmit;
endif

:Clicks "Register Cat";
:Fills cat details
(name, breed, age, weight, 
color, photo, medical history);
:Submits cat form;

|System (Backend)|
:Validate cat data;
|Supabase|
:Validate breed_id exists in cat_breeds;
if (Breed valid?) then (yes)
    :INSERT into cats table;
    :INSERT into medical_records
    (allergies, conditions, vaccination);
    :INSERT into patient_history
    (initial entry);
    |Cat Owner|
    :Cat profile displayed;
else (no)
    |System (Backend)|
    :Return "Invalid breed" error;
    |Cat Owner|
    :Select valid breed;
endif
stop
@enduml
```

### Mermaid (Flowchart with Subgraphs as Lanes)

```mermaid
flowchart LR
    subgraph CatOwner["🐱 Cat Owner"]
        A1([Start]) --> A2[Open Registration Page]
        A2 --> A3[Fill form: email, password, name, location]
        A3 --> A4[Submit]
    end

    subgraph Backend["⚙️ System Backend"]
        A4 --> B1{Valid input?}
        B1 -->|No| B2[Return errors]
        B2 --> A3
        B1 -->|Yes| B3[Hash password]
    end

    subgraph Supabase["🗄️ Supabase"]
        B3 --> C1[Create user in auth.users]
        C1 --> C2[Insert profile into users table]
    end

    subgraph Backend2["⚙️ System Backend"]
        C2 --> B4[Generate JWT token]
    end

    subgraph NotifSvc["📧 Notification Service"]
        B4 --> N1[Send welcome email]
    end

    subgraph CatOwner2["🐱 Cat Owner"]
        N1 --> A5[Receive welcome email]
        B4 --> A6[Redirected to Dashboard]
        A6 --> A7[Click Register Cat]
        A7 --> A8[Fill cat details: name, breed, age, weight]
        A8 --> A9[Submit]
    end

    subgraph Backend3["⚙️ System Backend"]
        A9 --> B5{Breed valid?}
        B5 -->|No| B6[Return breed error]
        B6 --> A8
    end

    subgraph Supabase2["🗄️ Supabase"]
        B5 -->|Yes| C3[INSERT into cats]
        C3 --> C4[INSERT into medical_records]
        C4 --> C5[INSERT into patient_history]
    end

    subgraph CatOwner3["🐱 Cat Owner"]
        C5 --> A10[Cat profile displayed]
        A10 --> A11([End])
    end
```

---

## Swimlane 2: Book Appointment (DoorDash-style)

### PlantUML (True Swimlane)

```plantuml
@startuml
|Cat Owner|
start
:Clicks "Find Hospitals";

|Location Service|
:Get user geolocation;
:Return lat/lng coordinates;

|System (Backend)|
:Query hospitals within radius
(PostGIS: ST_DWithin);

|Supabase|
:SELECT hospitals 
WHERE ST_DWithin(location, point, radius)
AND is_active = true
AND is_approved = true
ORDER BY distance;
:Return hospital list with 
ratings, services, distance;

|Cat Owner|
:Views hospital cards 
sorted by distance;
:Selects a hospital;

|System (Backend)|
:Fetch hospital details;

|Supabase|
:SELECT hospital details,
services, vets, available slots, 
offers, reviews;

|Cat Owner|
:Views hospital page 
(DoorDash-style layout);
:Selects service type 
(checkup / vaccination / treatment);
:Selects preferred vet;
:Selects available time slot;
:Selects which cat;
:Reviews appointment summary;
:Clicks "Book & Pay";

|System (Backend)|
:Check slot still available;

|Supabase|
:SELECT is_booked FROM 
appointment_slots WHERE id = ?;

if (Slot available?) then (yes)
    |Payment Gateway (Stripe)|
    :Create payment intent;
    :Return client_secret;
    
    |Cat Owner|
    :Enter payment details;
    :Confirm payment;
    
    |Payment Gateway (Stripe)|
    if (Payment success?) then (yes)
        :Return payment confirmation;
        
        |System (Backend)|
        :Create Appointment record;
        
        |Supabase|
        :INSERT into appointments;
        :UPDATE appointment_slots 
        SET is_booked = true;
        :INSERT into payments;
        
        |Notification Service|
        fork
            :Notify Cat Owner 
            (email + push);
        fork again
            :Notify Vet 
            (push);
        fork again
            :Notify Hospital 
            (dashboard alert);
        end fork
        
        |Cat Owner|
        :Views confirmation page
        with appointment details;
    else (no)
        |Cat Owner|
        :Payment failed message;
        :Retry or change payment method;
    endif
else (no)
    |System (Backend)|
    :Slot no longer available;
    |Cat Owner|
    :Show alternative slots;
    :Select different slot;
endif
stop
@enduml
```

### Mermaid (Flowchart with Subgraphs as Lanes)

```mermaid
flowchart TD
    subgraph Owner["🐱 Cat Owner"]
        A1([Start]) --> A2[Click Find Hospitals]
    end

    subgraph Location["📍 Location Service"]
        A2 --> L1[Get user geolocation]
        L1 --> L2[Return lat/lng]
    end

    subgraph Backend["⚙️ Backend"]
        L2 --> B1[Query hospitals within radius via PostGIS]
    end

    subgraph DB["🗄️ Supabase"]
        B1 --> D1[SELECT nearby hospitals ORDER BY distance]
    end

    subgraph Owner2["🐱 Cat Owner"]
        D1 --> A3[View hospital cards sorted by distance]
        A3 --> A4[Select a hospital]
        A4 --> A5[View hospital page with services/vets/offers]
        A5 --> A6[Select service + vet + slot + cat]
        A6 --> A7[Click Book and Pay]
    end

    subgraph Backend2["⚙️ Backend"]
        A7 --> B2{Slot still available?}
        B2 -->|No| B3[Return alternative slots]
        B3 --> A6
    end

    subgraph Stripe["💳 Stripe"]
        B2 -->|Yes| S1[Create payment intent]
    end

    subgraph Owner3["🐱 Cat Owner"]
        S1 --> A8[Enter payment details]
        A8 --> A9[Confirm payment]
    end

    subgraph Stripe2["💳 Stripe"]
        A9 --> S2{Payment success?}
        S2 -->|No| S3[Payment failed]
        S3 --> A8
    end

    subgraph DB2["🗄️ Supabase"]
        S2 -->|Yes| D2[INSERT appointment]
        D2 --> D3[UPDATE slot = booked]
        D3 --> D4[INSERT payment record]
    end

    subgraph Notif["📧 Notifications"]
        D4 --> N1[Notify owner + vet + hospital]
    end

    subgraph Owner4["🐱 Cat Owner"]
        N1 --> A10[View confirmation page]
        A10 --> A11([End])
    end
```

---

## Swimlane 3: Purchase Products (Cat Store — DoorDash-style)

### PlantUML (True Swimlane)

```plantuml
@startuml
|Cat Owner|
start
:Clicks "Cat Stores";

|Location Service|
:Get user geolocation;
:Return lat/lng;

|System (Backend)|
:Query nearby stores 
(PostGIS radius search);

|Supabase|
:SELECT stores 
WHERE ST_DWithin(...)
AND is_open = true
ORDER BY distance;

|Cat Owner|
:Views store cards 
sorted by distance;
:Selects a store;

|System (Backend)|
:Fetch store details;

|Supabase|
:SELECT store page config,
products, categories, offers;

|Cat Owner|
:Views store page 
(DoorDash-style layout);
:Browses products by category;
:Adds items to cart;
:Reviews cart 
(items, quantities, subtotal);
:Clicks "Checkout";
:Enters delivery address;

|System (Backend)|
:Validate all items in stock;

|Supabase|
:SELECT stock_quantity 
FROM products WHERE id IN (...);

if (All items in stock?) then (yes)
    |System (Backend)|
    :Calculate subtotal + delivery fee;
    
    |Payment Gateway (Stripe)|
    :Create payment intent for total;
    :Return client_secret;
    
    |Cat Owner|
    :Enter payment details;
    :Confirm order;
    
    |Payment Gateway (Stripe)|
    if (Payment success?) then (yes)
        |Supabase|
        :INSERT into orders;
        :INSERT into order_items 
        (one per product);
        :UPDATE products 
        SET stock = stock - qty;
        :INSERT into payments;
        
        |Notification Service|
        fork
            :Notify Cat Owner 
            "Order confirmed!";
        fork again
            :Notify Store Owner 
            "New order received!";
        end fork
        
        |Cat Owner|
        :Views order confirmation 
        + tracking page;
    else (no)
        |Cat Owner|
        :Payment failed;
        :Retry payment;
    endif
else (no)
    |System (Backend)|
    :Return out-of-stock items;
    |Cat Owner|
    :Remove/adjust items;
    :Update cart;
endif
stop
@enduml
```

---

## Swimlane 4: Vet-User Direct Chat

### PlantUML (True Swimlane)

```plantuml
@startuml
|Cat Owner|
start
:Opens chat with vet;

|System (Backend)|
:Check if chat room exists
(user_id, vet_id);

|Supabase|
if (Chat room exists?) then (yes)
    :SELECT messages 
    FROM messages 
    WHERE chat_room_id = ?
    ORDER BY sent_at DESC 
    LIMIT 50;
else (no)
    :INSERT new chat_room
    (user_id, vet_id);
    :Return empty message list;
endif

|Supabase Realtime|
:Subscribe to chat channel;

|Cat Owner|
:Views chat window 
with message history;
:Types message;
:Clicks Send;

|System (Backend)|
:Validate message content;

|Supabase|
:INSERT into messages
(chat_room_id, sender_id, 
content, type, sent_at);
:UPDATE chat_rooms 
SET last_message_at = now(),
unread_vet = unread_vet + 1;

|Supabase Realtime|
:Broadcast message event 
to chat channel;

|Veterinarian|
if (Vet online?) then (yes)
    :Receives real-time message;
    :Reads message;
    :Types reply;
    :Clicks Send;
    
    |Supabase|
    :INSERT reply into messages;
    :UPDATE unread_user + 1;
    
    |Supabase Realtime|
    :Broadcast reply event;
    
    |Cat Owner|
    :Receives reply in real-time;
    :Continues conversation;
else (no)
    |Notification Service|
    :Send push notification to vet;
    :Send email notification;
    
    |Veterinarian|
    :Receives push notification
    "New message from [owner]";
    :Opens app to respond later;
endif
stop
@enduml
```

---

## Swimlane 5: AI Companion Consultation

### PlantUML (True Swimlane)

```plantuml
@startuml
|Cat Owner|
start
:Opens AI Companion;
:Selects which cat to ask about;
:Describes symptoms in 
natural language
"My cat is vomiting and 
has diarrhea for 2 days";
:Submits query;

|System (Backend)|
:Receive symptom query;

|Supabase|
:Fetch cat profile
(breed, age, weight);
:Fetch medical record
(allergies, conditions, history);

|System (Backend)|
:Build context string 
(symptoms + cat profile);

|AI Service (OpenAI)|
:Generate vector embedding 
for symptom text;
:Return float[1536] vector;

|Supabase (pgvector)|
:Cosine similarity search:
SELECT *, 
1-(embedding <=> query_vector) 
as similarity
FROM illness_records
ORDER BY similarity DESC
LIMIT 5;
:Return top 5 matched 
illness-solution pairs;

|System (Backend)|
:Filter results by cat breed;
:Calculate severity score;
:Build recommendation;

|Supabase|
:INSERT into ai_consultations
(user_id, cat_id, query, 
results, confidence, severity);

|Cat Owner|
if (Severity = HIGH/CRITICAL?) then (yes)
    #pink:Display warning:
    "⚠️ We recommend seeing 
    a vet immediately";
    :Show matched illnesses 
    with confidence scores;
    :Show "Book Appointment" button;
    
    if (User clicks Book?) then (yes)
        :Redirect to 
        Appointment Booking flow;
    else (no)
        :Acknowledge warning;
    endif
else (no)
    :Display matched illnesses 
    with confidence scores;
    :Show home remedies;
    :Show monitoring tips;
    :Show "Was this helpful?" feedback;
endif
stop
@enduml
```

---

## Swimlane 6: Hospital Dashboard Customization

### PlantUML (True Swimlane)

```plantuml
@startuml
|Hospital Admin|
start
:Opens Hospital Dashboard;
:Clicks "Customize Page";

|System (Backend)|
:Authenticate user;
:Verify hospital_admin role;

|Supabase|
:Fetch current hospital 
page_config, banner_url,
services, operating_hours;

|Hospital Admin|
:Views page editor 
(WYSIWYG interface);

fork
    :Upload new banner image;
    |Supabase Storage|
    :Store image in 
    hospital-assets bucket;
    :Return public URL;
fork again
    |Hospital Admin|
    :Edit description;
    :Update operating hours;
    :Update contact info;
fork again
    |Hospital Admin|
    :Add/edit promotional section
    "20% off vaccinations this month";
fork again
    |Hospital Admin|
    :Reorder page sections
    (drag and drop);
fork again
    |Hospital Admin|
    :Manage services list
    (add/edit/remove services);
end fork

|Hospital Admin|
:Clicks "Preview";
:Reviews preview of 
public-facing page;

if (Satisfied?) then (yes)
    :Clicks "Publish";
    
    |System (Backend)|
    :Validate page configuration;
    
    |Supabase|
    :UPDATE hospitals 
    SET page_config = ?,
    banner_url = ?,
    operating_hours = ?
    WHERE id = ?;
    
    |Hospital Admin|
    :Success: "Changes are live! ✓";
else (no)
    |Hospital Admin|
    :Continue editing;
endif
stop
@enduml
```

---

## Swimlane 6b: Store Dashboard Customization

### PlantUML (True Swimlane)

```plantuml
@startuml
|Store Owner|
start
:Opens Store Dashboard;
:Clicks "Customize Store Page";

|System (Backend)|
:Authenticate user;
:Verify store_owner role;

|Supabase|
:Fetch current store 
page_config, banner_url,
products, categories,
delivery_zones, operating_hours;

|Store Owner|
:Views store page editor
(WYSIWYG interface);

fork
    :Upload new banner image;
    |Supabase Storage|
    :Store image in 
    store-assets bucket;
    :Return public URL;
fork again
    |Store Owner|
    :Edit store description;
    :Update operating hours;
    :Update contact info;
fork again
    |Store Owner|
    :Configure delivery zones
    (set delivery areas on map);
    :Set delivery fee;
fork again
    |Store Owner|
    :Manage product categories
    (add/edit/reorder categories);
fork again
    |Store Owner|
    :Manage products
    (add/edit/remove products);
    :Upload product images;
    :Set prices and stock quantities;
fork again
    |Store Owner|
    :Reorder page layout sections
    (drag and drop);
end fork

|Store Owner|
:Clicks "Preview";
:Reviews preview of 
public-facing store page;

if (Satisfied?) then (yes)
    :Clicks "Publish";
    
    |System (Backend)|
    :Validate page configuration;
    :Validate delivery zones;
    
    |Supabase|
    :UPDATE cat_stores 
    SET page_config = ?,
    banner_url = ?,
    operating_hours = ?,
    delivery_zones = ?,
    delivery_fee = ?
    WHERE id = ?;
    
    :UPDATE products
    (any product changes);
    
    :UPDATE product_categories
    (any category changes);
    
    |Store Owner|
    :Success: "Store page is live! ✓";
else (no)
    |Store Owner|
    :Continue editing;
endif
stop
@enduml
```

---

## Swimlane 7: Order Fulfillment (Store Owner Processing)

### PlantUML (True Swimlane)

```plantuml
@startuml
|Cat Owner|
start
:Places order 
(from Swimlane 3);

|Supabase Realtime|
:Broadcast new order event 
to store channel;

|Store Owner|
:Receives real-time notification
🔔 "New order received!";
:Views order details
(items, quantities, address, notes);

if (Can fulfill order?) then (yes)
    :Clicks "Accept Order";
    
    |System (Backend)|
    :Update order status;
    
    |Supabase|
    :UPDATE orders 
    SET status = 'preparing';
    :INSERT into order_fulfillment
    (status_change log);
    
    |Notification Service|
    :Notify Cat Owner 
    "Your order is being prepared";
    
    |Cat Owner|
    :Receives status update;
    
    |Store Owner|
    :Prepares order;
    :Clicks "Ready for Pickup/Delivery";
    
    |Supabase|
    :UPDATE orders 
    SET status = 'ready';
    
    |Notification Service|
    :Notify Cat Owner 
    "Your order is ready!";
    
    |Cat Owner|
    :Receives "order ready" update;
    
    |Store Owner|
    :Hands off order for delivery;
    :Clicks "Completed";
    
    |Supabase|
    :UPDATE orders 
    SET status = 'delivered',
    delivered_at = now();
    :Finalize payment;
    
    |Notification Service|
    :Notify Cat Owner 
    "Order delivered! 
    Rate your experience";
    
    |Cat Owner|
    :Receives delivery confirmation;
    :Optionally rates & reviews store;
    
else (no)
    |Store Owner|
    :Clicks "Reject Order";
    :Enters rejection reason;
    
    |Supabase|
    :UPDATE orders 
    SET status = 'cancelled';
    
    |Payment Gateway (Stripe)|
    :Process refund;
    
    |Notification Service|
    :Notify Cat Owner 
    "Order cancelled. Refund issued.";
    
    |Cat Owner|
    :Receives cancellation + refund;
endif
stop
@enduml
```

---

## Swimlane 8: Admin — Manage Medicine Database

### PlantUML (True Swimlane)

```plantuml
@startuml
|System Admin|
start
:Opens Admin Panel;
:Navigates to Medicine Management;

|System (Backend)|
:Verify admin role;

|Supabase|
:SELECT * FROM medicines 
ORDER BY name 
LIMIT 20 OFFSET 0;

|System Admin|
:Views medicine table
(searchable, sortable);
:Clicks "Add New Medicine";
:Fills medicine form:
- Name & generic name
- Manufacturer
- Ingredients list
- Dosage form (tablet/liquid/etc)
- Usage instructions
- Contraindications
- Allergy warnings
- Breed-specific warnings
- Side effects;

:Submits form;

|System (Backend)|
:Validate medicine data;
:Check for duplicate names;

if (Valid & unique?) then (yes)
    |Supabase|
    :INSERT into medicines
    (all fields);
    
    |AI Service (OpenAI)|
    :Generate embedding for 
    (name + description + 
    symptoms it treats);
    :Return vector float[1536];
    
    |Supabase (pgvector)|
    :UPDATE medicines 
    SET embedding = vector
    WHERE id = new_id;
    
    |System Admin|
    :Medicine added successfully ✓;
    :Updated medicine list displayed;
else (no)
    |System (Backend)|
    :Return validation errors;
    |System Admin|
    :Shows error messages;
    :Correct and resubmit;
endif
stop
@enduml
```

---

## Swimlane 9: Vet — Treatment, Prescribe Medicine & Update Patient Record

### PlantUML (True Swimlane)

```plantuml
@startuml
|Veterinarian|
start
:Opens today's appointments;
:Selects current appointment;

|System (Backend)|
:Fetch full appointment context;

|Supabase|
:SELECT appointment details 
+ cat profile 
+ medical_record (allergies)
+ patient_history 
+ past prescriptions;

|Veterinarian|
:Reviews patient context:
- Cat info & breed
- Known allergies  
- Medical history
- Past prescriptions;

:Conducts examination;
:Enters diagnosis notes;
:Adds treatment record;

|Supabase|
:INSERT into treatments
(appointment_id, vet_id, cat_id,
diagnosis, notes, follow_up);

|Veterinarian|
:Searches medicine database;

|System (Backend)|
:Search medicines by name/condition;

|Supabase|
:SELECT * FROM medicines 
WHERE name ILIKE '%query%';

|Veterinarian|
:Views medicine options 
with ingredients & warnings;
:Selects medicine;
:Sets dosage, frequency, duration;
:Clicks "Prescribe";

|System (Backend)|
:Cross-check cat allergies vs 
medicine contraindications;

|Supabase|
:SELECT allergies FROM 
medical_records WHERE cat_id = ?;
:SELECT contraindications, 
allergy_warnings FROM 
medicines WHERE id = ?;

|System (Backend)|
if (Contraindication found?) then (yes)
    |Veterinarian|
    #pink:⚠️ WARNING: 
    Cat is allergic to [ingredient]
    in this medicine;
    
    if (Override?) then (yes)
        :Acknowledges risk;
        :Adds override reason;
    else (no)
        :Selects different medicine;
        stop
    endif
else (no)
endif

|Supabase|
:INSERT into prescriptions
(appointment_id, cat_id, vet_id,
medicine_id, dosage, frequency,
duration_days, instructions);

:INSERT into patient_history
(cat_id, type='prescription',
appointment_id, prescription_id);

|Notification Service|
:Notify Cat Owner:
"New prescription for [cat name]:
[medicine] - [dosage] [frequency]
for [duration] days";

|Cat Owner|
:Receives prescription notification;
:Views prescription details 
in patient history;

|Veterinarian|
:Prescription confirmed ✓;
:Adds follow-up instructions;
:Marks appointment complete;

|Supabase|
:UPDATE appointments 
SET status = 'completed';
:INSERT into patient_history
(type='appointment_completed');

stop
@enduml
```

---

## Swimlane 10: Review & Rating Flow

### PlantUML (True Swimlane)

```plantuml
@startuml
|Cat Owner|
start
:Completes appointment/order;
:Receives prompt: 
"Rate your experience";
:Opens review form;
:Selects star rating (1-5);
:Writes review comment;
:Submits review;

|System (Backend)|
:Validate review content;
:Check user had actual 
appointment/order with target;

|Supabase|
:INSERT into reviews
(user_id, target_id, 
rating, comment);
:Recalculate average rating:
UPDATE hospitals/stores/vets 
SET rating = AVG(reviews.rating),
total_reviews = COUNT(*);

|Notification Service|
:Notify Hospital Admin / 
Store Owner / Vet:
"New review received (★★★★☆)";

|Hospital Admin / Store Owner|
:Receives review notification;
:Views review in dashboard;

if (Wants to respond?) then (yes)
    :Writes response;
    :Submits response;
    
    |Supabase|
    :INSERT into review_responses
    (review_id, responder_id, 
    response_text);
    
    |Notification Service|
    :Notify Cat Owner:
    "Business responded 
    to your review";
    
    |Cat Owner|
    :Views response;
else (no)
    |Hospital Admin / Store Owner|
    :Acknowledges review;
endif
stop
@enduml
```

---

## Swimlane 11: Offer / Promotion Management

### PlantUML (True Swimlane)

```plantuml
@startuml
|Hospital Admin / Store Owner|
start
:Opens Dashboard;
:Navigates to "Offers";

|System (Backend)|
:Fetch existing offers
for this hospital/store;
|Supabase|
:SELECT * FROM offers
WHERE hospital_id = ? 
OR store_id = ?
ORDER BY valid_from DESC;
|Hospital Admin / Store Owner|
:Views offers list
(active / expired);

:Clicks "Create Offer";
:Fills offer form
(title, description, discount_percent,
promo_code, valid_from, valid_to,
applicable_items);
:Submits form;

|System (Backend)|
:Validate offer data;
if (valid_from < valid_to?) then (yes)
    |Supabase|
    :INSERT into offers
    (hospital_id/store_id, title,
    discount_percent, promo_code,
    valid_from, valid_to,
    applicable_items, is_active=true);
    |Hospital Admin / Store Owner|
    :Offer created ✓;
    :Offer appears in listing;
else (no)
    |System (Backend)|
    :Return validation error
    "End date must be after start date";
    |Hospital Admin / Store Owner|
    :Correct dates and resubmit;
endif

note right
  Owner can also:
  - Toggle offer active/inactive
  - Edit offer details
  - Delete expired offers
end note

stop
@enduml
```

---

## Swimlane 12: Admin — Verify Vets, Approve Hospitals & Stores

### PlantUML (True Swimlane)

```plantuml
@startuml
|System Admin|
start
:Opens Admin Dashboard;

|System (Backend)|
:Fetch dashboard stats;
|Supabase|
:SELECT COUNT(*) FROM vets 
WHERE is_verified = false;
:SELECT COUNT(*) FROM hospitals 
WHERE is_approved = false;
:SELECT COUNT(*) FROM cat_stores 
WHERE is_approved = false;
|System Admin|
:Views KPIs + pending counts;

fork
    :Clicks "Pending Vets";
    |System (Backend)|
    :Fetch unverified vets;
    |Supabase|
    :SELECT v.*, u.name, u.email 
    FROM vets v JOIN users u 
    WHERE v.is_verified = false;
    |System Admin|
    :Reviews vet credentials
    (license, qualifications, bio);
    
    if (Approve?) then (yes)
        :Clicks "Approve";
        |Supabase|
        :UPDATE vets 
        SET is_verified = true,
        verified_at = now()
        WHERE id = ?;
        |Notification Service|
        :Notify Vet:
        "Your profile has been verified!";
    else (no)
        :Clicks "Reject" + reason;
        |Notification Service|
        :Notify Vet:
        "Profile rejected: " + reason;
    endif

fork again
    |System Admin|
    :Clicks "Pending Hospitals";
    |Supabase|
    :SELECT * FROM hospitals 
    WHERE is_approved = false;
    |System Admin|
    :Reviews hospital details;
    
    if (Approve?) then (yes)
        :Clicks "Approve";
        |Supabase|
        :UPDATE hospitals 
        SET is_approved = true 
        WHERE id = ?;
        |Notification Service|
        :Notify Hospital Admin:
        "Hospital approved!";
    else (no)
        :Clicks "Reject" + reason;
        |Notification Service|
        :Notify Hospital Admin:
        "Hospital rejected: " + reason;
    endif

fork again
    |System Admin|
    :Clicks "Pending Stores";
    |Supabase|
    :SELECT * FROM cat_stores 
    WHERE is_approved = false;
    |System Admin|
    :Reviews store details;
    
    if (Approve?) then (yes)
        :Clicks "Approve";
        |Supabase|
        :UPDATE cat_stores 
        SET is_approved = true 
        WHERE id = ?;
        |Notification Service|
        :Notify Store Owner:
        "Store approved!";
    else (no)
        :Clicks "Reject" + reason;
        |Notification Service|
        :Notify Store Owner:
        "Store rejected: " + reason;
    endif
end fork

|System Admin|
note right
  Admin can also:
  - Suspend/reactivate users
  - Manage cat breeds
  - Manage AI illness data
end note

stop
@enduml
```

---

## Summary of All Swimlane / Workflow Diagrams

| # | Swimlane | Actors/Lanes | Primary Use Case | Transaction Pattern |
|---|----------|-------------|-----------------|-------------------|
| 1 | Registration | Cat Owner, Backend, Supabase, Notification | UC-1.1, UC-1.2 | TS-1, TS-2 |
| 2 | Book Appointment | Cat Owner, Location, Backend, Supabase, Stripe, Notification | UC-1.5 | TS-3 (Transaction → SubsequentTransaction + Place) |
| 3 | Purchase Products | Cat Owner, Location, Backend, Supabase, Stripe, Notification | UC-1.9 | TS-4 (Transaction with LineItem → SubsequentTransaction) |
| 4 | Vet-User Chat | Cat Owner, Backend, Supabase, Realtime, Vet, Notification | UC-1.6, UC-2.4 | TS-5 (Transaction with TransactionLineItem) |
| 5 | AI Consultation | Cat Owner, Backend, OpenAI, pgvector, Supabase | UC-1.11 | TS-7 (Participant-Transaction-SpecificItem) |
| 6 | Hospital Dashboard Customization | Hospital Admin, Backend, Supabase, Storage | UC-3.2 | TS-8 (Participant-Transaction-Place + Item) |
| 6b | Store Dashboard Customization | Store Owner, Backend, Supabase, Storage | UC-4.2 | TS-9 (Participant-Transaction-Place + Item + Classification) |
| 7 | Order Fulfillment | Cat Owner, Realtime, Store Owner, Backend, Supabase, Stripe, Notification | UC-4.5 | TS-12 (Transaction → SubsequentTransaction) |
| 8 | Medicine Management | System Admin, Backend, Supabase, OpenAI, pgvector | UC-5.5 | TS-13 (Participant-Transaction-Item) |
| 9 | Treatment & Prescription | Vet, Backend, Supabase, Notification, Cat Owner | UC-2.5, UC-2.9 | TS-6 (Transaction → SubsequentTransaction with Item) |
| 10 | Review & Rating | Cat Owner, Backend, Supabase, Notification, Business Owner | UC-1.14 | TS-10 (Transaction → SubsequentTransaction) |
| 11 | Offer Management | Hospital Admin / Store Owner, Backend, Supabase | UC-3.6, UC-4.6 | TS-11 (Participant-Transaction-Item) |
| 12 | Admin Verification & Approval | System Admin, Backend, Supabase, Notification | UC-5.1–UC-5.4 | TS-13 (Participant-Transaction-SpecificItem) |

---

## Diagram Format Guide

| Format | Tool | Best For |
|--------|------|----------|
| **PlantUML** (primary) | [plantuml.com](https://www.plantuml.com/plantuml/uml), VS Code PlantUML extension | **True swimlanes** with `\|Lane\|` syntax — proper UML activity diagrams |
| **Mermaid** (secondary) | [mermaid.live](https://mermaid.live), GitHub markdown | Flowcharts with subgraphs approximating lanes — good for GitHub rendering |

> **Recommendation**: Use the **PlantUML** versions for formal documentation and presentations. The PlantUML activity diagram syntax with `|Lane Name|` partitions renders proper swimlane diagrams with vertical lanes.

