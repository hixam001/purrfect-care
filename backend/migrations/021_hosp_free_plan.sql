-- ============================================================
-- Migration 021: Add hosp_free plan for hospital_admin role
-- ============================================================

INSERT INTO subscription_plans (
    id, name, for_role,
    price_monthly, price_yearly,
    max_products, max_vets,
    features, is_active
)
VALUES (
    'hosp_free', 'Free', 'hospital_admin',
    0, 0,
    NULL, 1,
    '["1 vet profile","Up to 50 appointments/month","Basic hospital listing","Email support"]'::jsonb,
    true
)
ON CONFLICT (id) DO UPDATE SET
    name          = EXCLUDED.name,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly  = EXCLUDED.price_yearly,
    max_products  = EXCLUDED.max_products,
    max_vets      = EXCLUDED.max_vets,
    features      = EXCLUDED.features,
    is_active     = EXCLUDED.is_active;
