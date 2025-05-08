import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { useAuth } from '@/Hooks/useAuth'
import type { VerifyEmailRequest } from '@/Interfaces/Auth/AuthInterface'

export default function useVerifyContainer() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyEmail, loading, error } = useAuth()
  const [done, setDone] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token') ?? ''
    if (!token) {
      toast.error(t('activationAccount.errors.noToken'))
      navigate('/login', { replace: true })
      return
    }

    const req: VerifyEmailRequest = { token }
    verifyEmail(req)
      .then(() => {
        setDone(true)
        toast.success(t('activationAccount.notifications.success'))
      })
      .catch(() => {
        // ya se muestra toast de error en useAuth
      })
  }, [searchParams, verifyEmail, t, navigate])

  return { loading, error, done }
}