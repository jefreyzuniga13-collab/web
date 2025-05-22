import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { toast } from 'react-toastify'
import { useAuth } from '@/Hooks/useAuth'
import type { ResetPasswordRequest } from '@/Interfaces/Auth/AuthInterface'

export default function useResetContainer() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { resetPasswordAsync, loading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

    let token = searchParams.get('token') ?? ''
    token = token.replace(/ /g, '+')

  useEffect(() => {
    if (!token) {
      toast.error(t('resetPassword.errors.noToken'))
      navigate('/login', { replace: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const validationSchema = Yup.object<ResetPasswordRequest>({
    token: Yup.string().required(t('resetPassword.errors.requiredToken')),
    newPassword: Yup.string()
      .min(8, t('resetPassword.errors.passwordMin', { min: 8 }))
      .required(t('resetPassword.errors.requiredNewPassword')),
    confirmNewPassword: Yup.string()
      .oneOf([Yup.ref('newPassword')], t('resetPassword.errors.passwordsMustMatch'))
      .required(t('resetPassword.errors.requiredConfirm')),
  })

  const formik = useFormik<ResetPasswordRequest>({
    initialValues: { token, newPassword: '', confirmNewPassword: '' },
    validationSchema,
    validateOnChange: false,
    onSubmit: async (values, { setStatus }) => {
      setStatus(undefined)
      console.log(token)
      try {
        await resetPasswordAsync(values)
        toast.success(t('resetPassword.notifications.success'))
        navigate('/login', { replace: true })
      } catch (err: unknown) {
        const msg = err instanceof Error
          ? err.message
          : t('resetPassword.errors.resetFailed')
        setStatus(msg)
      }
    },
  })

  return {
    formik,
    loading,
    showPassword,
    toggleShowPassword: () => setShowPassword(v => !v),
    showConfirm,
    toggleShowConfirm: () => setShowConfirm(v => !v),
    canSubmit: formik.isValid && formik.dirty && !loading,
    formError: formik.status as string | undefined,
  }
} 