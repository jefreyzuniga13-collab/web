/* eslint-disable @typescript-eslint/no-empty-object-type */
export interface ClientRequestDTO {
  codClient?: string | null
  workModel?: string | null
  priority?: string | null
  supportType?: string | null
  isSupportActive: boolean
  isFranchise: boolean
  supportLimitTime?: number | null
  enviromentType?: string | null
  observation?: string | null
}

export interface ClientUpdateRequestDTO extends Partial<ClientRequestDTO> {}

export interface ClientResponseDTO {
  id: number
  name?: string | null
  codClient: string
  workModel?: string | null
  priority?: string | null
  supportType?: string | null
  isSupportActive: boolean
  isFranchise: boolean
  supportLimitTime?: number | null
  recurrency?: number | null
  enviromentType?: string | null
  lastContactDate: string
  lastClosedCase?: string | null
  observation?: string | null
  delinquentClient?: string | null
  homeCountry?: string | null
  email?: string | null
  ambiguity?: string | null
  registeredName?: string | null
  address?: string | null
  location?: string | null
  activity?: string | null
  isActive: boolean
  createdById: number
  createdByName?: string | null
  updatedById: number
  updatedByName?: string | null
  outsourcedDevices: OutsourcedDeviceResponseDTO[]
  outsourcedSystems: OutsourcedSystemsResponseDTO[]
  hostingCredentials: CredentialResponseDTO[]
}

export interface DeviceRequestDTO {
  name: string
  description?: string | null
  ip?: string | null
  operatingSystem?: string | null
  versionSO?: string | null
  isActive?: boolean
}

export interface OutsourcedDeviceRequestDTO extends DeviceRequestDTO {}

export interface OutsourcedDeviceResponseDTO {
  id: number
  name: string
  description?: string | null
  ip?: string | null
  operatingSystem?: string | null
  versionSO?: string | null
  isActive: boolean
  createdById: number
  createdByName?: string | null
  updatedById?: number | null
  updatedByName?: string | null
  credentials: CredentialResponseDTO[]
}

export interface SystemRequestDTO {
  outsourcedSystemsId: number
  isActive?: boolean
}

export interface OutsourcedSystemsRequestDTO {
  name: string
  description?: string | null
  version?: string | null
  isActive?: boolean
}

export interface OutsourcedSystemsResponseDTO {
  id: number
  name: string
  description?: string | null
  version?: string | null
  isActive: boolean
  createdById: number
  createdByName?: string | null
  updatedById?: number | null
  updatedByName?: string | null
  credentials: CredentialResponseDTO[]
}

export interface CredentialRequestDTO {
  id?: number
  catCredentialId: number
  clientId?: number | null
  outsourcedDeviceId?: number | null
  clientOutsourcedSystemId?: number | null
  user: string
  password: string
  instance?: string | null
  port?: string | null
  observation?: string | null
  isActive?: boolean
}

export interface CredentialResponseDTO {
  id: number
  catCredencialId: number
  catCredencialNames?: string | null
  clientId?: number | null
  clientName?: string | null
  clientRegisteredName?: string | null
  outsourcedDeviceId?: number | null
  outsourcedDeviceName?: string | null
  clientOutsourcedSystemsId?: number | null
  clientOutsourcedSystemsName?: string | null
  user: string
  password?: string | null
  instance?: string | null
  port?: string | null
  observation?: string | null
  isActive: boolean
  createdAt?: string | null
  updatedAt?: string | null
  createdById?: number | null
  createdByName?: string | null
  updatedById?: number | null
  updatedByName?: string | null
}

export interface ContactRequestDTO {
  contactId: number
  isActive?: boolean
}

export interface ContactLogLiteResponseDto {
  id: number
  phone: string
  waId?: string | null
  waName?: string | null
  waUserId?: string | null
  fullName?: string | null
  status?: string | null
}