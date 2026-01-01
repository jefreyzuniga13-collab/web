/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import type {
  CustomMessageRequestDto,
  CustomMessageResponseDto,
} from '@/Interfaces/Crm/CustomMessageInterface'
import { CustomMessageServices } from '@/Services/chat/CustomMessageServices'

export function useCustomMessage(autoLoad = true) {
  const [customMessages, setCustomMessages] = useState<CustomMessageResponseDto[]>([])
  const [selectedCustomMessage, setSelectedCustomMessage] = useState<CustomMessageResponseDto | null>(null)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingItem, setLoadingItem] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [isModalOpen, setModalOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const fetchPage = useCallback(async () => {
    setLoadingList(true)
    setError(null)
    try {
      const resp = await CustomMessageServices.getAllAsync()
      setCustomMessages(resp)
      setLoaded(true)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoadingList(false)
    }
  }, [])

  const fetchById = useCallback(async (id: number) => {
    setLoadingItem(true)
    setError(null)
    try {
      const item = await CustomMessageServices.getByIdAsync(id)
      setSelectedCustomMessage(item)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoadingItem(false)
    }
  }, [])

  const create = useCallback(
    async (values: CustomMessageRequestDto) => {
      setLoadingItem(true)
      setError(null)
      try {
        await CustomMessageServices.createAsync(values)
        await fetchPage()
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingItem(false)
      }
    },
    [fetchPage]
  )

  const update = useCallback(
    async (id: number, values: CustomMessageRequestDto) => {
      setLoadingItem(true)
      setError(null)
      try {
        await CustomMessageServices.updateAsync(id, values)
        await fetchPage()
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingItem(false)
      }
    },
    [fetchPage]
  )

  const toggleStatus = useCallback(
    async (id: number) => {
      setLoadingItem(true)
      setError(null)
      try {
        const toggled = await CustomMessageServices.toggleStatusAsync(id)
        setCustomMessages(prev =>
          prev.map(item => (item.id === toggled.id ? toggled : item))
        )
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingItem(false)
      }
    },
    []
  )

  const openCreate = useCallback(() => {
    setSelectedCustomMessage(null)
    setModalMode('create')
    setModalOpen(true)
  }, [])

  const openEdit = useCallback(
    (id: number) => {
      const cache = customMessages.find(x => x.id === id) || null
      setSelectedCustomMessage(cache)
      setModalMode('edit')
      setModalOpen(true)
      fetchById(id)
    },
    [customMessages, fetchById]
  )

  const openView = useCallback(
    (id: number) => {
      const cache = customMessages.find(x => x.id === id) || null
      setSelectedCustomMessage(cache)
      setModalMode('view')
      setModalOpen(true)
      fetchById(id)
    },
    [customMessages, fetchById]
  )

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setSelectedCustomMessage(null)
  }, [])

  const handleSubmit = useCallback(
    (values: CustomMessageRequestDto) => {
      if (modalMode === 'create') create(values)
      else if (modalMode === 'edit' && selectedCustomMessage) update(selectedCustomMessage.id, values)
      closeModal()
    },
    [modalMode, selectedCustomMessage, create, update, closeModal]
  )

  useEffect(() => {
    if (autoLoad) {
      fetchPage()
    }
  }, [autoLoad, fetchPage])

  return {
    customMessages,
    selectedCustomMessage,
    loading: loadingList || loadingItem,
    error,
    modalMode,
    isModalOpen,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    toggleSystemParam: toggleStatus,
    create,
    update,
    load: fetchPage,
    loaded,
  }
}