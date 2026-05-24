-- ============================================================
-- Purrfect Care — Initial Schema Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";   -- for lat/lng proximity queries


-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
    'cat_owner', 'vet', 'hospital_admin', 'store_owner', 'admin'
);

CREATE TYPE appointment_status AS ENUM (
    'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
);

CREATE TYPE order_status AS ENUM (
    'pending', 'confirmed', 'preparing', 'ready',
    'out_for_delivery', 'delivered', 'cancelled', 'refunded'
);

CREATE TYPE payment_status AS ENUM (
    'pending', 'completed', 'failed', 'refunded'
);

CREATE TYPE prescription_status AS ENUM (
    'active', 'completed', 'cancelled'
);

CREATE TYPE message_type AS ENUM (
    'text', 'image', 'file', 'prescription_share'
);

CREATE TYPE notification_type AS ENUM (
    'welcome', 'appointment_booked', 'appointment_reminder',
    'new_message', 'new_prescription', 'order_placed',
    'order_status_update', 'new_review', 'system_alert',
    'appointment_confirmed', 'appointment_cancelled',
    'vet_verified', 'hospital_approved', 'store_approved'
);

CREATE TYPE notification_channel AS ENUM (
    'push', 'email', 'sms'
);


-- ============================================================
-- TABLE: user_profiles  (extends Supabase auth.users)
-- ============================================================

CREATE TABLE user_profiles (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id               UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name                  VARCHAR(100) NOT NULL,
    phone                 VARCHAR(20),
    avatar_url            TEXT,
    address               VARCHAR(255),
    city                  VARCHAR(100),
    country               VARCHAR(100),
    role                  user_role NOT NULL DEFAULT 'cat_owner',
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    latitude              DOUBLE PRECISION CHECK (latitude  BETWEEN -90  AND 90),
    longitude             DOUBLE PRECISION CHECK (longitude BETWEEN -180 AND 180),
    preferences           JSONB DEFAULT '{}',
    notification_settings VARCHAR(50) NOT NULL DEFAULT 'all',
    payment_customer_id   TEXT,
    last_login            TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_role    ON user_profiles(role);


-- ============================================================
-- TABLE: cat_breeds
-- ============================================================

CREATE TABLE cat_breeds (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                 VARCHAR(100) NOT NULL UNIQUE,
    origin_country       VARCHAR(100),
    size_category        VARCHAR(50),
    coat_type            VARCHAR(50),
    temperament          TEXT,
    description          TEXT,
    avg_lifespan_years   FLOAT,
    avg_weight_kg        FLOAT,
    common_health_issues TEXT[]  DEFAULT '{}',
    grooming_needs       TEXT[]  DEFAULT '{}',
    image_url            TEXT
);


-- ============================================================
-- TABLE: cats
-- ============================================================

CREATE TABLE cats (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name          VARCHAR(100) NOT NULL,
    breed_id      UUID REFERENCES cat_breeds(id) ON DELETE SET NULL,
    age_months    INTEGER CHECK (age_months >= 0),
    weight_kg     FLOAT   CHECK (weight_kg  >= 0),
    color         VARCHAR(50),
    gender        VARCHAR(10) CHECK (gender IN ('male', 'female')),
    photo_url     TEXT,
    is_neutered   BOOLEAN NOT NULL DEFAULT FALSE,
    microchip_id  VARCHAR(50),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cats_owner_id ON cats(owner_id);


-- ============================================================
-- TABLE: medical_records
-- ============================================================

CREATE TABLE medical_records (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cat_id               UUID NOT NULL UNIQUE REFERENCES cats(id) ON DELETE CASCADE,
    allergies            TEXT[]  DEFAULT '{}',
    existing_conditions  TEXT[]  DEFAULT '{}',
    vaccination_status   JSONB   DEFAULT '{}',
    blood_type           VARCHAR(10),
    notes                TEXT,
    last_updated         TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- TABLE: patient_history
-- ============================================================

CREATE TABLE patient_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cat_id          UUID NOT NULL REFERENCES cats(id) ON DELETE CASCADE,
    entry_type      VARCHAR(50) NOT NULL CHECK (
                        entry_type IN ('appointment','prescription','diagnosis','vaccination','surgery','note')
                    ),
    description     TEXT,
    appointment_id  UUID,
    prescription_id UUID,
    vet_id          UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patient_history_cat_id ON patient_history(cat_id);


-- ============================================================
-- TABLE: hospitals
-- ============================================================

CREATE TABLE hospitals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id   UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    phone           VARCHAR(20),
    email           VARCHAR(255),
    address         VARCHAR(500) NOT NULL,
    city            VARCHAR(100),
    banner_url      TEXT,
    operating_hours JSONB,
    latitude        DOUBLE PRECISION NOT NULL CHECK (latitude  BETWEEN -90  AND 90),
    longitude       DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_approved     BOOLEAN NOT NULL DEFAULT FALSE,
    rating          FLOAT   NOT NULL DEFAULT 0.0,
    total_reviews   INTEGER NOT NULL DEFAULT 0,
    page_config     JSONB   NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hospitals_city        ON hospitals(city);
CREATE INDEX idx_hospitals_is_approved ON hospitals(is_approved);


-- ============================================================
-- TABLE: hospital_services
-- ============================================================

CREATE TABLE hospital_services (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id       UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    name              VARCHAR(200) NOT NULL,
    description       TEXT,
    category          VARCHAR(50),
    price             FLOAT  NOT NULL CHECK (price >= 0),
    duration_minutes  INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes >= 5),
    is_active         BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_hospital_services_hospital_id ON hospital_services(hospital_id);


-- ============================================================
-- TABLE: vets
-- ============================================================

CREATE TABLE vets (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
    hospital_id       UUID REFERENCES hospitals(id) ON DELETE SET NULL,
    license_number    VARCHAR(50) NOT NULL,
    specialization    VARCHAR(100),
    experience_years  INTEGER CHECK (experience_years >= 0),
    bio               TEXT,
    qualifications    TEXT[]  DEFAULT '{}',
    is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
    rating            FLOAT   NOT NULL DEFAULT 0.0,
    total_reviews     INTEGER NOT NULL DEFAULT 0,
    verified_at       TIMESTAMPTZ
);

CREATE INDEX idx_vets_hospital_id  ON vets(hospital_id);
CREATE INDEX idx_vets_is_verified  ON vets(is_verified);


-- ============================================================
-- TABLE: appointment_slots
-- ============================================================

CREATE TABLE appointment_slots (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id  UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    vet_id       UUID NOT NULL REFERENCES vets(id)      ON DELETE CASCADE,
    slot_date    DATE NOT NULL,
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    is_booked    BOOLEAN NOT NULL DEFAULT FALSE,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_slots_vet_id      ON appointment_slots(vet_id);
CREATE INDEX idx_slots_slot_date   ON appointment_slots(slot_date);
CREATE INDEX idx_slots_is_booked   ON appointment_slots(is_booked);


-- ============================================================
-- TABLE: payments
-- ============================================================

CREATE TABLE payments (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
    appointment_id    UUID,
    order_id          UUID,
    amount            FLOAT NOT NULL,
    payment_method    VARCHAR(50),
    stripe_payment_id TEXT NOT NULL,
    status            payment_status NOT NULL DEFAULT 'pending',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at      TIMESTAMPTZ
);

CREATE INDEX idx_payments_user_id   ON payments(user_id);
CREATE INDEX idx_payments_status    ON payments(status);


-- ============================================================
-- TABLE: appointments
-- ============================================================

CREATE TABLE appointments (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
    cat_id           UUID NOT NULL REFERENCES cats(id)          ON DELETE RESTRICT,
    vet_id           UUID NOT NULL REFERENCES vets(id)          ON DELETE RESTRICT,
    hospital_id      UUID NOT NULL REFERENCES hospitals(id)     ON DELETE RESTRICT,
    service_id       UUID NOT NULL REFERENCES hospital_services(id) ON DELETE RESTRICT,
    slot_id          UUID NOT NULL UNIQUE REFERENCES appointment_slots(id) ON DELETE RESTRICT,
    appointment_date TIMESTAMPTZ NOT NULL,
    status           appointment_status NOT NULL DEFAULT 'pending',
    notes            TEXT,
    amount_paid      FLOAT,
    payment_id       UUID REFERENCES payments(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ
);

CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_vet_id  ON appointments(vet_id);
CREATE INDEX idx_appointments_status  ON appointments(status);


-- ============================================================
-- TABLE: medicines
-- ============================================================

CREATE TABLE medicines (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                  VARCHAR(200) NOT NULL,
    generic_name          VARCHAR(200),
    manufacturer          VARCHAR(200),
    ingredients           TEXT[]  DEFAULT '{}',
    dosage_form           VARCHAR(50),
    description           TEXT,
    usage_instructions    TEXT,
    contraindications     TEXT[]  DEFAULT '{}',
    allergy_warnings      TEXT[]  DEFAULT '{}',
    breed_warnings        TEXT[]  DEFAULT '{}',
    side_effects          TEXT[]  DEFAULT '{}',
    requires_prescription BOOLEAN NOT NULL DEFAULT TRUE,
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- TABLE: prescriptions
-- ============================================================

CREATE TABLE prescriptions (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    cat_id         UUID NOT NULL REFERENCES cats(id)       ON DELETE RESTRICT,
    vet_id         UUID NOT NULL REFERENCES vets(id)       ON DELETE RESTRICT,
    medicine_id    UUID NOT NULL REFERENCES medicines(id)  ON DELETE RESTRICT,
    dosage         VARCHAR(100) NOT NULL,
    frequency      VARCHAR(100) NOT NULL,
    duration_days  INTEGER NOT NULL CHECK (duration_days >= 1),
    instructions   TEXT,
    status         prescription_status NOT NULL DEFAULT 'active',
    prescribed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_cat_id ON prescriptions(cat_id);
CREATE INDEX idx_prescriptions_vet_id ON prescriptions(vet_id);


-- ============================================================
-- TABLE: chat_rooms
-- ============================================================

CREATE TABLE chat_rooms (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    vet_id          UUID NOT NULL REFERENCES vets(id)          ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ,
    unread_user     INTEGER NOT NULL DEFAULT 0,
    unread_vet      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, vet_id)
);

CREATE INDEX idx_chat_rooms_user_id ON chat_rooms(user_id);
CREATE INDEX idx_chat_rooms_vet_id  ON chat_rooms(vet_id);


-- ============================================================
-- TABLE: messages
-- ============================================================

CREATE TABLE messages (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id    UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
    content      VARCHAR(5000) NOT NULL,
    message_type message_type NOT NULL DEFAULT 'text',
    media_url    TEXT,
    is_read      BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_chat_room_id ON messages(chat_room_id);
CREATE INDEX idx_messages_sent_at      ON messages(sent_at);


-- ============================================================
-- TABLE: cat_stores
-- ============================================================

CREATE TABLE cat_stores (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id   UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    phone           VARCHAR(20),
    email           VARCHAR(255),
    address         VARCHAR(500) NOT NULL,
    city            VARCHAR(100),
    banner_url      TEXT,
    operating_hours JSONB,
    delivery_zones  JSONB,
    delivery_fee    FLOAT NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
    latitude        DOUBLE PRECISION NOT NULL CHECK (latitude  BETWEEN -90  AND 90),
    longitude       DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_approved     BOOLEAN NOT NULL DEFAULT FALSE,
    rating          FLOAT   NOT NULL DEFAULT 0.0,
    total_reviews   INTEGER NOT NULL DEFAULT 0,
    page_config     JSONB   NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cat_stores_city        ON cat_stores(city);
CREATE INDEX idx_cat_stores_is_approved ON cat_stores(is_approved);


-- ============================================================
-- TABLE: product_categories
-- ============================================================

CREATE TABLE product_categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url    TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0
);


-- ============================================================
-- TABLE: products
-- ============================================================

CREATE TABLE products (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id       UUID NOT NULL REFERENCES cat_stores(id)         ON DELETE CASCADE,
    category_id    UUID REFERENCES product_categories(id)          ON DELETE SET NULL,
    name           VARCHAR(200) NOT NULL,
    description    TEXT,
    price          FLOAT   NOT NULL CHECK (price >= 0),
    discount_price FLOAT   CHECK (discount_price >= 0),
    images         TEXT[]  DEFAULT '{}',
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    brand          VARCHAR(100),
    weight         FLOAT   CHECK (weight >= 0),
    unit           VARCHAR(20),
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    rating         FLOAT   NOT NULL DEFAULT 0.0,
    total_reviews  INTEGER NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_store_id    ON products(store_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active   ON products(is_active);


-- ============================================================
-- TABLE: orders
-- ============================================================

CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
    store_id            UUID NOT NULL REFERENCES cat_stores(id)    ON DELETE RESTRICT,
    subtotal            FLOAT NOT NULL,
    delivery_fee        FLOAT NOT NULL DEFAULT 0,
    total               FLOAT NOT NULL,
    status              order_status NOT NULL DEFAULT 'pending',
    payment_id          UUID REFERENCES payments(id) ON DELETE SET NULL,
    delivery_address    TEXT NOT NULL,
    delivery_latitude   DOUBLE PRECISION CHECK (delivery_latitude  BETWEEN -90  AND 90),
    delivery_longitude  DOUBLE PRECISION CHECK (delivery_longitude BETWEEN -180 AND 180),
    notes               TEXT,
    ordered_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at        TIMESTAMPTZ
);

CREATE INDEX idx_orders_user_id  ON orders(user_id);
CREATE INDEX idx_orders_store_id ON orders(store_id);
CREATE INDEX idx_orders_status   ON orders(status);


-- ============================================================
-- TABLE: order_items
-- ============================================================

CREATE TABLE order_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id    UUID NOT NULL REFERENCES orders(id)   ON DELETE CASCADE,
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity    INTEGER NOT NULL CHECK (quantity >= 1),
    unit_price  FLOAT   NOT NULL,
    total_price FLOAT   NOT NULL
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);


-- ============================================================
-- TABLE: reviews
-- ============================================================

CREATE TABLE reviews (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES hospitals(id)  ON DELETE CASCADE,
    store_id    UUID REFERENCES cat_stores(id) ON DELETE CASCADE,
    vet_id      UUID REFERENCES vets(id)       ON DELETE CASCADE,
    rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     VARCHAR(2000),
    status      VARCHAR(20) NOT NULL DEFAULT 'published',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- At least one target must be specified
    CHECK (
        (hospital_id IS NOT NULL)::INT +
        (store_id    IS NOT NULL)::INT +
        (vet_id      IS NOT NULL)::INT = 1
    )
);

CREATE INDEX idx_reviews_hospital_id ON reviews(hospital_id);
CREATE INDEX idx_reviews_store_id    ON reviews(store_id);
CREATE INDEX idx_reviews_vet_id      ON reviews(vet_id);


-- ============================================================
-- TABLE: review_responses
-- ============================================================

CREATE TABLE review_responses (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id     UUID NOT NULL UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,
    responder_id  UUID NOT NULL REFERENCES user_profiles(id)  ON DELETE RESTRICT,
    response_text VARCHAR(2000) NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'published',
    responded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- TABLE: offers
-- ============================================================

CREATE TABLE offers (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id      UUID REFERENCES hospitals(id)  ON DELETE CASCADE,
    store_id         UUID REFERENCES cat_stores(id) ON DELETE CASCADE,
    title            VARCHAR(200) NOT NULL,
    description      TEXT,
    discount_percent FLOAT CHECK (discount_percent BETWEEN 0 AND 100),
    promo_code       VARCHAR(50),
    valid_from       TIMESTAMPTZ NOT NULL,
    valid_to         TIMESTAMPTZ NOT NULL,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    applicable_items TEXT[]  DEFAULT '{}',
    CHECK (valid_to > valid_from)
);

CREATE INDEX idx_offers_hospital_id ON offers(hospital_id);
CREATE INDEX idx_offers_store_id    ON offers(store_id);
CREATE INDEX idx_offers_is_active   ON offers(is_active);


-- ============================================================
-- TABLE: notifications
-- ============================================================

CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    type       notification_type    NOT NULL,
    title      VARCHAR(200) NOT NULL,
    body       TEXT,
    channel    notification_channel NOT NULL DEFAULT 'push',
    data       JSONB   NOT NULL DEFAULT '{}',
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id  ON notifications(user_id);
CREATE INDEX idx_notifications_is_read  ON notifications(is_read);
CREATE INDEX idx_notifications_type     ON notifications(type);


-- ============================================================
-- Add FK constraints that have circular dependencies
-- ============================================================

ALTER TABLE patient_history
    ADD CONSTRAINT fk_ph_appointment  FOREIGN KEY (appointment_id)  REFERENCES appointments(id)  ON DELETE SET NULL,
    ADD CONSTRAINT fk_ph_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_ph_vet          FOREIGN KEY (vet_id)          REFERENCES vets(id)           ON DELETE SET NULL;

ALTER TABLE payments
    ADD CONSTRAINT fk_payments_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_payments_order       FOREIGN KEY (order_id)       REFERENCES orders(id)       ON DELETE SET NULL;


-- ============================================================
-- Row Level Security (RLS) — Enable on all tables
-- ============================================================

ALTER TABLE user_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_breeds         ENABLE ROW LEVEL SECURITY;
ALTER TABLE cats               ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_services  ENABLE ROW LEVEL SECURITY;
ALTER TABLE vets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_slots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines          ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms         ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cat_stores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_responses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments           ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- Basic RLS Policies (read-only public + owner write)
-- Your FastAPI backend uses service_role key → bypasses RLS
-- These protect direct client access (anon key)
-- ============================================================

-- user_profiles: users can only see and edit their own profile
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- cats: owners manage their own cats
CREATE POLICY "Owners can manage own cats"
    ON cats FOR ALL
    USING (owner_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
    ));

-- hospitals & stores: public read
CREATE POLICY "Public can read hospitals"
    ON hospitals FOR SELECT USING (is_active = TRUE AND is_approved = TRUE);

CREATE POLICY "Public can read stores"
    ON cat_stores FOR SELECT USING (is_active = TRUE AND is_approved = TRUE);

-- cat_breeds & medicines: public read
CREATE POLICY "Public can read cat breeds"
    ON cat_breeds FOR SELECT USING (TRUE);

CREATE POLICY "Public can read medicines"
    ON medicines FOR SELECT USING (is_active = TRUE);

-- notifications: users see only their own
CREATE POLICY "Users see own notifications"
    ON notifications FOR ALL
    USING (user_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
    ));

-- orders: users see own orders
CREATE POLICY "Users see own orders"
    ON orders FOR SELECT
    USING (user_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
    ));

-- appointments: users see own appointments
CREATE POLICY "Users see own appointments"
    ON appointments FOR SELECT
    USING (user_id IN (
        SELECT id FROM user_profiles WHERE user_id = auth.uid()
    ));

-- chat_rooms: participants only
CREATE POLICY "Chat participants only"
    ON chat_rooms FOR ALL
    USING (
        user_id IN (SELECT id FROM user_profiles WHERE user_id = auth.uid())
        OR
        vet_id IN (SELECT id FROM vets WHERE user_id IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        ))
    );
