import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '@/Layout/MainLayout'
import {RequireAuth} from '@/Layout/RequireAuth'
import PublicRoute from '@/Layout/PublicRoute'
import { ThreeDot } from 'react-loading-indicators'
import ClientPage from '@/Pages/Crm/ClientPage'

const Register             = lazy(() => import('@/Pages/Auth/RegisterAccountPage'))
const Login                = lazy(() => import('@/Pages/Auth/LoginPage'))
const VerifyEmail          = lazy(() => import('@/Pages/Auth/VerifyEmailPage'))
const ForgotPassword       = lazy(() => import('@/Pages/Auth/ForgotPasswordPage'))
const ResetPassword        = lazy(() => import('@/Pages/Auth/ResetPasswordPage'))
const Activation           = lazy(() => import('@/Pages/Auth/ActivationAccountPage'))
const Unauthorized         = lazy(() => import('@/Components/Common/Unauthorized'))
const SupportPage          = lazy(() => import('@/Pages/Chat/SupportPage'))
const UsersPage            = lazy(() => import('@/Pages/User/UsersPage'))
const DashboardPage        = lazy(() => import('@/Pages/Dashboard/DashboardPage'))
const NotificationsPage    = lazy(() => import('@/Pages/Notification/NotificationsPage'))
const NotFound             = lazy(() => import('@/Pages/NotFound'))
const SystemParameterPage  = lazy(() => import('@/Pages/Setting/SystemParameterPage'))
const ProfilePage          = lazy(() => import('@/Pages/Setting/ProfilePage'))
const PrivacyPolicy        = lazy(() => import('@/Pages/Setting/PrivacyPolicyPage'))
const VerifyNewContactPage = lazy(() => import('@/Pages/Setting/VerifyNewContactPage'))
const OpeningHourPage      = lazy(() => import('@/Pages/Setting/OpeningHourPage'))
const WorkShiftPage        = lazy(() => import('@/Pages/Setting/WorkShiftPage'))
const ContactPage          = lazy(() => import('@/Pages/Contact/ContactPage'))
const ConversationsPage    = lazy(() => import('@/Pages/Conversation/ConversationsPage'))
const TemplateCategoryPage    = lazy(() => import('@/Pages/Chat/TemplateCategoryPage'))
const WaTemplatesPage    = lazy(() => import('@/Pages/Wa/WaTemplatePage'))
const ProductCatalogPage    = lazy(() => import('@/Pages/Wa/ProductCatalogPage'))
const ServicePage    = lazy(() => import('@/Pages/Crm/ServicePage'))
// const WorkOrderPage    = lazy(() => import('@/Pages/Crm/WorkOrderPage'))
const ClientManagementPanel    = lazy(() => import('@/Pages/Crm/ClientManagementPanel'))



export function AppRouter() {
  return (
    <Suspense fallback={
      <div className="loader-container">
        <ThreeDot color="#0070B4" size="medium" />
      </div>
    }>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="login"           element={<Login />} />
          <Route path="signup"          element={<Register />} />
          <Route path="check-email"     element={<VerifyEmail />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password"  element={<ResetPassword />} />
          <Route path="verify-account"  element={<Activation />} />
          <Route path="privacy-policy"  element={<PrivacyPolicy />} />
          {/* <Route path="privacy-policy"  element={<WorkOrderPage />} /> */}
        </Route>

         <Route path="unauthorized"    element={<Unauthorized />} />

        <Route element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }>
          <Route index element={<Navigate to="chat" replace />} />
          <Route path="dashboard"               element={<DashboardPage />} />
          <Route path="chat"                    element={<SupportPage />} />
          <Route path="contacts"                element={<ContactPage />} />
          <Route path="users"                   element={<UsersPage />} />
          <Route path="notifications"           element={<NotificationsPage />} />
          <Route path="system-params"           element={<SystemParameterPage />} />
          <Route path="templates-categories"           element={<TemplateCategoryPage />} />
          <Route path="profile"                 element={<ProfilePage />} />
          <Route path="opening-hour"            element={<OpeningHourPage />} />
          <Route path="work-shift"              element={<WorkShiftPage />} />
          <Route path="verify-contact/:phoneNumber" element={<VerifyNewContactPage />} />
          <Route path="conversation/:state"     element={<ConversationsPage />} />
          <Route path="whatsapp-productcatalogs"     element={<ProductCatalogPage />} />
          <Route path="templates-management"     element={<WaTemplatesPage />} />
          <Route path="clients"     element={<ClientPage />} />
          <Route path="clientManagementPanel/:id"     element={<ClientManagementPanel />} />
          <Route path="services"     element={<ServicePage />} />
          <Route path="settings" element={<Navigate to="system-params" replace />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}