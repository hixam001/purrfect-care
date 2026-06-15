/**
 * PaymentReturnPage
 *
 * Safepay redirects here after the user completes (or cancels) a payment.
 * Expected query params:
 *   status = "success" | "cancelled"
 *   order  = order ID string
 *   type   = "subscription" | "appointment" | "order" (optional — defaults to legacy flow)
 *
 * Behaviour:
 *   type=subscription + success → refresh subscription in AuthContext → redirect to dashboard
 *   type=subscription + cancelled → back to /subscription to try again
 *   anything else success → show pending review confirmation
 *   anything else cancelled → show cancelled screen
 */
import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function PaymentReturnPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { refreshSubscription, user } = useAuth()

  const status    = params.get('status') || 'cancelled'
  const order     = params.get('order')  || ''
  const type      = params.get('type')   || ''
  const isSuccess = status === 'success'

  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (type === 'subscription' && isSuccess) {
      setRefreshing(true)
      refreshSubscription()
        .then(() => {
          const role = user?.role
          const dest = role === 'hospital_admin' ? '/hospital/dashboard' : '/store/dashboard'
          navigate(dest, { replace: true })
        })
        .catch(() => setRefreshing(false))
    }
  }, [type, isSuccess, refreshSubscription, user, navigate])

  // Subscription cancelled → back to plan selection
  if (type === 'subscription' && !isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
           style={{ background:'linear-gradient(135deg,#dbe8d8 0%,#EFE5DC 100%)' }}>
        <div className="max-w-lg w-full text-center rounded-3xl p-10"
             style={{ background:'rgba(255,255,255,.8)', backdropFilter:'blur(14px)', border:'1px solid rgba(196,140,56,.3)' }}>
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-6"
               style={{ background:'rgba(196,140,56,.12)', border:'2px solid rgba(196,140,56,.3)' }}>⚠️</div>
          <h1 className="font-display font-black text-[2rem] text-espresso tracking-tight mb-3">
            Payment Cancelled
          </h1>
          <p className="text-clay-muted text-[15px] mb-6">
            No charge was made. You can retry or choose a different plan.
          </p>
          <Link to="/subscription" className="btn btn-olive justify-center w-full !py-3 no-underline inline-flex">
            ← Back to Plan Selection
          </Link>
        </div>
      </div>
    )
  }

  // Appointment payment cancelled
  if (type === 'appointment' && !isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
           style={{ background:'linear-gradient(135deg,#dbe8d8 0%,#EFE5DC 100%)' }}>
        <div className="max-w-lg w-full text-center rounded-3xl p-10"
             style={{ background:'rgba(255,255,255,.8)', backdropFilter:'blur(14px)', border:'1px solid rgba(196,140,56,.3)' }}>
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-6"
               style={{ background:'rgba(196,140,56,.12)', border:'2px solid rgba(196,140,56,.3)' }}>⚠️</div>
          <h1 className="font-display font-black text-[2rem] text-espresso tracking-tight mb-3">
            Booking Cancelled
          </h1>
          <p className="text-clay-muted text-[15px] mb-6">
            Your payment was cancelled and no charge was made. Your booking has not been confirmed.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/find-vets" className="btn btn-olive justify-center w-full !py-3 no-underline inline-flex">
              Find a Vet
            </Link>
            <Link to="/dashboard" className="text-[13px] font-semibold" style={{ color:'#5e4749' }}>
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Appointment payment success
  if (type === 'appointment' && isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
           style={{ background:'linear-gradient(135deg,#dbe8d8 0%,#EFE5DC 100%)' }}>
        <div className="max-w-lg w-full text-center rounded-3xl p-10"
             style={{ background:'rgba(255,255,255,.8)', backdropFilter:'blur(14px)', border:'1px solid rgba(94,71,73,.25)' }}>
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-6"
               style={{ background:'rgba(94,71,73,.12)', border:'2px solid rgba(94,71,73,.25)' }}>📅</div>
          <div className="t-label mb-4 inline-block">Booking Confirmed</div>
          <h1 className="font-display font-black text-[2rem] text-espresso tracking-tight mb-3">
            You're booked!
          </h1>
          <p className="text-clay-muted text-[15px] mb-2">
            Your platform fee has been processed successfully.
          </p>
          <p className="text-clay-muted text-[14px] mb-5">
            Your appointment is <strong className="text-espresso">pending confirmation</strong> from the hospital.
            You will be notified once confirmed.
          </p>
          {order && (
            <div className="px-4 py-3 rounded-xl mb-5 text-[12px] font-mono"
                 style={{ background:'rgba(94,71,73,.06)', color:'#5e4749' }}>
              Reference: {order}
            </div>
          )}
          <div className="p-3 rounded-xl mb-6 text-[12px]"
               style={{ background:'rgba(196,140,56,.07)', border:'1px solid rgba(196,140,56,.2)', color:'#7A4F10' }}>
            The hospital's consultation fee is billed separately at the clinic on the day of your appointment.
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/dashboard" className="btn btn-olive justify-center w-full !py-3 no-underline inline-flex">
              Go to Dashboard
            </Link>
            <Link to="/find-vets" className="text-[13px] font-semibold" style={{ color:'#5e4749' }}>
              ← Book another appointment
            </Link>
          </div>
        </div>
      </div>
    )
  }



  // Subscription success — show brief loader while redirecting
  if (type === 'subscription' && isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
           style={{ background:'linear-gradient(135deg,#dbe8d8 0%,#EFE5DC 100%)' }}>
        <div className="text-center">
          <svg className="animate-spin w-10 h-10 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#5e4749" strokeWidth="3" opacity=".3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#5e4749" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <p className="text-clay-muted text-[15px]">Activating your subscription…</p>
        </div>
      </div>
    )
  }

  // Legacy / registration payment return
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: 'linear-gradient(135deg,#dbe8d8 0%,#EFE5DC 100%)' }}>
      <div className="max-w-lg w-full text-center rounded-3xl p-10"
           style={{
             background:    'rgba(255,255,255,.8)',
             backdropFilter:'blur(14px)',
             border:        isSuccess ? '1px solid rgba(94,71,73,.25)' : '1px solid rgba(196,140,56,.3)',
           }}>

        <div className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-6"
             style={{
               background: isSuccess ? 'rgba(94,71,73,.12)' : 'rgba(196,140,56,.12)',
               border:     isSuccess ? '2px solid rgba(94,71,73,.25)' : '2px solid rgba(196,140,56,.3)',
             }}>
          {isSuccess ? '✅' : '⚠️'}
        </div>

        {isSuccess ? (
          <>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                 style={{ background:'rgba(196,140,56,.1)', border:'1px solid rgba(196,140,56,.25)' }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background:'#b87c2a' }} />
              <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color:'#b87c2a' }}>
                Pending Review
              </span>
            </div>

            <h1 className="font-display font-black text-[2rem] text-espresso tracking-tight mb-3">
              Payment Confirmed!
            </h1>
            <p className="text-clay-muted text-[15px] mb-2">
              Your payment was processed and your application is under review.
            </p>
            <p className="text-clay-muted text-[14px] mb-6">
              Our team will review your documents within <strong className="text-espresso">24–48 hours</strong>.
              You will receive an email once your account is approved.
            </p>

            {order && (
              <div className="px-4 py-3 rounded-xl mb-6 text-[12px] font-mono"
                   style={{ background:'rgba(94,71,73,.06)', color:'#5e4749' }}>
                Reference: {order}
              </div>
            )}

            <Link to="/" className="btn btn-olive justify-center w-full !py-3 no-underline inline-flex">
              ← Return to Home
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-display font-black text-[2rem] text-espresso tracking-tight mb-3">
              Payment Cancelled
            </h1>
            <p className="text-clay-muted text-[15px] mb-6">
              No charge was made. You can try again at any time.
            </p>
            <div className="flex flex-col gap-3">
              <Link to="/hospital/register" className="btn btn-olive justify-center !py-3 no-underline inline-flex">
                Hospital Registration
              </Link>
              <Link to="/store/register" className="btn btn-outline justify-center !py-3 no-underline inline-flex">
                Store Registration
              </Link>
              <Link to="/" className="text-[13px] font-semibold" style={{ color:'#5e4749' }}>
                ← Back to Home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
