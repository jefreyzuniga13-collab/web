/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type {
  ProductoModificadorPCGInterface,
  ProductoPCGInterface,
} from "@/Interfaces/Chat/ProductPCGInterface"
import { ProductPCGService } from "@/Services/Ecommerce/ProductPCGService"

type Mode = "idle" | "category" | "search" | "all"

interface UseProductPCGOptions {
  initialPageSize?: number
}

export function useProductPCG(options?: UseProductPCGOptions) {
  const initialPageSize = options?.initialPageSize ?? 20

  const [productPcg, setProductPcg] = useState<ProductoPCGInterface[]>([])
  const [productModifiers, setProductModifiers] = useState<ProductoModificadorPCGInterface[]>([])
  const [loadingProductPcg, setLoadingProductPcg] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [page, setPage] = useState<number>(0)
  const [pageSize, setPageSize] = useState<number>(initialPageSize)
  const [mode, setMode] = useState<Mode>("idle")
  const [lastCategory, setLastCategory] = useState<string | null>(null)
  const [lastSearch, setLastSearch] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState<boolean>(true)
  // Evitar duplicados (por reintentos o paginación rara)
  const seenRef = useRef<Set<string>>(new Set())

  const reset = useCallback(() => {
    setProductPcg([])
    setError(null)
    setPage(0)
    setHasMore(true)
    seenRef.current = new Set()
  }, [])

  const appendUnique = useCallback((items: ProductoPCGInterface[]) => {
    if (!items?.length) return

    setProductPcg((prev) => {
      const next = [...prev]
      for (const it of items) {
        const key = String(it.codProducto ?? "")
        if (!key) continue
        if (seenRef.current.has(key)) continue
        seenRef.current.add(key)
        next.push(it)
      }
      return next
    })
  }, [])

  const inferHasMore = useCallback(
    (fetchedCount: number) => {
      // Regla común: si viene menos que pageSize, ya no hay más
      if (fetchedCount < pageSize) setHasMore(false)
      else setHasMore(true)
    },
    [pageSize]
  )

  const GetAll = useCallback(
    async (descripcion: string) => {
      const term = (descripcion ?? "").trim()
      if (!term) return
      setMode("search")
      setLastSearch(term)
      setLastCategory(null)
      reset()

      setLoadingProductPcg(true)
      setError(null)

      try {
        const items = await ProductPCGService.getAll(0, pageSize, term)
        appendUnique(items ?? [])
        inferHasMore((items ?? []).length)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingProductPcg(false)
      }
    },
    [appendUnique, inferHasMore, pageSize, reset]
  )

  const GetByCategory = useCallback(
    async (codGrupo: string) => {
      const cat = (codGrupo ?? "").trim()
      if (!cat) return

      setMode("category")
      setLastCategory(cat)
      setLastSearch(null)
      reset()

      setLoadingProductPcg(true)
      setError(null)

      try {
        const items = await ProductPCGService.GetByCategory(cat, 0, pageSize)
        appendUnique(items ?? [])
        inferHasMore((items ?? []).length)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingProductPcg(false)
      }
    },
    [appendUnique, inferHasMore, pageSize, reset]
  )

  const GetByCode = useCallback(async (codProducto: string) => {
    const code = (codProducto ?? "").trim()
    if (!code) return

    setLoadingProductPcg(true)
    setError(null)
    try {
      const item = await ProductPCGService.GetByCode(code)
      // Nota: este endpoint normalmente retorna 1 producto (o lista)
      setProductPcg(Array.isArray(item) ? item : item ? [item] : [])
      setHasMore(false)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoadingProductPcg(false)
    }
  }, [])

  const getProductModifiers = useCallback(async (codProducto: string) => {
    const code = (codProducto ?? "").trim()
    if (!code) return []

    setLoadingProductPcg(true)
    setError(null)
    try {
      const item = await ProductPCGService.getProductModifiers(code)
      setProductModifiers(item ?? [])
      return item ?? []
    } catch (err: any) {
      setError(err)
      return []
    } finally {
      setLoadingProductPcg(false)
    }
  }, [])

  // Cargar la siguiente página según modo actual (para Infinite Scroll)
  const loadNextPage = useCallback(async () => {
    if (loadingProductPcg) return
    if (!hasMore) return

    // Debe existir un contexto previo
    if (mode === "idle") return

    const nextPage = page + 1

    setLoadingProductPcg(true)
    setError(null)

    try {
      let items: ProductoPCGInterface[] = []

      if (mode === "category" && lastCategory) {
        items = (await ProductPCGService.GetByCategory(lastCategory, nextPage, pageSize)) ?? []
      } else if (mode === "search" && lastSearch) {
        items = (await ProductPCGService.getAll(nextPage, pageSize, lastSearch)) ?? []
      } else if (mode === "all") {
        // Si tenés un endpoint que trae "todo" sin filtro, con paginación:
        // items = (await ProductPCGService.getAll(nextPage, pageSize, "")) ?? []
        // Si NO existe, mejor dejarlo deshabilitado:
        items = []
      }

      appendUnique(items)
      setPage(nextPage)
      inferHasMore(items.length)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoadingProductPcg(false)
    }
  }, [
    appendUnique,
    hasMore,
    inferHasMore,
    lastCategory,
    lastSearch,
    loadingProductPcg,
    mode,
    page,
    pageSize,
  ])

  // Helpers útiles para UI
  const isSearching = useMemo(() => mode === "search", [mode])
  const isCategory = useMemo(() => mode === "category", [mode])

  // Si cambia pageSize, conviene resetear para evitar inconsistencias
  useEffect(() => {
    // solo si ya hay un contexto
    if (mode === "idle") return
    // reset mas recargar primera página según contexto actual
    ;(async () => {
      const currentMode = mode
      const cat = lastCategory
      const term = lastSearch

      reset()

      if (currentMode === "category" && cat) await GetByCategory(cat)
      if (currentMode === "search" && term) await GetAll(term)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize])

  return {
    productPcg,
    productModifiers,
    loadingProductPcg,
    error,

    page,
    pageSize,
    setPage,
    setPageSize,

    hasMore,
    reset,

    GetAll,
    GetByCode,
    GetByCategory,

    loadNextPage, // <-- Infinite scroll usa esto

    getProductModifiers,

    isSearching,
    isCategory,
  }
}