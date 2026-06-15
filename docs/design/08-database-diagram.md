# 08 — Database Diagram & Complete Schema

> Complete database design for Purrfect Care using Supabase (PostgreSQL). Includes ER diagram, all tables with field explanations, indexes, and RLS policies.

---

## Complete ER Diagram (Mermaid Flowchart)

> **28 entities**, **43 relationships**. Each entity includes full attributes. Render natively in GitHub or Markdown viewers supporting Mermaid.

### Subsystem 1: Users, Roles, and Places (Chen ERD)
```mermaid
graph LR
    %% ENTITIES (Strong = [], Weak = [[]])
    users[users]
    user_profiles[[user_profiles]]
    vets[vets]
    hospitals[hospitals]
    hospital_services[[hospital_services]]

    %% RELATIONSHIPS (Strong = {}, Weak = {{}})
    has_profile{{has_profile}}
    is_vet{is_vet}
    manages{manages}
    offers{{offers}}

    %% CONNECTIONS (Participation)
    users ---|Partial| has_profile
    has_profile ---|Total| user_profiles

    users ---|Partial| is_vet
    is_vet ---|Total| vets

    users ---|Partial| manages
    manages ---|Total| hospitals

    hospitals ---|Partial| offers
    offers ---|Total| hospital_services

    %% ATTRIBUTES - users (Ovals = ([ ]))
    users --- A_u_id([<u>id</u>])
    users --- A_u_email([email])
    users --- A_u_name([name])
    users --- A_u_phone([phone])
    users --- A_u_role([role])
    users --- A_u_avatar([avatar_url])
    users --- A_u_loc([location])
    users --- A_u_city([city])
    users --- A_u_created([created_at])

    %% ATTRIBUTES - user_profiles
    user_profiles --- A_up_id([<u>id</u>])
    user_profiles --- A_up_pref([preferences <<Multi>>])
    user_profiles --- A_up_notif([notification_settings])

    %% ATTRIBUTES - vets
    vets --- A_v_id([<u>id</u>])
    vets --- A_v_lic([license_number])
    vets --- A_v_spec([specialization])
    vets --- A_v_exp([experience_years])
    vets --- A_v_qual([qualifications <<Multi>>])

    %% ATTRIBUTES - hospitals
    hospitals --- A_h_id([<u>id</u>])
    hospitals --- A_h_name([name])
    hospitals --- A_h_phone([phone])
    hospitals --- A_h_loc([location])
    hospitals --- A_h_hours([operating_hours <<Multi>>])
    hospitals --- A_h_rate([rating])

    %% ATTRIBUTES - hospital_services
    hospital_services --- A_hs_id([<u>id</u>])
    hospital_services --- A_hs_name([name])
    hospital_services --- A_hs_price([price])
    hospital_services --- A_hs_dur([duration_minutes])
```

### Subsystem 2: Medical & Cats (Chen ERD)
```mermaid
graph LR
    %% ENTITIES
    users[users]
    cats[cats]
    cat_breeds[cat_breeds]
    medical_records[[medical_records]]
    patient_history[[patient_history]]
    medicines[medicines]
    cat_health_knowledge[cat_health_knowledge]

    %% RELATIONSHIPS
    owns{owns}
    belongs_to{belongs_to}
    has_record{{has_record}}
    has_history{{has_history}}

    %% CONNECTIONS
    users ---|Partial| owns
    owns ---|Total| cats

    cats ---|Total| belongs_to
    belongs_to ---|Partial| cat_breeds

    cats ---|Total| has_record
    has_record ---|Total| medical_records

    cats ---|Total| has_history
    has_history ---|Total| patient_history

    %% ATTRIBUTES - cats
    cats --- A_c_id([<u>id</u>])
    cats --- A_c_name([name])
    cats --- A_c_age([age_months])
    cats --- A_c_weight([weight_kg])
    cats --- A_c_gender([gender])

    %% ATTRIBUTES - cat_breeds
    cat_breeds --- A_cb_id([<u>id</u>])
    cat_breeds --- A_cb_name([name])
    cat_breeds --- A_cb_orig([origin_country])
    cat_breeds --- A_cb_life([avg_lifespan_years])

    %% ATTRIBUTES - medical_records
    medical_records --- A_mr_id([<u>id</u>])
    medical_records --- A_mr_alg([allergies <<Multi>>])
    medical_records --- A_mr_cond([existing_conditions <<Multi>>])
    medical_records --- A_mr_vac([vaccination_status <<Multi>>])

    %% ATTRIBUTES - patient_history
    patient_history --- A_ph_id([<u>id</u>])
    patient_history --- A_ph_type([entry_type])
    patient_history --- A_ph_desc([description])

    %% ATTRIBUTES - medicines
    medicines --- A_m_id([<u>id</u>])
    medicines --- A_m_name([name])
    medicines --- A_m_ingr([ingredients <<Multi>>])
    medicines --- A_m_req([requires_prescription])

    %% ATTRIBUTES - cat_health_knowledge (RAG chunks)
    cat_health_knowledge --- A_chk_id([<u>id</u>])
    cat_health_knowledge --- A_chk_sf([source_file])
    cat_health_knowledge --- A_chk_title([title])
    cat_health_knowledge --- A_chk_sec([section])
    cat_health_knowledge --- A_chk_cont([content])
    cat_health_knowledge --- A_chk_emb([embedding <<768-dim>>])
```

### Subsystem 3: Commerce (Chen ERD)
```mermaid
graph LR
    %% ENTITIES
    users[users]
    cat_stores[cat_stores]
    products[products]
    product_categories[product_categories]
    orders[orders]
    order_items[[order_items]]

    %% RELATIONSHIPS
    sells{sells}
    categorized_in{categorized_in}
    places{places}
    contains{{contains}}
    fulfilled_by{fulfilled_by}
    references{references}

    %% CONNECTIONS
    cat_stores ---|Partial| sells
    sells ---|Total| products

    products ---|Total| categorized_in
    categorized_in ---|Partial| product_categories

    users ---|Partial| places
    places ---|Total| orders

    orders ---|Total| fulfilled_by
    fulfilled_by ---|Partial| cat_stores

    orders ---|Total| contains
    contains ---|Total| order_items

    order_items ---|Total| references
    references ---|Partial| products

    %% ATTRIBUTES - cat_stores
    cat_stores --- A_cs_id([<u>id</u>])
    cat_stores --- A_cs_name([name])
    cat_stores --- A_cs_loc([location])
    cat_stores --- A_cs_hours([operating_hours <<Multi>>])
    cat_stores --- A_cs_fee([delivery_fee])

    %% ATTRIBUTES - products
    products --- A_p_id([<u>id</u>])
    products --- A_p_name([name])
    products --- A_p_price([price])
    products --- A_p_stock([stock_quantity])
    products --- A_p_img([images <<Multi>>])

    %% ATTRIBUTES - product_categories
    product_categories --- A_pc_id([<u>id</u>])
    product_categories --- A_pc_name([name])

    %% ATTRIBUTES - orders
    orders --- A_o_id([<u>id</u>])
    orders --- A_o_total([total])
    orders --- A_o_status([status])
    orders --- A_o_addr([delivery_address])

    %% ATTRIBUTES - order_items
    order_items --- A_oi_id([<u>id</u>])
    order_items --- A_oi_qty([quantity])
    order_items --- A_oi_price([unit_price])
```

### Subsystem 4: Appointments, Engagements & Payments (Chen ERD)
```mermaid
graph LR
    %% ENTITIES
    users[users]
    hospitals[hospitals]
    cat_stores[cat_stores]
    appointments[appointments]
    appointment_slots[appointment_slots]
    treatments[[treatments]]
    prescriptions[[prescriptions]]
    payments[[payments]]
    reviews[reviews]
    chat_rooms[chat_rooms]
    messages[[messages]]
    review_responses[[review_responses]]
    offers[offers]
    ai_consultations[ai_consultations]
    notifications[notifications]

    %% RELATIONSHIPS
    books{books}
    schedules{schedules}
    uses_slot{uses_slot}
    follows_up{{follows_up}}
    prescribes{{prescribes}}
    pays_for{{pays_for}}
    writes_review{writes_review}
    sends_msg{{sends_msg}}
    has_res{{has_response}}
    c_ai{consults_ai}
    r_notif{receives_notif}
    c_offer{creates_offer}

    %% CONNECTIONS
    users ---|Partial| books
    books ---|Total| appointments

    hospitals ---|Partial| schedules
    schedules ---|Total| appointment_slots

    appointments ---|Total| uses_slot
    uses_slot ---|Partial| appointment_slots

    appointments ---|Partial| follows_up
    follows_up ---|Total| treatments

    appointments ---|Partial| prescribes
    prescribes ---|Total| prescriptions

    appointments ---|Partial| pays_for
    pays_for ---|Total| payments

    users ---|Partial| writes_review
    writes_review ---|Total| reviews

    chat_rooms ---|Total| sends_msg
    sends_msg ---|Total| messages
    
    reviews ---|Partial| has_res
    has_res ---|Total| review_responses

    users ---|Partial| c_ai
    c_ai ---|Total| ai_consultations

    users ---|Partial| r_notif
    r_notif ---|Total| notifications

    cat_stores ---|Partial| c_offer
    c_offer ---|Total| offers

    %% ATTRIBUTES - appointments
    appointments --- A_app_id([<u>id</u>])
    appointments --- A_app_date([appointment_date])
    appointments --- A_app_stat([status])
    appointments --- A_app_amt([amount_paid])

    %% ATTRIBUTES - appointment_slots
    appointment_slots --- A_as_id([<u>id</u>])
    appointment_slots --- A_as_date([slot_date])
    appointment_slots --- A_as_book([is_booked])

    %% ATTRIBUTES - treatments
    treatments --- A_t_id([<u>id</u>])
    treatments --- A_t_diag([diagnosis])

    %% ATTRIBUTES - prescriptions
    prescriptions --- A_pr_id([<u>id</u>])
    prescriptions --- A_pr_dose([dosage])

    %% ATTRIBUTES - payments
    payments --- A_pay_id([<u>id</u>])
    payments --- A_pay_amt([amount])
    payments --- A_pay_meth([payment_method])

    %% ATTRIBUTES - reviews
    reviews --- A_r_id([<u>id</u>])
    reviews --- A_r_rate([rating])
    reviews --- A_r_com([comment])

    %% ATTRIBUTES - chat_rooms
    chat_rooms --- A_cr_id([<u>id</u>])
    chat_rooms --- A_cr_appt([appointment_id])
    chat_rooms --- A_cr_act([is_active])

    %% ATTRIBUTES - messages
    messages --- A_msg_id([<u>id</u>])
    messages --- A_msg_cont([content])
    messages --- A_msg_read([is_read])
```


---

## Table Definitions

### 1. `users` — All platform users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique user ID (matches Supabase auth.users.id) |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| `name` | VARCHAR(100) | NOT NULL | Full name |
| `phone` | VARCHAR(20) | | Phone number |
| `role` | VARCHAR(20) | NOT NULL, CHECK IN ('cat_owner','vet','hospital_admin','store_owner','admin') | Access control role |
| `avatar_url` | TEXT | | Profile picture URL |
| `location` | GEOGRAPHY(POINT, 4326) | | User's geolocation (PostGIS) |
| `address` | TEXT | | Street address |
| `city` | VARCHAR(100) | | City |
| `country` | VARCHAR(100) | | Country |
| `is_active` | BOOLEAN | DEFAULT true | Account status |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Registration timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update |

**Indexes**: `idx_users_email`, `idx_users_role`, `idx_users_location` (GiST)

---

### 2. `user_profiles` — Extended user preferences

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Profile ID |
| `user_id` | UUID | FK → users.id, UNIQUE | Owner |
| `preferences` | JSONB | DEFAULT '{}' | UI/notification preferences |
| `notification_settings` | VARCHAR(50) | DEFAULT 'all' | Email/push/sms settings |
| `payment_customer_id` | VARCHAR(255) | | Stripe customer ID |
| `last_login` | TIMESTAMPTZ | | Last login time |

---

### 3. `cat_breeds` — Cat breed encyclopedia

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Breed ID |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Breed name (e.g., "Persian", "Maine Coon") |
| `origin_country` | VARCHAR(100) | | Country of origin |
| `size_category` | VARCHAR(20) | CHECK IN ('small','medium','large','giant') | Size classification |
| `coat_type` | VARCHAR(50) | | Hair type (short, long, hairless, etc.) |
| `temperament` | TEXT | | Personality traits |
| `description` | TEXT | | Detailed breed description |
| `avg_lifespan_years` | DECIMAL(4,1) | | Average lifespan |
| `avg_weight_kg` | DECIMAL(4,1) | | Average weight |
| `common_health_issues` | TEXT[] | DEFAULT '{}' | Known genetic/health conditions |
| `grooming_needs` | TEXT[] | DEFAULT '{}' | Grooming requirements |
| `image_url` | TEXT | | Breed reference image |

---

### 4. `cats` — Registered cats

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Cat ID |
| `owner_id` | UUID | FK → users.id, NOT NULL | Cat owner |
| `name` | VARCHAR(100) | NOT NULL | Cat's name |
| `breed_id` | UUID | FK → cat_breeds.id | Breed reference |
| `age_months` | INTEGER | | Age in months |
| `weight_kg` | DECIMAL(5,2) | | Current weight |
| `color` | VARCHAR(50) | | Coat color |
| `gender` | VARCHAR(10) | CHECK IN ('male','female') | Gender |
| `photo_url` | TEXT | | Cat photo |
| `is_neutered` | BOOLEAN | DEFAULT false | Spay/neuter status |
| `microchip_id` | VARCHAR(50) | | Microchip number |
| `registered_at` | TIMESTAMPTZ | DEFAULT now() | Registration date |

**Indexes**: `idx_cats_owner_id`

---

### 5. `medical_records` — Cat health records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Record ID |
| `cat_id` | UUID | FK → cats.id, UNIQUE, NOT NULL | Cat reference |
| `allergies` | TEXT[] | DEFAULT '{}' | Known allergies (e.g., ["penicillin", "chicken"]) |
| `existing_conditions` | TEXT[] | DEFAULT '{}' | Chronic conditions (e.g., ["diabetes", "asthma"]) |
| `vaccination_status` | JSONB | DEFAULT '{}' | Map of vaccine→{date, next_due} |
| `blood_type` | VARCHAR(10) | | Blood type (A, B, AB) |
| `notes` | TEXT | | Additional medical notes |
| `last_updated` | TIMESTAMPTZ | DEFAULT now() | Last update timestamp |

---

### 6. `patient_history` — Timeline of medical events

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Entry ID |
| `cat_id` | UUID | FK → cats.id, NOT NULL | Cat reference |
| `entry_type` | VARCHAR(30) | NOT NULL, CHECK IN ('appointment','prescription','diagnosis','vaccination','surgery','note') | Type of history entry |
| `description` | TEXT | | Event description |
| `appointment_id` | UUID | FK → appointments.id | Related appointment |
| `prescription_id` | UUID | FK → prescriptions.id | Related prescription |
| `vet_id` | UUID | FK → vets.id | Attending vet |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Entry timestamp |

**Indexes**: `idx_patient_history_cat_id`, `idx_patient_history_created_at`

---

### 7. `vets` — Veterinarian profiles

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Vet ID |
| `user_id` | UUID | FK → users.id, UNIQUE, NOT NULL | User account link |
| `license_number` | VARCHAR(50) | UNIQUE, NOT NULL | Veterinary license |
| `specialization` | VARCHAR(100) | | Area of expertise |
| `experience_years` | INTEGER | | Years of experience |
| `bio` | TEXT | | Professional biography |
| `qualifications` | TEXT[] | DEFAULT '{}' | Degrees and certifications |
| `hospital_id` | UUID | FK → hospitals.id | Affiliated hospital |
| `is_verified` | BOOLEAN | DEFAULT false | Admin-verified status |
| `rating` | DECIMAL(3,2) | DEFAULT 0 | Average rating (0-5) |
| `total_reviews` | INTEGER | DEFAULT 0 | Review count |
| `verified_at` | TIMESTAMPTZ | | Verification date |

---

### 8. `hospitals` — Vet hospitals/clinics

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Hospital ID |
| `admin_user_id` | UUID | FK → users.id, NOT NULL | Admin who manages this hospital |
| `name` | VARCHAR(200) | NOT NULL | Hospital name |
| `description` | TEXT | | About the hospital |
| `phone` | VARCHAR(20) | | Contact phone |
| `email` | VARCHAR(255) | | Contact email |
| `location` | GEOGRAPHY(POINT, 4326) | NOT NULL | GPS coordinates (PostGIS) |
| `address` | TEXT | NOT NULL | Street address |
| `city` | VARCHAR(100) | | City |
| `banner_url` | TEXT | | Banner image for public page |
| `operating_hours` | JSONB | | {mon: {open: "09:00", close: "17:00"}, ...} |
| `is_active` | BOOLEAN | DEFAULT true | Currently operating |
| `is_approved` | BOOLEAN | DEFAULT false | Admin-approved |
| `rating` | DECIMAL(3,2) | DEFAULT 0 | Average rating |
| `total_reviews` | INTEGER | DEFAULT 0 | Review count |
| `page_config` | JSONB | DEFAULT '{}' | Custom page layout/sections (DoorDash-style) |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Registration date |

**Indexes**: `idx_hospitals_location` (GiST), `idx_hospitals_is_approved`

---

### 9. `hospital_services` — Services offered by hospitals

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Service ID |
| `hospital_id` | UUID | FK → hospitals.id, NOT NULL | Hospital |
| `name` | VARCHAR(100) | NOT NULL | Service name (e.g., "General Checkup") |
| `description` | TEXT | | Service details |
| `category` | VARCHAR(50) | CHECK IN ('checkup','vaccination','surgery','treatment','dental','grooming','emergency') | Category |
| `price` | DECIMAL(10,2) | NOT NULL | Price |
| `duration_minutes` | INTEGER | DEFAULT 30 | Typical duration |
| `is_active` | BOOLEAN | DEFAULT true | Available for booking |

---

### 10. `appointment_slots` — Vet availability

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Slot ID |
| `hospital_id` | UUID | FK → hospitals.id, NOT NULL | Hospital |
| `vet_id` | UUID | FK → vets.id, NOT NULL | Veterinarian |
| `slot_date` | DATE | NOT NULL | Date |
| `start_time` | TIME | NOT NULL | Start time |
| `end_time` | TIME | NOT NULL | End time |
| `is_booked` | BOOLEAN | DEFAULT false | Whether slot is taken |
| `is_recurring` | BOOLEAN | DEFAULT false | Weekly recurring slot |

**Indexes**: `idx_slots_vet_date`, `idx_slots_available` (WHERE is_booked = false)

---

### 11. `appointments` — Booked appointments

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Appointment ID |
| `user_id` | UUID | FK → user_profiles.id, NOT NULL | Cat owner's profile (NOT auth.uid directly) |
| `cat_id` | UUID | FK → cats.id, NOT NULL | Patient cat |
| `vet_id` | UUID | FK → vets.id, NOT NULL | Attending vet |
| `hospital_id` | UUID | FK → hospitals.id, NOT NULL | Hospital |
| `service_id` | UUID | FK → hospital_services.id, NOT NULL | Service booked |
| `slot_id` | UUID | FK → appointment_slots.id | Time slot (UNIQUE — prevents double-booking) |
| `appointment_date` | TIMESTAMPTZ | NOT NULL | Date and time |
| `status` | VARCHAR(20) | DEFAULT 'pending', CHECK IN ('pending','confirmed','in_progress','completed','cancelled','no_show') | Status |
| `notes` | TEXT | | Appointment notes |
| `amount_paid` | DECIMAL(10,2) | | Consultation fee (billed at clinic) |
| `payment_id` | VARCHAR(255) | | Safepay tracker token for platform fee |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Booking time |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last status change |

**Indexes**: `idx_appointments_user`, `idx_appointments_vet`, `idx_appointments_hospital`, `idx_appointments_status`

---

### 12. `medicines` — Medicine database

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Medicine ID |
| `name` | VARCHAR(200) | NOT NULL | Brand name |
| `generic_name` | VARCHAR(200) | | Generic/chemical name |
| `manufacturer` | VARCHAR(200) | | Manufacturer |
| `ingredients` | TEXT[] | NOT NULL | Active ingredients list |
| `dosage_form` | VARCHAR(50) | | tablet, liquid, injection, topical |
| `description` | TEXT | | Full description |
| `usage_instructions` | TEXT | | How to administer |
| `contraindications` | TEXT[] | DEFAULT '{}' | Conditions where medicine should NOT be used |
| `allergy_warnings` | TEXT[] | DEFAULT '{}' | Ingredients that may cause allergic reactions |
| `breed_warnings` | TEXT[] | DEFAULT '{}' | Breeds with known adverse reactions |
| `side_effects` | TEXT[] | DEFAULT '{}' | Possible side effects |
| `requires_prescription` | BOOLEAN | DEFAULT true | Prescription-only flag |
| `is_active` | BOOLEAN | DEFAULT true | Available in database |
| `embedding` | VECTOR(768) | | Gemini embedding for AI search (gemini-embedding-001, reserved) |

**Indexes**: `idx_medicines_name` (GIN trigram), `idx_medicines_embedding` (ivfflat for vector search)

---

### 13. `prescriptions` — Vet prescriptions for cats

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Prescription ID |
| `appointment_id` | UUID | FK → appointments.id | Related appointment |
| `cat_id` | UUID | FK → cats.id, NOT NULL | Patient cat |
| `vet_id` | UUID | FK → vets.id, NOT NULL | Prescribing vet |
| `medicine_id` | UUID | FK → medicines.id, NOT NULL | Medicine prescribed |
| `dosage` | VARCHAR(100) | NOT NULL | Dosage (e.g., "5mg") |
| `frequency` | VARCHAR(100) | NOT NULL | Frequency (e.g., "twice daily") |
| `duration_days` | INTEGER | NOT NULL | Duration in days |
| `instructions` | TEXT | | Special instructions |
| `status` | VARCHAR(20) | DEFAULT 'active', CHECK IN ('active','completed','cancelled') | Status |
| `prescribed_at` | TIMESTAMPTZ | DEFAULT now() | Prescription date |

---

### 14. `chat_rooms` — Vet-user chat rooms

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Chat room ID |
| `user_id` | UUID | FK → **user_profiles.id**, NOT NULL | Cat owner's profile PK |
| `vet_id` | UUID | FK → vets.id, NOT NULL | Veterinarian |
| `appointment_id` | UUID | FK → appointments.id, **UNIQUE** | Linked appointment (migration 025 — one chat room per appointment) |
| `last_message_at` | TIMESTAMPTZ | | Timestamp of last message |
| `unread_user` | INTEGER | DEFAULT 0 | Unread count for user |
| `unread_vet` | INTEGER | DEFAULT 0 | Unread count for vet |
| `is_active` | BOOLEAN | DEFAULT true | Chat is active |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Creation time |

**Unique constraint**: `UNIQUE(appointment_id)` *(migration 025: old `UNIQUE(user_id, vet_id)` dropped — one chat thread per appointment)*

> **Chat access note (migration 025+)**: Chat room creation, message loading, and message sending are handled by the FastAPI backend using the service-role key (bypasses Supabase client session + RLS). Supabase realtime channel is used only for live message push updates.

---

### 15. `messages` — Chat messages

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Message ID |
| `chat_room_id` | UUID | FK → chat_rooms.id, NOT NULL | Chat room |
| `sender_id` | UUID | FK → users.id, NOT NULL | Who sent it |
| `content` | TEXT | NOT NULL | Message content |
| `message_type` | VARCHAR(20) | DEFAULT 'text', CHECK IN ('text','image','file','prescription_share') | Type |
| `media_url` | TEXT | | Attached media URL |
| `is_read` | BOOLEAN | DEFAULT false | Read receipt |
| `sent_at` | TIMESTAMPTZ | DEFAULT now() | Sent timestamp |

**Indexes**: `idx_messages_chat_room`, `idx_messages_sent_at`

---

### 16. `cat_stores` — Cat product stores

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Store ID |
| `owner_user_id` | UUID | FK → users.id, NOT NULL | Store owner |
| `name` | VARCHAR(200) | NOT NULL | Store name |
| `description` | TEXT | | About the store |
| `phone` | VARCHAR(20) | | Contact phone |
| `email` | VARCHAR(255) | | Contact email |
| `location` | GEOGRAPHY(POINT, 4326) | NOT NULL | GPS coordinates |
| `address` | TEXT | NOT NULL | Street address |
| `city` | VARCHAR(100) | | City |
| `banner_url` | TEXT | | Banner image |
| `operating_hours` | JSONB | | Operating schedule |
| `delivery_zones` | JSONB | | Delivery area polygons |
| `delivery_fee` | DECIMAL(6,2) | DEFAULT 0 | Base delivery fee |
| `is_active` | BOOLEAN | DEFAULT true | Currently operating |
| `is_approved` | BOOLEAN | DEFAULT false | Admin-approved |
| `rating` | DECIMAL(3,2) | DEFAULT 0 | Average rating |
| `total_reviews` | INTEGER | DEFAULT 0 | Review count |
| `page_config` | JSONB | DEFAULT '{}' | Custom page layout |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Registration date |

**Indexes**: `idx_stores_location` (GiST), `idx_stores_is_approved`

---

### 17. `product_categories` — Product classification

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Category ID |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Category name (Food, Toys, Accessories, etc.) |
| `description` | TEXT | | Category description |
| `icon_url` | TEXT | | Category icon |
| `sort_order` | INTEGER | DEFAULT 0 | Display order |

---

### 18. `products` — Store products

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Product ID |
| `store_id` | UUID | FK → cat_stores.id, NOT NULL | Parent store |
| `category_id` | UUID | FK → product_categories.id | Category |
| `name` | VARCHAR(200) | NOT NULL | Product name |
| `description` | TEXT | | Product description |
| `price` | DECIMAL(10,2) | NOT NULL | Regular price |
| `discount_price` | DECIMAL(10,2) | | Sale price |
| `images` | TEXT[] | DEFAULT '{}' | Product image URLs |
| `stock_quantity` | INTEGER | DEFAULT 0 | Current stock |
| `brand` | VARCHAR(100) | | Brand name |
| `weight` | DECIMAL(8,2) | | Product weight |
| `unit` | VARCHAR(20) | | Unit (kg, g, pcs, etc.) |
| `is_active` | BOOLEAN | DEFAULT true | Available for purchase |
| `rating` | DECIMAL(3,2) | DEFAULT 0 | Average rating |
| `total_reviews` | INTEGER | DEFAULT 0 | Review count |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Added date |

**Indexes**: `idx_products_store`, `idx_products_category`

---

### 19. `orders` — Store orders

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Order ID |
| `user_id` | UUID | FK → users.id, NOT NULL | Buyer |
| `store_id` | UUID | FK → cat_stores.id, NOT NULL | Store |
| `subtotal` | DECIMAL(10,2) | NOT NULL | Items total |
| `delivery_fee` | DECIMAL(6,2) | DEFAULT 0 | Delivery charge |
| `total` | DECIMAL(10,2) | NOT NULL | Grand total |
| `status` | VARCHAR(20) | DEFAULT 'pending', CHECK IN ('pending','confirmed','preparing','ready','out_for_delivery','delivered','cancelled','refunded') | Status |
| `payment_id` | VARCHAR(255) | | Safepay tracker token |
| `delivery_address` | TEXT | NOT NULL | Delivery address |
| `delivery_location` | GEOGRAPHY(POINT, 4326) | | Delivery GPS |
| `notes` | TEXT | | Delivery instructions |
| `ordered_at` | TIMESTAMPTZ | DEFAULT now() | Order time |
| `delivered_at` | TIMESTAMPTZ | | Delivery time |

---

### 20. `order_items` — Items in each order

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Item ID |
| `order_id` | UUID | FK → orders.id, NOT NULL | Parent order |
| `product_id` | UUID | FK → products.id, NOT NULL | Product |
| `quantity` | INTEGER | NOT NULL, CHECK > 0 | Quantity ordered |
| `unit_price` | DECIMAL(10,2) | NOT NULL | Price at time of order |
| `total_price` | DECIMAL(10,2) | NOT NULL | quantity × unit_price |

---

### 21. `treatments` — Treatment records from appointments *(SubsequentTransaction)*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Treatment ID |
| `appointment_id` | UUID | FK → appointments.id, NOT NULL | Parent appointment (Transaction → SubsequentTransaction) |
| `vet_id` | UUID | FK → vets.id, NOT NULL | Performing vet |
| `cat_id` | UUID | FK → cats.id, NOT NULL | Patient cat |
| `diagnosis` | TEXT | | Diagnosis made during appointment |
| `notes` | TEXT | | Treatment notes |
| `follow_up_instructions` | TEXT | | Post-treatment care instructions |
| `follow_up_date` | DATE | | Recommended follow-up date |
| `status` | VARCHAR(20) | DEFAULT 'completed', CHECK IN ('in_progress','completed','follow_up_needed') | Treatment status |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Treatment timestamp |

**Indexes**: `idx_treatments_appointment`, `idx_treatments_cat`

> **Transaction Pattern**: SubsequentTransaction following Appointment. Per the PDF: *"Patient – appointment – treatment/admission"*

---

### 22. `payments` — Payment records *(SubsequentTransaction)*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Payment ID |
| `appointment_id` | UUID | FK → appointments.id | Payment for appointment |
| `order_id` | UUID | FK → orders.id | Payment for order |
| `user_id` | UUID | FK → users.id, NOT NULL | Payer |
| `amount` | DECIMAL(10,2) | NOT NULL | Payment amount |
| `payment_method` | VARCHAR(50) | | card, wallet, etc. |
| `stripe_payment_id` | VARCHAR(255) | NOT NULL | **Safepay tracker token** (column retains legacy name; populated by Safepay webhook) |
| `status` | VARCHAR(20) | DEFAULT 'pending', CHECK IN ('pending','completed','failed','refunded') | Payment status |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Payment timestamp |
| `completed_at` | TIMESTAMPTZ | | Completion timestamp |

**Indexes**: `idx_payments_appointment`, `idx_payments_order`, `idx_payments_user`

> **Transaction Pattern**: SubsequentTransaction. Per the PDF: *"Order – order line item – payment"*

---

### 23. `offers` — Promotions for hospitals and stores *(Transaction)*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Offer ID |
| `hospital_id` | UUID | FK → hospitals.id | Hospital (NULL if store offer) |
| `store_id` | UUID | FK → cat_stores.id | Store (NULL if hospital offer) |
| `title` | VARCHAR(200) | NOT NULL | Offer headline |
| `description` | TEXT | | Offer details |
| `discount_percent` | DECIMAL(5,2) | | Discount percentage |
| `promo_code` | VARCHAR(50) | | Optional promo code |
| `valid_from` | TIMESTAMPTZ | NOT NULL | Start date |
| `valid_to` | TIMESTAMPTZ | NOT NULL | End date |
| `is_active` | BOOLEAN | DEFAULT true | Currently active |
| `applicable_items` | TEXT[] | DEFAULT '{}' | Applicable product/service IDs |

---

### 24. `reviews` — User reviews *(Transaction)*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Review ID |
| `user_id` | UUID | FK → users.id, NOT NULL | Reviewer (Participant) |
| `hospital_id` | UUID | FK → hospitals.id | Reviewed hospital (Place) |
| `store_id` | UUID | FK → cat_stores.id | Reviewed store (Place) |
| `vet_id` | UUID | FK → vets.id | Reviewed vet (Participant) |
| `rating` | INTEGER | NOT NULL, CHECK 1-5 | Star rating |
| `comment` | TEXT | | Review text |
| `status` | VARCHAR(20) | DEFAULT 'published' | Review status |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Review date |

---

### 25. `review_responses` — Business responses to reviews *(SubsequentTransaction)*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Response ID |
| `review_id` | UUID | FK → reviews.id, NOT NULL, UNIQUE | Parent review (Transaction → SubsequentTransaction) |
| `responder_id` | UUID | FK → users.id, NOT NULL | Who responded (hospital admin/store owner/vet) |
| `response_text` | TEXT | NOT NULL | Response content |
| `status` | VARCHAR(20) | DEFAULT 'published' | Response status |
| `responded_at` | TIMESTAMPTZ | DEFAULT now() | Response timestamp |

> **Transaction Pattern**: SubsequentTransaction following Review Transaction

---

### 26. `cat_health_knowledge` — RAG knowledge base chunks *(Item)*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Chunk ID |
| `source_file` | TEXT | NOT NULL | Source markdown filename (e.g. `feline_ckd.md`) |
| `title` | TEXT | NOT NULL | Section heading used as chunk title |
| `section` | TEXT | | Section tag from metadata (e.g. `symptoms`, `treatment`) |
| `content` | TEXT | NOT NULL | Full text content of the chunk |
| `source` | TEXT | | Human-readable source name (e.g. `International Cat Care`) |
| `source_url` | TEXT | | Original URL of the veterinary article |
| `embedding` | VECTOR(768) | NOT NULL | Gemini `gemini-embedding-001` embedding (`RETRIEVAL_DOCUMENT`, 768-dim) |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Ingestion timestamp |

**Indexes**: `idx_cat_health_embedding` (ivfflat, lists=12, ops=vector_cosine_ops)

**RPC**: `match_cat_health(query_embedding vector, match_threshold float, match_count int)` — cosine similarity search with `SET LOCAL enable_indexscan = OFF` for exact sequential scan.

> **RAG Pipeline**: 21 Markdown files in `backend/rag/knowledge/` are chunked into 155 rows by `backend/rag/ingest.py`. Embeddings use `gemini-embedding-001` at 768 dimensions. The query pipeline: embed question → call `match_cat_health` RPC → inject top-6 chunks into Gemini chat prompt.

---

### 27. `ai_consultations` — AI interaction log *(Transaction)*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Consultation ID |
| `user_id` | UUID | FK → users.id, NOT NULL | User who asked (Participant) |
| `cat_id` | UUID | FK → cats.id | Cat consulted about (SpecificItem) |
| `query_text` | TEXT | NOT NULL | Original symptom description |
| `results` | JSONB | NOT NULL | Matched illnesses + confidence scores |
| `confidence_score` | DECIMAL(4,3) | | Highest match confidence (0-1) |
| `severity` | VARCHAR(20) | | Assessed severity |
| `status` | VARCHAR(20) | DEFAULT 'completed' | Consultation status |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Consultation time |

---

### 28. `notifications` — System notifications

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Notification ID |
| `user_id` | UUID | FK → users.id, NOT NULL | Recipient |
| `type` | VARCHAR(30) | NOT NULL | Notification type enum |
| `title` | VARCHAR(200) | NOT NULL | Notification title |
| `body` | TEXT | | Notification body |
| `channel` | VARCHAR(20) | DEFAULT 'push' | Delivery channel (push, email, sms) |
| `data` | JSONB | DEFAULT '{}' | Extra data payload |
| `is_read` | BOOLEAN | DEFAULT false | Read status |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Created time |

**Indexes**: `idx_notifications_user_unread` (WHERE is_read = false)

---

## PostgreSQL Extensions Required

```sql
-- Enable required extensions in Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "postgis";         -- Geospatial queries
CREATE EXTENSION IF NOT EXISTS "vector";          -- pgvector for AI
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- Trigram search for medicine names
```

## Row Level Security (RLS) Summary

| Table | Policy | Description |
|-------|--------|-------------|
| `user_profiles` | SELECT own | Users read their own profile (`user_id = auth.uid()`) |
| `users` | SELECT own, admin all | Users see own row; admin sees all |
| `cats` | CRUD own | Owners manage their own cats |
| `appointment_slots` | SELECT public (true) | Anyone can read slots (for booking UI) |
| `appointment_slots` | INSERT/UPDATE/DELETE hospital admin | Admin manages slots for their hospital |
| `appointments` | SELECT own + vet + hospital | User, assigned vet, and hospital admin can view |
| `appointments` | **INSERT cat owner** | Cat owner can book (added migration 024: `user_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())`) |
| `appointments` | UPDATE vet + hospital admin | Status updates only |
| `medical_records` | SELECT owner + vet | Owner and treating vets |
| `chat_rooms` | SELECT participants | Only user and vet in the room |
| `messages` | SELECT room members | Only chat room participants |
| `messages` | INSERT room members | Vets and users can send messages (migration 014) |
| `orders` | SELECT buyer + store | Buyer and store owner |
| `hospitals/stores` | SELECT approved = true | Public read of approved listings |
| `hospitals/stores` | UPDATE admin | Admin write only |
| `treatments` | SELECT vet + owner | Treating vet and cat owner |
| `payments` | SELECT payer + admin | Payer and system admin |
| `review_responses` | SELECT all | Public like reviews |
| `products` | SELECT public (active only); INSERT/UPDATE/DELETE store owner | Store owners manage their own store's products (migration 018/019) |
| `product_categories` | INSERT authenticated | Any authenticated user can add categories |

## Table Count: **28 tables** — Applied Migrations: **025**

> **Migration history note**: 25 migration files applied on top of the initial schema. Key post-schema changes: `user_profiles` RLS fixed (022/023 — dropped recursive policy); `appointment_slots` uses `is_booked` not `is_available`; cat-owner INSERT policy on `appointments` (024); `chat_rooms.appointment_id` FK + `UNIQUE(appointment_id)` replaces `UNIQUE(user_id, vet_id)` (025 — one chat room per appointment).

---

## Backend API Endpoints (FastAPI / Cloud Run)

Certain data flows bypass Supabase RLS by routing through the FastAPI backend using the service-role key:

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /api/auth/register` | Public | Create Supabase auth user + user_profiles row |
| `POST /api/auth/login` | Public | Validate credentials, issue JWT + Supabase session tokens |
| `GET /api/auth/me` | Bearer JWT | Return authenticated user's profile |
| `GET /api/hospitals/{id}/vets` | Public | List verified vets (service role — bypasses user_profiles RLS) |
| `GET /api/hospitals/vet/{vet_id}` | Public | Get single vet's name + avatar (service role) |
| `POST /api/hospitals/vets` | Hospital admin JWT | Register new vet account (creates auth user + vet profile) |
| `GET /api/appointments/{id}` | Bearer JWT | Single appointment with participant verification (service role) |
| `GET /api/appointments/{id}/chat-room` | Bearer JWT | Get or create chat room for appointment (service role) |
| `GET /api/appointments/{id}/messages` | Bearer JWT | Load all messages for appointment's chat room (service role) |
| `POST /api/appointments/{id}/messages` | Bearer JWT | Send a message (service role — bypasses messages RLS) |
| `POST /api/payments/appointment-session` | Bearer JWT | Create Safepay checkout session for appointment platform fee |
| `POST /api/payments/order-session` | Bearer JWT | Create Safepay checkout session for order |
| `POST /api/payments/webhook` | Safepay HMAC | Receive payment confirmations, update appointment/order status |

---

## Transaction Pattern Player Role → Table Mapping

| Player Role | Database Tables |
|-------------|----------------|
| **Participant** | `users`, `user_profiles`, `vets` |
| **SpecificItem** | `cats`, `medical_records` |
| **Item** | `cat_breeds`, `medicines`, `hospital_services`, `products`, `product_categories`, `cat_health_knowledge` |
| **Place** | `hospitals`, `cat_stores` |
| **Transaction** | `appointments`, `appointment_slots`, `orders`, `chat_rooms`, `ai_consultations`, `reviews`, `offers` |
| **TransactionLineItem** | `order_items`, `messages` |
| **SubsequentTransaction** | `treatments`, `prescriptions`, `payments`, `patient_history`, `review_responses` |
| **System** | `notifications` |
