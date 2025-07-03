/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ContactLogInterface } from "@/Interfaces/Contact/ContactInterface"
import { contactService } from "@/Services/Contact/ContactService"
import {useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const useContact = () => {

    const [data, setData] = useState<ContactLogInterface[]>([])
    const [selectedData, setSetselectedData] = useState<ContactLogInterface | null>(null)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalCount, setTotalCount] = useState(0)
    const [loadingList, setLoadingList] = useState(false)
    const [loadingItem, setLoadingItem] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
    const [isModalOpen, setModalOpen] = useState(false)
    
    const navigate = useNavigate()

    const fetchPage = useCallback(async (p = page, s = pageSize) => {
        setLoadingList(true)
        setError(null)
        try {
            const res = await contactService.getAllAsync(p, s);
            setData(res.items)
            setTotalCount(res.meta.totalCount)
            setPage(res.meta.currentPage)
            setPageSize(res.meta.pageSize)
        } catch (err: any) {
            setError(err)
        } finally {
            setLoadingList(false)
        }
    }, [page, pageSize])

    const fetchById = useCallback(async (id: number) => {
        setLoadingItem(true)
        setError(null)
        try {
            const item = await contactService.getContactByIdAsync(id)
            setSetselectedData(item)
        } catch (err: any) {
            setError(err)
        } finally {
            setLoadingItem(false)
        }
    }, [])

    const fetchByPhone = useCallback(async (phone: string) => {
        setLoadingItem(true)
        setError(null)
        try{
            const item = await contactService.getContactByPhoneAsync(phone)
            setSetselectedData(item)
        }catch (err: any) {
            setError(err)
        }
        finally {
            setLoadingItem(false)
        }
    }, [])

    const create = useCallback(async (values: ContactLogInterface) => {
        setLoadingItem(true)
        setError(null)
        try {
            const newItem = await contactService.createAsync(values)
            setData(prev => [...prev, newItem])
            setTotalCount(prev => prev + 1)
        } catch (err: any) {
            setError(err)
        } finally {
            setLoadingItem(false)
        }
    }, [])

    const update = useCallback(async(id: number, values: ContactLogInterface)=>{

        setLoadingItem(true)
        setError(null)
        try{
            await contactService.updateContactAsync(values)
            setData(prev => prev.map(item => item.id === id ? {...item, ...values} : item))
        }catch(err: any) {
            setError(err)
        }
        finally {
            setLoadingItem(false)
        }

    }, [])

    const toggleAsync = useCallback(async(id: number)=>{
        setLoadingItem(true)
        setError(null)
        try{
            const updatedItem = await contactService.toggleAsync(id)

            setData(prev => prev.map(item => item.id === id ? updatedItem : item))
        }catch(err: any) {
            setError(err)
        }
        finally {
            setLoadingItem(false)
        }
    }, [])

    const verifyAsync = useCallback(async(phone: string)=>{
        setLoadingItem(true)
        setError(null)
        try{
            // const updatedItem = await contactService.verifyContactAsync(id)
           navigate(`/verify-contact/${phone}`)
            // setData(prev => prev.map(item => item.id === id ? updatedItem : item))
        }catch(err: any) {
            setError(err)
        }
        finally {
            setLoadingItem(false)
        }
    }, [])

    const openCreate = useCallback(()=>{
        setSetselectedData(null)
        setModalMode('create')
        setModalOpen(true)
    }, [])
    
    const openEdit = useCallback((item: ContactLogInterface) => {
        setSetselectedData(item)
        setModalMode('edit')
        setModalOpen(true)
    }, [setSetselectedData])

    const openView = useCallback((item: ContactLogInterface) => {
        setSetselectedData(item)
        setModalMode('view')
        setModalOpen(true)
    }, [setSetselectedData])

    const closeModal = useCallback(() => {
        setModalOpen(false)
        setSetselectedData(null)
        setModalMode('create')
    }, [])

    useEffect(() => {
        fetchPage()
    }, [fetchPage, page, pageSize])

    const handleSubmit =  useCallback((values: ContactLogInterface) => {

        if(modalMode === 'create') {
            create(values)
        }else if(modalMode === 'edit' && selectedData) {
            update(Number(selectedData.id), values)
        }
        closeModal()
    }, [modalMode, selectedData, create, update, closeModal])

  return{
    data,
    selectedData,
    loading: loadingList || loadingItem,
    error,
    page,
    pageSize,
    totalCount,
    setPage: (p: number) => fetchPage(p, pageSize),
    setPageSize: (s: number) => fetchPage(1, s),
    isModalOpen,
    modalMode,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    fetchPage,
    fetchById,
    fetchByPhone,
    create,
    update,
    toggleAsync,
    verifyAsync
  }
}

export default useContact
