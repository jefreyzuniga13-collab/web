import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "react-toastify"

import type {
  AgentDto,
  ConversationDto,
} from "@/Interfaces/Chat/ChatInterfaces"

import type {
  AppDispatch,
  RootState,
} from "@/Context"

import { AgentService } from "@/Services/auth/AgentService"
import { assignAgent } from "@/Services/chat/ConversationService"

import { closeAssignModal } from "@/Context/Slices/Chat/assignModalSlice"

interface AssignModalHook {
  conversation: ConversationDto | null | undefined
  isOpen: boolean
  agents: AgentDto[]
  loadingAgents: boolean
  loadingAgentId: number | null
  isSubmitting: boolean
  handleAssignAgent: (agentId: number) => Promise<void>
  handleClose: () => void
}

export function useAssignModal(): AssignModalHook {
  const dispatch = useDispatch<AppDispatch>()

  const { isOpen, conversation } = useSelector(
    (state: RootState) => state.assignModal
  )

  const [agents, setAgents] = useState<AgentDto[]>([])
  const [loadingAgents, setLoadingAgents] = useState(false)
  const [loadingAgentId, setLoadingAgentId] = useState<number | null>(null)

  /*
   * Bloqueo síncrono adicional.
   *
   * Evita que dos clics muy rápidos ejecuten dos solicitudes
   * antes de que React actualice loadingAgentId.
   */
  const submittingRef = useRef(false)

  const isSubmitting = loadingAgentId !== null

  useEffect(() => {
    if (!isOpen || !conversation) {
      setAgents([])
      setLoadingAgents(false)
      setLoadingAgentId(null)
      submittingRef.current = false
      return
    }

    let cancelled = false

    const loadAgents = async () => {
      try {
        setLoadingAgents(true)

        const response = await AgentService.agentOnlineAsync()

        if (cancelled) return

        setAgents(response ?? [])
      } catch (error) {
        if (cancelled) return

        console.error("Error al cargar agentes:", error)
        setAgents([])
        toast.error("No se pudieron cargar los agentes.")
      } finally {
        if (!cancelled) {
          setLoadingAgents(false)
        }
      }
    }

    void loadAgents()

    return () => {
      cancelled = true
    }
  }, [isOpen, conversation?.conversationId])

  const handleAssignAgent = async (agentId: number): Promise<void> => {
    if (!conversation) return
    if (agentId <= 0) return

    /*
     * Primera protección contra doble envío.
     */
    if (submittingRef.current || loadingAgentId !== null) {
      return
    }

    if (conversation.assignedAgentId === agentId) {
      toast.info(
        "La conversación ya está asignada a este agente."
      )
      return
    }

    submittingRef.current = true
    setLoadingAgentId(agentId)

    try {
      await assignAgent(
        conversation.conversationId,
        String(agentId),
        "Human"
      )

      toast.success(
        conversation.assignedAgentId
          ? "Solicitud de reasignación enviada correctamente."
          : "Solicitud de asignación enviada correctamente."
      )

      dispatch(closeAssignModal())
    } catch (error: unknown) {
      console.error(
        "Error al asignar la conversación:",
        error
      )

      const apiError = error as {
        response?: {
          data?: {
            message?: string
          }
        }
      }

      const message =
        apiError.response?.data?.message ??
        "No se pudo asignar el agente. Intenta nuevamente."

      toast.error(message)
    } finally {
      submittingRef.current = false
      setLoadingAgentId(null)
    }
  }

  const handleClose = (): void => {
    if (submittingRef.current || loadingAgentId !== null) {
      return
    }

    dispatch(closeAssignModal())
  }

  return {
    conversation,
    isOpen,
    agents,
    loadingAgents,
    loadingAgentId,
    isSubmitting,
    handleAssignAgent,
    handleClose,
  }
}