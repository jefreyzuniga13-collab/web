import { useState, useMemo } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/Hooks/Auth/useAuth'
//import { CompanyService } from '@/Services/CompanyService'
import type { RegisterRequest } from '@/Interfaces/Auth/AuthInterface'

interface CompanyOption {
  label: string
  value: number
}

export default function useRegisterForm() {
  const { t } = useTranslation()
  const { registerAsync, loading } = useAuth()
  const [companies] = useState<CompanyOption[]>([])
  const [fetchError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // // 1) Traer lista de compañías
  // useEffect(() => {
  //   CompanyService.getAllAsync()
  //     .then(({ data }) => {
  //       setCompanies(
  //         data.data.map(c => ({ label: c.name, value: c.companyId }))
  //       )
  //     })
  //     .catch(() => {
  //       setFetchError(t('register.errors.fetchCompanies'))
  //     })
  // }, [t])

  // 2) Schema de validación
  const validationSchema = useMemo(
    () =>
      Yup.object<RegisterRequest>({
        fullName:   Yup.string().trim().required(t('register.errors.required', { field: t('register.fullNameLabel') })),
        email:      Yup.string().trim().email(t('register.errors.invalidEmail')).required(t('register.errors.required', { field: t('register.emailLabel') })),
        password:   Yup.string().min(8, t('register.errors.passwordMin', { min: 8 })).required(t('register.errors.required', { field: t('register.passwordLabel') })),
        companyId:  Yup.number().integer().positive().required(t('register.errors.required', { field: t('register.companyNameLabel') })),
        phone:      Yup.string().trim().required(t('register.errors.required', { field: t('register.phoneLabel') })),
        identifier: Yup.string().trim().required(t('register.errors.required', { field: t('register.identifierLabel') }))
      }),
    [t]
  )

  // 3) Formik
  const formik = useFormik<RegisterRequest>({
    initialValues: {
      fullName:   '',
      email:      '',
      password:   '',
      companyId:  0,
      phone:      '',
      identifier: ''
    },
    validationSchema,
    validateOnBlur:   true,
    validateOnChange: false,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setStatus(undefined)
      try {
        await registerAsync(values)
      } catch (err: unknown) {
        setStatus(
          err instanceof Error
            ? err.message
            : t('register.errors.registrationFail')
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