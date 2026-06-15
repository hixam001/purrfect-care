-- ============================================================
-- Migration 008: Subscription Plans & Subscriptions Tables
-- ============================================================

-- ── subscription_plans ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
    id             TEXT        PRIMARY KEY,           -- e.g. 'store_free', 'store_growth'
    name           TEXT        NOT NULL,
    for_role       TEXT        NOT NULL,              -- 'store_owner' | 'hospital_admin'
    price_monthly  INTEGER     NOT NULL DEFAULT 0,   -- PKR
    price_yearly   INTEGER     NOT NULL DEFAULT 0,   -- PKR
    max_products   INTEGER,                           -- NULL = unlimited
    max_vets       INTEGER,                           -- NULL = unlimited
    features       JSONB       NOT NULL DEFAULT '[]',
    is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── subscriptions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id         UUID        NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    plan_id            TEXT        NOT NULL REFERENCES subscription_plans(id),
    status             TEXT        NOT NULL DEFAULT 'pending_payment',
                                   -- pending_payment | active | cancelled | expired
    billing_cycle      TEXT        NOT NULL DEFAULT 'monthly',  -- monthly | yearly
    started_at         TIMESTAMPTZ,
    expires_at         TIMESTAMPTZ,
    safepay_order_id   TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_subscriptions_updated_at();

-- Indices
CREATE INDEX IF NOT EXISTS idx_subscriptions_profile_id ON subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status     ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_safepay    ON subscriptions(safepay_order_id);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE subscription_plans  ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions        ENABLE ROW LEVEL SECURITY;

-- Plans: public read, no user write
CREATE POLICY plans_public_read ON subscription_plans
    FOR SELECT USING (true);

-- Subscriptions: user sees only their own rows
CREATE POLICY subs_owner_select ON subscriptions
    FOR SELECT USING (
        profile_id = (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        )
    );
