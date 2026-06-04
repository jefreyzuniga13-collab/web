import { useCallback, useEffect, useState } from 'react'
import { CompanySystemParamsService } from '@/Services/Crm/CompanySystemParamsService'
import type { CompanySystemParamProj } from '@/Interfaces/Crm/CompanySystemParams'

interface UseCompanySystemParamValueResult {
  item: CompanySystemParamProj | null
  value: string
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

const getParamValue = (item: CompanySystemParamProj | null): string => {
  if (!item) return ''

  return String(
    item.value ??
    ''
  ).trim()
}

export function useCompanySystemParamValue(
  systemParamId: number,
  enabled = true
): UseCompanySystemParamValueResult {
  const [item, setItem] = useState<CompanySystemParamProj | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchParam = useCallback(async () => {
    if (!enabled || !systemParamId || systemParamId <= 0) return

    setLoading(true)
    setError(null)

    try {
      const res = await CompanySystemParamsService.getBySystemParamAsync(
        systemParamId
      )

      setItem(res)
    } catch (err) {
      setError(err as Error)
      setItem(null)
    } finally {
      setLoading(false)
    }
  }, [enabled, systemParamId])

  useEffect(() => {
    void fetchParam()
  }, [fetchParam])

  return {
    item,
    value: getParamValue(item),
    loading,
    error,
    refetch: fetchParam
  }
}