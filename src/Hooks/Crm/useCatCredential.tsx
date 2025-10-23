/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { CatCredentialService } from "@/Services/Crm/CatCredentialService";
import type {
  CatCredencialRequestDto,
  CatCredencialResponseDto,
} from "@/Interfaces/Crm/CatCredential";

export const useCatCredential = () => {
  const [catCredential, setCatCredential] = useState<CatCredencialResponseDto[]>([]);
  const [selectedCatCredential, setSelectedCatCredential] = useState<CatCredencialResponseDto | null>(null);
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
      const resp = await CatCredentialService.getAllAsync(globalFilter, p, s);
      setCatCredential(resp.items);
      setTotalCount(resp.meta.totalCount);
      setPage(resp.meta.currentPage);
      setPageSize(resp.meta.pageSize);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoadingList(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchById = useCallback(async (id: number) => {
    setLoadingItem(true);
    setError(null);
    try {
      const ws = await CatCredentialService.getByIdAsync(id);
      setSelectedCatCredential(ws);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoadingItem(false);
    }
  }, []);

  const create = useCallback(async (values: CatCredencialRequestDto) => {
    setLoadingItem(true);
    setError(null);
    try {
      await CatCredentialService.createAsync(values);
      await fetchPage(1, pageSize);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoadingItem(false);
    }
  }, [fetchPage, pageSize]);

  const update = useCallback(async (id: number, values: CatCredencialRequestDto) => {
    setLoadingItem(true);
    setError(null);
    try {
      await CatCredentialService.updateAsync(id, values);
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
      const updated = await CatCredentialService.toggleStatusAsync(id);
      setCatCredential(ws => ws.map(w => w.id === updated.id ? updated : w));
    } catch (err: any) {
      setError(err);
    } finally {
      setLoadingItem(false);
    }
  }, []);

  const openCreate = useCallback(() => {
    setSelectedCatCredential(null);
    setModalMode('create');
    setIsModalOpen(true);
  }, []);

  const openEdit = useCallback((id: number) => {
    // show immediately with cached
    const cached = catCredential.find(w => w.id === id) || null;
    setSelectedCatCredential(cached);
    setModalMode('update');
    setIsModalOpen(true);
    // then refresh details
    fetchById(id);
  }, [catCredential, fetchById]);

  const openView = useCallback((id: number) => {
    const cached = catCredential.find(w => w.id === id) || null;
    setSelectedCatCredential(cached);
    setModalMode('view');
    setIsModalOpen(true);
    fetchById(id);
  }, [catCredential, fetchById]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedCatCredential(null);
  }, []);

  const handleSubmit = useCallback((values: CatCredencialRequestDto) => {

    if (modalMode === 'create') {
      create(values);
    } else if (modalMode === 'update' && selectedCatCredential) {
      update(selectedCatCredential.id, values);
    }
    closeModal();
  }, [modalMode, selectedCatCredential, create, update, closeModal]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage, globalFilter]);

  return {
    catCredential,
    selectedCatCredential,
    loading: loadingList || loadingItem,
    error,
    page,
    pageSize,
    totalCount,
    fetchPage,
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