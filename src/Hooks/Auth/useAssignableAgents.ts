import { useMemo, useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { AgentService } from '@/Services/auth/AgentService'

import type { AgentDto } from '@/Interfaces/Chat/ChatInterfaces'
import type { AssignableAgent } from '@/Interfaces/Chat/BulkAssignmentInterface'

const toAssignableAgent = (agent: AgentDto): AssignableAgent => ({
  id: agent.userId,
  name: agent.fullName,
  email: agent.email,
  imageUrl: agent.imageUrl,
  isOnline: agent.isOnline ?? false,
  isActive: agent.isActive ?? true,
})

export const supportAgentKeys = {
  all: ['users', 'agents'] as const,
  list: () => supportAgentKeys.all,
}

export const useAssignableAgents = (options?: { enabled?: boolean }) => {
  const [search, setSearch] = useState('')
  const [onlyOnline, setOnlyOnline] =
    useState(false)

  const [includeInactive, setIncludeInactive] =
    useState(false)

  const {
    data: rawAgents = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<AgentDto[], Error>({
    queryKey: supportAgentKeys.list(),
    queryFn: () => AgentService.getAgentsAsync(),
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  })

  const agents = useMemo(
    () => rawAgents.map(toAssignableAgent),
    [rawAgents]
  )

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