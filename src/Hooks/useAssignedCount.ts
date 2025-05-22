import { useState, useEffect } from 'react'
import { getAssignedCount } from '@/Services/ConversationService'

export function useAssignedCount(agentUserId: number, pollInterval = 60_000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let mounted = true
    const fetch = async () => {
      try {
        const { data } = await getAssignedCount(agentUserId)
        if (mounted) setCount(data)
      } catch (e) {
        console.error('Error fetching assigned count', e)
      }
    }
    fetch()
    const timer = setInterval(fetch, pollInterval)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [agentUserId, pollInterval])

  return count
}