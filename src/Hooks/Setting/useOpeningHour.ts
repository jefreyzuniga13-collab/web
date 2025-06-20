/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { OpeningHourService } from '@/Services/Config/OpeningHourService'
import type {
  OpeningHourInterface,
  OpeningHourFormValues,
} from '@/Interfaces/Setting/OpeningHour'

export const useOpeningHour = () => {
  const [openingHours, setOpeningHours] = useState<OpeningHourInterface[]>([])
  const [selectedOpeningHour, setSelectedOpeningHour] = useState<OpeningHourInterface | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [isModalOpen, setModalOpen] = useState<boolean>(false)

  const getOpeningHours = async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await OpeningHourService.getOpeningHourAsync()
      setOpeningHours(items)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const getOpeningHourById = async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await OpeningHourService.getOpeningHourByIdAsync(id)
      setSelectedOpeningHour(data)
    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const createOpeningHour = async (values: OpeningHourFormValues) => {
    setLoading(true)
    setError(null)
    try {
      const newItem = await OpeningHourService.createOpeningHourAsync(values)
      setOpeningHours(prev => [...prev, newItem])
    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const updateOpeningHour = async (payload: OpeningHourInterface) => {
    setLoading(true)
    setError(null)
    try {
      const updated = await OpeningHourService.updateOpeningHourAsync(payload.id, payload)
      setOpeningHours(prev =>
        prev.map(item => (item.id === updated.id ? updated : item))
      )
    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleOpeningHourStatus = async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const updated = await OpeningHourService.toggleOpeningHourStatusAsync(id)
      setOpeningHours(prev =>
        prev.map(item => (item.id === updated.id ? updated : item))
      )
    } catch (err: any) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setSelectedOpeningHour(null)
    setModalMode('create')
    setModalOpen(true)
  }

  const openEdit = (id: number) => {
    getOpeningHourById(id).then(() => {
      setModalMode('edit')
      setModalOpen(true)
    })
  }

  const openView = (id: number) => {
    getOpeningHourById(id).then(() => {
      setModalMode('view')
      setModalOpen(true)
    })
  }

  const closeModal = () => {
    setModalOpen(false)
  }

  const handleSubmit = (values: OpeningHourFormValues) => {
    if (modalMode === 'create') createOpeningHour(values)
    else if (modalMode === 'edit' && selectedOpeningHour)
      updateOpeningHour({ ...selectedOpeningHour, ...values })
    closeModal()
  }

  useEffect(() => {
    getOpeningHours()
  }, [])

  return {
    openingHours,
    selectedOpeningHour,
    loading,
    error,
    modalMode,
    isModalOpen,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    toggleOpeningHourStatus,
  }
}