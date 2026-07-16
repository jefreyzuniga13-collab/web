import {useCallback,useEffect,useState} from "react"
import { toast } from "react-toastify"
import { useSignalR } from "@/Context/SignalRContext"
import { authService } from "@/Services/auth/AuthService"
import type { LoginApprovalRequestedDto} from "@/Interfaces/Auth/AuthInterface"
import { LoginApprovalModal } from "@/Components/Auth/LoginApprovalModal"

/**
 * Escucha solicitudes de acceso mientras existe una sesión autenticada.
 */
export function LoginApprovalWatcher() {
  const {
    onLoginApprovalRequested,
    offLoginApprovalRequested,
  } = useSignalR()

  const [request, setRequest] =
    useState<LoginApprovalRequestedDto | null>(null)

  const [processing, setProcessing] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    const handler = (
      payload: LoginApprovalRequestedDto
    ) => {
      setRequest(payload)
      setError(null)

      toast.info(
        "Se recibió una solicitud de acceso desde otro dispositivo."
      )
    }

    onLoginApprovalRequested(handler)

    return () => {
      offLoginApprovalRequested(handler)
    }
  }, [
    onLoginApprovalRequested,
    offLoginApprovalRequested,
  ])

  const approve = useCallback(async () => {
    if (!request || processing) {
      return
    }

    try {
      setProcessing(true)
      setError(null)

      await authService
        .approveLoginAccessRequestAsync(
          request.requestKey
        )

      toast.success(
        "Solicitud aprobada. El otro dispositivo puede continuar."
      )

      setRequest(null)
    } catch (currentError) {
      const message =
        currentError instanceof Error
          ? currentError.message
          : "No se pudo aprobar la solicitud."

      setError(message)
    } finally {
      setProcessing(false)
    }
  }, [request, processing])

  const reject = useCallback(async () => {
    if (!request || processing) {
      return
    }

    try {
      setProcessing(true)
      setError(null)

      await authService
        .rejectLoginAccessRequestAsync(
          request.requestKey
        )

      toast.info(
        "Solicitud de acceso rechazada."
      )

      setRequest(null)
    } catch (currentError) {
      const message =
        currentError instanceof Error
          ? currentError.message
          : "No se pudo rechazar la solicitud."

      setError(message)
    } finally {
      setProcessing(false)
    }
  }, [request, processing])

  return (
    <LoginApprovalModal
      open={Boolean(request)}
      request={request}
      processing={processing}
      error={error}
      onApprove={approve}
      onReject={reject}
    />
  )
}