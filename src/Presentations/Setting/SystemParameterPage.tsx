
import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useSystemParams } from '@/Hooks/Setting/useSystemParams'
import { SystemParamsTable } from '@/Components/Setting/SystemParamsTable'
import { SystemParamModal } from '@/Components/Setting/SystemParamModal'
import { SystemParamDetails } from '@/Components/Setting/SystemParamDetails'
import { DeleteParamDialog } from '@/Components/Setting/DeleteParamDialog'
import type { SystemParamResponseDto, SystemParamRequestDto } from "@/Interfaces/Auth/AuthInterface"
import '@/Styles/Setting/SystemParamsPage.css'

export const SystemParamsPage: React.FC = () => {
  const {
    systemParams,
    loading,
    error,
    loadSystemParam,
    createSystemParam,
    updateSystemParam,
    deleteSystemParam
  } = useSystemParams()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedParam, setSelectedParam] = useState<SystemParamResponseDto | null>(null)

  useEffect(() => {
    loadSystemParam()
  }, [loadSystemParam])

  const handleCreate = async (data: SystemParamRequestDto) => {
    await createSystemParam(data)
    setIsCreateModalOpen(false)
  }

  const handleEdit = (param: SystemParamResponseDto) => {
    setSelectedParam(param)
    setIsEditModalOpen(true)
  }

  const handleUpdate = async (data: SystemParamRequestDto) => {
    await updateSystemParam(data)
    setIsEditModalOpen(false)
    setSelectedParam(null)
  }

  const handleView = (param: SystemParamResponseDto) => {
    setSelectedParam(param)
    setIsDetailsModalOpen(true)
  }

  const handleDelete = (param: SystemParamResponseDto) => {
    setSelectedParam(param)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (selectedParam) {
      await deleteSystemParam(selectedParam.id)
      setIsDeleteDialogOpen(false)
      setSelectedParam(null)
    }
  }

  return (
    <div className="system-params-page">
      <div className="system-params-page__container">
        {/* Header */}
        <div className="system-params-page__header">
          <div className="system-params-page__title-section">
            <h1 className="system-params-page__title">Parámetros del Sistema</h1>
            <p className="system-params-page__subtitle">
              Gestiona la configuración y parámetros del sistema
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="system-params-page__create-button"
          >
            <Plus size={20} className="system-params-page__create-icon" />
            Nuevo Parámetro
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="system-params-page__error">
            <div className="system-params-page__error-icon">⚠</div>
            <div className="system-params-page__error-content">
              <h3 className="system-params-page__error-title">Error</h3>
              <p className="system-params-page__error-message">{error}</p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="system-params-page__table-container">
          <div className="system-params-page__table-header">
            <h2 className="system-params-page__table-title">
              Lista de Parámetros ({systemParams.length})
            </h2>
          </div>
          <SystemParamsTable
            params={systemParams}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            loading={loading}
          />
        </div>

        {/* Modals */}
        <SystemParamModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreate}
          title="Crear Nuevo Parámetro"
          isLoading={loading}
        />

        <SystemParamModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedParam(null)
          }}
          onSubmit={handleUpdate}
          initialData={selectedParam || undefined}
          title="Editar Parámetro"
          isLoading={loading}
        />

        <SystemParamDetails
          param={selectedParam}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false)
            setSelectedParam(null)
          }}
        />

        <DeleteParamDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false)
            setSelectedParam(null)
          }}
          onConfirm={handleConfirmDelete}
          param={selectedParam}
        />
      </div>
    </div>
  )
}

export default SystemParamsPage