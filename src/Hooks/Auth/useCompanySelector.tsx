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
 * - Guardar la empresa seleccionada en Redux.
 * - Evitar modo global para SignalR.
 * - Reiniciar SignalR al cambiar de empresa.
 * - Seleccionar automáticamente la primera empresa si Root no tiene una activa.
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

  useEffect(() => {
    if (!isRoot || companies.length === 0 || activeCompanyId) {
      return;
    }

    const firstCompany = companies[0];

    if (!firstCompany) {
      return;
    }

    dispatch(setActiveCompany(firstCompany));
  }, [dispatch, isRoot, companies, activeCompanyId]);

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
      if (!isRoot) {
        return;
      }

      if (!company) {
        dispatch(clearActiveCompany());

        await stopHubConnection();
        await queryClient.invalidateQueries();

        return;
      }

      const currentCompanyId = Number(activeCompanyId || 0);
      const nextCompanyId = Number(company.companyId || 0);

      if (currentCompanyId === nextCompanyId) {
        return;
      }

      await stopHubConnection();

      dispatch(setActiveCompany(company));

      await queryClient.invalidateQueries();
      await restartHubConnection();

      window.location.reload();
    },
    [dispatch, queryClient, isRoot, activeCompanyId]
  );

  const clearCompany = useCallback(async () => {
    if (!isRoot) {
      return;
    }

    dispatch(clearActiveCompany());

    await stopHubConnection();
    await queryClient.invalidateQueries();
  }, [dispatch, queryClient, isRoot]);

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