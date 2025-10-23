import { useCallback, useMemo, useState } from 'react'
import { ClientsService } from '@/Services/Crm/ClientService'
import type {
  ClientRequestDTO,
  ClientUpdateRequestDTO,
  ClientResponseDTO,
  DeviceRequestDTO,
  CredentialRequestDTO,
  SystemRequestDTO,
} from '@/Interfaces/Crm/ClientInterface'

export function useClient() {
  const [client, setClient] = useState<ClientResponseDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
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
      run(() => ClientsService.getAllAsync(filter, page, pageSize)),
    [run]
  )

  const getByIdAsync = useCallback(
    async (idOrCode: number | string) => {
      const data =
        typeof idOrCode === 'number'
          ? await run(() => ClientsService.getByIdAsync(idOrCode))
          : await run(() => ClientsService.getByCodeAsync(String(idOrCode)))
      setClient(data)
      return data
    },
    [run]
  )

  const createAsync = useCallback(
    async (payload: ClientRequestDTO) => {
      const data = await run(() => ClientsService.createAsync(payload))
      setClient(data)
      return data
    },
    [run]
  )

  const updateAsync = useCallback(
    async (id: number, payload: ClientUpdateRequestDTO) => {
      const data = await run(() => ClientsService.updateAsync(id, payload))
      setClient(data)
      return data
    },
    [run]
  )

  const toggleStatusAsync = useCallback(
    async (id: number) => {
      const data = await run(() => ClientsService.toggleStatusAsync(id))
      setClient(data)
      return data
    },
    [run]
  )

  const addDeviceAsync = useCallback(
    async (clientId: number, device: DeviceRequestDTO) => {
      const data = await run(() => ClientsService.addDeviceAsync(clientId, device))
      return data
    },
    [run]
  )

  const addSystemAsync = useCallback(
    async (clientId: number, system: SystemRequestDTO) => {
      const data = await run(() =>
        ClientsService.addSystemByIdAsync(clientId, system.outsourcedSystemsId)
      )
      return data
    },
    [run]
  )

  const addSystemByIdAsync = useCallback(
    async (clientId: number, systemId: number) => {
      const data = await run(() => ClientsService.addSystemByIdAsync(clientId, systemId))
      return data
    },
    [run]
  )

  const addCredentialHostingAsync = useCallback(
    async (clientId: number, credential: CredentialRequestDTO) => {

      console.log("En el metodo addCredentialHostingAsync, con los datos. ClienteId", clientId)
      console.log("Credencial", credential)
      const data = await run(() => ClientsService.addCredentialHostingAsync(clientId, credential))
      return data
    },
    [run]
  )

  const addCredentialForDeviceAsync = useCallback(
    async (clientId: number, deviceId: number, credential: CredentialRequestDTO) => {
      const data = await run(() =>
        ClientsService.addCredentialForDeviceAsync(clientId, deviceId, credential)
      )
      return data
    },
    [run]
  )

  const addCredentialForSystemAsync = useCallback(
    async (clientId: number, clientSystemId: number, credential: CredentialRequestDTO) => {
      const data = await run(() =>
        ClientsService.addCredentialForSystemAsync(clientId, clientSystemId, credential)
      )
      return data
    },
    [run]
  )

  const linkExistingContactsAsync = useCallback(
    async (clientId: number, contactIds: number[]) => {
      const data = await run(() => ClientsService.linkExistingContactsAsync(clientId, contactIds))
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
      addSystemByIdAsync,
      addCredentialHostingAsync,
      addCredentialForDeviceAsync,
      addCredentialForSystemAsync,
      linkExistingContactsAsync,
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
      addSystemByIdAsync,
      addCredentialHostingAsync,
      addCredentialForDeviceAsync,
      addCredentialForSystemAsync,
      linkExistingContactsAsync,
    ]
  )

  return value
}

export default useClient