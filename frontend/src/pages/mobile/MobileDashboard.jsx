import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import MobileLayout from '../../layouts/MobileLayout'
import { supabase } from '../../lib/supabaseClient'

const TILES = [
  { icon:'🐾', label:'My Cats',      desc:'Manage your cat profiles',     to:'/my-cats'      },
  { icon:'🏥', label:'Find Vets',    desc:'Search nearby hospitals',      to:'/find-vets'    },
  { icon:'🤖', label:'AI Companion', desc:"Ask about your cat's health",  to:'/ai-companion' },
  { icon:'🛍', label:'Cat Store',    desc:'Food, toys & accessories',     to:'/store'        },
  { icon:'📅', label:'Appointments', desc:'Your upcoming vet visits',     to:'/find-vets'    },
  { icon:'⚙',  label:'Settings',     desc:'Account & preferences',        to:'/settings'     },
]

const STORE_TILES = [
  { icon:'📊', label:'Overview',  desc:'Sales & store summary',          to:null, tab:'overview'  },
  { icon:'📦', label:'Products',  desc:'Manage your catalogue',          to:null, tab:'products'  },
  { icon:'🛍️', label:'Orders',   desc:'View & update orders',           to:null, tab:'orders'    },
  { icon:'📈', label:'Statistics',desc:'Revenue & analytics',            to:null, tab:'stats'     },
  { icon:'⚙️', label:'Settings', desc:'Store profile & hours',          to:null, tab:'settings'  },
]

const HOSPITAL_TILES = [
  { icon:'📊', label:'Overview',     desc:'Appointments & summary',      tab:'overview'  },
  { icon:'👩‍⚕️', label:'Vets',       desc:'Your veterinary team',        tab:'vets'      },
  { icon:'📅', label:'Appointments', desc:'Confirm & manage bookings',   tab:'appts'     },
  { icon:'🏥', label:'Services',     desc:'Treatments & pricing',        tab:'services'  },
  { icon:'🗓️', label:'Slots',       desc:'Availability calendar',       tab:'slots'     },
  { icon:'📈', label:'Statistics',   desc:'Hospital analytics',          tab:'stats'     },
  { icon:'⚙️', label:'Settings',    desc:'Hospital profile & hours',    tab:'settings'  },
]

export default function MobileDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cats, setCats] = useState([])
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  /* ── Redirect business roles to their own dashboards ── */
  useEffect(() => {
    if (user?.role === 'store_owner')    navigate('/store/dashboard', { replace: true })
    if (user?.role === 'hospital_admin') navigate('/hospital/dashboard', { replace: true })
    if (user?.role === 'vet')            navigate('/vet-dashboard', { replace: true })
  }, [user?.role, navigate])

  useEffect(() => {
    if (!user?.id) return
    supabase.from('cats').select('id,name,breed,photo_url').eq('owner_id', user.id).limit(3)
      .then(({ data }) => { if (data) setCats(data) })
  }, [user?.id])

  // Don't render the user dashboard content for business roles (they'll be redirected)
  if (user?.role === 'store_owner' || user?.role === 'hospital_admin' || user?.role === 'vet') {
    return (
      <MobileLayout title="Loading…">
        <div className="flex items-center justify-center h-48">
          <div className="text-[14px]" style={{ color:'#7a5e60' }}>Redirecting to your dashboard…</div>
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout title={`Hello, ${firstName} 👋`}>
      <div className="p-4 space-y-5">

        {/* ── Cat strip ── */}
        {cats.length > 0 && (
          <section>
            <p className="font-semibold text-sm mb-2" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
              Your cats
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
              {cats.map(c => (
                <button key={c.id} onClick={() => navigate('/my-cats')}
                  className="flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-2xl"
                  style={{ backgroundColor:'#ffffff', border:'1px solid #b8ceb5', minWidth:80 }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor:'rgba(94,71,73,0.09)' }}>
                    {c.photo_url
                      ? <img src={c.photo_url} alt={c.name} className="w-full h-full object-cover" />
                      : <span className="text-2xl">🐱</span>
                    }
                  </div>
                  <span className="text-xs font-semibold" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>{c.name}</span>
                  {c.breed && <span className="text-[10px]" style={{ color:'#7a5e60' }}>{c.breed}</span>}
                </button>
              ))}
              <button onClick={() => navigate('/my-cats')}
                className="flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-2xl"
                style={{ backgroundColor:'rgba(94,71,73,0.06)', border:'1.5px dashed #5e4749', minWidth:80 }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">➕</span>
                </div>
                <span className="text-xs font-semibold" style={{ color:'#5e4749', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Add cat</span>
              </button>
            </div>
          </section>
        )}

        {/* ── Nav tiles ── */}
        <section>
          <p className="font-semibold text-sm mb-3" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
            What would you like to do?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {TILES.map(t => (
              <button key={t.label} onClick={() => navigate(t.to)}
                className="flex flex-col items-start p-4 rounded-2xl text-left transition-all active:scale-95"
                style={{ backgroundColor:'#ffffff', border:'1px solid #b8ceb5', boxShadow:'0 2px 8px rgba(45,27,14,0.06)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 text-xl"
                  style={{ backgroundColor:'rgba(94,71,73,0.09)' }}>
                  {t.icon}
                </div>
                <span className="font-bold text-sm block" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>{t.label}</span>
                <span className="text-[11px] mt-0.5 leading-tight" style={{ color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>{t.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── No cats CTA ── */}
        {cats.length === 0 && (
          <div className="rounded-2xl p-5 text-center" style={{ backgroundColor:'rgba(94,71,73,0.07)', border:'1px solid rgba(94,71,73,0.18)' }}>
            <div className="text-4xl mb-2">🐱</div>
            <p className="font-bold text-base mb-1" style={{ color:'#3a2c2d', fontFamily:'Plus Jakarta Sans, sans-serif' }}>No cats yet</p>
            <p className="text-sm mb-4" style={{ color:'#7a5e60', fontFamily:'Plus Jakarta Sans, sans-serif' }}>Add your first cat to get personalised care recommendations.</p>
            <button onClick={() => navigate('/my-cats')}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
              style={{ backgroundColor:'#5e4749' }}>
              Add my first cat
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  )
}
