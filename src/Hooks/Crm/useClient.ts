/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useState } from 'react'
import ClientService from '@/Services/Crm/ClientService'
import type {
  ClientRequestDTO,
  ClientUpdateRequestDTO,
  ClientResponseDTO,
  DeviceRequestDTO,
  CredentialRequestDTO,
  SystemRequestDTO,
  ContactRequestDTO,
} from '@/Interfaces/Crm/ClientInterface'

export function useClient() {
  const [client, setClient] = useState<ClientResponseDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const run = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fn()
      return res
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getAllAsync = useCallback(
    (filter: string, page: number, pageSize: number) =>
      run(() => ClientService.getAllAsync(filter, page, pageSize)),
    [run]
  )

  const getByIdAsync = useCallback(
    async (idOrCode: number | string) => {
      const data =
        typeof idOrCode === 'number'
          ? await run(() => ClientService.getByIdAsync(idOrCode))
          : await run(() => ClientService.getByCodeAsync(String(idOrCode)))
      setClient(data)
      return data
    },
    [run]
  )

  const createAsync = useCallback(
    async (payload: ClientRequestDTO) => {
      const data = await run(() => ClientService.createAsync(payload))
      setClient(data)
      return data
    },
    [run]
  )

  const updateAsync = useCallback(
    async (id: number, payload: ClientUpdateRequestDTO) => {
      const data = await run(() => ClientService.updateAsync(id, payload))
      setClient(data)
      return data
    },
    [run]
  )

  const toggleStatusAsync = useCallback(
    async (id: number) => {
      const data = await run(() => ClientService.toggleStatusAsync(id))
      setClient(data)
      return data
    },
    [run]
  )

  const addDeviceAsync = useCallback(
    async (id: number, device: DeviceRequestDTO) => {
      const data = await run(() => ClientService.addDeviceAsync(id, device))
      setClient(data)
      return data
    },
    [run]
  )

  const addSystemAsync = useCallback(
    async (id: number, system: SystemRequestDTO) => {
      const data = await run(() => ClientService.addSystemAsync(id, system))
      setClient(data)
      return data
    },
    [run]
  )

  const addCredentialAsync = useCallback(
    async (id: number, cred: CredentialRequestDTO) => {
      const data = await run(() => ClientService.addCredentialAsync(id, cred))
      setClient(data)
      return data
    },
    [run]
  )

  const addContactAsync = useCallback(
    async (id: number, contact: ContactRequestDTO) => {
      const data = await run(() => ClientService.addContactAsync(id, contact))
      setClient(data)
      return data
    },
    [run]
  )

  const removeDeviceAsync = useCallback(
    async (id: number, deviceId: number) => {
      const data = await run(() => ClientService.removeDeviceAsync(id, deviceId))
      setClient(data)
      return data
    },
    [run]
  )

  const removeSystemAsync = useCallback(
    async (id: number, systemId: number) => {
      const data = await run(() => ClientService.removeSystemAsync(id, systemId))
      setClient(data)
      return data
    },
    [run]
  )

  const removeCredentialAsync = useCallback(
    async (id: number, credentialId: number) => {
      const data = await run(() => ClientService.removeCredentialAsync(id, credentialId))
      setClient(data)
      return data
    },
    [run]
  )

  const removeContactAsync = useCallback(
    async (id: number, contactId: number) => {
      const data = await run(() => ClientService.removeContactAsync(id, contactId))
      setClient(data)
      return data
    },
    [run]
  )

  const value = useMemo(
    () => ({
      client,
      loading,
      error,
      setClient,
      getAllAsync,
      getByIdAsync,
      createAsync,
      updateAsync,
      toggleStatusAsync,
      addDeviceAsync,
      addSystemAsync,
      addCredentialAsync,
      addContactAsync,
      removeDeviceAsync,
      removeSystemAsync,
      removeCredentialAsync,
      removeContactAsync,
    }),
    [
      client,
      loading,
      error,
      getAllAsync,
      getByIdAsync,
      createAsync,
      updateAsync,
      toggleStatusAsync,
      addDeviceAsync,
      addSystemAsync,
      addCredentialAsync,
      addContactAsync,
      removeDeviceAsync,
      removeSystemAsync,
      removeCredentialAsync,
      removeContactAsync,
    ]
  )
  return value
}

export default useClient