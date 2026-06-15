/**
 * SubscriptionPage
 *
 * Shown after login when the user has no active subscription.
 * - Store owners see 4 plans (Free, Basic, Growth, Premium)
 * - Hospital admins see 3 paid plans (Starter, Clinic, Hospital)
 * - Free plan activates directly; paid plans redirect to Safepay
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const API      = import.meta.env.VITE_API_URL || 'https://server-vmvwkwachq-uc.a.run.app'
const RETURN   = `${window.location.origin}/payment/return`
const CANCEL   = `${window.location.origin}/subscription`

const ROLE_LABELS = {
  store_owner:    { title:'Choose Your Store Plan',    sub:'Select the plan that best fits your store.' },
  hospital_admin: { title:'Choose Your Hospital Plan', sub:'All hospital plans include mandatory subscription. Choose a plan to activate your dashboard.' },
}

const PLAN_COLORS = {
  store_free:    { bg:'rgba(160,140,125,.1)', border:'#b8ceb5',            badge:null           },
  store_basic:   { bg:'rgba(85,107,47,.08)', border:'rgba(85,107,47,.3)',  badge:null           },
  store_growth:  { bg:'rgba(94,71,73,.1)',   border:'rgba(94,71,73,.35)',  badge:'Best Value'   },
  store_premium: { bg:'rgba(196,140,56,.1)', border:'rgba(196,140,56,.35)',badge:'Most Popular' },
  hosp_free:     { bg:'rgba(160,140,125,.1)', border:'#b8ceb5',            badge:null           },
  hosp_starter:  { bg:'rgba(85,107,47,.08)', border:'rgba(85,107,47,.3)',  badge:null           },
  hosp_clinic:   { bg:'rgba(94,71,73,.1)',   border:'rgba(94,71,73,.35)',  badge:'Most Popular' },
  hosp_hospital: { bg:'rgba(196,140,56,.1)', border:'rgba(196,140,56,.35)',badge:null           },
}

function formatPrice(pkr) {
  if (pkr === 0) return 'Free'
  return `₨ ${pkr.toLocaleString()}`
}

export default function SubscriptionPage() {
  const { user, token, subscription, refreshSubscription, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const role     = user?.role || 'store_owner'
  const labels   = ROLE_LABELS[role] || ROLE_LABELS.store_owner

  const [plans,    setPlans]    = useState([])
  const [billing,  setBilling]  = useState('monthly')
  const [selected, setSelected] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [working,  setWorking]  = useState(false)
  const [err,      setErr]      = useState('')

  // If user already has an active subscription, redirect to dashboard
  useEffect(() => {
    if (subscription?.subscription?.status === 'active') {
      navigate(role === 'hospital_admin' ? '/hospital/dashboard' : '/store/dashboard', { replace: true })
    }
  }, [subscription, role, navigate])

  // Fetch plans for this role — wait for auth to finish so role is known
  useEffect(() => {
    if (authLoading) return   // auth still resolving, role not yet confirmed
    fetch(`${API}/api/subscriptions/plans?role=${role}`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : []
        setPlans(list)
        // Default selection
        const defaultPlan = list.find(p => p.id === 'store_growth' || p.id === 'hosp_clinic') || list[0]
        if (defaultPlan) setSelected(defaultPlan.id)
      })
      .catch(() => setErr('Failed to load plans. Please refresh.'))
      .finally(() => setLoading(false))
  }, [role, authLoading])

  async function handleSelectPlan() {
    if (!selected) return
    const plan = plans.find(p => p.id === selected)
    if (!plan) return

    setErr('')
    setWorking(true)

    try {
      // Free plan — activate directly
      if (plan.price_monthly === 0) {
        const res  = await fetch(`${API}/api/subscriptions/activate`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ plan_id: plan.id }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Activation failed.')
        await refreshSubscription()
        navigate('/store/dashboard', { replace: true })
        return
      }

      // Paid plan — create Safepay session
      const res  = await fetch(`${API}/api/subscriptions/checkout`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          plan_id:       plan.id,
          billing_cycle: billing,
          redirect_url:  RETURN + '?type=subscription',
          cancel_url:    CANCEL,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Could not initiate payment.')
      window.location.href = data.checkout_url
    } catch (e) {
      setErr(e.message)
    } finally {
      setWorking(false)
    }
  }

  const selectedPlan = plans.find(p => p.id === selected)
  const price = selectedPlan
    ? billing === 'monthly' ? selectedPlan.price_monthly : selectedPlan.price_yearly
    : 0

  return (
    <div className="min-h-screen" style={{ background:'linear-gradient(135deg,#dbe8d8 0%,#EFE5DC 100%)' }}>
      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                 style={{ background:'linear-gradient(135deg,#5e4749,#4a373a)' }}>🐱</div>
            <span className="font-display font-black text-xl text-espresso">
              Purrfect<span className="text-olive">Care</span>
            </span>
          </div>
          <span className="t-label mb-3 inline-block">Subscription Required</span>
          <h1 className="font-display font-black text-espresso tracking-tight mb-2"
              style={{ fontSize:'clamp(1.6rem,3vw,2.4rem)' }}>
            {labels.title}
          </h1>
          <p className="text-clay-muted text-[15px] max-w-xl mx-auto">{labels.sub}</p>
        </div>

        {/* Billing toggle (hidden for free-only role) */}
        {plans.some(p => p.price_monthly > 0) && (
          <div className="flex justify-center mb-8">
            <div className="flex gap-1 p-1 rounded-xl" style={{ background:'rgba(255,255,255,.6)', border:'1px solid #b8ceb5' }}>
              {[
                { key:'monthly', label:'Monthly' },
                { key:'yearly',  label:'Yearly (2 months free)' },
              ].map(b => (
                <button key={b.key} type="button" onClick={() => setBilling(b.key)}
                        className="px-5 py-2 rounded-lg text-[13px] font-bold transition-all"
                        style={{
                          background: billing === b.key ? '#5e4749' : 'transparent',
                          color:      billing === b.key ? '#fff'    : '#4E342E',
                        }}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-20 text-clay-muted text-[14px]">Loading plans…</div>
        )}

        {!loading && (
          <div className={`grid gap-4 mb-8 ${plans.length === 4 ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
            {plans.map(plan => {
              const style  = PLAN_COLORS[plan.id] || { bg:'rgba(255,255,255,.5)', border:'#b8ceb5', badge:null }
              const isSelected = selected === plan.id
              const isFree = plan.price_monthly === 0
              const displayPrice = isFree ? 'Free' : formatPrice(billing === 'monthly' ? plan.price_monthly : plan.price_yearly)

              return (
                <div key={plan.id} onClick={() => setSelected(plan.id)}
                     className="relative p-5 rounded-2xl cursor-pointer transition-all"
                     style={{
                       background: style.bg,
                       border:     `2px solid ${isSelected ? '#5e4749' : style.border}`,
                       transform:  isSelected ? 'translateY(-2px)' : 'none',
                       boxShadow:  isSelected ? '0 8px 24px rgba(94,71,73,.18)' : 'none',
                     }}>

                  {style.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="t-label text-[9px]">{style.badge}</span>
                    </div>
                  )}

                  <div className="font-display font-black text-[1.1rem] text-espresso mb-1">{plan.name}</div>

                  <div className="font-black text-[1.8rem] text-olive leading-none mb-0.5">{displayPrice}</div>
                  {!isFree && (
                    <div className="t-mono text-[9px] text-clay-muted mb-3">
                      {billing === 'monthly' ? 'per month' : 'per year'}
                    </div>
                  )}
                  {isFree && <div className="t-mono text-[9px] text-olive mb-3">No payment required</div>}

                  {plan.max_products !== null && plan.max_products !== undefined && (
                    <div className="t-mono text-[10px] font-bold mb-3"
                         style={{ color:'#5e4749' }}>
                      {plan.max_products} products max
                    </div>
                  )}
                  {plan.max_vets !== null && plan.max_vets !== undefined && (
                    <div className="t-mono text-[10px] font-bold mb-3"
                         style={{ color:'#5e4749' }}>
                      {plan.max_vets} vets max
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    {(plan.features || []).map(f => (
                      <div key={f} className="flex items-start gap-2 text-[11px] text-espresso-soft">
                        <span className="text-olive flex-shrink-0 mt-0.5">✓</span>{f}
                      </div>
                    ))}
                  </div>

                  {isSelected && (
                    <div className="mt-4 pt-3 border-t flex items-center gap-1.5" style={{ borderColor:'rgba(94,71,73,.2)' }}>
                      <div className="w-4 h-4 rounded-full bg-olive flex items-center justify-center text-white text-[10px]">✓</div>
                      <span className="t-mono text-[9px] text-olive font-bold">Selected</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* CTA */}
        {!loading && selected && (
          <div className="text-center">
            {err && (
              <div className="mb-4 px-4 py-3 rounded-xl text-[13px] inline-block"
                   style={{ background:'rgba(196,56,56,.08)', border:'1px solid rgba(196,56,56,.2)', color:'#9B2020' }}>
                ⚠️ {err}
              </div>
            )}

            <button type="button" onClick={handleSelectPlan} disabled={working}
                    className="btn btn-olive !py-4 !px-10 text-[15px]"
                    style={{ opacity: working ? .7 : 1 }}>
              {working
                ? <span className="flex items-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Processing…
                  </span>
                : selectedPlan?.price_monthly === 0
                  ? 'Start Free — No Payment Required'
                  : `Continue to Payment — ${formatPrice(price)} →`
              }
            </button>

            <div className="mt-4 text-[12px] text-clay-muted">
              {selectedPlan?.price_monthly === 0
                ? 'You can upgrade your plan at any time from your dashboard.'
                : 'You will be redirected to Safepay for secure payment processing.'
              }
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
