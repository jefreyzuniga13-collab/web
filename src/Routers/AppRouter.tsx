import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '@/Layout/MainLayout'
import { ThreeDot } from 'react-loading-indicators'

const Login           = lazy(() => import('@/Presentations/Auth/LoginPresentation'))
const Register        = lazy(() => import('@/Presentations/Auth/RegisterAccountPresentation'))
const VerifyEmail     = lazy(() => import('@/Presentations/Auth/VerifyEmailPresentation'))
const ForgotPassword  = lazy(() => import('@/Presentations/Auth/ForgotPasswordPresentation'))
const ResetPassword   = lazy(() => import('@/Presentations/Auth/ResetPasswordPresentation'))
const Activation      = lazy(() => import('@/Presentations/Auth/ActivationAccountPresentation'))
const Unauthorized    = lazy(() => import('@/Components/Common/Unauthorized'))
const SupportPage     = lazy(() => import('@/Presentations/Chat/SupportPage'))
const UsersPage       = lazy(() => import('@/Presentations/User/UsersPage'))
const DashboardPresentation       = lazy(() => import('@/Presentations/Dashboard/DashboardPresentation'))
const NotificationsPage       = lazy(() => import('@/Presentations/Notification/NotificationsPage'))
const NotFound        = lazy(() => import('@/Presentations/NotFound'))
const SystemParameterPage = lazy(() => import('@/Presentations/Setting/SystemParameterPage'))
const ProfilePage = lazy(() => import('@/Presentations/Setting/Profile'))
const PrivacyPolicy = lazy(() => import('@/Presentations/Setting/PrivacyPolicy'))
const VerifyNewContactPage = lazy(()=> import("@/Presentations/Setting/VerifyNewContactPage"))
const OpeningHourPage = lazy(()=> import("@/Presentations/Setting/OpeningHourPage"))

export function AppRouter() {
  return (
    <Suspense fallback={
      <div className="loader-container">
        <ThreeDot color="#3142cc" size="medium" />
      </div>
    }>
      <Routes>
        {/* Rutas públicas */}
        <Route index element={<Navigate to="/login" replace />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/signup"          element={<Register />} />
        <Route path="/check-email"     element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/verify-account"  element={<Activation />} />
        <Route path="/privacy-policy"  element={<PrivacyPolicy />} />
        <Route path="/verify-account"  element={''} />

        {/**Rutas privados */}
        <Route path="/unauthorized"    element={<Unauthorized />} />
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="chat" replace />} />

            <Route path="dashboard" element={<DashboardPresentation />} />
            <Route path="chat"      element={<SupportPage />} />
            <Route path="users"  element={<UsersPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="system-params" element={<SystemParameterPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="opening-hour" element={<OpeningHourPage />} />
            <Route path="verify-contact/:phone" element={<VerifyNewContactPage />} />
            <Route path="settings" element={<Navigate to="/system-params" replace />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}