import { useMemo } from 'react'
import { TextField, Tooltip } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import type { Column } from '@/Interfaces/Common/CustomTable'
import type { CompaniesLicenseProj } from '@/Interfaces/Crm/LicenseInterfaz'
import Button from '@/Components/Common/Button'
import CustomTable from '@/Components/Common/CustomTable'
import CompaniesLicenseModalForm from '@/Components/Crm/CompaniesLicenseModalForm'
import useCompaniesLicenses from '@/Hooks/Crm/License/useCompaniesLicenses'
import '@/Styles/Auth/ContactPage.css'
import { formatDate } from '@/Utils/formatters'

const getStatusClass = (statusName: string, isExpired: boolean) => {
  if (isExpired) return 'status status--inactive'

  const normalized = statusName.toLowerCase()

  if (normalized.includes('activa')) return 'status status--active'
  if (normalized.includes('suspendida')) return 'status status--inactive'
  if (normalized.includes('bloqueada')) return 'status status--inactive'
  if (normalized.includes('vencida')) return 'status status--inactive'
  if (normalized.includes('cancelada')) return 'status status--inactive'

  return 'status'
}

export default function CompaniesLicensePage() {
  const {
    openView,
    openCreate,
    openEdit,
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
    companyLicenseStatuses,
    changeStatus
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
      id: 'statusName',
      label: 'Estado',
      minWidth: 170,
      render: row => (
        <span className={getStatusClass(row.statusName, row.isExpired)}>
          {row.isExpired ? 'Licencia Vencida' : row.statusName}
        </span>
      )
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
      id: 'remainingDays',
      label: 'Días restantes',
      minWidth: 120,
      render: row => row.remainingDays
    },
    {
      id: 'observation',
      label: 'Observación',
      minWidth: 160,
      render: row => row.observation
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
      minWidth: 280,
      render: row => (
        <>
          <IconButton size="medium" onClick={() => openView(row)}>
            <Tooltip title="Ver">
              <VisibilityIcon fontSize="medium" />
            </Tooltip>
          </IconButton>

          <IconButton size="medium" onClick={() => openEdit(row)}>
            <Tooltip title="Editar">
              <EditIcon fontSize="medium" />
            </Tooltip>
          </IconButton>

          <select
            value={row.statusId}
            onChange={e => changeStatus(row.id, Number(e.target.value))}
            className="table-status-select"
            disabled={loading || companyLicenseStatuses.length === 0}
          >
            {companyLicenseStatuses.map(status => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
        </>
      )
    }
  ], [openView, openEdit, companyLicenseStatuses, changeStatus, loading])

  return (
    <div className="contact-page__container">
      <div className="contact-page__header">
        <div className="contact-page__content">
          <h1 className="contact-page__title">Gestión de Licencias por Empresa</h1>
          <p className="contact-page__subtitle">
            Relación de empresas con sus licencias, vigencias y estados.
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