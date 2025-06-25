/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { WorkShiftService } from "@/Services/Config/WorkShiftService";
import type {
  WorkShiftInterface,
  WorkShiftFormValues,
} from "@/Interfaces/Setting/WorkShiftInterface";

export const useWorkShift = () => {
  const [workShifts, setWorkShifts] = useState<WorkShiftInterface[]>([]);
  const [selectedWorkShift, setSelectedWorkShift] = useState<WorkShiftInterface | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingItem, setLoadingItem] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'update' | 'view'>('create');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPage = useCallback(async (p = page, s = pageSize) => {
    setLoadingList(true);
    setError(null);
    try {
      const resp = await WorkShiftService.getAllAsync(p, s);
      setWorkShifts(resp.items);
      setTotalCount(resp.meta.totalCount);
      setPage(resp.meta.currentPage);
      setPageSize(resp.meta.pageSize);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoadingList(false);
    }
  }, [page, pageSize]);

  const fetchById = useCallback(async (id: number) => {
    setLoadingItem(true);
    setError(null);
    try {
      const ws = await WorkShiftService.getByIdAsync(id);
      setSelectedWorkShift(ws);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoadingItem(false);
    }
  }, []);

  const create = useCallback(async (values: WorkShiftFormValues) => {
    setLoadingItem(true);
    setError(null);
      console.log("Datos enviados desde hook metodo create: ", JSON.stringify(values))
    try {
      await WorkShiftService.createAsync(values);
      await fetchPage(1, pageSize);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoadingItem(false);
    }
  }, [fetchPage, pageSize]);

  const update = useCallback(async (id: number, values: WorkShiftFormValues) => {
    setLoadingItem(true);
    setError(null);
    try {
      await WorkShiftService.updateAsync(id, values);
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
      const updated = await WorkShiftService.toggleStatusAsync(id);
      setWorkShifts(ws => ws.map(w => w.id === updated.id ? updated : w));
    } catch (err: any) {
      setError(err);
    } finally {
      setLoadingItem(false);
    }
  }, []);

  const openCreate = useCallback(() => {
    setSelectedWorkShift(null);
    setModalMode('create');
    setIsModalOpen(true);
  }, []);

  const openEdit = useCallback((id: number) => {
    // show immediately with cached
    const cached = workShifts.find(w => w.id === id) || null;
    setSelectedWorkShift(cached);
    setModalMode('update');
    setIsModalOpen(true);
    // then refresh details
    fetchById(id);
  }, [workShifts, fetchById]);

  const openView = useCallback((id: number) => {
    const cached = workShifts.find(w => w.id === id) || null;
    setSelectedWorkShift(cached);
    setModalMode('view');
    setIsModalOpen(true);
    fetchById(id);
  }, [workShifts, fetchById]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedWorkShift(null);
  }, []);

  const handleSubmit = useCallback((values: WorkShiftFormValues) => {

    if (modalMode === 'create') {
      create(values);
    } else if (modalMode === 'update' && selectedWorkShift) {
      update(selectedWorkShift.id, values);
    }
    closeModal();
  }, [modalMode, selectedWorkShift, create, update, closeModal]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  return {
    workShifts,
    selectedWorkShift,
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
  };
};