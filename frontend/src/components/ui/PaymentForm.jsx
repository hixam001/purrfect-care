// PaymentForm — Safepay-only payment. | Calls the backend to create a Safepay session then redirects | the user to the Safepay-hosted checkout page. All payment | method selection (card, wallet, etc.) is handled by Safepay. | Props: | amount      : string  — formatted display string, e.g. "₨ 1,500/mo" | amountPaisa : number  — amount in PKR paisa (e.g. 150000 = ₨ 1,500) | orderId     : string  — unique order identifier | title       : string  — plan name / billing label | onBack      : () => void | submitting  : bool    — if parent is already doing async work
import { useState } from 'react'

const API          = import.meta.env.VITE_API_URL || 'https://server-vmvwkwachq-uc.a.run.app'
const APP_BASE_URL = 'https://purrfect-care-app.web.app'

// Parse "₨ 1,500/mo" or "₨ 15,000/yr" → integer paisa value
export function parsePaisa(amountStr = '') {
  const digits = amountStr.replace(/[^\d]/g, '')
  const pkr    = parseInt(digits, 10) || 0
  return pkr * 100   // convert to paisa
}

export default function PaymentForm({
  amount    = '₨ 0',
  amountPaisa,
  orderId,
  title     = 'Subscription',
  onBack,
  submitting = false,
}) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const paisa = amountPaisa ?? parsePaisa(amount)
  const oid   = orderId     ?? `PC-${Date.now()}`

  async function handleSafepayCheckout() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/payments/create-session`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          amount:       paisa,
          currency:     'PKR',
          order_id:     oid,
          redirect_url: `${APP_BASE_URL}/payment/return?status=success&order=${oid}`,
          cancel_url:   `${APP_BASE_URL}/payment/return?status=cancelled&order=${oid}`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to create payment session.')
      if (!data.checkout_url) throw new Error('No checkout URL returned by payment gateway.')

      // Redirect to Safepay-hosted checkout
      window.location.href = data.checkout_url
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  const busy = loading || submitting

  return (
    <div>
      {/* Amount header */}
      <div className="mb-8">
        <div className="t-mono text-[10px] text-clay-muted mb-1">AMOUNT DUE</div>
        <div className="font-display font-black text-[2.4rem] text-espresso leading-none">{amount}</div>
        <div className="text-[13px] text-clay-muted mt-1">{title}</div>
      </div>

      {/* Safepay checkout card */}
      <div className="rounded-2xl p-6 mb-6"
           style={{ background: 'rgba(255,255,255,.75)', border: '1.5px solid #b8ceb5' }}>

        {/* Safepay branding */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
               style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)' }}>
            💳
          </div>
          <div>
            <div className="font-bold text-[14px] text-espresso">Safepay Checkout</div>
            <div className="text-[12px] text-clay-muted">Secure, hosted payment by Safepay</div>
          </div>
          <div className="ml-auto text-[10px] font-mono px-2 py-1 rounded-lg"
               style={{ background: 'rgba(94,71,73,.08)', color: '#5e4749' }}>
            POWERED BY SAFEPAY
          </div>
        </div>

        {/* What user can pay with — informational only, Safepay shows actual UI */}
        <div className="flex flex-col gap-2 mb-5">
          {[
            { icon: '💳', label: 'Credit / Debit Card',  sub: 'Visa, Mastercard, UnionPay' },
            { icon: '📱', label: 'Mobile Wallets',        sub: 'JazzCash, Easypaisa, NayaPay' },
            { icon: '🏦', label: 'Bank Transfer (IBFT)',  sub: 'All major Pakistani banks' },
          ].map(m => (
            <div key={m.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                 style={{ background: 'rgba(94,71,73,.04)', border: '1px solid rgba(184,206,181,.6)' }}>
              <span className="text-lg">{m.icon}</span>
              <div>
                <div className="text-[13px] font-semibold text-espresso">{m.label}</div>
                <div className="text-[11px] text-clay-muted">{m.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[12px] text-clay-muted text-center">
          Clicking the button below will open the Safepay secure checkout page
          where you can choose your preferred payment method.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-[13px]"
             style={{ background: 'rgba(196,56,56,.08)', border: '1px solid rgba(196,56,56,.2)', color: '#9B2020' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onBack && (
          <button type="button" onClick={onBack} disabled={busy}
                  className="btn btn-outline flex-1 justify-center !py-3"
                  style={{ opacity: busy ? .5 : 1 }}>
            ← Back
          </button>
        )}
        <button
          type="button"
          onClick={handleSafepayCheckout}
          disabled={busy}
          className="btn btn-olive flex-1 justify-center !py-3"
          style={{ opacity: busy ? .7 : 1 }}
        >
          {busy ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              Redirecting to Safepay…
            </span>
          ) : `Proceed to Safepay → Pay ${amount}`}
        </button>
      </div>

      {/* Security badge */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <span className="text-[10px] text-clay-muted">🔒 256-bit SSL · PCI DSS compliant · Secured by Safepay</span>
      </div>
    </div>
  )
}
