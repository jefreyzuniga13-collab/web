import api from '@/Utils/ApiConfig'

export function getCompanies() {
  return api.get<{ data: { companyId: number; name: string }[] }>('/Companies');
}