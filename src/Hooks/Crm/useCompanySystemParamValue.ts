import { useQuery } from '@tanstack/react-query'
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
  const {
    data: item = null,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<CompanySystemParamProj | null, Error>({
    queryKey: ['company-system-param', 'by-system-param', systemParamId],
    queryFn: () =>
      CompanySystemParamsService.getBySystemParamAsync(systemParamId),
    enabled: enabled && systemParamId > 0,
    staleTime: 1000 * 60 * 10,
  })

  return {
    item,
    value: getParamValue(item),
    loading: isLoading || isFetching,
    error: error ?? null,
    refetch: async () => {
      await refetch()
    }
  }
}
