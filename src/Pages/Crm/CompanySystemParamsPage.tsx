import { useMemo } from 'react'
import { TextField, MenuItem, IconButton } from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import ToggleOnIcon from '@mui/icons-material/ToggleOn'
import ToggleOffIcon from '@mui/icons-material/ToggleOff'
import Button from '@/Components/Common/Button'
import CustomTable from '@/Components/Common/CustomTable'
import type { Column } from '@/Interfaces/Common/CustomTable'
import { metaChannels, type CompanySystemParamProj } from '@/Interfaces/Crm/CompanySystemParams'
import { useCompanySystemParams } from '@/Hooks/Crm/useCompanySystemParams'
import type { NameTranslation } from '@/Interfaces/Crm/OpeningHour'
import { nameTranslations } from '@/Utils/Translation/nameTranslations'
import CompanySystemParamForm from '@/Components/Crm/CompanySystemParamForm'
import '@/Styles/Crm/CompanySystemParamsPage.css'

export default function CompanySystemParamsPage() {
const {
  items,
  companies,
  systemParams,
  // loading,
  error,
  page,
  pageSize,
  totalCount,
  globalFilter,
  companyId,
  selectedItem,
  modalMode,
  isModalOpen,
  setPage,
  setPageSize,
  setGlobalFilter,
  setCompanyId,
  openCreate,
  openEdit,
  openView,
  closeModal,
  handleSubmit,
  toggle,
} = useCompanySystemParams()

  const getParamName = (name: string) => {
    return nameTranslations[name as NameTranslation] ?? name
  }

  const columns: Column<CompanySystemParamProj>[] = useMemo(
    () => [
      {
        id: 'companyName',
        label: 'Empresa',
        minWidth: 150,
        render: (row) => row.companyName || '---',
      },
      {
        id: 'systemParamName',
        label: 'Parámetro',
        minWidth: 180,
        render: (row) => getParamName(row.systemParamName),
      },
      {
        id: 'metaChannelName',
        label: 'Canal',
        minWidth: 120,
        render: (row) => row.metaChannelName || '---',
      },
      {
        id: 'value',
        label: 'Valor',
        minWidth: 250,
        render: (row) => (
          <span title={row.value || ''}>
            {row.value ? (row.value.length > 60 ? `${row.value.slice(0, 60)}...` : row.value) : '---'}
          </span>
        ),
      },
      {
        id: 'isActive',
        label: 'Estado',
        minWidth: 100,
        render: (row) => (
          <span className={row.isActive ? 'status status--active' : 'status status--inactive'}>
            {row.isActive ? 'Activo' : 'Inactivo'}
          </span>
        ),
      },
      {
        id: 'createdByName',
        label: 'Creado por',
        minWidth: 140,
        render: (row) => row.createdByName || '---',
      },
      {
        id: 'updatedByName',
        label: 'Actualizado por',
        minWidth: 140,
        render: (row) => row.updatedByName || '---',
      },
      {
        id: 'actions',
        label: 'Acciones',
        minWidth: 150,
        width: 160,
        align: 'center',
        render: (row) => (
          <>
            <IconButton size="small" onClick={() => openView(row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>

            <IconButton size="small" onClick={() => openEdit(row)}>
              <EditIcon fontSize="small" />
            </IconButton>

            <IconButton size="small" onClick={() => toggle(row)}>
              {row.isActive ? (
                <ToggleOnIcon fontSize="small" color="success" />
              ) : (
                <ToggleOffIcon fontSize="small" />
              )}
            </IconButton>
          </>
        ),
      },
    ],
    [openView, openEdit, toggle]
  )

  return (
    <div className="sp-page__container">
      <div className="sp-page__header">
        <div className="sp-page__header-content">
          <h1 className="sp-page__title">Parámetros por Empresa</h1>
          <p className="sp-page__subtitle">
            Administra los valores de parámetros por empresa
          </p>
        </div>

        <div className="sp-page__btnContainer">
          <Button variant="primary" onClick={openCreate}>
            Nuevo Parámetro
          </Button>
        </div>
      </div>

      {error && <p className="sp-page__error">{error.message}</p>}

      <div className="table-contaner__search-filter__container">
        <TextField
          label="Buscar"
          variant="outlined"
          size="medium"
          fullWidth
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />

        <TextField
          label="Empresa"
          variant="outlined"
          size="small"
          select
          fullWidth
          value={companyId ?? ''}
          onChange={(e) => setCompanyId(e.target.value ? Number(e.target.value) : null)}
        >
          <MenuItem value="">Todas</MenuItem>
          {companies.map((company) => (
            <MenuItem key={company.companyId ?? 0} value={company.companyId ?? 0}>
              {company.name}
            </MenuItem>
          ))}
        </TextField>
      </div>

      <CustomTable<CompanySystemParamProj>
        columns={columns}
        rows={items}
        count={totalCount}
        page={page - 1}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[20, 30, 50]}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={e => setPageSize(parseInt(e.target.value, 10))}
      />

        <CompanySystemParamForm
          mode={modalMode}
          isOpen={isModalOpen}
          data={selectedItem}
          companies={companies}
          systemParams={systemParams}
          metaChannels={metaChannels}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
    </div>
  )
}