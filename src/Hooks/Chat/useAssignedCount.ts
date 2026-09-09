import { useQuery } from '@tanstack/react-query'
import { getAssignedCount } from '@/Services/chat/ConversationService'

export function useAssignedCount(agentUserId: number) {
  const { data: count = 0 } = useQuery<number, Error>({
    queryKey: ['conversations', 'assigned-count', agentUserId],
    queryFn: async () => {
      const { data } = await getAssignedCount(agentUserId)
      return data
    },
    enabled: agentUserId > 0,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  })

  return count
}
