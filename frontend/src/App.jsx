import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'

/* Layouts */
import AppLayout from './layouts/AppLayout.jsx'

/* Landing page sections */
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

/* Auth pages */
import LoginPage            from './pages/LoginPage.jsx'
import RegisterPage         from './pages/RegisterPage.jsx'
import SystemAdminLoginPage from './pages/SystemAdminLoginPage.jsx'

/* Dashboards */
import DashboardPage          from './pages/DashboardPage.jsx'
import HospitalAdminDashboard from './pages/HospitalAdminDashboard.jsx'
import SystemAdminDashboard   from './pages/SystemAdminDashboard.jsx'

/* Onboarding */
import HospitalRegisterPage from './pages/HospitalRegisterPage.jsx'
import StoreRegisterPage    from './pages/StoreRegisterPage.jsx'

/* App pages */
import FindVetsPage       from './pages/FindVetsPage.jsx'
import HospitalDetailPage from './pages/HospitalDetailPage.jsx'
import BookingPage        from './pages/BookingPage.jsx'
import StorePage          from './pages/StorePage.jsx'
import StoreDetailPage    from './pages/StoreDetailPage.jsx'
import AICompanionPage    from './pages/AICompanionPage.jsx'
import MedicinesPage      from './pages/MedicinesPage.jsx'
import ChatPage           from './pages/ChatPage.jsx'
import MyCatsPage        from './pages/MyCatsPage.jsx'
import SettingsPage      from './pages/SettingsPage.jsx'

/* ── Landing home ── */
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

/* ── Protected route wrapper ── */
function RequireAuth({ children }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

/* ── Admin-only route wrapper ── */
function RequireAdmin({ children }) {
  const isAdminSession = sessionStorage.getItem('pc_admin_session') === 'true'
  if (!isAdminSession) return <Navigate to="/admin/login" replace />
  return children
}

/* ── Hospital Admin route wrapper ── */
function RequireHospitalAdmin({ children }) {
  const { isLoggedIn, user } = useAuth()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (user && user.role !== 'hospital_admin') return <Navigate to="/dashboard" replace />
  return children
}

/* ── App ── */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public auth pages ── */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Onboarding (public) ── */}
          <Route path="/hospital/register" element={<HospitalRegisterPage />} />
          <Route path="/store/register"    element={<StoreRegisterPage />} />

          {/* ── System admin ── */}
          <Route path="/admin/login" element={<SystemAdminLoginPage />} />
          <Route path="/admin/dashboard" element={
            <RequireAdmin><SystemAdminDashboard /></RequireAdmin>
          } />

          {/* ── Hospital admin dashboard ── */}
          <Route path="/hospital/dashboard" element={
            <RequireHospitalAdmin><HospitalAdminDashboard /></RequireHospitalAdmin>
          } />

          {/* ── Cat owner / vet dashboard ── */}
          <Route path="/dashboard" element={
            <RequireAuth><DashboardPage /></RequireAuth>
          } />

          {/* ── AI Companion (own page, no shared layout) ── */}
          <Route path="/ai-companion" element={
            <RequireAuth><AICompanionPage /></RequireAuth>
          } />

          {/* ── Chat page (own page, no shared layout) ── */}
          <Route path="/chat/:appointmentId" element={
            <RequireAuth><ChatPage /></RequireAuth>
          } />

          {/* ── My Cats page ── */}
          <Route path="/my-cats" element={
            <RequireAuth><MyCatsPage /></RequireAuth>
          } />

          {/* ── Settings page ── */}
          <Route path="/settings" element={
            <RequireAuth><SettingsPage /></RequireAuth>
          } />

          {/* ── Booking page (own page, no shared layout) ── */}
          <Route path="/book/:vetId" element={
            <RequireAuth><BookingPage /></RequireAuth>
          } />

          {/* ── Main app with shared Navbar + Footer ── */}
          <Route element={<AppLayout />}>
            <Route path="/"                    element={<HomePage />} />
            <Route path="/find-vets"           element={<FindVetsPage />} />
            <Route path="/hospital/:id"        element={<HospitalDetailPage />} />
            <Route path="/store"               element={<StorePage />} />
            <Route path="/store/:storeId"      element={<StoreDetailPage />} />
            <Route path="/medicines"           element={<MedicinesPage />} />
            {/* Catch-all → home */}
            <Route path="*"                    element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
