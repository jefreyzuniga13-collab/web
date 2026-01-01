/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSystemParams } from '@/Hooks/Crm/useSystemParams'

const parseQuickOptions = (selectedParam: unknown): string[] => {
  const p: any = selectedParam

  const split = (s: string) =>
    String(s)
      .split('|')
      .map(x => x.trim())
      .filter(Boolean)

  if (Array.isArray(p)) {
    return p.filter((v: any) => typeof v === 'string').map((v: any) => v.trim())
  }

  if (typeof p === 'string') {
    const raw = p.trim()

    // Intentar JSON primero
    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          return parsed
            .filter((v: any) => typeof v === 'string')
            .map((v: any) => v.trim())
        }
      } catch {
        // si falla, seguimos abajo
      }
    }

    // Formato "texto1|texto2|texto3"
    return split(raw)
  }

  if (typeof p?.value === 'string') {
    const raw = p.value.trim()

    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          return parsed
            .filter((v: any) => typeof v === 'string')
            .map((v: any) => v.trim())
        }
      } catch {
        // ignorar, seguimos
      }
    }

    return split(raw)
  }

  if (Array.isArray(p?.value)) {
    return p.value
      .filter((v: any) => typeof v === 'string')
      .map((v: any) => v.trim())
  }

  return []
}

export const useQuickTab = (onSendNow?: (txt: string) => void | Promise<void>) => {
  const { selectedParam, fetchByName } = useSystemParams()

  useEffect(() => {
    fetchByName('OpcionesRapidas')
  }, [fetchByName])

  const quickOptions = useMemo(() => {
    const raw = parseQuickOptions(selectedParam)
    const uniq = Array.from(new Set(raw.map(s => s.trim()))).filter(Boolean)
    return uniq
  }, [selectedParam])

  const [qQuick, setQQuick] = useState('')

  const filteredQuick = useMemo(() => {
    const n = qQuick.trim().toLowerCase()
    if (!n) return quickOptions
    return quickOptions.filter(s => s.toLowerCase().includes(n))
  }, [quickOptions, qQuick])

  const handleSendQuick = useCallback(
    async (txt: string) => {
      if (!txt) return

      // Si viene función externa (como en SupportPage), úsala
      if (onSendNow) {
        await onSendNow(txt)
        return
      }

      // Fallback al "canal global" existente
      const w = window as any
      if (typeof w.__CHAT_SEND_QUICK__ === 'function') {
        w.__CHAT_SEND_QUICK__(txt)
        return
      }

      window.dispatchEvent(new CustomEvent('chat:sendQuick', { detail: { text: txt } }))
    },
    [onSendNow]
  )

  return {
    quickOptions,
    qQuick,
    setQQuick,
    filteredQuick,
    handleSendQuick,
  }
}

export default useQuickTab