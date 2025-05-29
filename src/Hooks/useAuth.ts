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

import { useSignalR } from '@/Context/SignalRContext'

interface AuthStorage {
  accessToken: string
  refreshToken: string
  expiresAt: string
  userId: number
}

export function useAuth() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isMounted = useRef(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const {
    notifyUserPresent,
    notifyUserAbsent
      } = useSignalR()

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

    // Lee auth
  const authRaw = localStorage.getItem('auth') || '{}'
  const userData = JSON.parse(authRaw) as AuthStorage

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
          navigate('/chat')

          notifyUserPresent(userData.userId);

          navigate(0);
        },
        successKey: 'login.notifications.loginSuccess',
        errorKey: 'login.errors.loginFailed'
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [call, dispatch, navigate]
  )

  const registerAsync = useCallback(
    (creds: RegisterRequest) =>
      call(authService.registerAsync, creds, {
        onSuccess: () => {
          navigate('/check-email', { replace: true })
        },
        successKey: 'register.notifications.sentEmail',
        errorKey:   'register.errors.registrationFail'
      }),
    [call, navigate]
  )

  const forgotPasswordAsync = useCallback(
    (creds: ForgotPasswordRequest) =>
      call(authService.forgotPasswordAsync, creds, {
        onSuccess: () => {
          navigate('/check-email', { replace: true })
        },
        successKey: 'login.notifications.resetRequest',
        errorKey: 'login.errors.loginFailed'
      }),
    [call, navigate]
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
          successKey: 'activationAccount.notifications.success',
          errorKey: 'activationAccount.errors.invalidToken'
        }),
      [call]
    )


  const logout = useCallback(() => {
    dispatch(clearAuth())
    toast.info(t('login.notifications.logout'))
    navigate('/login')

    notifyUserAbsent(userData.userId);

  // eslint-disable-next-line react-hooks/exhaustive-deps
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