
import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { useSystemParams } from '@/Hooks/Setting/useSystemParams'
import { SystemParamsTable } from '@/Components/Setting/SystemParamsTable'
import { SystemParamModal } from '@/Components/Setting/SystemParamModal'
import { SystemParamDetails } from '@/Components/Setting/SystemParamDetails'
import { DeleteParamDialog } from '@/Components/Setting/DeleteParamDialog'
import type { SystemParamResponseDto, SystemParamRequestDto } from "@/Interfaces/Auth/AuthInterface"
import '@/Styles/Setting/SystemParamsPage.css'

export const SystemParamsPage: React.FC = () => {
  // ... keep existing code (all state and hook logic)
  const {
    systemParams,
    loading,
    error,
    searchTerm,
    sortBy,
    sortOrder,
    loadSystemParam,
    searchParams,
    sortParams,
    createSystemParam,
    updateSystemParam,
    toggleSystemParam,
    deleteSystemParam
  } = useSystemParams()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false)
  const [selectedParam, setSelectedParam] = useState<SystemParamResponseDto | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadSystemParam()
  }, [loadSystemParam])

  // ... keep existing code (all handler functions)
  const handleCreate = async (data: SystemParamRequestDto) => {
    const result = await createSystemParam(data)
    if (result) {
      setIsCreateModalOpen(false)
    }
  }

  const handleEdit = (param: SystemParamResponseDto) => {
    setSelectedParam(param)
    setIsEditModalOpen(true)
  }

  const handleUpdate = async (data: SystemParamRequestDto) => {
    const result = await updateSystemParam(data)
    if (result) {
      setIsEditModalOpen(false)
      setSelectedParam(null)
    }
  }

  const handleView = (param: SystemParamResponseDto) => {
    setSelectedParam(param)
    setIsDetailsModalOpen(true)
  }

  const handleDelete = (param: SystemParamResponseDto) => {
    setSelectedParam(param)
    if (param.isActive) {
      setIsToggleDialogOpen(true)
    } else {
      setIsDeleteDialogOpen(true)
    }
  }

  const handleConfirmDelete = async () => {
    if (selectedParam) {
      const result = await deleteSystemParam(selectedParam.id)
      if (result) {
        setIsDeleteDialogOpen(false)
        setSelectedParam(null)
      }
    }
  }

  const handleConfirmToggle = async () => {
    if (selectedParam) {
      const result = await toggleSystemParam(selectedParam.id)
      if (result) {
        setIsToggleDialogOpen(false)
        setSelectedParam(null)
      }
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    searchParams(e.target.value)
  }

  const handleSortChange = (field: 'name' | 'createdAt' | 'updatedAt') => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc'
    sortParams(field, newOrder)
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

        {/* Search and Filters */}
        <div className="system-params-page__controls">
          <div className="system-params-page__search">
            <Search size={20} className="system-params-page__search-icon" />
            <input
              type="text"
              placeholder="Buscar parámetros..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="system-params-page__search-input"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="system-params-page__filter-button"
          >
            <Filter size={20} />
            Filtros
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="system-params-page__filters">
            <div className="system-params-page__filter-group">
              <label className="system-params-page__filter-label">Ordenar por:</label>
              <select
                value={sortBy}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onChange={(e) => handleSortChange(e.target.value as any)}
                className="system-params-page__filter-select"
              >
                <option value="name">Nombre</option>
                <option value="createdAt">Fecha de Creación</option>
                <option value="updatedAt">Última Actualización</option>
              </select>
            </div>
            
            <div className="system-params-page__filter-group">
              <label className="system-params-page__filter-label">Orden:</label>
              <select
                value={sortOrder}
                onChange={(e) => sortParams(sortBy, e.target.value as 'asc' | 'desc')}
                className="system-params-page__filter-select"
              >
                <option value="asc">Ascendente</option>
                <option value="desc">Descendente</option>
              </select>
            </div>
          </div>
        )}

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
          {/* <div className="system-params-page__table-header">
            <h2 className="system-params-page__table-title">
              Lista de Parámetros ({systemParams.length})
            </h2>
          </div> */}
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

        <DeleteParamDialog
          isOpen={isToggleDialogOpen}
          onClose={() => {
            setIsToggleDialogOpen(false)
            setSelectedParam(null)
          }}
          onConfirm={handleConfirmToggle}
          param={selectedParam}
          isToggle={true}
        />
      </div>
    </div>
  )
}

export default SystemParamsPage