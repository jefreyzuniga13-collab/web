import type { PagedResponse } from "@/Interfaces/GlobalInterface"
import type { NotificationRequestDto, NotificationResponseDto } from "@/Interfaces/Notification/NotificationInterfaces"
import { NotificationService } from "@/Services/Notification/NotificationService"
import { useCallback, useEffect, useState } from "react"

const useNotification = () => {
  const [data, setData] = useState<NotificationResponseDto[]>([])
  const [selectedData, setSelectedData] = useState<NotificationResponseDto | NotificationRequestDto | null>(null)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [loadingList, setLoadingList] = useState<boolean>(false)
  const [loadingItem, setLoadingItem] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'| 'view'>('view')
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  const fetchPage = useCallback(
   async(p = page, s = pageSize) =>{
    setLoadingList(true)
    setError(null)

    try{
       const res: PagedResponse<NotificationResponseDto> = await NotificationService.GetAllAsync(p, s)
      setData(res.items)
      setTotalCount(res.meta.totalCount)
      setPage(res.meta.currentPage)
      setPageSize(res.meta.pageSize)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }catch(err: any){
      setError(err)
    }finally{
      setLoadingList(false)
    }
   },
   [page, pageSize]
  )

  const fetByIdAsync = useCallback(
    async(id: number)=> {
      setLoadingItem(true);
      setError(null)
      try{
        const res = await NotificationService.GetByIdAsync(id);
        setSelectedData(res)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }catch(err: any){
        setError(err)
      }finally{
        setLoadingItem(false)
      }
    },
    []
  )

  const createAsync = useCallback(
    async(values: NotificationRequestDto)=>{
      setLoadingItem(true)
      setError(null)
      try{
        const payload = {...values} as NotificationRequestDto
        const newItem = await NotificationService.CreateAsync(payload);
        setData(prev=> [...prev, newItem])
        setTotalCount(prev=> prev + 1)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }catch(err: any){
        setError(err)
      }finally{
        setLoadingItem(false)
      }
    },
    []
  )

  const updateAsync = useCallback(
    async(id: number, values: NotificationRequestDto)=>{
      setLoadingItem(true)
      setError(null)
      try{
        const payload = { ...(selectedData ?? {}), ...values, id } as NotificationRequestDto;
        const updateItem = await NotificationService.UpdateAsync(id, payload);
        setData(prev=> prev.map(item=> (item.id == id ? updateItem: item)));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }catch(err: any){
        setError(err)
      }finally{
        setLoadingItem(false);
      }
    },
    [selectedData]
  )


  const toggleAsync = useCallback(
      async (id: number) => {
        setLoadingItem(true)
        setError(null)
        try {
          await NotificationService.ToggleActiveAsync(id)
          setData(prev =>
            prev.map(item =>
              item.id === id ? { ...item, isActive: !item.isActive } : item
            )
          )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
          setError(err)
        } finally {
          setLoadingItem(false)
        }
      },
      []
    )

    const openCreateAsync = useCallback(()=>{
      setSelectedData(null)
      setModalMode('create')
      setIsModalOpen(true)
    }, [])

    const openEditAsync = useCallback((item: NotificationResponseDto)=>{
      setSelectedData(item)
      setModalMode('edit')
      setIsModalOpen(true)
    }, [])

    const openViewAsync = useCallback((item: NotificationResponseDto)=>
    {
      setSelectedData(item)
      setModalMode('view')
      setIsModalOpen(true)
    },[])

    const closeModalAsync = useCallback(()=>{
      setIsModalOpen(false)
      setSelectedData(null)
      setModalMode('create')
    }, [])


    useEffect(() => {
      fetchPage()
    }, [fetchPage, page, pageSize])

    const handleSubmit = useCallback(
      (values: NotificationRequestDto)=>{
        if(modalMode === 'create') createAsync(values)
          else if(modalMode === 'edit') updateAsync(values.id!, values)
        closeModalAsync()
      },
      [modalMode, selectedData, createAsync, updateAsync, closeModalAsync]
    )

  return {
    data,
    selectedData,
    page,
    pageSize,
    totalCount,
    loadingItem,
    loadingList,
    error,
    isModalOpen,
    modalMode,
    fetchPage,
    fetByIdAsync,
    createAsync,
    updateAsync,
    toggleAsync,
    openCreateAsync,
    openEditAsync,
    openViewAsync,
    closeModalAsync,
    setPage,
    setPageSize,
    handleSubmit
  }
}

export default useNotification;