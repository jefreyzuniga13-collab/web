import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import type { AppDispatch } from "@/Context"
import type { ForceLogoutDto } from "@/Interfaces/Auth/AuthInterface"
import { logout } from "@/Context/Slices/Auth/authSlice"
import { clearCompanyState } from "@/Context/Slices/Auth/companySlice"
import { clearLoginAccessState } from "@/Context/Slices/Auth/loginAccessSlice"
import { useSignalR } from "@/Context/SignalRContext"
import { stopHubConnection } from "@/Services/signalr"
import {limpiarSesionCliente} from "@/Utils/clearClientStorage"

/**
 * Escucha el cierre forzado de la sesión anterior.
 *
 * No llama al endpoint logout porque la API ya revocó
 * la sesión antes de emitir el evento ForceLogout.
 */
export function useForceLogoutListener(): void {
  const dispatch =
    useDispatch<AppDispatch>()

  const navigate =
    useNavigate()

  const {
    onForceLogout,
    offForceLogout,
  } = useSignalR()

  useEffect(() => {
    let processing = false

    const handler = async (
      payload: ForceLogoutDto
    ) => {
      if (processing) return

      processing = true

      try {
        /*
         * Se detienen las conexiones antes de limpiar Redux
         * para impedir intentos de reconexión.
         */
        await stopHubConnection()

        dispatch(logout())
        dispatch(clearCompanyState())
        dispatch(clearLoginAccessState())

        await limpiarSesionCliente()

        toast.warning(
          payload.message ||
            "La sesión fue cerrada desde otro dispositivo."
        )

        navigate(
          "/login",
          {
            replace: true,
          }
        )
      } finally {
        processing = false
      }
    }

    onForceLogout(handler)

    return () => {
      offForceLogout(handler)
    }
  }, [
    dispatch,
    navigate,
    onForceLogout,
    offForceLogout,
  ])
}