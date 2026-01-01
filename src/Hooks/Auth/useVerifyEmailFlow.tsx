import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/Hooks/Auth/useAuth'
import type { VerifyEmailRequest } from '@/Interfaces/Auth/AuthInterface'

export default function useVerifyEmailFlow() {
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
        navigate(`/reset-password?token=${token}`)
      })
      .catch(() => {
        // error ya se maneja desde useAuth
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  return { loading, error, done }
}