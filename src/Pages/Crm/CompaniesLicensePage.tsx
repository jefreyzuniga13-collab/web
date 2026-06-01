import { useMemo } from 'react'
import { TextField } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import ToggleOnIcon from '@mui/icons-material/ToggleOn'
import ToggleOffIcon from '@mui/icons-material/ToggleOff'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import LockIcon from '@mui/icons-material/Lock'
import LockOpenIcon from '@mui/icons-material/LockOpen'
import PauseCircleIcon from '@mui/icons-material/PauseCircle'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import type { Column } from '@/Interfaces/Common/CustomTable'
import type { CompaniesLicenseProj } from '@/Interfaces/Crm/LicenseInterfaz'
import Button from '@/Components/Common/Button'
import CustomTable from '@/Components/Common/CustomTable'
import CompaniesLicenseModalForm from '@/Components/Crm/CompaniesLicenseModalForm'
import useCompaniesLicenses from '@/Hooks/Crm/License/useCompaniesLicenses'
import '@/Styles/Auth/ContactPage.css'
import { formatDate } from '@/Utils/formatters'

export default function CompaniesLicensePage() {
  const {
    openView,
    openCreate,
    openEdit,
    toggle,
    toggleLocked,
    toggleSuspend,
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
    loading
  } = useCompaniesLicenses()

  const columns: Column<CompaniesLicenseProj>[] = useMemo(() => [
    {
      id: 'companyName',
      label: 'Empresa',
      minWidth: 160,
      render: row => row.companyName
    },
    {
      id: 'licenseName',
      label: 'Licencia',
      minWidth: 160,
      render: row => row.licenseName
    },
    {
      id: 'observation',
      label: 'Observación',
      minWidth: 160,
      render: row => row.observation
    },
    {
      id: 'validFrom',
      label: 'Desde',
      minWidth: 110,
      render: row => formatDate(row.validFrom)
    },
    {
      id: 'validTo',
      label: 'Hasta',
      minWidth: 110,
      render: row => formatDate(row.validTo)
    },
    {
      id: 'isActive',
      label: 'Estado',
      minWidth: 100,
      render: row => (
        <span className={row.isActive ? 'status status--active' : 'status status--inactive'}>
          {row.isActive ? 'Activa' : 'Inactiva'}
        </span>
      )
    },
    {
      id: 'isSuspended',
      label: 'Suspensión',
      minWidth: 120,
      render: row => (
        <span className={row.isSuspended ? 'status status--inactive' : 'status status--active'}>
          {row.isSuspended ? 'Suspendida' : 'Disponible'}
        </span>
      )
    },
    {
      id: 'isLocked',
      label: 'Bloqueo',
      minWidth: 110,
      render: row => (
        <span className={row.isLocked ? 'status status--inactive' : 'status status--active'}>
          {row.isLocked ? 'Bloqueada' : 'Libre'}
        </span>
      )
    },
    {
      id: 'createdByName',
      label: 'Creado Por',
      minWidth: 130,
      render: row => row.createdByName
    },
    {
      id: 'updatedByName',
      label: 'Actualizado Por',
      minWidth: 130,
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
      minWidth: 230,
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

          <IconButton size="medium" onClick={() => toggleLocked(row.id)}>
            {row.isLocked ? (
              <LockIcon fontSize="medium" color="error" />
            ) : (
              <LockOpenIcon fontSize="medium" />
            )}
          </IconButton>

          <IconButton size="medium" onClick={() => toggleSuspend(row.id)}>
            {row.isSuspended ? (
              <PauseCircleIcon fontSize="medium" color="warning" />
            ) : (
              <PlayCircleIcon fontSize="medium" />
            )}
          </IconButton>
        </>
      )
    }
  ], [openView, openEdit, toggle, toggleLocked, toggleSuspend])

  return (
    <div className="contact-page__container">
      <div className="contact-page__header">
        <div className="contact-page__content">
          <h1 className="contact-page__title">Gestión de Licencias por Empresa</h1>
          <p className="contact-page__subtitle">
            Relación de empresas con sus licencias, vigencias, bloqueos y suspensiones.
          </p>
        </div>

        <div className="contact-page__buttons">
          <Button variant="primary" onClick={openCreate} className="contact-page__btn">
            Asignar Licencia
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
          onChange={e => setGlobalFilter(e.target.value)}
          className="table-contaner__search-filter"
        />
      </div>

      {error && <p className="contact-page__error">Error: {error.message}</p>}

      <CustomTable<CompaniesLicenseProj>
        columns={columns}
        rows={data}
        count={totalCount}
        page={page - 1}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[20, 30, 50]}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={e => setPageSize(parseInt(e.target.value, 10))}
      />

      <CompaniesLicenseModalForm
        mode={modalMode}
        isOpen={isModalOpen}
        data={selectedData}
        onClose={closeModal}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </div>
  )
}