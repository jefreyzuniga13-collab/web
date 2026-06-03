import type { Column } from '@/Interfaces/Common/CustomTable'
import IconButton from '@mui/material/IconButton'
import ToggleOnIcon from '@mui/icons-material/ToggleOn'
import ToggleOffIcon from '@mui/icons-material/ToggleOff'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import { useMemo } from 'react'
import { TextField } from '@mui/material'
import Button from '@/Components/Common/Button'
import CustomTable from '@/Components/Common/CustomTable'
import LicenseModalForm from '@/Components/Crm/LicenseModalForm'
import type { LicenseProj } from '@/Interfaces/Crm/LicenseInterfaz'
import useLicenses from '@/Hooks/Crm/License/useLicenses'
import '@/Styles/Auth/ContactPage.css'

const normalizeBenefits = (benefits: unknown): string[] => {
  if (Array.isArray(benefits)) return benefits

  if (typeof benefits === 'string') {
    try {
      const parsed = JSON.parse(benefits)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  return []
}

const formatDate = (value?: string): string => {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('es-NI')
}

export default function LicensePage() {
  const {
    openView,
    openCreate,
    openEdit,
    toggle,
    error,
    data,
    page,
    pageSize,
    totalCount,
    setPage,
    setPageSize,
    modalMode,
    isModalOpen,
    selectedData,
    closeModal,
    handleSubmit,
    globalFilter,
    setGlobalFilter,
    loading,
    licensePeriods
  } = useLicenses()

  const columns: Column<LicenseProj>[] = useMemo(() => [
    {
      id: 'name',
      label: 'Nombre',
      minWidth: 100,
      render: row => row.name
    },
    {
      id: 'description',
      label: 'Descripción',
      minWidth: 140,
      render: row => row.description
    },
    {
      id: 'benefits',
      label: 'Beneficios',
      minWidth: 160,
      render: row => {
        const benefits = normalizeBenefits(row.benefits)
        return benefits.length ? benefits.join(', ') : ''
      }
    },
    {
      id: 'licensePeriodName',
      label: 'Periodo',
      minWidth: 100,
      render: row => row.isRecurrent ? row.licensePeriodName || '' : 'No recurrente'
    },
    {
      id: 'licensePeriodMonths',
      label: 'Meses',
      minWidth: 80,
      render: row => row.isRecurrent ? row.licensePeriodMonths ?? '' : ''
    },
    {
      id: 'isRecurrent',
      label: 'Recurrente',
      minWidth: 100,
      render: row => (
        <span className={row.isRecurrent ? 'status status--active' : 'status status--inactive'}>
          {row.isRecurrent ? 'Sí' : 'No'}
        </span>
      )
    },
    {
      id: 'isActive',
      label: 'Estado',
      minWidth: 100,
      render: row => (
        <span className={row.isActive ? 'status status--active' : 'status status--inactive'}>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      id: 'createdByName',
      label: 'Creado Por',
      minWidth: 120,
      render: row => row.createdByName
    },
    {
      id: 'updatedByName',
      label: 'Actualizado Por',
      minWidth: 120,
      render: row => row.updatedByName
    },
    {
      id: 'createdAt',
      label: 'Creado',
      minWidth: 110,
      render: row => formatDate(row.createdAt)
    },
    {
      id: 'updatedAt',
      label: 'Actualizado',
      minWidth: 110,
      render: row => formatDate(row.updatedAt)
    },
    {
      id: 'actions',
      label: 'Acciones',
      minWidth: 150,
      render: row => (
        <>
          <IconButton size="medium" onClick={() => openView(row)}>
            <VisibilityIcon fontSize="medium" />
          </IconButton>

          <IconButton size="medium" onClick={() => openEdit(row)}>
            <EditIcon fontSize="medium" />
          </IconButton>

          <IconButton size="medium" onClick={() => toggle(row.id)}>
            {row.isActive ? (
              <ToggleOnIcon fontSize="medium" color="success" />
            ) : (
              <ToggleOffIcon fontSize="medium" />
            )}
          </IconButton>
        </>
      )
    }
  ], [openView, openEdit, toggle])

  return (
    <div className="contact-page__container">
      <div className="contact-page__header">
        <div className="contact-page__content">
          <h1 className="contact-page__title">Gestión de Catálogo de Licencias</h1>
          <p className="contact-page__subtitle">
            Listado del catálogo de licencias.
          </p>
        </div>

        <div className="contact-page__buttons">
          <Button variant="primary" onClick={openCreate} className="contact-page__btn">
            Nueva Licencia
          </Button>
        </div>
      </div>

      <div className="table-contaner__search-filter__container">
        <TextField
          label="Filtrar"
          variant="outlined"
          size="medium"
          fullWidth
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="table-contaner__search-filter"
        />
      </div>

      {error && <p className="contact-page__error">Error: {error.message}</p>}

      <CustomTable<LicenseProj>
        columns={columns}
        rows={data}
        count={totalCount}
        page={page - 1}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[20, 30, 50]}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={e => setPageSize(parseInt(e.target.value, 10))}
      />

      <LicenseModalForm
        mode={modalMode}
        isOpen={isModalOpen}
        data={selectedData}
        licensePeriods={licensePeriods}
        onClose={closeModal}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  )
}