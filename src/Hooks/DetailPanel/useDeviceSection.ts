/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useState } from 'react'
import type { DeviceRequestDTO } from '@/Interfaces/Crm/ClientInterface'

type ErrorBag = Record<string, string>

export interface UseDeviceSectionResult {
  devs: any[]
  devSearch: string
  setDevSearch: (v: string) => void
  filteredDevs: any[]
  expandedDev: number | null
  toggleExpandedDev: (id: number) => void
  addDeviceOpen: boolean
  setAddDeviceOpen: (v: boolean) => void
  newDevice: any
  setNewDevice: (v: any) => void
  createDevice: () => Promise<void>
  deviceErrors: ErrorBag
  setDeviceErrors: (v: ErrorBag) => void
}

/**
 * Lógica para gestionar dispositivos externos del cliente:
 * creación, búsqueda, validación y manejo de errores.
 */
export const useDeviceSection = (
  client: any,
  addDeviceAsync: (clientId: number, dto: DeviceRequestDTO) => Promise<any>,
  reloadClient: () => Promise<void>,
  setClient: (updater: (prev: any) => any) => void
): UseDeviceSectionResult => {
  const devs = useMemo(() => {
    const list = ((client as any)?.outsourcedDevices ?? []) as any[]
    return list.map(d => ({ ...d, credentials: d.credentials ?? [] }))
  }, [client])

  const [devSearch, setDevSearch] = useState('')
  const filteredDevs = useMemo(() => {
    const n = devSearch.trim().toLowerCase()
    if (!n) return devs
    return devs.filter((d: any) =>
      [d.name, d.ip, d.operatingSystem, d.versionSO, d.description]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(n))
    )
  }, [devs, devSearch])

  const [expandedDev, setExpandedDev] = useState<number | null>(null)
  const toggleExpandedDev = (id: number) =>
    setExpandedDev(prev => (prev === id ? null : id))

  const [addDeviceOpen, setAddDeviceOpen] = useState(false)
  const [newDevice, setNewDevice] = useState<any>({
    name: '',
    ip: '',
    operatingSystem: '',
    versionSO: '',
    description: '',
    isActive: true,
  })
  const [deviceErrors, setDeviceErrors] = useState<ErrorBag>({})

  const validateDevice = useCallback(() => {
    const e: ErrorBag = {}
    const name = String(newDevice.name ?? '').trim()
    const os = String(newDevice.operatingSystem ?? '').trim()
    const version = String(newDevice.versionSO ?? '').trim()
    const desc = String(newDevice.description ?? '').trim()
    const ip = String(newDevice.ip ?? '').trim()

    if (!name) e.name = 'Nombre es obligatorio.'
    else if (name.length > 255) e.name = 'Nombre: máximo 255 caracteres.'

    if (ip && ip.length > 100) e.ip = 'Ip: máximo 100 caracteres.'
    if (os && os.length > 100) e.operatingSystem = 'Sistema operativo: máximo 100 caracteres.'
    if (version && version.length > 100) e.versionSO = 'Versión SO: máximo 100 caracteres.'
    if (desc && desc.length > 500) e.description = 'Descripción: máximo 500 caracteres.'

    setDeviceErrors(e)
    return Object.keys(e).length === 0
  }, [newDevice])

  const createDevice = useCallback(async () => {
    if (!client?.id) return
    if (!validateDevice()) return

    const dto: DeviceRequestDTO = {
      name: newDevice.name.trim(),
      ip: newDevice.ip || null,
      operatingSystem: newDevice.operatingSystem || null,
      versionSO: newDevice.versionSO || null,
      description: newDevice.description || null,
      isActive: !!newDevice.isActive,
    }

    const created = await addDeviceAsync(client.id, dto)

    setClient((prev: any) => {
      if (!prev) return prev
      const list = Array.isArray(prev.outsourcedDevices)
        ? [...prev.outsourcedDevices]
        : []
      if (created)
        list.unshift({ ...(created as any), credentials: [] })
      else
        list.unshift({
          id: Date.now(),
          ...dto,
          isActive: !!dto.isActive,
          credentials: [],
        })
      return { ...prev, outsourcedDevices: list }
    })
    await reloadClient()
    setNewDevice({
      name: '',
      ip: '',
      operatingSystem: '',
      versionSO: '',
      description: '',
      isActive: true,
    })
    setDeviceErrors({})
    setAddDeviceOpen(false)
  }, [client, newDevice, addDeviceAsync, setClient, validateDevice, reloadClient])

  return {
    devs,
    devSearch,
    setDevSearch,
    filteredDevs,
    expandedDev,
    toggleExpandedDev,
    addDeviceOpen,
    setAddDeviceOpen,
    newDevice,
    setNewDevice,
    createDevice,
    deviceErrors,
    setDeviceErrors,
  }
}