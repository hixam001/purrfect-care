/**
 * SystemAdminDashboard — Full platform administration panel.
 * Accessible at /admin/dashboard — only for users with role === 'admin'.
 * Theme: matches the warm light system used across the rest of the app.
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
  cat_owner:     { label:'Cat Owner',      bg:'rgba(94,71,73,.10)',   text:'#4a373a',  icon:'🐱' },
  vet:           { label:'Veterinarian',   bg:'rgba(59,130,246,.10)', text:'#1D4ED8',  icon:'👩‍⚕️' },
  hospital_admin:{ label:'Hospital Admin', bg:'rgba(184,92,56,.10)',  text:'#8C4229',  icon:'🏥' },
  store_owner:   { label:'Store Owner',    bg:'rgba(124,58,237,.10)', text:'#6D28D9',  icon:'🏪' },
  admin:         { label:'System Admin',   bg:'rgba(99,102,241,.10)', text:'#4338CA',  icon:'⚙️' },
}

const STATUS_PILL = {
  verified: { bg:'rgba(94,71,73,.10)',    text:'#4a373a', border:'rgba(94,71,73,.20)',  label:'✓ Verified' },
  pending:  { bg:'rgba(184,124,42,.10)', text:'#7A4F10', border:'rgba(184,124,42,.20)',label:'⏳ Pending'  },
  rejected: { bg:'rgba(184,56,56,.09)',  text:'#7D1F1F', border:'rgba(184,56,56,.18)', label:'✕ Rejected' },
}

/* ── Colour palette (mirrors light theme) ── */
const C = {
  bg:        '#dbe8d8',
  surface:   'rgba(255,255,255,.88)',
  surfaceHov:'rgba(255,255,255,.97)',
  border:    '#b8ceb5',
  text:      '#3a2c2d',
  textSoft:  '#3a2c2d',
  textMuted: '#7a5e60',
  olive:     '#5e4749',
  oliveDark: '#4a373a',
  oliveBg:   'rgba(94,71,73,.09)',
  oliveBorder:'rgba(94,71,73,.20)',
  amberBg:   'rgba(184,92,56,.08)',
  amberBorder:'rgba(184,92,56,.22)',
  dangerBg:  'rgba(184,56,56,.08)',
  dangerBorder:'rgba(184,56,56,.20)',
  dangerText:'#7D1F1F',
  // Admin accent — subtle indigo used only in the "System Admin" badge
  adminBg:   'rgba(99,102,241,.08)',
  adminBorder:'rgba(99,102,241,.22)',
  adminText: '#4338CA',
}

function RolePill({ role }) {
  const m = ROLE_META[role] ?? { label:role, bg:'rgba(0,0,0,.05)', text:'#333', icon:'👤' }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold"
          style={{ background: m.bg, color: m.text }}>
      {m.icon} {m.label}
    </span>
  )
}

function StatusPill({ status }) {
  const s = STATUS_PILL[status] ?? { bg:'rgba(0,0,0,.05)', text:'#333', border:'transparent', label: status }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold"
          style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  )
}

/* ── Stat Card ── */
function StatCard({ icon, label, value, sub, accentBg }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-1"
         style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl mb-3"
           style={{ background: accentBg }}>
        {icon}
      </div>
      <div className="font-display font-black text-[1.7rem] leading-none" style={{ color: C.text }}>{value}</div>
      <div className="text-[13px] font-medium mt-1" style={{ color: C.textMuted }}>{label}</div>
      {sub && <div className="text-[11.5px]" style={{ color: C.olive }}>{sub}</div>}
    </div>
  )
}

/* ── Card wrapper ── */
function Panel({ children, className = '' }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`}
         style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      {children}
    </div>
  )
}

/* ── Section heading ── */
function SectionH2({ children }) {
  return (
    <h2 className="font-display font-bold text-[1.05rem] mb-5"
        style={{ color: C.text }}>{children}</h2>
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
    { id:'overview',  label:'Overview',                          icon:'📊' },
    { id:'hospitals', label:'Hospitals',                         icon:'🏥' },
    { id:'stores',    label:'Stores',                            icon:'🏪' },
    { id:'users',     label:'Users',                             icon:'👤' },
    { id:'pending',   label:`Pending (${approvals.length})`,     icon:'⏳' },
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

  function approveApproval(id) { setApprovals(a => a.filter(ap => ap.id !== id)) }

  const filteredUsers = MOCK_USERS.filter(u => {
    const matchRole   = roleFilter === 'all' || u.role === roleFilter
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase())
                      || u.email.toLowerCase().includes(search.toLowerCase())
    return matchRole && matchSearch
  })

  /* ── Shared button styles ── */
  const btnApprove = {
    background: C.oliveBg, color: C.olive, border: `1px solid ${C.oliveBorder}`,
    padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', transition: 'all .15s',
  }
  const btnReject = {
    background: C.dangerBg, color: C.dangerText, border: `1px solid ${C.dangerBorder}`,
    padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', transition: 'all .15s',
  }

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-40"
              style={{ background: 'rgba(219,232,216,.93)', backdropFilter: 'blur(18px)',
                       WebkitBackdropFilter: 'blur(18px)', borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-6">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                 style={{ background: 'linear-gradient(135deg,#5e4749,#4a373a)' }}>🐱</div>
            <div>
              <span className="font-display font-black text-[17px] tracking-tight" style={{ color: C.text }}>
                Purrfect<span style={{ color: C.olive }}>Care</span>
              </span>
              <span className="text-[11px] font-semibold ml-2.5 px-2 py-0.5 rounded-full"
                    style={{ background: C.adminBg, border: `1px solid ${C.adminBorder}`, color: C.adminText }}>
                Admin
              </span>
            </div>
          </Link>

          {/* Tabs (desktop) */}
          <nav className="hidden md:flex items-center gap-0.5">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                      className="px-4 py-2 rounded-xl text-[13.5px] font-medium transition-all duration-200"
                      style={{
                        background: tab === t.id ? C.oliveBg  : 'transparent',
                        color:      tab === t.id ? C.olive    : C.textMuted,
                        border:     tab === t.id ? `1px solid ${C.oliveBorder}` : '1px solid transparent',
                      }}>
                {t.icon} {t.label}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                   style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}` }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#B87C2A' }} />
                <span className="text-[12px] font-semibold" style={{ color: '#7A4F10' }}>
                  {pendingCount} pending
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="btn btn-outline !text-[12.5px] !py-2"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">

        {/* Page heading */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3"
               style={{ background: C.adminBg, border: `1px solid ${C.adminBorder}` }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: C.adminText }} />
            <span className="text-[11.5px] font-semibold" style={{ color: C.adminText }}>
              System Administration
            </span>
          </div>
          <h1 className="font-display font-black tracking-tight mb-1"
              style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: C.text }}>
            Platform Dashboard
          </h1>
          <p className="text-[14.5px]" style={{ color: C.textMuted }}>
            Manage hospitals, users, and platform-wide settings.
          </p>
        </div>

        {/* ══ OVERVIEW ══ */}
        {tab === 'overview' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon="👤" label="Total Users"       value={totalUsers}     accentBg="rgba(99,102,241,.10)" />
              <StatCard icon="🏥" label="Hospitals"         value={totalHospitals} accentBg="rgba(59,130,246,.10)" />
              <StatCard icon="👩‍⚕️" label="Veterinarians"  value={totalVets}       accentBg={C.oliveBg} />
              <StatCard icon="⏳" label="Pending Approvals" value={pendingCount}
                        sub={pendingCount > 0 ? 'Needs review' : 'All clear'}
                        accentBg={C.amberBg} />
            </div>

            {/* Role breakdown */}
            <Panel className="mb-6">
              <h2 className="font-display font-bold text-[1.05rem] mb-4" style={{ color: C.text }}>
                User Role Breakdown
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(ROLE_META).filter(([r]) => r !== 'admin').map(([role, meta]) => {
                  const count = MOCK_USERS.filter(u => u.role === role).length
                  return (
                    <div key={role} className="flex items-center gap-3 p-3 rounded-xl"
                         style={{ background: meta.bg, border: `1px solid ${C.border}` }}>
                      <span className="text-2xl">{meta.icon}</span>
                      <div>
                        <div className="font-display font-black text-[1.3rem] leading-none" style={{ color: meta.text }}>{count}</div>
                        <div className="text-[12px] font-medium mt-0.5" style={{ color: meta.text, opacity: .75 }}>{meta.label}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Panel>

            {/* Recent pending */}
            {approvals.length > 0 && (
              <div className="rounded-2xl p-6"
                   style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}` }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-[1.05rem]" style={{ color: C.text }}>
                    ⏳ Pending Approvals
                  </h2>
                  <button onClick={() => setTab('pending')}
                          className="text-[13px] font-semibold bg-none border-none cursor-pointer"
                          style={{ color: C.olive, background: 'none', border: 'none' }}>
                    View all →
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {approvals.slice(0, 3).map(ap => (
                    <div key={ap.id} className="flex items-center gap-4 p-3 rounded-xl"
                         style={{ background: 'rgba(255,255,255,.6)' }}>
                      <span className="text-xl">{ap.type === 'hospital' ? '🏥' : ap.type === 'store' ? '🏪' : '👩‍⚕️'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[14px]" style={{ color: C.text }}>{ap.name}</div>
                        <div className="text-[12.5px]" style={{ color: C.textMuted }}>
                          {ap.type === 'hospital' ? `${ap.city} · Submitted ${ap.submitted}` : `${ap.hospital ?? ap.city} · ${ap.submitted}`}
                        </div>
                      </div>
                      <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full capitalize"
                            style={{ background: C.amberBg, color: '#7A4F10', border: `1px solid ${C.amberBorder}` }}>
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
              <h2 className="font-display font-bold text-[1.1rem]" style={{ color: C.text }}>
                Registered Hospitals ({hospitals.length})
              </h2>
              <div className="flex gap-2">
                {['all', 'verified', 'pending', 'rejected'].map(s => (
                  <button key={s}
                          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all"
                          style={{ background: C.surface, color: C.textMuted, border: `1px solid ${C.border}` }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {hospitals.map(h => (
                <Panel key={h.id} className="!p-5 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                       style={{ background: 'rgba(59,130,246,.09)' }}>🏥</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px]" style={{ color: C.text }}>{h.name}</div>
                    <div className="text-[13px] mt-0.5" style={{ color: C.textMuted }}>
                      {h.city} · {h.vets} vet{h.vets !== 1 ? 's' : ''} · {h.plan} plan · Joined {h.joined}
                    </div>
                  </div>
                  <StatusPill status={h.status} />
                  {h.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => approveHospital(h.id)} style={btnApprove}>✓ Verify</button>
                      <button onClick={() => rejectHospital(h.id)}  style={btnReject}>✕ Reject</button>
                    </div>
                  )}
                </Panel>
              ))}
            </div>
          </div>
        )}

        {/* ══ STORES ══ */}
        {tab === 'stores' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-[1.1rem]" style={{ color: C.text }}>
                Registered Stores ({approvals.filter(a=>a.type==='store').length + 2} total)
              </h2>
              <span className="text-[13px] font-medium" style={{ color: C.textMuted }}>
                {approvals.filter(a=>a.type==='store').length} pending review
              </span>
            </div>

            <p className="text-[13px] font-semibold mb-3" style={{ color: C.textMuted }}>Verified</p>
            <div className="flex flex-col gap-3 mb-6">
              {[
                { id:10, name:'Purrfect Pet Supplies', city:'Lahore',  owner:'Sara Riaz',  categories:'Food & Treats, Wellness', plan:'Growth',  joined:'Apr 15, 2026' },
                { id:11, name:'Whisker World',          city:'Karachi', owner:'Haris Baig', categories:'Toys, Accessories',       plan:'Premium', joined:'Mar 10, 2026' },
              ].map(s => (
                <Panel key={s.id} className="!p-5 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                       style={{ background: 'rgba(124,58,237,.08)' }}>🏪</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px]" style={{ color: C.text }}>{s.name}</div>
                    <div className="text-[13px] mt-0.5" style={{ color: C.textMuted }}>
                      {s.city} · Owner: {s.owner} · {s.categories} · {s.plan} plan · Joined {s.joined}
                    </div>
                  </div>
                  <StatusPill status="verified" />
                  <button style={btnReject}>Revoke</button>
                </Panel>
              ))}
            </div>

            {approvals.filter(a=>a.type==='store').length > 0 && (
              <>
                <p className="text-[13px] font-semibold mb-3" style={{ color: '#7A4F10' }}>Pending Review</p>
                <div className="flex flex-col gap-3">
                  {approvals.filter(a=>a.type==='store').map(s => (
                    <div key={s.id} className="rounded-2xl p-5 flex items-center gap-5"
                         style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}` }}>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                           style={{ background: 'rgba(184,92,56,.12)' }}>🏪</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[15px]" style={{ color: C.text }}>{s.name}</div>
                        <div className="text-[13px] mt-0.5" style={{ color: C.textMuted }}>
                          {s.city} · Owner: {s.owner} · {s.categories} · {s.docs} docs · Submitted {s.submitted}
                        </div>
                      </div>
                      <StatusPill status="pending" />
                      <div className="flex gap-2">
                        <button onClick={() => approveApproval(s.id)} style={btnApprove}>✓ Approve</button>
                        <button onClick={() => setApprovals(a => a.filter(x => x.id !== s.id))} style={btnReject}>✕ Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-6 p-4 rounded-2xl text-[13.5px] flex items-start gap-2.5"
                 style={{ background: C.oliveBg, border: `1px solid ${C.oliveBorder}` }}>
              <span style={{ color: C.olive, flexShrink: 0 }}>🔒</span>
              <span style={{ color: C.textSoft }}>
                Store applications require System Admin verification. Stores are <strong>not listed publicly</strong> until explicitly approved. Owners are notified by email after review.
              </span>
            </div>
          </div>
        )}

        {/* ══ USERS ══ */}
        {tab === 'users' && (
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="px-4 py-2.5 rounded-xl text-[13.5px] outline-none transition-all"
                style={{ background: 'rgba(255,255,255,.9)', border: `1.5px solid ${C.border}`,
                         color: C.text, minWidth: 240 }}
              />
              <div className="flex gap-2 flex-wrap">
                {['all', ...Object.keys(ROLE_META).filter(r => r !== 'admin')].map(r => (
                  <button key={r} onClick={() => setRoleFilter(r)}
                          className="px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all"
                          style={{
                            background: roleFilter === r ? C.oliveBg  : C.surface,
                            color:      roleFilter === r ? C.olive    : C.textMuted,
                            border:     roleFilter === r ? `1px solid ${C.oliveBorder}` : `1px solid ${C.border}`,
                          }}>
                    {r === 'all' ? 'All Roles' : ROLE_META[r]?.icon + ' ' + ROLE_META[r]?.label}
                  </button>
                ))}
              </div>
              <span className="text-[13px] ml-auto" style={{ color: C.textMuted }}>
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {filteredUsers.map(u => (
                <Panel key={u.id} className="!p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                       style={{ background: ROLE_META[u.role]?.bg ?? C.surface }}>
                    {ROLE_META[u.role]?.icon ?? '👤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[14.5px]" style={{ color: C.text }}>{u.name}</div>
                    <div className="text-[13px]" style={{ color: C.textMuted }}>{u.email}</div>
                  </div>
                  <RolePill role={u.role} />
                  <span className="text-[12px] font-medium hidden sm:block" style={{ color: C.textMuted }}>
                    {u.joined}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: u.active ? C.olive : '#B85C38' }} />
                    <span className="text-[12px] font-semibold" style={{ color: u.active ? C.olive : '#8C4229' }}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </Panel>
              ))}
            </div>
          </div>
        )}

        {/* ══ PENDING APPROVALS ══ */}
        {tab === 'pending' && (
          <div>
            <h2 className="font-display font-bold text-[1.1rem] mb-5" style={{ color: C.text }}>
              Pending Approvals ({approvals.length})
            </h2>

            {approvals.length === 0 ? (
              <Panel className="py-20 text-center">
                <div className="text-5xl mb-4">✅</div>
                <div className="font-display font-bold text-[1.15rem]" style={{ color: C.text }}>All caught up!</div>
                <div className="text-[14px] mt-2" style={{ color: C.textMuted }}>No pending approvals at this time.</div>
              </Panel>
            ) : (
              <div className="flex flex-col gap-4">
                {approvals.map(ap => (
                  <div key={ap.id} className="rounded-2xl p-6"
                       style={{ background: C.amberBg, border: `1px solid ${C.amberBorder}` }}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                           style={{ background: 'rgba(184,92,56,.12)' }}>
                         {ap.type === 'hospital' ? '🏥' : ap.type === 'store' ? '🏪' : '👩‍⚕️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-semibold text-[15px]" style={{ color: C.text }}>{ap.name}</div>
                          <span className="text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full capitalize"
                                style={{ background: C.amberBg, color:'#7A4F10', border:`1px solid ${C.amberBorder}` }}>
                            {ap.type}
                          </span>
                        </div>
                        <div className="text-[13.5px] mb-2" style={{ color: C.textMuted }}>
                          {ap.type === 'hospital' ? (
                            <>{ap.city} · {ap.docs} documents submitted · Submitted {ap.submitted}</>
                          ) : ap.type === 'store' ? (
                            <>{ap.city} · Owner: {ap.owner} · {ap.categories} · {ap.docs} docs · Submitted {ap.submitted}</>
                          ) : (
                            <>Linked to: {ap.hospital} · License: {ap.license} · Submitted {ap.submitted}</>
                          )}
                        </div>
                        {(ap.type === 'hospital' || ap.type === 'store') && (
                          <div className="text-[13px] p-3 rounded-xl"
                               style={{ background: 'rgba(255,255,255,.65)', border: `1px solid ${C.border}` }}>
                            📄 {ap.docs} verification documents attached — review before approving.
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button onClick={() => approveApproval(ap.id)} style={{ ...btnApprove, padding: '8px 16px' }}>✓ Approve</button>
                        <button onClick={() => setApprovals(a => a.filter(x => x.id !== ap.id))} style={{ ...btnReject, padding: '8px 16px' }}>✕ Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 rounded-2xl text-[13.5px]"
                 style={{ background: C.oliveBg, border: `1px solid ${C.oliveBorder}` }}>
              ℹ️ <span style={{ color: C.textSoft }}>
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
