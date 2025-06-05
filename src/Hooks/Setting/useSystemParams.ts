/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useCallback } from 'react'
import type { SystemParamRequestDto, SystemParamResponseDto } from "@/Interfaces/Auth/AuthInterface"
import SystemParamService from "@/Services/SystemParamService"

export function useSystemParams() {
  const [systemParams, setSystemParams] = useState<SystemParamResponseDto[]>([])
  const [filteredParams, setFilteredParams] = useState<SystemParamResponseDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const loadSystemParam = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = await SystemParamService.getSystemParams()
      setSystemParams(params)
      setFilteredParams(params)
    } catch (err: any) {
      setError(err.message || 'Error loading system parameters')
    } finally {
      setLoading(false)
    }
  }, [])

  const filterAndSort = useCallback((params: SystemParamResponseDto[], search: string, sort: string, order: string) => {
    let filtered = params.filter(param => 
      param.name.toLowerCase().includes(search.toLowerCase()) ||
      param.description.toLowerCase().includes(search.toLowerCase()) ||
      param.value.toLowerCase().includes(search.toLowerCase())
    )

    filtered.sort((a, b) => {
      let aValue: any = a[sort as keyof SystemParamResponseDto]
      let bValue: any = b[sort as keyof SystemParamResponseDto]
      
      if (sort === 'createdAt' || sort === 'updatedAt') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }
      
      if (order === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [])

  const searchParams = useCallback((term: string) => {
    setSearchTerm(term)
    const filtered = filterAndSort(systemParams, term, sortBy, sortOrder)
    setFilteredParams(filtered)
  }, [systemParams, sortBy, sortOrder, filterAndSort])

  const sortParams = useCallback((sort: 'name' | 'createdAt' | 'updatedAt', order: 'asc' | 'desc') => {
    setSortBy(sort)
    setSortOrder(order)
    const filtered = filterAndSort(systemParams, searchTerm, sort, order)
    setFilteredParams(filtered)
  }, [systemParams, searchTerm, filterAndSort])

  const getSystemParamById = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const param = await SystemParamService.getSystemParamById(id)
      return param
    } catch (err: any) {
      setError(err.message || `Error getting parameter with ID ${id}`)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getSystemParamByName = useCallback(async (name: string) => {
    setLoading(true)
    setError(null)
    try {
      const param = await SystemParamService.getSystemParamByName(name)
      return param
    } catch (err: any) {
      setError(err.message || `Error getting parameter with name ${name}`)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const createSystemParam = useCallback(async (param: SystemParamRequestDto) => {
    setLoading(true)
    setError(null)
    try {
      const newParam = await SystemParamService.createSystemParam(param)
      const updatedParams = [...systemParams, newParam]
      setSystemParams(updatedParams)
      setFilteredParams(filterAndSort(updatedParams, searchTerm, sortBy, sortOrder))
      return newParam
    } catch (err: any) {
      setError(err.message || 'Error creating parameter')
      return null
    } finally {
      setLoading(false)
    }
  }, [systemParams, searchTerm, sortBy, sortOrder, filterAndSort])

  const updateSystemParam = useCallback(async (param: SystemParamRequestDto) => {
    setLoading(true)
    setError(null)
    try {
      const updatedParam = await SystemParamService.updateSystemParams(param)
      const updatedParams = systemParams.map(p => p.id === updatedParam.id ? updatedParam : p)
      setSystemParams(updatedParams)
      setFilteredParams(filterAndSort(updatedParams, searchTerm, sortBy, sortOrder))
      return updatedParam
    } catch (err: any) {
      setError(err.message || 'Error updating parameter')
      return null
    } finally {
      setLoading(false)
    }
  }, [systemParams, searchTerm, sortBy, sortOrder, filterAndSort])

  const toggleSystemParam = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const param = systemParams.find(p => p.id === id)
      if (!param) throw new Error('Parameter not found')
      
      const updatedParam = { ...param, isActive: !param.isActive }
      const updatedParams = systemParams.map(p => p.id === id ? updatedParam : p)
      setSystemParams(updatedParams)
      setFilteredParams(filterAndSort(updatedParams, searchTerm, sortBy, sortOrder))
      return true
    } catch (err: any) {
      setError(err.message || 'Error toggling parameter status')
      return false
    } finally {
      setLoading(false)
    }
  }, [systemParams, searchTerm, sortBy, sortOrder, filterAndSort])

  const deleteSystemParam = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await SystemParamService.deleteSystemParam(id)
      const updatedParams = systemParams.filter(p => p.id !== id)
      setSystemParams(updatedParams)
      setFilteredParams(filterAndSort(updatedParams, searchTerm, sortBy, sortOrder))
      return true
    } catch (err: any) {
      setError(err.message || 'Error deleting parameter')
      return false
    } finally {
      setLoading(false)
    }
  }, [systemParams, searchTerm, sortBy, sortOrder, filterAndSort])

  return {
    systemParams: filteredParams,
    loading,
    error,
    searchTerm,
    sortBy,
    sortOrder,
    loadSystemParam,
    searchParams,
    sortParams,
    getSystemParamById,
    getSystemParamByName,
    createSystemParam,
    updateSystemParam,
    toggleSystemParam,
    deleteSystemParam
  }
}