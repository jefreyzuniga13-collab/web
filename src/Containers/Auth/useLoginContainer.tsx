import { useState, useMemo } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/Hooks/useAuth'
import type { LoginRequest } from '@/Interfaces/Auth/AuthInterface'

interface LoginFormValues extends LoginRequest {
  remember: boolean
}

export default function useLoginContainer() {
  const { t } = useTranslation()
  const { login, loading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const validationSchema = useMemo(
    () =>
      Yup.object<LoginFormValues>({
        email: Yup.string()
          .trim()
          .lowercase()
          .email(t('login.errors.invalidEmail'))
          .required(t('login.errors.required', { field: t('login.emailLabel') })),
        password: Yup.string()
          .min(8, t('login.errors.passwordMin', { min: 8 }))
          .required(t('login.errors.required', { field: t('login.passwordLabel') })),
        remember: Yup.boolean()
      }),
    [t]
  )

  const formik = useFormik<LoginFormValues>({
    initialValues: { email: '', password: '', remember: false },
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setStatus(undefined)
      try {
        const { email, password } = values
        await login({ email, password })
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : t('login.errors.loginFailed')
        setStatus(msg)
      } finally {
        setSubmitting(false)
      }
    }
  })

  return {
    formik,
    loading,
    showPassword,
    toggleShowPassword: () => setShowPassword(v => !v),
    canSubmit: formik.isValid && formik.dirty && !loading,
    formError: formik.status as string | undefined
  }
}