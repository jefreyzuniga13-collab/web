export interface ContactResponseDTO {
  id: number
  fullName: string
  phone?: string | null
  waName?: string | null
  isVerified: boolean
  isActive: boolean
  verifiedBy?: SimpleUserDTO | null
  verifiedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  clienteCodigo?: string | null
}

export interface SimpleUserDTO {
  id?: number
  fullName?: string
  email?: string
}

export interface ClientResponseDTO {
  id: number
  name: string
  email?: string | null
  Ambiguity?: string | null
  DelinquentClient?: string | null
  HomeCountry?: string | null
  RegisteredName?: string | null
  activity?: string | null
  direccion?: string | null
  workModel?: string | null
  priority?: 'Alta' | 'Media' | 'Baja' | string
  supportType?: 'AAA' | 'AA' | 'A' | string
  enviromentType?: 'LOCAL' | 'NUBE' | string
  isSupportActive?: boolean
  isFranchise?: boolean
  supportLimitTime?: number | null
  recurrency?: string | null
  lastContactDate?: string | null
  lastClosedCase?: string | null
  observation?: string | null
  credentials?: CredentialResponseDTO[]
  outsourcedDevices?: DeviceResponseDTO[]
  outsourcedSystems?: SystemResponseDTO[]
  clientContacts?: ContactMiniResponseDTO[]
}

export interface CredentialResponseDTO {
  id: number
  catCredencialNames?: string
  type?: string
  user?: string
  password?: string
  instance?: string
  port?: string
  observation?: string
  isActive?: boolean
}

export interface DeviceResponseDTO {
  id: number
  name: string
  ip?: string
  operatingSystem?: string
  versionSO?: string
  description?: string
  isActive?: boolean
  credentials?: CredentialResponseDTO[]
}

export interface SystemResponseDTO {
  id: number
  name: string
  version?: string
  credentials?: CredentialResponseDTO[]
}

export interface ContactMiniResponseDTO {
  id: number
  fullName: string
  phone?: string
}

export interface ClientUpdateRequestDTO {
  workModel?: string
  priority?: 'Alta' | 'Media' | 'Baja'
  supportType?: 'AAA' | 'AA' | 'A'
  enviromentType?: 'LOCAL' | 'NUBE'
  isFranchise?: boolean
}

export interface CredentialRequestDTO {
  id?: number
  type: string
  user: string
  password?: string
  instance?: string
  port?: string
  observation?: string
  isActive?: boolean
}

export interface DeviceRequestDTO {
  id?: number
  name: string
  ip?: string
  operatingSystem?: string
  versionSO?: string
  description?: string
  isActive?: boolean
  credentials?: CredentialRequestDTO[]
}

export interface SystemRequestDTO {
  id?: number
  name: string
  version?: string
  credentials?: CredentialRequestDTO[]
}

export interface ContactRequestDTO {
  id?: number
  fullName: string
  phone?: string
}

export interface ClientRequestDTO {
  nombre: string
  telefono?: string | null
  celular?: string | null
  direccion?: string | null
  workModel?: string | null
  priority?: 'Alta' | 'Media' | 'Baja'
  supportType?: 'AAA' | 'AA' | 'A'
  enviromentType?: 'LOCAL' | 'NUBE'
  isSupportActive?: boolean
  isFranchise?: boolean
  supportLimitTime?: number | null
  recurrency?: string | null
  observation?: string | null
  credentials?: CredentialRequestDTO[]
  outsourcedDevices?: DeviceRequestDTO[]
  outsourcedSystems?: SystemRequestDTO[]
  clientContacts?: ContactRequestDTO[]
}