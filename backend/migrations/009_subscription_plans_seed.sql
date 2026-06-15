-- ============================================================
-- Migration 009: Seed Subscription Plans
-- ============================================================
-- Run after 008_subscriptions_schema.sql
-- Uses ON CONFLICT to allow idempotent re-runs.

-- ── Store Plans ──────────────────────────────────────────────
INSERT INTO subscription_plans
    (id, name, for_role, price_monthly, price_yearly, max_products, max_vets, features)
VALUES
(
    'store_free', 'Free', 'store_owner',
    0, 0,
    10, NULL,
    '["Up to 10 products","Standard listing","Email support"]'::jsonb
),
(
    'store_basic', 'Basic', 'store_owner',
    500, 5000,
    30, NULL,
    '["Up to 30 products","Standard listing","Priority email support","Basic analytics"]'::jsonb
),
(
    'store_growth', 'Growth', 'store_owner',
    1500, 15000,
    200, NULL,
    '["Up to 200 products","Priority listing in search","Real-time analytics","Dedicated support","5% platform fee"]'::jsonb
),
(
    'store_premium', 'Premium', 'store_owner',
    3500, 35000,
    NULL, NULL,
    '["Unlimited products","Featured store placement","AI-driven recommendations","Vet-approved badge eligibility","3% platform fee","API access"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name          = EXCLUDED.name,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly  = EXCLUDED.price_yearly,
    max_products  = EXCLUDED.max_products,
    features      = EXCLUDED.features,
    is_active     = TRUE;

-- ── Hospital Plans ───────────────────────────────────────────
INSERT INTO subscription_plans
    (id, name, for_role, price_monthly, price_yearly, max_products, max_vets, features)
VALUES
(
    'hosp_starter', 'Starter', 'hospital_admin',
    1500, 15000,
    NULL, 3,
    '["Up to 3 vets","50 appointments/month","Basic analytics","Email support"]'::jsonb
),
(
    'hosp_clinic', 'Clinic', 'hospital_admin',
    3500, 35000,
    NULL, 15,
    '["Up to 15 vets","Unlimited appointments","Advanced analytics","Priority support","Digital prescriptions","Patient history"]'::jsonb
),
(
    'hosp_hospital', 'Hospital', 'hospital_admin',
    7500, 75000,
    NULL, NULL,
    '["Unlimited vets","Unlimited everything","Custom integrations","Dedicated account manager","AI diagnostics","Multi-branch support"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name          = EXCLUDED.name,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly  = EXCLUDED.price_yearly,
    max_vets      = EXCLUDED.max_vets,
    features      = EXCLUDED.features,
    is_active     = TRUE;
