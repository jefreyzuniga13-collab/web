import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import NotFound from "@/Pages/Auth/NotFound"
import ListSkeleton from "@/Components/Common/ListSkeleton"
import CarPage from "@/Pages/ECommerce/CarPage"
import type { TempLinkResolveResponseDto } from "@/Interfaces/Common/GlobalPCGInterface"
import { CartService } from "@/Services/Ecommerce/CartService"
import {
  applyPublicEmpresaId,
  clearPublicEmpresaContext
} from "@/Utils/ECommerce/publicEmpresa"

type Status = "loading" | "ok" | "unauthorized"

const resolveMemoryCache = new Map<string, TempLinkResolveResponseDto>()
const resolveInFlight = new Map<
  string,
  Promise<TempLinkResolveResponseDto>
>()

const getCacheKey = (token: string) => {
  return `paynow:resolved:${token}`
}

const readPayloadFromSession = (
  token: string
): TempLinkResolveResponseDto | null => {
  try {
    const raw = sessionStorage.getItem(getCacheKey(token))

    if (!raw) return null

    return JSON.parse(raw) as TempLinkResolveResponseDto
  } catch {
    sessionStorage.removeItem(getCacheKey(token))
    return null
  }
}

const savePayloadToSession = (
  token: string,
  payload: TempLinkResolveResponseDto
) => {
  try {
    sessionStorage.setItem(getCacheKey(token), JSON.stringify(payload))
  } catch {
    // Ignorar si el navegador bloquea storage.
  }
}

/**
 * Cache viejo puede no traer aplicaMultimoneda; sin ese flag
 * el checkout no muestra el selector de moneda.
 */
const isPayloadComplete = (
  payload: TempLinkResolveResponseDto | null
): payload is TempLinkResolveResponseDto => {
  if (!payload) return false

  return (
    typeof payload.permiteMultiPago === "boolean" &&
    typeof payload.permitePasarela === "boolean" &&
    typeof payload.aplicaMultimoneda === "boolean"
  )
}

const applyEmpresaId = (payload: TempLinkResolveResponseDto) => {
  const empresaId = applyPublicEmpresaId(payload?.empresaId)

  if (!empresaId) {
    clearPublicEmpresaContext()
    console.warn("empresaId no vino en el payload")
  }
}

const resolvePaynowTokenOnce = async (
  token: string
): Promise<TempLinkResolveResponseDto> => {
  const cleanToken = token.trim()

  const memoryPayload = resolveMemoryCache.get(cleanToken)

  if (isPayloadComplete(memoryPayload)) {
    return memoryPayload
  }

  if (memoryPayload) {
    resolveMemoryCache.delete(cleanToken)
  }

  const sessionPayload = readPayloadFromSession(cleanToken)

  if (isPayloadComplete(sessionPayload)) {
    resolveMemoryCache.set(cleanToken, sessionPayload)
    return sessionPayload
  }

  if (sessionPayload) {
    sessionStorage.removeItem(getCacheKey(cleanToken))
  }

  const currentRequest = resolveInFlight.get(cleanToken)

  if (currentRequest) {
    return currentRequest
  }

  const request = CartService.resolveToken(cleanToken)
    .then((response) => {
      const payload = response.data

      if (!payload) {
        throw new Error("El enlace no devolvió información válida.")
      }

      resolveMemoryCache.set(cleanToken, payload)
      savePayloadToSession(cleanToken, payload)

      return payload
    })
    .finally(() => {
      resolveInFlight.delete(cleanToken)
    })

  resolveInFlight.set(cleanToken, request)

  return request
}

const ProtectedCartRoute = () => {
  const [status, setStatus] = useState<Status>("loading")
  const [payload, setPayload] =
    useState<TempLinkResolveResponseDto | null>(null)

  const [searchParams] = useSearchParams()
  const token = searchParams.get("paynow")

  const cleanToken = useMemo(() => {
    return String(token ?? "").trim()
  }, [token])

  const lastResolvedTokenRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const validate = async () => {
      if (!cleanToken) {
        clearPublicEmpresaContext()
        setPayload(null)
        setStatus("unauthorized")
        return
      }

      if (lastResolvedTokenRef.current === cleanToken && payload) {
        setStatus("ok")
        return
      }

      setStatus("loading")

      try {
        const resolvedPayload = await resolvePaynowTokenOnce(cleanToken)

        if (cancelled) return

        lastResolvedTokenRef.current = cleanToken

        applyEmpresaId(resolvedPayload)
        setPayload(resolvedPayload)
        setStatus("ok")
      } catch (error) {
        if (cancelled) return

        console.error("Error resolviendo token temporal:", error)

        clearPublicEmpresaContext()

        setPayload(null)
        setStatus("unauthorized")
      }
    }

    void validate()

    return () => {
      cancelled = true
    }
  }, [cleanToken, payload])

  if (status === "loading") {
    return (
      <main className="cart-page">
        <ListSkeleton variant="cart" count={5} />
      </main>
    )
  }

  if (status === "unauthorized" || !payload) {
    return <NotFound />
  }

  return <CarPage payload={payload} />
}

export default ProtectedCartRoute