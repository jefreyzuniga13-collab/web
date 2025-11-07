/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, type ChangeEvent } from "react";
import {ClientsService} from '@/Services/Crm/ClientService'
import type { ClientProcResponse, ClientRequestDTO } from "@/Interfaces/Crm/ClientInterface";


export const useClasicClient = () => {
    
    const initialValues: ClientRequestDTO = {
            isFranchise: false,
            isSupportActive: false,
            codClient: '',
            enviromentType: '',
            observation: '',
            priority: '',
            supportLimitTime: 0,
            supportType: '',
            workModel: ''
    }

  const [clients, setClients] = useState<ClientProcResponse[]>([]);
  const [form, setForm] = useState<ClientRequestDTO>(initialValues);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingItem, setLoadingItem] = useState(false);
  const [error, setError] = useState<Error | null>(null);
    const [globalFilter, setGlobalFilter] = useState<string>('')

  const fetchPage = useCallback(async (p = page, s = pageSize) => {
    setLoadingList(true);
    setError(null);
    try {
      const resp = await ClientsService.getAllClientAsyn(globalFilter, p, s);
      
      setClients(resp.items);
      setTotalCount(resp.meta.totalCount);
      setPage(resp.meta.currentPage);
      setPageSize(resp.meta.pageSize);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoadingList(false);
    }
  }, [globalFilter, page, pageSize]);

  const fetchById = useCallback(async (id: number) => {
    setLoadingItem(true);
    setError(null);
    
    try {
      const resp = await ClientsService.getByIdAsync(id);
      setForm(resp);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoadingItem(false);
    }
  }, []);

  const update = useCallback(async (id: number, values: ClientRequestDTO) => {
    setLoadingItem(true);
    setError(null);
    try {
      await ClientsService.updateAsync(id, values);
      await fetchPage(page, pageSize);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoadingItem(false);
    }
  }, [fetchPage, page, pageSize]);

  // const toggleStatus = useCallback(async (id: number) => {
  //   setLoadingItem(true);
  //   setError(null);
  //   try {
  //     const updated = await ClientsService.toggleStatusAsync(id);
  //     setClients(cl => cl.map(c => c.id === updated.id ? updated : c));
  //   } catch (err: any) {
  //     setError(err);
  //   } finally {
  //     setLoadingItem(false);
  //   }
  // }, []);

    const handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback(
      (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        // if (error[name as keyof Errors]) setError((prev) => ({ ...prev, [name]: undefined }))
      },
      []
    )

      const handleSelect = useCallback(
    (value: string) => {
      setForm((prev) => ({ ...prev, type: value }));
    },
    []
  );

    const handleCheckbox = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target
        setForm(f => ({ ...f, [name]: checked }))
      },
      []
    )

  const handleSubmit = useCallback((values: ClientRequestDTO) => {

    if(form.id == null) return;
    
      update(form.id, values);

  }, [form, update]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage, globalFilter]);

  return {
    clients,
    form,
    loading: loadingList || loadingItem,
    error,
    page,
    pageSize,
    totalCount,
    setPage:      (p: number) => fetchPage(p, pageSize),
    setPageSize:  (s: number) => fetchPage(1, s),
    handleSubmit,
    // toggleStatus,
    globalFilter,
    setGlobalFilter,
    fetchById,
    update,
    handleChange,
    handleSelect,
    handleCheckbox
  };
};