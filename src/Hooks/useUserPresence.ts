import { useState, useEffect } from 'react'
import { userService } from '@/Services/UserService'

export function useUserPresence(userId: number, pollInterval = 60_000) {
  const [presence, setPresence] = useState<{ isOnline: boolean; lastOnline?: string }>({
    isOnline: false
  })

  useEffect(() => {
    let mounted = true
    const fetch = async () => {
      try {
        const { isOnline, lastOnline } = await userService.getUserStatus(userId)
        if (mounted) setPresence({ isOnline, lastOnline })
      } catch (e) {
        console.error('Error fetching presence', e)
      }
    }
    fetch()
    const timer = setInterval(fetch, pollInterval)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [userId, pollInterval])

  return presence
}