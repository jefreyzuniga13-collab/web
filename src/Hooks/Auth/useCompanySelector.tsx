import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppDispatch, RootState } from "@/Context";
import {clearActiveCompany, selectActiveCompanyId, selectActiveCompanyName, selectCompanies, selectIsGlobalCompanyMode, setActiveCompany, setCompanies} 
from "@/Context/Slices/Auth/companySlice";
import { selectIsRoot } from "@/Context/Slices/Auth/authSlice";
import { companyService } from "@/Services/auth/companyService";
import type { CompanySelectorItem } from "@/Interfaces/Auth/CompanyInterface";
import { restartHubConnection } from "@/Services/signalr";
const COMPANY_SELECTOR_QUERY_KEY = ["company-selector"];

export function useCompanySelector() {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();

  const isRoot = useSelector(selectIsRoot);
  const companies = useSelector(selectCompanies);
  const activeCompanyId = useSelector(selectActiveCompanyId);
  const activeCompanyName = useSelector(selectActiveCompanyName);
  const isGlobalMode = useSelector(selectIsGlobalCompanyMode);

  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  const query = useQuery({
    queryKey: COMPANY_SELECTOR_QUERY_KEY,
    queryFn: () => companyService.getSelectorAsync(),
    enabled: isAuthenticated ,
    // staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!query.data?.data) {
      return;
    }

    dispatch(setCompanies(query.data.data));
  }, [dispatch, query.data]);

  const selectedCompany = useMemo(() => {
    if (!activeCompanyId) {
      return null;
    }

    return (
      companies.find(
        (company) => Number(company.companyId) === Number(activeCompanyId)
      ) ?? null
    );
  }, [companies, activeCompanyId]);

    const changeCompany = useCallback(
      async (company: CompanySelectorItem | null) => {
        dispatch(setActiveCompany(company));

        await queryClient.invalidateQueries();

        await restartHubConnection();

       window.location.reload();
      },
      [dispatch, queryClient]
    );

  const clearCompany = useCallback(async () => {
    dispatch(clearActiveCompany());

    await queryClient.invalidateQueries();

    await restartHubConnection();
  }, [dispatch, queryClient]);


  return {
    isRoot,
    companies,
    selectedCompany,
    activeCompanyId,
    activeCompanyName,
    isGlobalMode,
    loading: query.isLoading || query.isFetching,
    error: query.error,
    changeCompany,
    clearCompany,
    refetchCompanies: query.refetch,
  };
}