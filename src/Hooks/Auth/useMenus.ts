import { useQuery } from "@tanstack/react-query";
import { menuService } from "@/Services/auth/MenuService";
import type { MenuDto } from "@/Interfaces/Chat/ChatInterfaces";

const menuKeys = {
  all: ["menus"] as const,
  authenticated: () =>
    [...menuKeys.all, "authenticated"] as const,
};

export function useMenus() {
  const menusQuery = useQuery<
    MenuDto[],
    Error
  >({
    queryKey: menuKeys.authenticated(),

    queryFn: () =>
      menuService.getMenusAsync(),

    /*
     * El menú normalmente no cambia durante
     * la sesión actual.
     */
    staleTime: 30 * 60 * 1000,

    gcTime: 60 * 60 * 1000,

    refetchOnWindowFocus: false,

    refetchOnReconnect: false,

    retry: 1,
  });

  return {
    menus: menusQuery.data ?? [],

    loading:
      menusQuery.isLoading ||
      menusQuery.isFetching,

    error:
      menusQuery.error?.message ?? null,

    refetch: menusQuery.refetch,
  };
}

export { menuKeys };