import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { toast } from 'react-toastify'
import { useAuth } from '@/Hooks/Auth/useAuth'
import type { ResetPasswordRequest } from '@/Interfaces/Auth/AuthInterface'

export default function useResetPasswordForm() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { resetPasswordAsync, loading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  let token = searchParams.get('token') ?? ''
  token = token.replace(/ /g, '+')

  useEffect(() => {
    if (!token) {
      toast.error('El enlace de restablecimiento no es válido.')
      navigate('/login', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const validationSchema = Yup.object<ResetPasswordRequest>({
    token: Yup.string().required('El token es obligatorio.'),
    newPassword: Yup.string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.')
      .required('La nueva contraseña es obligatoria.'),
    confirmNewPassword: Yup.string()
      .oneOf([Yup.ref('newPassword')], 'Las contraseñas no coinciden.')
      .required('La confirmación de la contraseña es obligatoria.'),
  })

  const formik = useFormik<ResetPasswordRequest>({
    initialValues: { token, newPassword: '', confirmNewPassword: '' },
    validationSchema,
    validateOnChange: true,
    onSubmit: async (values, { setStatus }) => {
      setStatus(undefined)
      try {
        await resetPasswordAsync(values)
        toast.success('La contraseña se restableció correctamente.')
        navigate('/login', { replace: true })
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : 'No se pudo restablecer la contraseña. Intenta nuevamente.'
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