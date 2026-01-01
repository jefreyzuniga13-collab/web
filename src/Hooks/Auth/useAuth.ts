import { useState, useCallback, useRef, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { authService } from '@/Services/auth/AuthService'
import { setCredentials, logout as clearAuth } from '@/Context/Slices/Auth/authSlice'

import type {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  AuthData
} from '@/Interfaces/Auth/AuthInterface'

export function useAuth() {
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
        successMessage?: string
        errorMessage?: string
        onSuccess?: (data: R) => void
      } = {}
    ): Promise<R> => {
      setLoading(true)
      setError(null)

      try {
        const data = await fn(payload)
        opts.onSuccess?.(data)
        if (opts.successMessage) toast.success(opts.successMessage)
        return data
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : opts.errorMessage ?? 'No se pudo completar la operación. Intenta nuevamente.'

        setError(msg)
        toast.error(msg)
        throw err
      } finally {
        if (isMounted.current) setLoading(false)
      }
    },
    []
  )

  const login = useCallback(
    (creds: LoginRequest) =>
      call(authService.loginAsync, creds, {
        onSuccess: (data: AuthData) => {
          dispatch(setCredentials(data))
          navigate('/chat', { replace: true })
          navigate(0)
        },
        successMessage: 'Inicio de sesión exitoso.',
        errorMessage: 'No se pudo iniciar sesión. Verifica tus credenciales e inténtalo de nuevo.'
      }),
    [call, dispatch, navigate]
  )

  const registerAsync = useCallback(
    (creds: RegisterRequest) =>
      call(authService.registerAsync, creds, {
        onSuccess: () => {
          navigate('/check-email', { replace: true })
        },
        successMessage: 'Te enviamos un correo para verificar tu cuenta.',
        errorMessage: 'No se pudo completar el registro. Intenta nuevamente.'
      }),
    [call, navigate]
  )

  const forgotPasswordAsync = useCallback(
    (creds: ForgotPasswordRequest) =>
      call(authService.forgotPasswordAsync, creds, {
        onSuccess: () => {
          navigate('/check-email', { replace: true })
        },
        successMessage: 'Te enviamos un correo para restablecer tu contraseña.',
        errorMessage: 'No se pudo procesar la solicitud. Intenta nuevamente.'
      }),
    [call, navigate]
  )

  const resetPasswordAsync = useCallback(
    (creds: ResetPasswordRequest) =>
      call(authService.resetPasswordAsync, creds, {
        successMessage: 'Contraseña restablecida correctamente.',
        errorMessage: 'No se pudo restablecer la contraseña. Verifica el enlace e inténtalo nuevamente.'
      }),
    [call]
  )

  const verifyEmail = useCallback(
    (creds: VerifyEmailRequest) =>
      call(authService.verifyEmailAsync, creds, {
        successMessage: 'Cuenta activada correctamente.',
        errorMessage: 'El enlace de activación no es válido o ya expiró.'
      }),
    [call]
  )

  const logout = useCallback(async () => {
    const authRaw = localStorage.getItem('auth')
    const auth: AuthData | null = authRaw ? JSON.parse(authRaw) : null
    const uid = auth?.userId

    try {
      if (uid) {
        const res = await authService.logoutAsync(Number(uid))
        toast.success(res?.message ?? 'Sesión cerrada.')
      } else {
        toast.success('Sesión cerrada.')
      }
    } catch {
      toast.error('Error al cerrar sesión.')
    }

    dispatch(clearAuth())
    localStorage.removeItem('auth')
    navigate('/login', { replace: true })
  }, [dispatch, navigate])

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