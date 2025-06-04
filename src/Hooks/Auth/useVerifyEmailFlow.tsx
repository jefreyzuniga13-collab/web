import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
//import { useTranslation } from 'react-i18next'
//import { toast } from 'react-toastify'
import { useAuth } from '@/Hooks/Auth/useAuth'
import type { VerifyEmailRequest } from '@/Interfaces/Auth/AuthInterface'

export default function useVerifyEmailFlow() {
  //const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyEmail, loading, error } = useAuth()
  const [done, setDone] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token') ?? ''
    
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    const req: VerifyEmailRequest = { token }
    verifyEmail(req)
      .then(() => {
        setDone(true)
        navigate(`/reset-password?token=${token}`);
        //toast.success(t('activationAccount.notifications.success'))
      })
      .catch(() => {
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return { loading, error, done }
}