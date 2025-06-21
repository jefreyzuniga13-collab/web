/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { WorkShiftService } from "@/Services/Config/WorkShiftService";
import type { WorkShiftInterface } from "@/Interfaces/Setting/WorkShiftInterface";

export const useWorkShift = () => {
  const [workShifts, setWorkShifts] = useState<WorkShiftInterface[]>([]);
  const [selectedWorkShift, setSelectedWorkShift] = useState<WorkShiftInterface | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'update' | 'view'>('create');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const getAllAsync = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await WorkShiftService.getAllAsync();
      setWorkShifts(items);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const getByIdAsync = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const value = await WorkShiftService.getByIdAsync(id);
      setSelectedWorkShift(value);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const createAsync = async (value: WorkShiftInterface) => {
    setLoading(true);
    setError(null);
    try {
      const newItem = await WorkShiftService.createAsync(value);
      setWorkShifts(prev => [...prev, newItem]);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const updateAsync = async (id: number, value: WorkShiftInterface) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await WorkShiftService.updateAsync(id, value);
      setWorkShifts(prev =>
         prev.map(item => item.id === updated.id ? updated : item)
      );
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAsync = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await WorkShiftService.toggleAsync(id);
      setWorkShifts(prev =>
         prev.map(item => item.id === updated.id ? updated : item)
      );
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setSelectedWorkShift(null);
    setModalMode("create");
    setIsModalOpen(true);
  };

  const openEdit = (id: number) => {
    getByIdAsync(id).then(() => {
      setModalMode("update");
      setIsModalOpen(true);
    });
  };

  const openView = (id: number) => {
    getByIdAsync(id).then(() => {
      setModalMode("view");
      setIsModalOpen(true);
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (values: WorkShiftInterface) => {
    if (modalMode === "create") {
      createAsync(values);
    } else if (modalMode === "update" && selectedWorkShift) {
      updateAsync(selectedWorkShift.id, values);
    }
    closeModal();
  };

  useEffect(() => {
    getAllAsync();
  }, []);

  return {
    workShifts,
    selectedWorkShift,
    error,
    loading,
    getAllAsync,
    getByIdAsync,
    createAsync,
    updateAsync,
    toggleAsync,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    isModalOpen,
    modalMode,
  };
};