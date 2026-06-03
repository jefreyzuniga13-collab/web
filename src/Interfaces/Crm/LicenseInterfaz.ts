export interface LicensePeriodProj {
  id: number
  name: string
  code: string
  months: number
  createdById: number
  createdByName: string
  createdAt: string
  updatedById: number
  updatedByName: string
  updatedAt: string
  isActive: boolean
}

export interface LicenseRequest {
  name: string
  description: string
  isActive: boolean
  licensePeriodId: number
  isRecurrent: boolean
  duration?: number
  benefits: string[]
}

export interface LicenseProj {
  id: number
  name: string
  description: string
  totalCount: number
  createdById: number
  isActive: boolean
  createdByName: string
  createdAt: string
  updatedById: number
  updatedByName: string
  updatedAt: string
  isRecurrent: boolean
  duration?: number
  benefits: string[] | string

  licensePeriodId: number
  licensePeriodName: string
  licensePeriodCode: string
  licensePeriodMonths: number
}

export interface CompaniesLicenseRequest {
  licencesId: number
  companyId: number
  validFrom: string
  statusId: number
  observation: string
  licenseExpirationWarningDays: number
}

export interface CompaniesLicenseProj {
  id: number
  licencesId: number
  licenseName: string

  companyId: number
  companyName: string

  validFrom: string
  validTo: string

  statusId: number
  statusName: string

  observation: string

  createdById: number
  createdByName: string
  createdAt: string

  updatedById: number
  updatedByName: string
  updatedAt: string

  totalCount: number

  isExpired: boolean
  remainingDays: number
  licenseExpirationWarningDays: number
}

export interface FormErrors {
  companyId: string
  licencesId: string
  validFrom: string
  statusId: string
  observation: string
  licenseExpirationWarningDays: number
}