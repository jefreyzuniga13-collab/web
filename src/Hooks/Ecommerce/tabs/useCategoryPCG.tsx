import { useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import type { CategoriaPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface"
import { CategoryPCGyService } from "@/Services/Ecommerce/CategoryPCGyService"

const CATEGORY_QUERY_KEY = ["category-pcg-list"] as const
const EMPTY_CATEGORIES: CategoriaPCGInterface[] = []

const CATEGORY_STALE_TIME = 1000 * 60 * 30
const CATEGORY_GC_TIME = 1000 * 60 * 60

const fetchCategories = async (): Promise<CategoriaPCGInterface[]> => {
  const categories = await CategoryPCGyService.GetAll()

  return Array.isArray(categories) ? categories : []
}

export function useCategoryPCG() {
  const queryClient = useQueryClient()

  /*
   * La consulta permanece deshabilitada hasta que ProductTab llama GetAll.
   * Esto conserva la interfaz anterior y evita peticiones automáticas
   * innecesarias al montar componentes que todavía no muestran categorías.
   */
  const categoryQuery = useQuery<CategoriaPCGInterface[], Error>({
    queryKey: CATEGORY_QUERY_KEY,
    queryFn: fetchCategories,
    enabled: false,
    staleTime: CATEGORY_STALE_TIME,
    gcTime: CATEGORY_GC_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  })

  /*
   * fetchQuery reutiliza la caché y deduplica solicitudes concurrentes.
   * Si las categorías siguen vigentes, no vuelve a consultar la API.
   */
  const GetAll = useCallback(async (): Promise<CategoriaPCGInterface[]> => {
    return await queryClient.fetchQuery<CategoriaPCGInterface[]>({
      queryKey: CATEGORY_QUERY_KEY,
      queryFn: fetchCategories,
      staleTime: CATEGORY_STALE_TIME,
      gcTime: CATEGORY_GC_TIME,
    })
  }, [queryClient])

  return {
    categoryPcg: categoryQuery.data ?? EMPTY_CATEGORIES,
    loading: categoryQuery.fetchStatus === "fetching",
    error: categoryQuery.error ?? null,
    GetAll,
  }
}