import { useQuery } from '@tanstack/react-query'
import type { CompanyInterface } from '@/Interfaces/Crm/CompanyInterface'
import { CompanyService } from '@/Services/Crm/CompanyService'

export const useCompany = () => {
  const {
    data: companies = null,
    isLoading: loading,
    error,
    refetch: getAllAsync,
  } = useQuery<CompanyInterface[], Error>({
    queryKey: ['companies'],
    queryFn: CompanyService.getAllAsync,
    staleTime: 1000 * 60 * 5,
  })

  return {
    error,
    loading,
    companies,
    getAllAsync,
  }
}