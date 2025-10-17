/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { ServiceService } from "@/Services/Crm/ServiceService";
import type {
  ServiceResponseDto,
  ServiceRequestDto,
} from "@/Interfaces/Crm/ServiceInterface";

export const useService = () => {
  const [services, setServices] = useState<ServiceResponseDto[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceResponseDto | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingItem, setLoadingItem] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'update' | 'view'>('create');
  const [isModalOpen, setIsModalOpen] = useState(false);
    const [globalFilter, setGlobalFilter] = useState<string>('')

  const fetchPage = useCallback(async (p = page, s = pageSize) => {
    setLoadingList(true);
    setError(null);
    try {
      const resp = await ServiceService.getAllAsync(globalFilter, p, s);
      setServices(resp.items);
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
      const ws = await ServiceService.getByIdAsync(id);
      setSelectedService(ws);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoadingItem(false);
    }
  }, []);

  const create = useCallback(async (values: ServiceRequestDto) => {
    setLoadingItem(true);
    setError(null);
    try {
      await ServiceService.createAsync(values);
      await fetchPage(1, pageSize);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoadingItem(false);
    }
  }, [fetchPage, pageSize]);

  const update = useCallback(async (id: number, values: ServiceRequestDto) => {
    setLoadingItem(true);
    setError(null);
    try {
      await ServiceService.updateAsync(id, values);
      await fetchPage(page, pageSize);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoadingItem(false);
    }
  }, [fetchPage, page, pageSize]);

  const toggleStatus = useCallback(async (id: number) => {
    setLoadingItem(true);
    setError(null);
    try {
      const updated = await ServiceService.toggleStatusAsync(id);
      setServices(ws => ws.map(w => w.id === updated.id ? updated : w));
    } catch (err: any) {
      setError(err);
    } finally {
      setLoadingItem(false);
    }
  }, []);

  const openCreate = useCallback(() => {
    setSelectedService(null);
    setModalMode('create');
    setIsModalOpen(true);
  }, []);

  const openEdit = useCallback((id: number) => {
    // show immediately with cached
    const cached = services.find(w => w.id === id) || null;
    setSelectedService(cached);
    setModalMode('update');
    setIsModalOpen(true);
    // then refresh details
    fetchById(id);
  }, [services, fetchById]);

  const openView = useCallback((id: number) => {
    const cached = services.find(w => w.id === id) || null;
    setSelectedService(cached);
    setModalMode('view');
    setIsModalOpen(true);
    fetchById(id);
  }, [services, fetchById]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedService(null);
  }, []);

  const handleSubmit = useCallback((values: ServiceRequestDto) => {

    if (modalMode === 'create') {
      create(values);
    } else if (modalMode === 'update' && selectedService) {
      update(selectedService.id, values);
    }
    closeModal();
  }, [modalMode, selectedService, create, update, closeModal]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage, globalFilter]);

  return {
    services,
    selectedService,
    loading: loadingList || loadingItem,
    error,
    page,
    pageSize,
    totalCount,
    setPage:      (p: number) => fetchPage(p, pageSize),
    setPageSize:  (s: number) => fetchPage(1, s),
    modalMode,
    isModalOpen,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    toggleStatus,
    globalFilter,
    setGlobalFilter,
  };
};