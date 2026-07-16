import * as signalR from "@microsoft/signalr"
import type {LoginRequestResolvedDto} from "@/Interfaces/Auth/AuthInterface"
const API_URL =import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ?? ""
const HUB_BASE = API_URL.replace(/\/api\/v1$/, "")

let loginAccessConnection: signalR.HubConnection | null = null
let activeRequestKey: string | null = null
let startPromise: Promise<void> | null = null

const approvedHandlers = new Map<
  (payload: LoginRequestResolvedDto) => void,
  (payload: LoginRequestResolvedDto) => void
>()

const rejectedHandlers = new Map<
  (payload: LoginRequestResolvedDto) => void,
  (payload: LoginRequestResolvedDto) => void
>()

const cancelledHandlers = new Map<
  (payload: LoginRequestResolvedDto) => void,
  (payload: LoginRequestResolvedDto) => void
>()

function validateRequestKey(requestKey: string): string {
  const normalized = requestKey?.trim()

  if (!normalized) {
    throw new Error("RequestKey es requerido.")
  }

  return normalized
}

function buildConnection(): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${HUB_BASE}/hubs/login-access`, {
      withCredentials: true,
      transport:
        signalR.HttpTransportType.WebSockets |
        signalR.HttpTransportType.ServerSentEvents |
        signalR.HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 15000])
    .withServerTimeout(60000)
    .withKeepAliveInterval(15000)
    .configureLogging(signalR.LogLevel.Warning)
    .build()
}

/**
 * Vuelve a registrar los callbacks después de una reconexión.
 */
function rebindHandlers(connection: signalR.HubConnection) {
  approvedHandlers.forEach((callback) => {
    connection.off("LoginRequestApproved", callback)
    connection.on("LoginRequestApproved", callback)
  })

  rejectedHandlers.forEach((callback) => {
    connection.off("LoginRequestRejected", callback)
    connection.on("LoginRequestRejected", callback)
  })

  cancelledHandlers.forEach((callback) => {
    connection.off("LoginRequestCancelled", callback)
    connection.on("LoginRequestCancelled", callback)
  })
}

/**
 * Une nuevamente la conexión al grupo temporal de la solicitud.
 */
async function joinActiveRequest(): Promise<void> {
  if (
    !loginAccessConnection ||
    loginAccessConnection.state !==
      signalR.HubConnectionState.Connected ||
    !activeRequestKey
  ) {
    return
  }

  await loginAccessConnection.invoke(
    "JoinLoginRequest",
    activeRequestKey
  )
}

function configureLifecycle(connection: signalR.HubConnection) {
  connection.onreconnecting((error) => {
    console.warn(
      "[LOGIN ACCESS] Reconectando...",
      error
    )
  })

  connection.onreconnected(async () => {
    try {
      rebindHandlers(connection)
      await joinActiveRequest()
    } catch (error) {
      console.error(
        "[LOGIN ACCESS] No se pudo recuperar el grupo.",
        error
      )
    }
  })

  connection.onclose((error) => {
    if (error) {
      console.warn(
        "[LOGIN ACCESS] Conexión cerrada.",
        error
      )
    }
  })
}

/**
 * Inicia la conexión anónima utilizada por el equipo en espera.
 */
export async function startLoginAccessConnection(
  requestKey: string
): Promise<void> {
  const normalizedRequestKey =
    validateRequestKey(requestKey)

  if (
    loginAccessConnection?.state ===
      signalR.HubConnectionState.Connected &&
    activeRequestKey === normalizedRequestKey
  ) {
    return
  }

  if (startPromise) {
    await startPromise
    return
  }

  startPromise = (async () => {
    /*
     * Si cambia la solicitud, se crea una conexión limpia
     * para evitar conservar el grupo anterior.
     */
    if (
      loginAccessConnection &&
      activeRequestKey !== normalizedRequestKey
    ) {
      await stopLoginAccessConnection()
    }

    activeRequestKey = normalizedRequestKey

    if (!loginAccessConnection) {
      loginAccessConnection = buildConnection()
      configureLifecycle(loginAccessConnection)
      rebindHandlers(loginAccessConnection)
    }

    if (
      loginAccessConnection.state ===
      signalR.HubConnectionState.Disconnected
    ) {
      await loginAccessConnection.start()
    }

    await joinActiveRequest()
  })()

  try {
    await startPromise
  } finally {
    startPromise = null
  }
}

/**
 * Sale del grupo temporal y detiene la conexión.
 */
export async function stopLoginAccessConnection(): Promise<void> {
  const connection = loginAccessConnection
  const requestKey = activeRequestKey

  loginAccessConnection = null
  activeRequestKey = null
  startPromise = null

  if (!connection) {
    return
  }

  if (
    connection.state ===
      signalR.HubConnectionState.Connected &&
    requestKey
  ) {
    try {
      await connection.invoke(
        "LeaveLoginRequest",
        requestKey
      )
    } catch {
      // La desconexión continúa aunque no sea posible salir del grupo.
    }
  }

  if (
    connection.state !==
    signalR.HubConnectionState.Disconnected
  ) {
    try {
      await connection.stop()
    } catch (error) {
      console.warn(
        "[LOGIN ACCESS] Error al detener la conexión.",
        error
      )
    }
  }
}

export function onLoginRequestApproved(
  handler: (payload: LoginRequestResolvedDto) => void
) {
  if (approvedHandlers.has(handler)) {
    return () => offLoginRequestApproved(handler)
  }

  const callback = (payload: LoginRequestResolvedDto) => {
    handler(payload)
  }

  approvedHandlers.set(handler, callback)

  if (loginAccessConnection) {
    loginAccessConnection.off(
      "LoginRequestApproved",
      callback
    )

    loginAccessConnection.on(
      "LoginRequestApproved",
      callback
    )
  }

  return () => offLoginRequestApproved(handler)
}

export function offLoginRequestApproved(
  handler: (payload: LoginRequestResolvedDto) => void
) {
  const callback = approvedHandlers.get(handler)

  if (callback && loginAccessConnection) {
    loginAccessConnection.off(
      "LoginRequestApproved",
      callback
    )
  }

  approvedHandlers.delete(handler)
}

export function onLoginRequestRejected(
  handler: (payload: LoginRequestResolvedDto) => void
) {
  if (rejectedHandlers.has(handler)) {
    return () => offLoginRequestRejected(handler)
  }

  const callback = (payload: LoginRequestResolvedDto) => {
    handler(payload)
  }

  rejectedHandlers.set(handler, callback)

  if (loginAccessConnection) {
    loginAccessConnection.off(
      "LoginRequestRejected",
      callback
    )

    loginAccessConnection.on(
      "LoginRequestRejected",
      callback
    )
  }

  return () => offLoginRequestRejected(handler)
}

export function offLoginRequestRejected(
  handler: (payload: LoginRequestResolvedDto) => void
) {
  const callback = rejectedHandlers.get(handler)

  if (callback && loginAccessConnection) {
    loginAccessConnection.off(
      "LoginRequestRejected",
      callback
    )
  }

  rejectedHandlers.delete(handler)
}

export function onLoginRequestCancelled(
  handler: (payload: LoginRequestResolvedDto) => void
) {
  if (cancelledHandlers.has(handler)) {
    return () => offLoginRequestCancelled(handler)
  }

  const callback = (payload: LoginRequestResolvedDto) => {
    handler(payload)
  }

  cancelledHandlers.set(handler, callback)

  if (loginAccessConnection) {
    loginAccessConnection.off(
      "LoginRequestCancelled",
      callback
    )

    loginAccessConnection.on(
      "LoginRequestCancelled",
      callback
    )
  }

  return () => offLoginRequestCancelled(handler)
}

export function offLoginRequestCancelled(
  handler: (payload: LoginRequestResolvedDto) => void
) {
  const callback = cancelledHandlers.get(handler)

  if (callback && loginAccessConnection) {
    loginAccessConnection.off(
      "LoginRequestCancelled",
      callback
    )
  }

  cancelledHandlers.delete(handler)
}