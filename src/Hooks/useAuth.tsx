import { useState, useCallback, useRef, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { authService } from '@/Services/AuthService'
import {
  setCredentials,
  logout as clearAuth
} from '@/Context/Slices/authSlice'
import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  AuthData
} from '@/Interfaces/Auth/AuthInterface'

export function useAuth() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isMounted = useRef(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  const call = useCallback(
    async <P, R>(
      fn: (payload: P) => Promise<R>,
      payload: P,
      opts: {
        successKey?: string
        errorKey?: string
        onSuccess?: (data: R) => void
      } = {}
    ): Promise<R> => {
      setLoading(true)
      setError(null)
      try {
        const data = await fn(payload)
        opts.onSuccess?.(data)
        if (opts.successKey) toast.success(t(opts.successKey))
        return data
      } catch (err: unknown) {
        const msg = err instanceof Error
          ? err.message
          : opts.errorKey
            ? t(opts.errorKey)
            : t('login.notifications.loginFailed')
        setError(msg)
        toast.error(msg)
        throw err
      } finally {
        if (isMounted.current) setLoading(false)
      }
    },
    [t]
  )

  const login = useCallback(
    (creds: LoginRequest) =>
      call(authService.loginAsync, creds, {
        onSuccess: (data: AuthData) => {
          dispatch(setCredentials(data))
          navigate('/dashboard')
        },
        successKey: 'login.notifications.loginSuccess',
        errorKey: 'login.errors.loginFailed'
      }),
    [call, dispatch, navigate]
  )

  const registerAsync = useCallback(
    (creds: RegisterRequest) =>
      call(authService.registerAsync, creds, {
        onSuccess: (data: AuthData) => {
          dispatch(setCredentials(data))
          navigate('/dashboard')
        },
        successKey: 'login.notifications.registerSuccess',
        errorKey: 'login.errors.loginFailed'
      }),
    [call, dispatch, navigate]
  )

  const forgotPasswordAsync = useCallback(
    (creds: ForgotPasswordRequest) =>
      call(authService.forgotPasswordAsync, creds, {
        successKey: 'login.notifications.resetRequest',
        errorKey: 'login.errors.loginFailed'
      }),
    [call]
  )

  const resetPasswordAsync = useCallback(
    (creds: ResetPasswordRequest) =>
      call(authService.resetPasswordAsync, creds, {
        successKey: 'login.notifications.resetSuccess',
        errorKey: 'login.errors.loginFailed'
      }),
    [call]
  )

  const verifyEmail = useCallback(
    (creds: VerifyEmailRequest) =>
      call(authService.verifyEmailAsync, creds, {
        successKey: 'login.notifications.verifySuccess',
        errorKey: 'login.errors.loginFailed'
      }),
    [call]
  )

  const logout = useCallback(() => {
    dispatch(clearAuth())
    toast.info(t('login.notifications.logout'))
    navigate('/login')
  }, [dispatch, navigate, t])

  return {
    login,
    registerAsync,
    forgotPasswordAsync,
    resetPasswordAsync,
    verifyEmail,
    logout,
    loading,
    error
  }
}