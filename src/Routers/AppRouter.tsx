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
//const Dashboard       = lazy(() => import('@/Presentations/DashboardPresebtation'))
const SupportPage     = lazy(() => import('@/Presentations/Chat/SupportPage'))
const UsersPage       = lazy(() => import('@/Presentations/User/UsersPage'))
const DashboardPresentation       = lazy(() => import('@/Presentations/Dashboard/DashboardPresentation'))
const NotFound        = lazy(() => import('@/Presentations/NotFound'))

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
        <Route path="/unauthorized"    element={<Unauthorized />} />
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="Dashboard" replace />} />
            <Route path="Dashboard" element={<DashboardPresentation />} />
            <Route path="Chat"      element={<SupportPage />} />
            <Route path="Usuarios"  element={<UsersPage />} />
          </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}