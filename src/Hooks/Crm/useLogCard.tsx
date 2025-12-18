/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react"
import type { LogCartFormValues, LogCartResponseDto } from "@/Interfaces/Crm/LogCartInterface"
import { logCartService } from "@/Services/Crm/LogCartService"
import { toast } from "react-toastify"
type ModalMode = "create" | "edit" | "view"

const useLogCart = (logCartId?: number) => {
  const [data, setData] = useState<LogCartResponseDto[]>([])
  const [selectedData, setSelectedData] = useState<LogCartResponseDto | null>(null)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingItem, setLoadingItem] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isModalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>("create")
  const lastRequestRef = useRef(0)

  const fetchAll = useCallback(async () => {
    setLoadingList(true)
    setError(null)
    try {
      const items = await logCartService.getAllAsync()
      setData(items)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoadingList(false)
    }
  }, [])

  const fetchById = useCallback(async (id: number) => {
    setLoadingItem(true)
    setError(null)
    const requestId = ++lastRequestRef.current
    try {
      const item = await logCartService.getByIdAsync(id)
      if (requestId !== lastRequestRef.current) return
      setSelectedData(item)
    } catch (err: any) {
      if (requestId === lastRequestRef.current) setError(err)
    } finally {
      if (requestId === lastRequestRef.current) setLoadingItem(false)
    }
  }, [])

   const fetchByOrderId = useCallback(async (id: number) => {
    setLoadingItem(true)
    setError(null)
    const requestId = ++lastRequestRef.current
    try {
      const item = await logCartService.getByIdAsync(id)
      if (requestId !== lastRequestRef.current) return
      setSelectedData(item)
      return item;
    } catch (err: any) {
      if (requestId === lastRequestRef.current) setError(err)
        return null
    } finally {
      if (requestId === lastRequestRef.current) setLoadingItem(false)
    }
  }, [])

   const fetchByContactId = useCallback(async (contactId: number) => {
    setLoadingItem(true)
    setError(null)
    const requestId = ++lastRequestRef.current
    try {
      const item = await logCartService.GetByContactAndStatus(contactId)
      if (requestId !== lastRequestRef.current) return
      setSelectedData(item)

      return item
    } catch (err: any) {
      if (requestId === lastRequestRef.current) setError(err)
        return null
    } finally {
      if (requestId === lastRequestRef.current) setLoadingItem(false)
    }
  }, [])

  const create = useCallback(async (values: LogCartFormValues) => {
    setLoadingItem(true)
    setError(null)
    try {
      const payload = { ...values }
      const newItem = await logCartService.createAsync(payload)
      setData(prev => [...prev, newItem])
      // toast.success("Log de carrito creado correctamente")
      return newItem
    } catch (err: any) {
      setError(err)
      toast.error("Error al crear el log de carrito")
      return null
    } finally {
      setLoadingItem(false)
    }
  }, [])

  const update = useCallback(
    async (id: number, values: LogCartFormValues) => {
      setLoadingItem(true)
      setError(null)
      try {
        const payload = { ...values }
        const updatedItem = await logCartService.updateAsync(id, payload)
        setData(prev => prev.map(item => (item.id === id ? updatedItem : item)))
        setSelectedData(updatedItem)
        // toast.success("Log de carrito actualizado correctamente")
        return updatedItem
      } catch (err: any) {
        setError(err)
        toast.error("Error al actualizar el log de carrito")
        return null
      } finally {
        setLoadingItem(false)
      }
    },
    []
  )

  const toggle = useCallback(async (id: number) => {
    setLoadingItem(true)
    setError(null)
    try {
      const updated = await logCartService.toggleAsync(id)
      setData(prev => prev.map(item => (item.id === id ? updated : item)))
      if (selectedData && selectedData.id === id) {
        setSelectedData(updated)
      }
      // toast.success("Estado del log de carrito actualizado")
      return updated
    } catch (err: any) {
      setError(err)
      toast.error("Error al alternar el estado del log de carrito")
      return null
    } finally {
      setLoadingItem(false)
    }
  }, [selectedData])


  const UpdatedStatus = useCallback(async (id: number, statusId: number) => {
    setLoadingItem(true)
    setError(null)
    try {
      const updated = await logCartService.UpdatedStatusAsync(id, statusId)
      setData(prev => prev.map(item => (item.id === id ? updated : item)))
      
      if (selectedData && selectedData.id === id) {
        setSelectedData(updated)
      }
      // toast.success("Estado del log de carrito actualizado")
      return updated
    } catch (err: any) {
      setError(err)
      toast.error("Error al alternar el estado del log de carrito")
      return null
    } finally {
      setLoadingItem(false)
    }
  }, [selectedData])

  const openCreate = useCallback(() => {
    setSelectedData(null)
    setModalMode("create")
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((item: LogCartResponseDto) => {
    setSelectedData(item)
    setModalMode("edit")
    setModalOpen(true)
  }, [])

  const openView = useCallback((item: LogCartResponseDto) => {
    setSelectedData(item)
    setModalMode("view")
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setSelectedData(null)
    setModalMode("create")
  }, [])

  const handleSubmit = useCallback(
    async (values: LogCartFormValues) => {
      if (modalMode === "create") {
        await create(values)
      } else if (modalMode === "edit" && selectedData) {
        await update(selectedData.id, values)
      }
      closeModal()
    },
    [modalMode, selectedData, create, update, closeModal]
  )

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (typeof logCartId !== "number" || logCartId <= 0) {
      setSelectedData(null)
      return
    }
    setSelectedData(null)
    fetchById(logCartId)
  }, [logCartId, fetchById])

  return {
    data,
    selectedData,
    loading: loadingList || loadingItem,
    error,
    isModalOpen,
    modalMode,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    fetchAll,
    fetchById,
    create,
    update,
    toggle,
    fetchByOrderId,
    fetchByContactId,
    UpdatedStatus
  }
}

export default useLogCart