import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AgentService } from '@/Services/auth/AgentService'
import type { AssignableAgent } from '@/Interfaces/Chat/BulkAssignmentInterface'

const assignableAgentKeys = {
  all: ['assignable-agents'] as const,
  list: () =>
    [...assignableAgentKeys.all, 'list'] as const,
}

export const useAssignableAgents = () => {
  const [search, setSearch] = useState('')
  const [onlyOnline, setOnlyOnline] =
    useState(false)

  const [includeInactive, setIncludeInactive] =
    useState(false)

  const {
    data: agents = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<AssignableAgent[], Error>({
    queryKey: assignableAgentKeys.list(),
    queryFn: () =>
      AgentService.getAssignableAgentsAsync(),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  })

  const filteredAgents = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase()

    return agents.filter(agent => {
      if (
        onlyOnline &&
        !agent.isOnline
      ) {
        return false
      }

      if (
        !includeInactive &&
        !agent.isActive
      ) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const searchableText = [
        agent.name,
        agent.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(
        normalizedSearch
      )
    })
  }, [
    agents,
    search,
    onlyOnline,
    includeInactive,
  ])

  const activeAgents = useMemo(
    () =>
      agents.filter(agent => agent.isActive),
    [agents]
  )

  const onlineAgents = useMemo(
    () =>
      agents.filter(
        agent =>
          agent.isActive &&
          agent.isOnline
      ),
    [agents]
  )

  return {
    agents,
    filteredAgents,
    activeAgents,
    onlineAgents,

    search,
    setSearch,

    onlyOnline,
    setOnlyOnline,

    includeInactive,
    setIncludeInactive,

    isLoading,
    isFetching,
    isError,
    error,

    refetch,
  }
}

export default useAssignableAgents