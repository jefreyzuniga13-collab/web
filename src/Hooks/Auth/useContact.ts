/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ContactLogInterface, ContactFormValues } from '@/Interfaces/Auth/ContactInterface'
import { contactService } from '@/Services/auth/ContactService'
import type { PagedResponse } from '@/Interfaces/Common/GlobalInterface'
import { toast } from 'react-toastify'

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
  const lastRequestRef = useRef(0)

  const fetchPage = useCallback(
    async (p = page, s = pageSize) => {
      setLoadingList(true)
      setError(null)
      try {
        const res: PagedResponse<ContactLogInterface> = await contactService.getAllAsync(globalFilter, p, s)
        const verifiedRes: PagedResponse<ContactLogInterface> = await contactService.getAllVerifiedAsync(p, s)

        setData(res.items)
        setVerifiedContact(verifiedRes.items)
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
        const res = await contactService.getContactByClientCodeAsync(clientCode, p, s)
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

  const getById = useCallback(async (id: number) => {
  setLoadingItem(true)
  setError(null)

  try {
    const res = await contactService.getById(id)

    if (res.success) {
      setSelectedData(res.data)
      return res.data
    } else {
      toast.error(res.message)
      return null
    }
  } catch (err: any) {
    setError(err)
    return null
  } finally {
    setLoadingItem(false)
  }
}, [])


  const fetchById = useCallback(
    async (id: number) => {
      setLoadingItem(true)
      setError(null)
      const requestId = ++lastRequestRef.current
      try {
        const item = await contactService.getContactByIdAsync(id)
        if (requestId !== lastRequestRef.current) return
        setSelectedData(item)
      } catch (err: any) {
        if (requestId === lastRequestRef.current) setError(err)
      } finally {
        if (requestId === lastRequestRef.current) setLoadingItem(false)
      }
    },
    []
  )

  const fetchByPhone = useCallback(
    async (phone: string) => {
      setLoadingItem(true)
      setError(null)
      const requestId = ++lastRequestRef.current
      try {
        const item = await contactService.getContactByPhoneAsync(phone)
        if (requestId !== lastRequestRef.current) return
        setSelectedData(item)
      } catch (err: any) {
        if (requestId === lastRequestRef.current) setError(err)
      } finally {
        if (requestId === lastRequestRef.current) setLoadingItem(false)
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

const UpdateEcommerceUserAsync = useCallback(async(id: number, ecommerceUserId: number)=>{
  setLoadingItem(true);
  setError(null);

  try{
    const res = await contactService.UpdateEcommerceUser(id, ecommerceUserId)
     
    return res;
  }catch(err: any){
    setError(err)
  }finally{
    setLoadingItem(false)
  }
}, [])
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

  // const verify = useCallback(
  //   async (phone: string) => {
  //     setLoadingItem(true)
  //     setError(null)
  //     try {
  //       navigate(`/verify-contact/${phone}`)
  //     } catch (err: any) {
  //       setError(err)
  //     } finally {
  //       setLoadingItem(false)
  //     }
  //   },
  //   []
  // )


    const verify = useCallback(
    async (id: number) => {
      setLoadingItem(true)
      setError(null)
      try {
        navigate(`/verify-contact/${id}`)
      } catch (err: any) {
        setError(err)
      } finally {
        setLoadingItem(false)
      }
    },
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
    fetchPage();
  }, [fetchPage]);

  const handleSubmit = useCallback(
    (values: ContactFormValues) => {
      if (modalMode === 'create') create(values)
      else if (modalMode === 'edit' && selectedData)
        update(selectedData.id as number, values)
      closeModal()
    },
    [modalMode, selectedData, create, update, closeModal]
  )

  useEffect(() => {
    if (typeof contactId !== 'number' || contactId <= 0) {
      setSelectedData(null)
      return
    }
    setSelectedData(null)
    fetchById(contactId)
  }, [contactId, fetchById])

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
    contactByClient,
    UpdateEcommerceUserAsync,
    getById
  }
}

export default useContact