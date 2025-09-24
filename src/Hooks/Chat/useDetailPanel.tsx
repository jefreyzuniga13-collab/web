/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from 'react'
import useContact from '@/Hooks/Contact/useContact'
import { useInnova } from '@/Hooks/useInnova'

const parseQuickOptions = (selectedParam: unknown): string[] => {
  const p: any = selectedParam
  const split = (s: string) =>
    String(s)
      .split('|')
      .map((x) => x.trim())
      .filter(Boolean)

  if (Array.isArray(p)) return p.filter((v: any) => typeof v === 'string')

  if (typeof p === 'string') {
    try {
      const j = JSON.parse(p)
      if (Array.isArray(j)) return j.filter((v: any) => typeof v === 'string')
    } catch {
      return split(p)
    }
  }

  if (typeof p?.value === 'string') {
    try {
      const j = JSON.parse(p.value)
      if (Array.isArray(j)) return j.filter((v: any) => typeof v === 'string')
    } catch {
      return split(p.value)
    }
  }

  if (Array.isArray(p?.value)) return p.value.filter((v: any) => typeof v === 'string')
  return []
}

export const useDetailPanel = (contactId?: number, selectedParam?: unknown) => {
  const [optionMenu, setOptionMenu] = useState<number>(1)

  const {
    selectedData,
    loading: contactLoading,
    error: contactError,
    fetchById: fetchContactById,
  } = useContact(contactId)

  const {
    client,
    getByIdAsync: fetchClientByCode,
    loading: innovaLoading,
    error: innovaError,
    setClient,
  } = useInnova()

  const lastContactIdRef = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (typeof contactId === 'number' && contactId > 0 && lastContactIdRef.current !== contactId) {
      lastContactIdRef.current = contactId
      fetchContactById(contactId).catch(() => {})
    }
  }, [contactId, fetchContactById])

  const clientCode = useMemo(() => {
    const c: any = selectedData
    return c?.codcli ?? c?.codCliente ?? c?.clientCode ?? c?.clientId ?? null
  }, [selectedData])

  const lastClientCodeRef = useRef<string | null>(null)
  useEffect(() => {
    if (clientCode == null || clientCode === '') return
    const codeStr = String(clientCode)
    if (lastClientCodeRef.current !== codeStr) {
      lastClientCodeRef.current = codeStr
      fetchClientByCode(codeStr).catch(() => {})
    }
  }, [clientCode, fetchClientByCode, setClient])

  const quickOptions = useMemo(() => {
    const arr = parseQuickOptions(selectedParam)
    const uniq = Array.from(new Set(arr.map((s) => s.trim()))).filter(Boolean)
    return uniq
  }, [selectedParam])

  const loading = contactLoading || innovaLoading
  const error = contactError ?? (innovaError ? new Error(String(innovaError)) : null)

  const refreshContact = () => {
    if (typeof contactId === 'number' && contactId > 0) {
      return fetchContactById(contactId)
    }
    return Promise.resolve()
  }

  const refreshClient = () => {
    if (clientCode != null && String(clientCode).length) {
      return fetchClientByCode(String(clientCode))
    }
    return Promise.resolve()
  }

  return {
    optionMenu,
    setOptionMenu,
    selectedData,
    client,
    quickOptions,
    loading,
    error,
    clientCode,
    refreshContact,
    refreshClient,
  }
}

export default useDetailPanel