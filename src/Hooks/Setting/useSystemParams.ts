
import { useState, useCallback } from 'react';
import type { SystemParamResponseDto, SystemParamRequestDto } from '@/Interfaces/Auth/AuthInterface';
import type { PaginationInfo } from '@/Interfaces/GlobalInterface';

export const useSystemParams = () => {
  const [systemParams, setSystemParams] = useState<SystemParamResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 25
  });

  const loadSystemParam = useCallback(async (page: number = 1, pageSize: number = 25) => {
    setLoading(true);
    try {
      setSystemParams([]);
      setPagination({
        currentPage: page,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: pageSize
      });
      setError(null);
    } catch (err) {
      setError('Error al cargar los parámetros del sistema');
      console.error('Error loading system params:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortBy, sortOrder]);

  const searchParams = useCallback(async (query: string) => {
    setSearchTerm(query);
    await loadSystemParam(1, pagination.itemsPerPage);
  }, [loadSystemParam, pagination.itemsPerPage]);

  const sortParams = useCallback(async (field: 'name' | 'createdAt' | 'updatedAt', order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    await loadSystemParam(pagination.currentPage, pagination.itemsPerPage);
  }, [loadSystemParam, pagination.currentPage, pagination.itemsPerPage]);

  const handlePageChange = useCallback(async (page: number) => {
    await loadSystemParam(page, pagination.itemsPerPage);
  }, [loadSystemParam, pagination.itemsPerPage]);

  const handlePageSizeChange = useCallback(async (pageSize: number) => {
    await loadSystemParam(1, pageSize);
  }, [loadSystemParam]);

  const getSystemParamById = useCallback(async (id: number): Promise<SystemParamResponseDto | null> => {
    setLoading(true);
    try {
      console.log('Getting system param by ID:', id);
      setError(null);
      return null;
    } catch (err) {
      setError(`Error al obtener el parámetro con ID ${id}`);
      console.error('Error getting system param by ID:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSystemParamByName = useCallback(async (name: string): Promise<SystemParamResponseDto | null> => {
    setLoading(true);
    try {
      console.log('Getting system param by name:', name);
      setError(null);
      return null;
    } catch (err) {
      setError(`Error al obtener el parámetro con nombre ${name}`);
      console.error('Error getting system param by name:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSystemParam = useCallback(async (data: SystemParamRequestDto): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('Creating system param:', data);
      await loadSystemParam(pagination.currentPage, pagination.itemsPerPage);
      return true;
    } catch (err) {
      setError('Error al crear el parámetro');
      console.error('Error creating system param:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadSystemParam, pagination.currentPage, pagination.itemsPerPage]);

  const updateSystemParam = useCallback(async (data: SystemParamRequestDto): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('Updating system param:', data);
      await loadSystemParam(pagination.currentPage, pagination.itemsPerPage);
      return true;
    } catch (err) {
      setError('Error al actualizar el parámetro');
      console.error('Error updating system param:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadSystemParam, pagination.currentPage, pagination.itemsPerPage]);

  const toggleSystemParam = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('Toggling system param:', id);
      await loadSystemParam(pagination.currentPage, pagination.itemsPerPage);
      return true;
    } catch (err) {
      setError('Error al cambiar el estado del parámetro');
      console.error('Error toggling system param:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadSystemParam, pagination.currentPage, pagination.itemsPerPage]);

  const deleteSystemParam = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('Deleting system param:', id);
      await loadSystemParam(pagination.currentPage, pagination.itemsPerPage);
      return true;
    } catch (err) {
      setError('Error al eliminar el parámetro');
      console.error('Error deleting system param:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadSystemParam, pagination.currentPage, pagination.itemsPerPage]);

  return {
    systemParams,
    loading,
    error,
    searchTerm,
    sortBy,
    sortOrder,
    pagination,
    loadSystemParam,
    searchParams,
    sortParams,
    handlePageChange,
    handlePageSizeChange,
    getSystemParamById,
    getSystemParamByName,
    createSystemParam,
    updateSystemParam,
    toggleSystemParam,
    deleteSystemParam
  };
};