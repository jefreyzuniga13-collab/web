import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

const LoginPresentation = lazy(() => import('@/Presentations/Auth/LoginPresentation'))
const NotFound = lazy(() => import('@/Presentations/NotFound'))
const VerifyEmailPresentation = lazy(()=> import('@/Presentations/Auth/VerifyEmailPresentation'))
const ForgotPasswordPresentation = lazy(()=> import("@/Presentations/Auth/ForgotPasswordPresentation"))
const ResetPasswordPresentation = lazy(()=> import("@/Presentations/Auth/ResetPasswordPresentation"))
const ActivationAccountPresentation = lazy(()=> import("@/Presentations/Auth/ActivationAccountPresentation"))

export function AppRouter() {
  return (
    <Suspense fallback={<div className="loading">Loading…</div>}>
      <Routes>
        <Route index element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPresentation />} />
        <Route path="/sent-email" element={<VerifyEmailPresentation />} />
        <Route path='/forgot-password' element={<ForgotPasswordPresentation/>} />
        <Route path='/reset-password' element={<ResetPasswordPresentation/>}/>
        <Route path='/activation-account' element={<ActivationAccountPresentation/>}/>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}