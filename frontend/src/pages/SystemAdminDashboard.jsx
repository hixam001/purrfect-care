/**
 * SystemAdminDashboard — Full platform administration panel.
 * Accessible at /admin/dashboard — only for users with role === 'admin'.
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

/* ── Mock data ── */
const MOCK_HOSPITALS = [
  { id:1, name:'Green Paw Veterinary Clinic',  city:'Lahore',     vets:3, status:'verified',  plan:'Professional', joined:'May 12, 2026' },
  { id:2, name:'Feline Care Centre',            city:'Karachi',    vets:7, status:'verified',  plan:'Enterprise',   joined:'Apr 3, 2026'  },
  { id:3, name:'CatMed Specialist Hospital',    city:'Islamabad',  vets:2, status:'pending',   plan:'Basic',        joined:'Jun 1, 2026'  },
  { id:4, name:'PawHealth Clinic',              city:'Rawalpindi', vets:1, status:'pending',   plan:'Basic',        joined:'Jun 4, 2026'  },
  { id:5, name:'WhiskerWell Animal Hospital',   city:'Faisalabad', vets:5, status:'rejected',  plan:'Professional', joined:'May 28, 2026' },
]

const MOCK_USERS = [
  { id:1,  name:'Laiba Khan',      email:'laiba@example.com',   role:'cat_owner',     joined:'Jun 1',  active:true  },
  { id:2,  name:'Ahmed Ali',       email:'ahmed@example.com',   role:'cat_owner',     joined:'May 20', active:true  },
  { id:3,  name:'Dr. Aisha Mirza', email:'aisha@greenpaw.com',  role:'vet',           joined:'May 12', active:true  },
  { id:4,  name:'Dr. Omar Khalid', email:'omar@greenpaw.com',   role:'vet',           joined:'May 12', active:true  },
  { id:5,  name:'Sara Riaz',       email:'sara@catstore.com',   role:'store_owner',   joined:'Apr 15', active:true  },
  { id:6,  name:'Bilal Shah',      email:'bilal@greenpaw.com',  role:'hospital_admin',joined:'May 12', active:true  },
  { id:7,  name:'Nida Hussain',    email:'nida@felinecare.com', role:'hospital_admin',joined:'Apr 3',  active:true  },
  { id:8,  name:'Usman Tariq',     email:'usman@example.com',   role:'cat_owner',     joined:'Jun 3',  active:false },
]

const PENDING_APPROVALS = [
  { id:1, type:'hospital', name:'CatMed Specialist Hospital',  city:'Islamabad', submitted:'Jun 1, 2026',  docs:3 },
  { id:2, type:'hospital', name:'PawHealth Clinic',            city:'Rawalpindi',submitted:'Jun 4, 2026',  docs:3 },
  { id:3, type:'vet',      name:'Dr. Sana Farooq',             hospital:'CatMed Specialist Hospital', license:'PVMC-2024-5521', submitted:'Jun 2, 2026' },
  { id:4, type:'store',    name:'Paws & Whiskers Boutique',    city:'Lahore',    owner:'Sara Riaz',  categories:'Food & Treats, Grooming', submitted:'Jun 3, 2026', docs:3 },
  { id:5, type:'store',    name:'Kitty Kingdom Supplies',      city:'Karachi',   owner:'Haris Khan', categories:'Toys, Accessories, Beds', submitted:'Jun 4, 2026', docs:2 },
]

const ROLE_META = {
  cat_owner:     { label:'Cat Owner',     color:'rgba(107,142,35,.12)',  text:'#556B2F',  icon:'🐱' },
  vet:           { label:'Veterinarian',  color:'rgba(80,150,255,.12)',  text:'#2563EB',  icon:'👩‍⚕️' },
  hospital_admin:{ label:'Hospital Admin',color:'rgba(196,140,56,.12)', text:'#92400E',  icon:'🏥' },
  store_owner:   { label:'Store Owner',   color:'rgba(160,60,200,.1)',   text:'#7C3AED',  icon:'🏪' },
  admin:         { label:'System Admin',  color:'rgba(124,110,245,.12)', text:'#5B4EDB',  icon:'⚙️' },
}

const STATUS_PILL = {
  verified: { bg:'rgba(107,142,35,.12)', text:'#3D6B10', label:'✓ Verified' },
  pending:  { bg:'rgba(196,140,56,.12)', text:'#92400E', label:'⏳ Pending'  },
  rejected: { bg:'rgba(196,56,56,.1)',   text:'#9B2020', label:'✕ Rejected' },
}

function RolePill({ role }) {
  const m = ROLE_META[role] ?? { label:role, color:'#eee', text:'#333', icon:'👤' }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold"
          style={{ background: m.color, color: m.text }}>
      {m.icon} {m.label}
    </span>
  )
}

function StatusPill({ status }) {
  const s = STATUS_PILL[status] ?? { bg:'#eee', text:'#333', label: status }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-bold"
          style={{ background: s.bg, color: s.text }}>
      {s.label}
    </span>
  )
}

/* ── Stat Card ── */
function StatCard({ icon, label, value, sub, accentColor }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-1"
         style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl mb-3"
           style={{ background: accentColor }}>
        {icon}
      </div>
      <div className="font-black text-[1.6rem]" style={{ color: '#E8E8F0' }}>{value}</div>
      <div className="text-[12px] font-medium" style={{ color: 'rgba(232,232,240,.5)' }}>{label}</div>
      {sub && <div className="text-[11px] font-mono" style={{ color: 'rgba(124,110,245,.7)' }}>{sub}</div>}
    </div>
  )
}

/* ── Main Dashboard ── */
export default function SystemAdminDashboard() {
  const navigate = useNavigate()

  function handleLogout() {
    sessionStorage.removeItem('pc_admin_session')
    navigate('/admin/login')
  }

  const [tab,        setTab]        = useState('overview')
  const [hospitals,  setHospitals]  = useState(MOCK_HOSPITALS)
  const [approvals,  setApprovals]  = useState(PENDING_APPROVALS)
  const [roleFilter, setRoleFilter] = useState('all')
  const [search,     setSearch]     = useState('')

  const TABS = [
    { id:'overview',  label:'Overview',          icon:'📊' },
    { id:'hospitals', label:'Hospitals',          icon:'🏥' },
    { id:'stores',    label:'Stores',             icon:'🏪' },
    { id:'users',     label:'Users',              icon:'👤' },
    { id:'pending',   label:`Pending (${approvals.length})`, icon:'⏳' },
  ]

  const totalUsers     = MOCK_USERS.length
  const totalHospitals = hospitals.length
  const totalVets      = MOCK_USERS.filter(u => u.role === 'vet').length
  const pendingCount   = approvals.length

  function approveHospital(id) {
    setHospitals(h => h.map(hosp => hosp.id === id ? { ...hosp, status: 'verified' } : hosp))
    setApprovals(a => a.filter(ap => !(ap.type === 'hospital' && ap.id === id)))
  }

  function rejectHospital(id) {
    setHospitals(h => h.map(hosp => hosp.id === id ? { ...hosp, status: 'rejected' } : hosp))
    setApprovals(a => a.filter(ap => !(ap.type === 'hospital' && ap.id === id)))
  }

  function approveApproval(id) {
    setApprovals(a => a.filter(ap => ap.id !== id))
  }

  const filteredUsers = MOCK_USERS.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0D0D1A 0%, #111128 100%)' }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40"
              style={{ background: 'rgba(13,13,26,.9)', backdropFilter: 'blur(18px)',
                       borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-6">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                 style={{ background: 'rgba(124,110,245,.2)', border: '1px solid rgba(124,110,245,.3)' }}>🐱</div>
            <div>
              <span className="font-display font-black text-[17px] tracking-tight" style={{ color: '#E8E8F0' }}>
                Purrfect<span style={{ color: '#7C6EF5' }}>Care</span>
              </span>
              <span className="text-[10px] font-mono ml-2" style={{ color: 'rgba(124,110,245,.6)' }}>
                System Admin
              </span>
            </div>
          </Link>

          {/* Tabs (desktop) */}
          <nav className="hidden md:flex items-center gap-0.5">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                      className="px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200"
                      style={{
                        background: tab === t.id ? 'rgba(124,110,245,.15)' : 'transparent',
                        color: tab === t.id ? '#7C6EF5' : 'rgba(232,232,240,.45)',
                        border: tab === t.id ? '1px solid rgba(124,110,245,.25)' : '1px solid transparent',
                      }}>
                {t.icon} {t.label}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Pending badge */}
            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                   style={{ background: 'rgba(196,140,56,.15)', border: '1px solid rgba(196,140,56,.25)' }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#C48C38' }} />
                <span className="text-[11px] font-mono" style={{ color: '#C48C38' }}>{pendingCount} pending</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl text-[11px] font-bold transition-all duration-200"
              style={{ background: 'rgba(255,255,255,.06)', color: 'rgba(232,232,240,.5)',
                       border: '1px solid rgba(255,255,255,.08)' }}>
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">

        {/* Page heading */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
               style={{ background: 'rgba(124,110,245,.1)', border: '1px solid rgba(124,110,245,.2)' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#7C6EF5' }} />
            <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: '#7C6EF5' }}>
              System Administration
            </span>
          </div>
          <h1 className="font-display font-black tracking-tight" style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: '#E8E8F0' }}>
            Platform Dashboard
          </h1>
          <p className="text-[14px] mt-1" style={{ color: 'rgba(232,232,240,.4)' }}>
            Manage hospitals, users, and platform-wide settings.
          </p>
        </div>

        {/* ══ OVERVIEW ══ */}
        {tab === 'overview' && (
          <div>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon="👤" label="Total Users"          value={totalUsers}           accentColor="rgba(124,110,245,.15)" />
              <StatCard icon="🏥" label="Hospitals"            value={totalHospitals}        accentColor="rgba(80,150,255,.12)"  />
              <StatCard icon="👩‍⚕️" label="Veterinarians"       value={totalVets}            accentColor="rgba(107,142,35,.12)"  />
              <StatCard icon="⏳" label="Pending Approvals"    value={pendingCount} sub={pendingCount > 0 ? "Needs review" : "All clear"} accentColor="rgba(196,140,56,.12)" />
            </div>

            {/* Role breakdown */}
            <div className="rounded-2xl p-6 mb-6"
                 style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
              <h2 className="font-display font-bold text-[1rem] mb-4" style={{ color: '#E8E8F0' }}>User Role Breakdown</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(ROLE_META).filter(([r]) => r !== 'admin').map(([role, meta]) => {
                  const count = MOCK_USERS.filter(u => u.role === role).length
                  return (
                    <div key={role} className="flex items-center gap-3 p-3 rounded-xl"
                         style={{ background: meta.color }}>
                      <span className="text-2xl">{meta.icon}</span>
                      <div>
                        <div className="font-black text-[1.2rem]" style={{ color: meta.text }}>{count}</div>
                        <div className="text-[11px] font-mono" style={{ color: meta.text, opacity: 0.7 }}>{meta.label}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent pending approvals */}
            {approvals.length > 0 && (
              <div className="rounded-2xl p-6"
                   style={{ background: 'rgba(196,140,56,.05)', border: '1px solid rgba(196,140,56,.18)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-[1rem]" style={{ color: '#E8E8F0' }}>
                    ⏳ Pending Approvals
                  </h2>
                  <button onClick={() => setTab('pending')}
                          className="text-[12px] font-mono"
                          style={{ color: '#C48C38', background: 'none', border: 'none', cursor: 'pointer' }}>
                    View all →
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {approvals.slice(0, 3).map(ap => (
                    <div key={ap.id} className="flex items-center gap-4 p-3 rounded-xl"
                         style={{ background: 'rgba(255,255,255,.03)' }}>
                      <span className="text-xl">{ap.type === 'hospital' ? '🏥' : '👩‍⚕️'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[13px]" style={{ color: '#E8E8F0' }}>{ap.name}</div>
                        <div className="text-[11px]" style={{ color: 'rgba(232,232,240,.4)' }}>
                          {ap.type === 'hospital' ? `${ap.city} · Submitted ${ap.submitted}` : `${ap.hospital} · ${ap.submitted}`}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full capitalize"
                            style={{ background: 'rgba(196,140,56,.15)', color: '#C48C38' }}>
                        {ap.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ HOSPITALS ══ */}
        {tab === 'hospitals' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-[1.1rem]" style={{ color: '#E8E8F0' }}>
                Registered Hospitals ({hospitals.length})
              </h2>
              <div className="flex gap-2">
                {['all', 'verified', 'pending', 'rejected'].map(s => (
                  <button key={s} className="px-3 py-1.5 rounded-lg text-[11px] font-mono capitalize transition-all"
                          style={{ background: 'rgba(255,255,255,.05)', color: 'rgba(232,232,240,.5)',
                                   border: '1px solid rgba(255,255,255,.08)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {hospitals.map(h => (
                <div key={h.id} className="rounded-2xl p-5 flex items-center gap-5"
                     style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                       style={{ background: 'rgba(80,150,255,.1)' }}>🏥</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[15px]" style={{ color: '#E8E8F0' }}>{h.name}</div>
                    <div className="text-[12px]" style={{ color: 'rgba(232,232,240,.4)' }}>
                      {h.city} · {h.vets} vet{h.vets !== 1 ? 's' : ''} · {h.plan} plan · Joined {h.joined}
                    </div>
                  </div>
                  <StatusPill status={h.status} />
                  {h.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => approveHospital(h.id)}
                              className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                              style={{ background: 'rgba(107,142,35,.15)', color: '#6B8E23',
                                       border: '1px solid rgba(107,142,35,.25)' }}>
                        ✓ Verify
                      </button>
                      <button onClick={() => rejectHospital(h.id)}
                              className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                              style={{ background: 'rgba(196,56,56,.1)', color: '#F87171',
                                       border: '1px solid rgba(196,56,56,.2)' }}>
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ STORES ══ */}
        {tab === 'stores' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-[1.1rem]" style={{ color: '#E8E8F0' }}>
                Registered Stores ({approvals.filter(a=>a.type==='store').length + 2} total)
              </h2>
              <span className="text-[12px] font-mono" style={{ color: 'rgba(232,232,240,.35)' }}>
                {approvals.filter(a=>a.type==='store').length} pending review
              </span>
            </div>

            {/* Verified stores */}
            <h3 className="text-[11px] font-mono uppercase tracking-widest mb-3" style={{ color: 'rgba(232,232,240,.35)' }}>Verified</h3>
            <div className="flex flex-col gap-3 mb-6">
              {[
                { id:10, name:'Purrfect Pet Supplies', city:'Lahore',  owner:'Sara Riaz',  categories:'Food & Treats, Wellness', plan:'Growth',  joined:'Apr 15, 2026' },
                { id:11, name:'Whisker World',         city:'Karachi', owner:'Haris Baig', categories:'Toys, Accessories',       plan:'Premium', joined:'Mar 10, 2026' },
              ].map(s => (
                <div key={s.id} className="rounded-2xl p-5 flex items-center gap-5"
                     style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                       style={{ background: 'rgba(160,60,200,.08)' }}>🏪</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[15px]" style={{ color: '#E8E8F0' }}>{s.name}</div>
                    <div className="text-[12px]" style={{ color: 'rgba(232,232,240,.4)' }}>
                      {s.city} · Owner: {s.owner} · {s.categories} · {s.plan} plan · Joined {s.joined}
                    </div>
                  </div>
                  <StatusPill status="verified" />
                  <button className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                          style={{ background: 'rgba(196,56,56,.08)', color: '#F87171', border: '1px solid rgba(196,56,56,.2)' }}>
                    Revoke
                  </button>
                </div>
              ))}
            </div>

            {/* Pending stores */}
            {approvals.filter(a=>a.type==='store').length > 0 && (
              <>
                <h3 className="text-[11px] font-mono uppercase tracking-widest mb-3" style={{ color: 'rgba(196,140,56,.6)' }}>Pending Review</h3>
                <div className="flex flex-col gap-3">
                  {approvals.filter(a=>a.type==='store').map(s => (
                    <div key={s.id} className="rounded-2xl p-5 flex items-center gap-5"
                         style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(196,140,56,.2)' }}>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                           style={{ background: 'rgba(196,140,56,.1)' }}>🏪</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[15px]" style={{ color: '#E8E8F0' }}>{s.name}</div>
                        <div className="text-[12px]" style={{ color: 'rgba(232,232,240,.4)' }}>
                          {s.city} · Owner: {s.owner} · {s.categories} · {s.docs} docs · Submitted {s.submitted}
                        </div>
                      </div>
                      <StatusPill status="pending" />
                      <div className="flex gap-2">
                        <button onClick={() => approveApproval(s.id)}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                                style={{ background: 'rgba(107,142,35,.15)', color: '#6B8E23', border: '1px solid rgba(107,142,35,.25)' }}>
                          ✓ Approve
                        </button>
                        <button onClick={() => setApprovals(a => a.filter(x => x.id !== s.id))}
                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                                style={{ background: 'rgba(196,56,56,.08)', color: '#F87171', border: '1px solid rgba(196,56,56,.2)' }}>
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Note */}
            <div className="mt-6 p-4 rounded-2xl text-[13px] flex items-start gap-2"
                 style={{ background: 'rgba(124,110,245,.07)', border: '1px solid rgba(124,110,245,.18)' }}>
              <span style={{ color: 'rgba(124,110,245,.8)', flexShrink: 0 }}>🔒</span>
              <span style={{ color: 'rgba(232,232,240,.5)' }}>
                Store applications require System Admin verification. Stores are <strong style={{ color: '#E8E8F0' }}>not listed publicly</strong> until explicitly approved. Owners are notified by email after review.
              </span>
            </div>
          </div>
        )}

        {/* ══ USERS ══ */}
        {tab === 'users' && (
          <div>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="px-4 py-2.5 rounded-xl text-[13px] outline-none transition-all"
                style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
                         color: '#E8E8F0', minWidth: 220 }}
              />
              <div className="flex gap-2 flex-wrap">
                {['all', ...Object.keys(ROLE_META).filter(r => r !== 'admin')].map(r => (
                  <button key={r} onClick={() => setRoleFilter(r)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-mono capitalize transition-all"
                          style={{
                            background: roleFilter === r ? 'rgba(124,110,245,.2)' : 'rgba(255,255,255,.05)',
                            color: roleFilter === r ? '#7C6EF5' : 'rgba(232,232,240,.4)',
                            border: roleFilter === r ? '1px solid rgba(124,110,245,.3)' : '1px solid rgba(255,255,255,.08)',
                          }}>
                    {r === 'all' ? 'All Roles' : ROLE_META[r]?.icon + ' ' + ROLE_META[r]?.label}
                  </button>
                ))}
              </div>
              <span className="text-[12px] ml-auto" style={{ color: 'rgba(232,232,240,.3)' }}>
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {filteredUsers.map(u => (
                <div key={u.id} className="rounded-2xl p-4 flex items-center gap-4"
                     style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                       style={{ background: ROLE_META[u.role]?.color ?? 'rgba(255,255,255,.05)' }}>
                    {ROLE_META[u.role]?.icon ?? '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[14px]" style={{ color: '#E8E8F0' }}>{u.name}</div>
                    <div className="text-[12px]" style={{ color: 'rgba(232,232,240,.35)' }}>{u.email}</div>
                  </div>
                  <RolePill role={u.role} />
                  <span className="text-[11px] font-mono hidden sm:block" style={{ color: 'rgba(232,232,240,.25)' }}>
                    {u.joined}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: u.active ? '#6B8E23' : '#9B2020' }} />
                    <span className="text-[10px] font-mono" style={{ color: u.active ? '#6B8E23' : '#9B2020' }}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ PENDING APPROVALS ══ */}
        {tab === 'pending' && (
          <div>
            <h2 className="font-display font-bold text-[1.1rem] mb-5" style={{ color: '#E8E8F0' }}>
              Pending Approvals ({approvals.length})
            </h2>

            {approvals.length === 0 ? (
              <div className="text-center py-20 rounded-2xl"
                   style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)' }}>
                <div className="text-5xl mb-4">✅</div>
                <div className="font-bold text-[1.1rem]" style={{ color: '#E8E8F0' }}>All caught up!</div>
                <div className="text-[14px] mt-2" style={{ color: 'rgba(232,232,240,.3)' }}>
                  No pending approvals at this time.
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {approvals.map(ap => (
                  <div key={ap.id} className="rounded-2xl p-6"
                       style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(196,140,56,.2)' }}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                           style={{ background: 'rgba(196,140,56,.1)' }}>
                         {ap.type === 'hospital' ? '🏥' : ap.type === 'store' ? '🏪' : '👩‍⚕️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-bold text-[15px]" style={{ color: '#E8E8F0' }}>{ap.name}</div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full capitalize"
                                style={{ background: 'rgba(196,140,56,.15)', color: '#C48C38' }}>
                            {ap.type}
                          </span>
                        </div>
                        <div className="text-[13px] mb-1" style={{ color: 'rgba(232,232,240,.45)' }}>
                          {ap.type === 'hospital' ? (
                            <>{ap.city} · {ap.docs} documents submitted · Submitted {ap.submitted}</>
                          ) : ap.type === 'store' ? (
                            <>{ap.city} · Owner: {ap.owner} · {ap.categories} · {ap.docs} docs · Submitted {ap.submitted}</>
                          ) : (
                            <>Linked to: {ap.hospital} · License: {ap.license} · Submitted {ap.submitted}</>
                          )}
                        </div>
                        {(ap.type === 'hospital' || ap.type === 'store') && (
                          <div className="text-[12px] mt-2 p-3 rounded-xl"
                               style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
                            📄 {ap.docs} verification documents attached — review before approving.
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button onClick={() => approveApproval(ap.id)}
                                className="px-4 py-2 rounded-xl text-[12px] font-bold transition-all"
                                style={{ background: 'rgba(107,142,35,.15)', color: '#6B8E23',
                                         border: '1px solid rgba(107,142,35,.3)' }}>
                          ✓ Approve
                        </button>
                        <button onClick={() => setApprovals(a => a.filter(x => x.id !== ap.id))}
                                className="px-4 py-2 rounded-xl text-[12px] font-bold transition-all"
                                style={{ background: 'rgba(196,56,56,.08)', color: '#F87171',
                                         border: '1px solid rgba(196,56,56,.2)' }}>
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info note */}
            <div className="mt-6 p-4 rounded-2xl text-[13px]"
                 style={{ background: 'rgba(124,110,245,.07)', border: '1px solid rgba(124,110,245,.18)' }}>
              ℹ️ <span style={{ color: 'rgba(232,232,240,.6)' }}>
                Hospitals and vets require System Admin verification before going live on the platform.
                Vets are added exclusively by their Hospital Admin — they cannot self-register.
              </span>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
