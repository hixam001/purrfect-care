import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { useIsMobile } from './hooks/useIsMobile.js'

// Layouts
import AppLayout from './layouts/AppLayout.jsx'

// Landing page sections
import { useScrollReveal } from './hooks/useScrollReveal.js'
import Hero          from './components/Hero.jsx'
import MarqueeTicker from './components/MarqueeTicker.jsx'
import FeatureBento  from './components/FeatureBento.jsx'
import HowItWorks    from './components/HowItWorks.jsx'
import CatStore      from './components/CatStore.jsx'
import VetsSection   from './components/VetsSection.jsx'
import StatsBand     from './components/StatsBand.jsx'
import Testimonials  from './components/Testimonials.jsx'
import CTABanner     from './components/CTABanner.jsx'

// Auth pages — desktop
import LoginPage            from './pages/LoginPage.jsx'
import RegisterPage         from './pages/RegisterPage.jsx'
import SystemAdminLoginPage from './pages/SystemAdminLoginPage.jsx'

// Mobile auth pages
import MobileLogin    from './pages/mobile/MobileLogin.jsx'
import MobileRegister from './pages/mobile/MobileRegister.jsx'

// Dashboards
import DashboardPage          from './pages/DashboardPage.jsx'
import HospitalAdminDashboard from './pages/HospitalAdminDashboard.jsx'
import SystemAdminDashboard   from './pages/SystemAdminDashboard.jsx'
import VetDashboard           from './pages/VetDashboard.jsx'
import StoreDashboard         from './pages/StoreDashboard.jsx'

// Onboarding
import HospitalRegisterPage from './pages/HospitalRegisterPage.jsx'
import StoreRegisterPage    from './pages/StoreRegisterPage.jsx'
import PaymentReturnPage    from './pages/PaymentReturnPage.jsx'
import SubscriptionPage     from './pages/SubscriptionPage.jsx'

// App pages — desktop
import FindVetsPage       from './pages/FindVetsPage.jsx'
import HospitalDetailPage from './pages/HospitalDetailPage.jsx'
import BookingPage        from './pages/BookingPage.jsx'
import StorePage          from './pages/StorePage.jsx'
import StoreDetailPage    from './pages/StoreDetailPage.jsx'
import AICompanionPage    from './pages/AICompanionPage.jsx'
import MedicinesPage      from './pages/MedicinesPage.jsx'
import ChatPage           from './pages/ChatPage.jsx'
import ChatsInboxPage     from './pages/ChatsInboxPage.jsx'
import MyCatsPage         from './pages/MyCatsPage.jsx'
import SettingsPage       from './pages/SettingsPage.jsx'


// App pages — mobile
import MobileDashboard from './pages/mobile/MobileDashboard.jsx'
import MobileMyCats    from './pages/mobile/MobileMyCats.jsx'
import MobileFindVets  from './pages/mobile/MobileFindVets.jsx'
import MobileAIChat    from './pages/mobile/MobileAIChat.jsx'
import MobileStore     from './pages/mobile/MobileStore.jsx'
import MobileSettings  from './pages/mobile/MobileSettings.jsx'

// ── Landing home ──
function HomePage() {
  useScrollReveal()
  return (
    <>
      <Hero />
      <MarqueeTicker />
      <FeatureBento />
      <HowItWorks />
      <CatStore />
      <VetsSection />
      <StatsBand />
      <Testimonials />
      <CTABanner />
    </>
  )
}

// ── Route guards ──
function RequireAuth({ children }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

function RequireAdmin({ children }) {
  const isAdminSession = sessionStorage.getItem('pc_admin_session') === 'true'
  if (!isAdminSession) return <Navigate to="/admin/login" replace />
  return children
}

function RequireHospitalAdmin({ children }) {
  const { isLoggedIn, user, isSubscribed } = useAuth()
  if (!isLoggedIn)                              return <Navigate to="/login"        replace />
  if (user && user.role !== 'hospital_admin')   return <Navigate to="/dashboard"    replace />
  if (isLoggedIn && !isSubscribed)              return <Navigate to="/subscription" replace />
  return children
}

function RequireVet({ children }) {
  const { isLoggedIn, user } = useAuth()
  if (!isLoggedIn)                    return <Navigate to="/login"     replace />
  if (user && user.role !== 'vet')    return <Navigate to="/dashboard" replace />
  return children
}

function RequireStoreOwner({ children }) {
  const { isLoggedIn, user, isSubscribed } = useAuth()
  if (!isLoggedIn)                                return <Navigate to="/login"        replace />
  if (user && user.role !== 'store_owner')        return <Navigate to="/dashboard"    replace />
  if (isLoggedIn && !isSubscribed)                return <Navigate to="/subscription" replace />
  return children
}

// ── Root router ──
function AppRoutes() {
  const mobile = useIsMobile()

  return (
    <Routes>
      {/* ── Auth — mobile/desktop conditional ── */}
      <Route path="/login"    element={mobile ? <MobileLogin />    : <LoginPage />} />
      <Route path="/register" element={mobile ? <MobileRegister /> : <RegisterPage />} />

      {/* ── Onboarding (always desktop, no AppLayout) ── */}
      <Route path="/hospital/register" element={<HospitalRegisterPage />} />
      <Route path="/store/register"    element={<StoreRegisterPage />} />

      {/* ── System admin (always desktop, no AppLayout) ── */}
      <Route path="/admin/login"     element={<SystemAdminLoginPage />} />
      <Route path="/admin/dashboard" element={<RequireAdmin><SystemAdminDashboard /></RequireAdmin>} />
      <Route path="/payment/return"  element={<PaymentReturnPage />} />
      <Route path="/subscription"    element={<SubscriptionPage />} />

      {/* ── Hospital admin (always desktop, no AppLayout) ── */}
      <Route path="/hospital/dashboard" element={<RequireHospitalAdmin><HospitalAdminDashboard /></RequireHospitalAdmin>} />

      {/* ── Vet dashboard (always desktop, no AppLayout) ── */}
      <Route path="/vet-dashboard"   element={<RequireVet><VetDashboard /></RequireVet>} />

      {/* ── Store owner dashboard (always desktop, no AppLayout) ── */}
      <Route path="/store/dashboard" element={<RequireStoreOwner><StoreDashboard /></RequireStoreOwner>} />

      {/* ══════════════════════════════════════════ | MOBILE ROUTES — use MobileLayout internally | ══════════════════════════════════════════ */}
      {mobile && (
        <>
          <Route path="/"              element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"     element={<RequireAuth><MobileDashboard /></RequireAuth>} />
          <Route path="/my-cats"       element={<RequireAuth><MobileMyCats /></RequireAuth>} />
          <Route path="/find-vets"     element={<MobileFindVets />} />
          <Route path="/hospital/:id"  element={<HospitalDetailPage />} />
          <Route path="/book/:vetId"   element={<RequireAuth><BookingPage /></RequireAuth>} />
          <Route path="/ai-companion"  element={<RequireAuth><MobileAIChat /></RequireAuth>} />
          <Route path="/chat/:appointmentId" element={<RequireAuth><ChatPage /></RequireAuth>} />
          <Route path="/chats"              element={<RequireAuth><ChatsInboxPage /></RequireAuth>} />
          <Route path="/store"         element={<MobileStore />} />
          <Route path="/store/:storeId" element={<StoreDetailPage />} />
          <Route path="/medicines"     element={<MedicinesPage />} />
          <Route path="/settings"      element={<RequireAuth><MobileSettings /></RequireAuth>} />
          <Route path="*"              element={<Navigate to="/dashboard" replace />} />
        </>
      )}

      {/* ══════════════════════════════════════════ | DESKTOP ROUTES — ALL inside AppLayout | (gives every page the Navbar + Footer) | ══════════════════════════════════════════ */}
      {!mobile && (
        <Route element={<AppLayout />}>
          {/* Landing */}
          <Route path="/"                    element={<HomePage />} />

          {/* Dashboard */}
          <Route path="/dashboard"           element={<RequireAuth><DashboardPage /></RequireAuth>} />

          {/* My Cats */}
          <Route path="/my-cats"             element={<RequireAuth><MyCatsPage /></RequireAuth>} />

          {/* Find Vets + Hospital detail */}
          <Route path="/find-vets"           element={<FindVetsPage />} />
          <Route path="/hospital/:id"        element={<HospitalDetailPage />} />

          {/* Booking */}
          <Route path="/book/:vetId"         element={<RequireAuth><BookingPage /></RequireAuth>} />

          {/* AI Companion */}
          <Route path="/ai-companion"        element={<RequireAuth><AICompanionPage /></RequireAuth>} />

          {/* Chat — individual conversation */}
          <Route path="/chat/:appointmentId" element={<RequireAuth><ChatPage /></RequireAuth>} />

          {/* Chats inbox — all conversations list */}
          <Route path="/chats" element={<RequireAuth><ChatsInboxPage /></RequireAuth>} />

          {/* Store */}
          <Route path="/store"               element={<StorePage />} />
          <Route path="/store/:storeId"      element={<StoreDetailPage />} />

          {/* Medicines */}
          <Route path="/medicines"           element={<MedicinesPage />} />

          {/* Settings */}
          <Route path="/settings"            element={<RequireAuth><SettingsPage /></RequireAuth>} />

          {/* Catch-all → home */}
          <Route path="*"                    element={<Navigate to="/" replace />} />
        </Route>
      )}
    </Routes>
  )
}

// ── App ──
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
