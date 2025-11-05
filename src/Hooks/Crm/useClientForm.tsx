// import { useState, useEffect } from 'react'
// import type { ClientRequestDTO, ClientResponseDTO } from '@/Interfaces/Crm/ClientInterface'

// type Errors = {
//     openingHourId?: string
//     assignedUserId?: string
//     validFrom?: string
//     validTo?: string
//     range?: string
// }

// interface Props {
//     mode: 'create' | 'update' | 'view'
//     data?: ClientResponseDTO | null
//     onSubmit: (values: ClientRequestDTO) => void
// }

// const initialForm: ClientRequestDTO = {
//     codClient: '00000',
//     observation: '',
//     priority: '',
//     supportType: '',
//     workModel: '',
//     enviromentType: '',
//     isFranchise: false,
//     isSupportActive: false,
//     supportLimitTime: 0
// }

// export function useClientForm({ mode, data, onSubmit }: Props) {
//     const isView = mode === 'view'
//     const [form, setForm] = useState<ClientRequestDTO>(initialForm)
//     const [errors, setErrors] = useState<Errors>({})

//     // Cargar datos iniciales según modo
//     useEffect(() => {
//         if ((mode === 'update' || isView) && data) {
//             setForm({
//                 isFranchise: data.isFranchise,
//                 isSupportActive: data.isSupportActive,
//                 observation: data.observation,
//                 codClient: data.codClient,
//                 workModel: data.workModel,
//                 priority: data.priority,
//                 supportType: data.supportType,
//                 supportLimitTime: data.supportLimitTime,
//                 enviromentType: data.enviromentType
//             })
//         } else if (mode === 'create') {
//             setForm(initialForm)
//             setErrors({})
//         }
//     }, [mode, data, isView])

//     const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setForm(f => ({ ...f, isSupportActive: e.target.checked }))

//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault()
//         const newErrors: Errors = {}

//         if (!form.codClient) newErrors.openingHourId = 'Codigo de cliente obligatorio'
//         if (!form.isSupportActive) newErrors.assignedUserId = 'Soporte activo es obligatorio'
//         if (!form.priority) newErrors.validFrom = 'Prioridad es obligatoria.'
//         if (!form.supportType) newErrors.validFrom = 'Tipo de soporte es obligatorio.'

//         if (Object.keys(newErrors).length) {
//             setErrors(newErrors)
//             return
//         }

//         setErrors({})
//         const payload: ClientRequestDTO = {
//             isFranchise: form.isFranchise,
//             isSupportActive: form.isSupportActive,
//             workModel: form.workModel,
//             codClient: form.codClient,
//             priority: form.priority,
//             supportType: form.supportType,
//             observation: form.observation,
//             supportLimitTime: form.supportLimitTime,
//             enviromentType: form.enviromentType
//         }

//         onSubmit(payload)
//         if (mode === 'create') {
//             setForm(initialForm)
//             setErrors({})
//         }
//     }

//     return {
//         form,
//         errors,
//         isView,
//         handleCheckbox,
//         handleSubmit,
//     }
// }