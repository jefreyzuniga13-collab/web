
import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { useSystemParams } from '@/Hooks/Setting/useSystemParams'
import SystemParamsTable from '@/Components/Setting/SystemParamsTable'
import { SystemParamModal } from '@/Components/Setting/SystemParamModal'
import SystemParamDetails from '@/Components/Setting/SystemParamDetails'
import DeleteParamDialog from '@/Components/Setting/DeleteParamConfirmation'
import type { SystemParamResponseDto, SystemParamRequestDto } from "@/Interfaces/Auth/AuthInterface"
import '@/Styles/Setting/SystemParamsPage.css'

export const SystemParamsPage: React.FC = () => {
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
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    loadSystemParam()
  }, [loadSystemParam])

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

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    searchParams(searchInput)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchParams(searchInput)
    }
  }

  const handleClearSearch = () => {
    setSearchInput('')
    searchParams('')
  }

  const handleSortChange = (field: 'name' | 'createdAt' | 'updatedAt') => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc'
    sortParams(field, newOrder)
  }

  return (
    <div className="system-params-page">
      <div className="system-params-header">
        <h1>Parámetros del Sistema</h1>
      </div>

      <div className="system-params-controls">
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <div className="search-input-wrapper">
            <div className="search-input-container">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar parámetros..."
                value={searchInput}
                onChange={handleSearchInput}
                onKeyPress={handleKeyPress}
                className="search-input"
              />
            </div>
          </div>
          <div className="search-buttons">
            <button type="submit" className="btn btn-primary">Buscar</button>
            {searchTerm && (
              <button type="button" className="btn btn-tertiary" onClick={handleClearSearch}>
                Limpiar
              </button>
            )}
          </div>
        </form>
        
        <div className="control-buttons">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary filter-btn"
          >
            <Filter size={18} />
            Filtros
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary create-param-btn"
          >
            <Plus size={18} />
            Nuevo Parámetro
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="system-params-filters">
          <div className="filter-group">
            <div className="filter-control">
              <label>Ordenar por:</label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as 'name' | 'createdAt' | 'updatedAt')}
                className="filter-select"
              >
                <option value="name">Nombre</option>
                <option value="createdAt">Fecha de Creación</option>
                <option value="updatedAt">Última Actualización</option>
              </select>
            </div>
            
            <div className="filter-control">
              <label>Orden:</label>
              <select
                value={sortOrder}
                onChange={(e) => sortParams(sortBy, e.target.value as 'asc' | 'desc')}
                className="filter-select"
              >
                <option value="asc">Ascendente</option>
                <option value="desc">Descendente</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="system-params-error">
          Error: {error}
        </div>
      )}

      <SystemParamsTable
        params={systemParams}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        loading={loading}
      />

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

      {isDetailsModalOpen && selectedParam && (
        <SystemParamDetails
          param={selectedParam}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false)
            setSelectedParam(null)
          }}
        />
      )}

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
  )
}

export default SystemParamsPage