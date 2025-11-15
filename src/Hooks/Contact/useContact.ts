/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ContactLogInterface, ContactFormValues } from '@/Interfaces/Contact/ContactInterface'
import { contactService } from '@/Services/Contact/ContactService'
import type { PagedResponse } from '@/Interfaces/GlobalInterface'

const useContact = (contactId?: number) => {
  const [data, setData] = useState<ContactLogInterface[]>([])
  const [contactByClient, setContactByClient] = useState<ContactLogInterface[]>([])
  const [verifiedContact, setVerifiedContact] = useState<ContactLogInterface[]>([])
  const [selectedData, setSelectedData] = useState<ContactLogInterface | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(30)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingItem, setLoadingItem] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [isModalOpen, setModalOpen] = useState(false)
  const [globalFilter, setGlobalFilter] = useState<string>('')

  const navigate = useNavigate()

  useEffect(() => {
    if (typeof contactId === 'number') {
      fetchById(contactId);
    }
  }, [contactId])
  
  const fetchPage = useCallback(
    async (p = page, s = pageSize) => {
      setLoadingList(true)
      setError(null)
      try {
        const res: PagedResponse<ContactLogInterface> = await contactService.getAllAsync(globalFilter, p, s)
        const verifiedRes: PagedResponse<ContactLogInterface> = await contactService.getAllVerifiedAsync(p, s)

        setData(res.items)
        setVerifiedContact(verifiedRes.items);

        setTotalCount(res.meta.totalCount)
        setPage(res.meta.currentPage)
        setPageSize(res.meta.pageSize)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingList(false)
      }
    },
    [globalFilter, page, pageSize]
  )

const getByClient = useCallback(
  async (clientId: string, p = page, s = pageSize) => {
      setLoadingList(true)
      setError(null)
      try {
        const res = await contactService.getContactByClientAsync(clientId, p, s)

        setContactByClient(res.items)
        setTotalCount(res.meta.totalCount)
        setPage(res.meta.currentPage)
        setPageSize(res.meta.pageSize)

        return res 
      } catch (err: any) {
        setError(err)
        return null
      } finally {
        setLoadingList(false)
      }
    },
    [page, pageSize]
  )

  const getByClientCode = useCallback(
  async (clientCode: string, p = page, s = pageSize) => {
      setLoadingList(true)
      setError(null)
      try {

        const res = await contactService.getContactByClientAsync(clientCode, p, s)

        //aqui esta no es a contacto es a contactByClientem, y no se hace la peticion
        setContactByClient(res.items)
        setTotalCount(res.meta.totalCount)
        setPage(res.meta.currentPage)
        setPageSize(res.meta.pageSize)

        return res 
      } catch (err: any) {
        setError(err)
        return null
      } finally {
        setLoadingList(false)
      }
    },
    [page, pageSize]
)

  const fetchById = useCallback(
    async (id: number) => {
      setLoadingItem(true)
      setError(null)
      try {
        const item = await contactService.getContactByIdAsync(id)
        setSelectedData(item)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingItem(false)
      }
    },
    []
  )

  const fetchByPhone = useCallback(
    async (phone: string) => {
      setLoadingItem(true)
      setError(null)
      try {
        const item = await contactService.getContactByPhoneAsync(phone)
        setSelectedData(item)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingItem(false)
      }
    },
    []
  )

  const create = useCallback(
    async (values: ContactFormValues) => {
      setLoadingItem(true)
      setError(null)
      try {
        const payload = { ...values } as ContactLogInterface
        const newItem = await contactService.createAsync(payload)
        setData(prev => [...prev, newItem])
        setTotalCount(prev => prev + 1)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingItem(false)
      }
    },
    []
  )

  const update = useCallback(
    async (id: number, values: ContactFormValues) => {
      setLoadingItem(true)
      setError(null)
      try {
        const payload = { ...(selectedData ?? {}), ...values, id } as ContactLogInterface
        const updatedItem = await contactService.updateContactAsync(payload)
        setData(prev => prev.map(item => (item.id === id ? updatedItem : item)))
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingItem(false)
      }
    },
    [selectedData]
  )

  const toggle = useCallback(
    async (id: number) => {
      setLoadingItem(true)
      setError(null)
      try {
        await contactService.toggleAsync(id)
        setData(prev =>
          prev.map(item =>
            item.id === id ? { ...item, isActive: !item.isActive } : item
          )
        )
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingItem(false)
      }
    },
    []
  )

  const verify = useCallback(
    async (phone: string) => {
      setLoadingItem(true)
      setError(null)
      try {
        navigate(`/verify-contact/${phone}`)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingItem(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const openCreate = useCallback(() => {
    setSelectedData(null)
    setModalMode('create')
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((item: ContactLogInterface) => {
    setSelectedData(item)
    setModalMode('edit')
    setModalOpen(true)
  }, [])

  const openView = useCallback((item: ContactLogInterface) => {
    setSelectedData(item)
    setModalMode('view')
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setSelectedData(null)
    setModalMode('create')
  }, [])

  useEffect(() => {
    fetchPage()
  }, [fetchPage, globalFilter, page, pageSize])

  const handleSubmit = useCallback(
    (values: ContactFormValues) => {
      if (modalMode === 'create') create(values)
      else if (modalMode === 'edit' && selectedData)
        update(selectedData.id as number, values)
      closeModal()
    },
    [modalMode, selectedData, create, update, closeModal]
  )

  return {
    data,
    verifiedContact,
    selectedData,
    loading: loadingList || loadingItem,
    error,
    page,
    pageSize,
    totalCount,
    isModalOpen,
    modalMode,
    globalFilter,
    setPage: (p: number) => fetchPage(p, pageSize),
    setPageSize: (s: number) => fetchPage(1, s),
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    fetchPage,
    fetchById,
    fetchByPhone,
    getByClient,
    create,
    update,
    toggle,
    verify,
    setGlobalFilter,
    getByClientCode,
    // contactos del cliente
    contactByClient
    
  }
}

export default useContact;