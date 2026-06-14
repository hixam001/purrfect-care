/**
 * PaymentForm — full payment UI with three methods:
 *  - Credit/Debit Card (animated preview)
 *  - Mobile Wallet (JazzCash / Easypaisa)
 *  - Bank Transfer
 *
 * Props:
 *   amount      : string   — formatted amount string e.g. "₨ 2,500"
 *   onSuccess   : () => void
 *   onBack      : () => void
 *   title       : string   — optional override title
 */
import { useState } from 'react'

const METHODS = [
  { id:'card',   icon:'💳', label:'Credit / Debit Card',       sub:'Visa · Mastercard · UBL · HBL'        },
  { id:'jazz',   icon:'📱', label:'Mobile Wallet',              sub:'JazzCash · Easypaisa · SadaPay'       },
  { id:'bank',   icon:'🏦', label:'Bank Transfer',              sub:'Direct IBFT · Interbank Transfer'     },
]

const WALLETS = [
  { id:'jazzcash',  label:'JazzCash',  color:'#E60000', icon:'/jazzcash.svg'  },
  { id:'easypaisa', label:'Easypaisa', color:'#00A651', icon:'/easypaisa.svg' },
  { id:'sadapay',   label:'SadaPay',   color:'#1A1A2E', icon:'/sadapay.svg'   },
]

function CreditCardPreview({ number, name, expiry }) {
  const formatted = number.replace(/\s/g,'').padEnd(16,'•').replace(/(.{4})/g,'$1 ').trim()
  return (
    <div
      className="w-full max-w-[320px] h-[185px] rounded-2xl p-6 relative overflow-hidden mx-auto mb-6 select-none"
      style={{ background:'linear-gradient(135deg,#4a373a 0%,#5e4749 50%,#7a5e60 100%)' }}
    >
      {/* Circles */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full"
           style={{ background:'rgba(255,255,255,.08)', transform:'translate(30%,-30%)' }} />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full"
           style={{ background:'rgba(255,255,255,.06)', transform:'translate(-30%,30%)' }} />

      {/* Chip */}
      <div className="w-10 h-7 rounded-md mb-4" style={{ background:'rgba(255,255,255,.25)', backdropFilter:'blur(4px)' }} />

      {/* Number */}
      <div className="font-mono text-[17px] font-bold text-white tracking-[.15em] mb-4">
        {formatted}
      </div>

      {/* Name + Expiry */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[9px] text-white/60 font-mono uppercase mb-0.5">Card Holder</div>
          <div className="text-[13px] font-bold text-white uppercase">{name || 'YOUR NAME'}</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-white/60 font-mono uppercase mb-0.5">Expires</div>
          <div className="text-[13px] font-bold text-white">{expiry || 'MM/YY'}</div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentForm({ amount = '₨ 0', onSuccess, onBack, title = 'Complete Payment' }) {
  const [method,   setMethod]   = useState('card')
  const [wallet,   setWallet]   = useState('jazzcash')
  const [cardNum,  setCardNum]  = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry,   setExpiry]   = useState('')
  const [cvv,      setCvv]      = useState('')
  const [mobile,   setMobile]   = useState('')
  const [bankRef,  setBankRef]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)

  const inputCls = "w-full px-4 py-3 rounded-xl text-[14px] text-espresso outline-none transition-all"
  const inputSty = { background:'rgba(255,255,255,.8)', border:'1.5px solid #b8ceb5' }
  const fi = e => { e.target.style.borderColor='#5e4749'; e.target.style.boxShadow='0 0 0 3px rgba(85,107,47,.12)' }
  const fo = e => { e.target.style.borderColor='#b8ceb5'; e.target.style.boxShadow='none' }

  function formatCard(v) {
    return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim()
  }
  function formatExpiry(v) {
    const d = v.replace(/\D/g,'').slice(0,4)
    return d.length > 2 ? d.slice(0,2)+'/'+d.slice(2) : d
  }

  async function handlePay() {
    setLoading(true)
    await new Promise(r => setTimeout(r, 2000))
    setLoading(false)
    setSuccess(true)
    setTimeout(onSuccess, 1800)
  }

  if (success) return (
    <div className="text-center py-12 px-6">
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-5 animate-bounce"
           style={{ background:'rgba(94,71,73,.15)', border:'2px solid rgba(94,71,73,.3)' }}>✅</div>
      <h3 className="font-display font-black text-[1.6rem] text-espresso mb-2">Payment Successful!</h3>
      <p className="text-clay-muted text-[14px] mb-2">{amount} paid successfully</p>
      <div className="t-mono text-[10px] text-olive">Redirecting…</div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="t-mono text-[10px] text-clay-muted mb-1">AMOUNT DUE</div>
        <div className="font-display font-black text-[2.2rem] text-espresso">{amount}</div>
        <div className="text-[13px] text-clay-muted">{title}</div>
      </div>

      {/* Method selector */}
      <div className="flex flex-col gap-2 mb-6">
        {METHODS.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethod(m.id)}
            className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-all"
            style={{
              background: method === m.id ? 'rgba(85,107,47,.08)' : 'rgba(255,255,255,.7)',
              border:     method === m.id ? '2px solid #5e4749'   : '1.5px solid #b8ceb5',
            }}
          >
            <span className="text-2xl">{m.icon}</span>
            <div className="flex-1">
              <div className="font-bold text-[14px] text-espresso">{m.label}</div>
              <div className="text-[11px] text-clay-muted">{m.sub}</div>
            </div>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                 style={{ border:'2px solid', borderColor: method === m.id ? '#5e4749' : '#b8ceb5' }}>
              {method === m.id && <div className="w-2.5 h-2.5 rounded-full bg-olive" />}
            </div>
          </button>
        ))}
      </div>

      {/* ── CARD ── */}
      {method === 'card' && (
        <div>
          <CreditCardPreview number={cardNum} name={cardName} expiry={expiry} />
          <div className="flex flex-col gap-3">
            <div>
              <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Card Number</label>
              <input value={cardNum} onChange={e => setCardNum(formatCard(e.target.value))}
                     placeholder="1234 5678 9012 3456" maxLength={19}
                     className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
            </div>
            <div>
              <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Cardholder Name</label>
              <input value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())}
                     placeholder="AS ON CARD" className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Expiry Date</label>
                <input value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))}
                       placeholder="MM/YY" maxLength={5} className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
              </div>
              <div>
                <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">CVV</label>
                <input value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g,'').slice(0,4))}
                       placeholder="•••" type="password" maxLength={4} className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE WALLET ── */}
      {method === 'jazz' && (
        <div>
          <div className="flex gap-2 mb-4">
            {WALLETS.map(w => (
              <button key={w.id} type="button" onClick={() => setWallet(w.id)}
                      className="flex-1 py-3 rounded-xl text-[12px] font-bold transition-all"
                      style={{
                        background: wallet === w.id ? w.color : 'rgba(255,255,255,.7)',
                        color:      wallet === w.id ? '#fff'  : '#4E342E',
                        border:     wallet === w.id ? 'none'  : '1.5px solid #b8ceb5',
                      }}>
                {w.label}
              </button>
            ))}
          </div>
          <div>
            <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Registered Mobile Number</label>
            <input value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g,'').slice(0,11))}
                   placeholder="03XX XXXXXXX" className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
          </div>
          <div className="mt-4 p-4 rounded-xl text-[12px] text-clay-muted"
               style={{ background:'rgba(94,71,73,.07)', border:'1px dashed rgba(94,71,73,.3)' }}>
            <strong className="text-olive">How it works:</strong> You will receive a payment request on your {WALLETS.find(w=>w.id===wallet)?.label} account. Approve it to complete the transaction.
          </div>
        </div>
      )}

      {/* ── BANK TRANSFER ── */}
      {method === 'bank' && (
        <div>
          <div className="p-5 rounded-2xl mb-4"
               style={{ background:'rgba(94,71,73,.07)', border:'1px solid rgba(94,71,73,.2)' }}>
            <div className="t-mono text-[10px] text-olive mb-3">TRANSFER TO THIS ACCOUNT</div>
            {[
              ['Bank',         'Meezan Bank Ltd'],
              ['Account Name', 'Purrfect Care Pvt. Ltd.'],
              ['IBAN',         'PK86 MEZN 0001 0100 0123 4567'],
              ['Account No',   '0001 0100 0123 4567'],
              ['Branch Code',  '0001'],
            ].map(([k,v]) => (
              <div key={k} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor:'rgba(94,71,73,.15)' }}>
                <span className="text-[12px] text-clay-muted">{k}</span>
                <span className="text-[12px] font-bold text-espresso font-mono">{v}</span>
              </div>
            ))}
          </div>
          <div>
            <label className="t-mono text-[10px] text-espresso-soft block mb-1.5">Transaction Reference Number</label>
            <input value={bankRef} onChange={e => setBankRef(e.target.value)}
                   placeholder="Enter TRN / Reference ID from your bank"
                   className={inputCls} style={inputSty} onFocus={fi} onBlur={fo} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        {onBack && (
          <button type="button" onClick={onBack}
                  className="btn btn-outline flex-1 justify-center !py-3">
            ← Back
          </button>
        )}
        <button
          type="button"
          onClick={handlePay}
          disabled={loading}
          className="btn btn-olive flex-1 justify-center !py-3"
          style={{ opacity: loading ? .7 : 1 }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              Processing…
            </span>
          ) : `Pay ${amount}`}
        </button>
      </div>

      {/* Security badge */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <span className="text-[10px] text-clay-muted">🔒 256-bit SSL secured · PCI DSS compliant</span>
      </div>
    </div>
  )
}
