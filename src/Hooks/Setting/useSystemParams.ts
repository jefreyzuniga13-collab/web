
import { useState, useCallback } from 'react'
import type { SystemParamRequestDto, SystemParamResponseDto } from "@/Interfaces/Auth/AuthInterface"
import SystemParamService from "@/Services/SystemParamService"

export function useSystemParams() {
  const [systemParams, setSystemParams] = useState<SystemParamResponseDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSystemParam = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = await SystemParamService.getSystemParams()
      setSystemParams(params)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Error loading system parameters')
    } finally {
      setLoading(false)
    }
  }, [])

  const getSystemParamById = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const param = await SystemParamService.getSystemParamById(id)
      return param
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      setSystemParams(prev => [...prev, newParam])
      return newParam
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Error creating parameter')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSystemParam = useCallback(async (param: SystemParamRequestDto) => {
    setLoading(true)
    setError(null)
    try {
      const updatedParam = await SystemParamService.updateSystemParams(param)
      setSystemParams(prev => prev.map(p => p.id === updatedParam.id ? updatedParam : p))
      return updatedParam
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Error updating parameter')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteSystemParam = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await SystemParamService.deleteSystemParam(id)
      setSystemParams(prev => prev.filter(p => p.id !== id))
      return true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Error deleting parameter')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    systemParams,
    loading,
    error,
    loadSystemParam,
    getSystemParamById,
    getSystemParamByName,
    createSystemParam,
    updateSystemParam,
    deleteSystemParam
  }
}