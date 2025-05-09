import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

const LoginPresentation = lazy(() => import('@/Presentations/Auth/LoginPresentation'))
const RegisterAccountPresentation = lazy(() => import('@/Presentations/Auth/RegisterAccountPresentation'))
const NotFound = lazy(() => import('@/Presentations/NotFound'))
const VerifyEmailPresentation = lazy(()=> import('@/Presentations/Auth/VerifyEmailPresentation'))
const ForgotPasswordPresentation = lazy(()=> import("@/Presentations/Auth/ForgotPasswordPresentation"))
const ResetPasswordPresentation = lazy(()=> import("@/Presentations/Auth/ResetPasswordPresentation"))
const ActivationAccountPresentation = lazy(()=> import("@/Presentations/Auth/ActivationAccountPresentation"))
const Unauthorized = lazy(()=> import("@/Components/Common/Unauthorized"))
const ChatPresentation = lazy(()=> import("@/Presentations/Chats/ChatPresentation"))
const ProtectedRouteLayout = lazy(()=> import('@/Layout/ProtectedRouteLayout'))
const SupportPage = lazy(()=> import("@/Presentations/Chats/SupportPage"))

export function AppRouter() {
  return (
    <Suspense fallback={<div className="loading">Loading…</div>}>
      <Routes>
        <Route index element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPresentation />} />
        <Route path="/signup" element={<RegisterAccountPresentation />} />
        <Route path="/check-email" element={<VerifyEmailPresentation />} />
        <Route path='/forgot-password' element={<ForgotPasswordPresentation/>} />
        <Route path='/reset-password' element={<ResetPasswordPresentation/>}/>
        <Route path='/verify-account' element={<ActivationAccountPresentation/>}/>
        <Route path='/unauthorized' element={<Unauthorized/>}/>
        <Route path='/chat' element={<SupportPage/>}/>
       
        <Route path="*" element={<NotFound />} />


        <Route element={<ProtectedRouteLayout roles={['db_admin, db_agent, db-client']} />}>
          <Route path="/chat" element={<ChatPresentation />} />
        </Route>

        {/* Sólo agentes */}
        {/* <Route element={<RoleProtectedRoute roles={['db_agent']} />}>
          <Route path="/agent" element={<AgentPage />} />
        </Route> */}
      </Routes>
    </Suspense>
  )
}