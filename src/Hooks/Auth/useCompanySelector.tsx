import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AppDispatch, RootState } from "@/Context";
import {
  clearActiveCompany,
  selectActiveCompanyId,
  selectActiveCompanyName,
  selectCompanies,
  selectIsGlobalCompanyMode,
  setActiveCompany,
  setCompanies,
} from "@/Context/Slices/Auth/companySlice";
import { selectIsRoot } from "@/Context/Slices/Auth/authSlice";
import { companyService } from "@/Services/auth/companyService";
import type { CompanySelectorItem } from "@/Interfaces/Auth/CompanyInterface";
import { restartHubConnection, stopHubConnection } from "@/Services/signalr";

const COMPANY_SELECTOR_QUERY_KEY = ["company-selector"];

/**
 * Hook para manejar la empresa activa del usuario Root.
 *
 * Responsabilidades:
 * - Cargar las empresas disponibles para Root.
 * - Guardar la empresa seleccionada en Redux cuando el usuario la elija.
 * - No seleccionar empresa automáticamente.
 * - Reiniciar SignalR al cambiar de empresa.
 * - Evitar recargas completas de la página.
 */
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
    enabled: isAuthenticated && isRoot,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    const data = query.data?.data;

    if (!data || !isRoot) {
      return;
    }

    dispatch(setCompanies(data));
  }, [dispatch, isRoot, query.data]);

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

  const clearCompanyQueries = useCallback(() => {
    queryClient.removeQueries({
      predicate: (queryItem) => {
        const firstKey = queryItem.queryKey[0];

        return firstKey !== COMPANY_SELECTOR_QUERY_KEY[0];
      },
    });
  }, [queryClient]);

  const changeCompany = useCallback(
    async (company: CompanySelectorItem | null) => {
      if (!isRoot) {
        return;
      }

      await stopHubConnection();

      if (!company) {
        dispatch(clearActiveCompany());
        clearCompanyQueries();
        return;
      }

      const currentCompanyId = Number(activeCompanyId || 0);
      const nextCompanyId = Number(company.companyId || 0);

      if (currentCompanyId === nextCompanyId) {
        await restartHubConnection();
        return;
      }

      dispatch(setActiveCompany(company));

      clearCompanyQueries();

      await restartHubConnection();
    },
    [dispatch, isRoot, activeCompanyId, clearCompanyQueries]
  );

  const clearCompany = useCallback(async () => {
    if (!isRoot) {
      return;
    }

    await stopHubConnection();

    dispatch(clearActiveCompany());

    clearCompanyQueries();
  }, [dispatch, isRoot, clearCompanyQueries]);

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