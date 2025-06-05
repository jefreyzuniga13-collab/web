
import React from 'react'
import { ReusableForm } from '../Common/ReusableForm'
import type { SystemParamRequestDto, SystemParamResponseDto } from "@/Interfaces/Auth/AuthInterface"
import '@/Styles/Setting/SystemParamForm.css'

interface Props {
  initialData?: SystemParamResponseDto
  onSubmit: (data: SystemParamRequestDto) => void
  onCancel: () => void
  isLoading?: boolean
}

export const SystemParamForm: React.FC<Props> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const fields = [
    {
      name: 'name',
      label: 'Nombre del Parámetro',
      type: 'text' as const,
      required: true,
      placeholder: 'Ej: max_connections'
    },
    {
      name: 'type',
      label: 'Tipo',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'Prompts', label: 'Prompts' },
        { value: 'Keywords', label: 'Keywords' },
        { value: 'Temp', label: 'Temp' }
      ]
    },
    {
      name: 'value',
      label: 'Valor',
      type: 'textarea' as const,
      required: true,
      placeholder: 'Valor del parámetro',
      rows: 4
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea' as const,
      required: true,
      placeholder: 'Describe el propósito de este parámetro...',
      rows: 3
    }
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = (formData: Record<string, any>) => {
    const systemParamData: SystemParamRequestDto = {
      id: initialData?.id || 0,
      name: formData.name,
      value: formData.value,
      description: formData.description,
      type: formData.type
    }
    onSubmit(systemParamData)
  }

  const initialFormData = initialData ? {
    name: initialData.name,
    value: initialData.value,
    description: initialData.description,
    type: initialData.type === 'prompt' ? 'prompt' : initialData.type
  } : {}

  return (
    <ReusableForm
      fields={fields}
      initialData={initialFormData}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      isLoading={isLoading}
      submitLabel={initialData ? 'Actualizar' : 'Crear'}
      className="system-param-form"
    />
  )
}