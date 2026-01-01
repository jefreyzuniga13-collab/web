import { useState, useMemo } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useAuth } from '@/Hooks/Auth/useAuth'
// import { CompanyService } from '@/Services/CompanyService'
import type { RegisterRequest } from '@/Interfaces/Auth/AuthInterface'

interface CompanyOption {
  label: string
  value: number
}

export default function useRegisterForm() {
  const { registerAsync, loading } = useAuth()
  const [companies] = useState<CompanyOption[]>([])
  const [fetchError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const validationSchema = useMemo(
    () =>
      Yup.object<RegisterRequest>({
        fullName: Yup.string()
          .trim()
          .required('El nombre completo es obligatorio.'),
        email: Yup.string()
          .trim()
          .email('Ingresa un correo electrónico válido.')
          .required('El correo electrónico es obligatorio.'),
        password: Yup.string()
          .min(8, 'La contraseña debe tener al menos 8 caracteres.')
          .required('La contraseña es obligatoria.'),
        companyId: Yup.number()
          .integer()
          .positive()
          .required('La empresa es obligatoria.'),
        phone: Yup.string()
          .trim()
          .required('El número de teléfono es obligatorio.'),
        identifier: Yup.string()
          .trim()
          .required('El identificador es obligatorio.')
      }),
    []
  )

  const formik = useFormik<RegisterRequest>({
    initialValues: {
      fullName: '',
      email: '',
      password: '',
      companyId: 0,
      phone: '',
      identifier: ''
    },
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setStatus(undefined)
      try {
        await registerAsync(values)
      } catch (err: unknown) {
        setStatus(
          err instanceof Error
            ? err.message
            : 'No se pudo completar el registro. Intenta nuevamente.'
        )
      } finally {
        setSubmitting(false)
      }
    }
  })

  return {
    formik,
    companies,
    fetchError,
    loading,
    showPassword,
    toggleShowPassword: () => setShowPassword(v => !v),
    canSubmit: formik.isValid && formik.dirty && !loading,
    formError: formik.status as string | undefined,
  }
}