import { useMemo } from 'react'
import CustomTable from '@/Components/Common/CustomTable'
import Button from '@/Components/Common/Button'
import IconButton from '@mui/material/IconButton'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import ToggleOnIcon from '@mui/icons-material/ToggleOn'
import ToggleOffIcon from '@mui/icons-material/ToggleOff'
import DynamicParamsForm from '@/Components/Crm/DynamicParamForm'
import { useDynamicParam } from '@/Hooks/Crm/useDynamicParam'
import type { DynamicParamResponseDto } from '@/Interfaces/Crm/DynamicParamInterface'
import type { Column } from '@/Interfaces/Common/CustomTable'
import '@/Styles/Crm/SystemParamsPage.css'
import { TextField } from '@mui/material'

export default function DynamicParamPage() {
  const {
    dynamicParams,
    selectedDynamicParam,
    page,
    pageSize,
    totalCount,
    setPage,
    setPageSize,
    modalMode,
    isModalOpen,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    toggleStatus,
    globalFilter,
    setGlobalFilter
  } = useDynamicParam()

  const columns: Column<DynamicParamResponseDto>[] = useMemo(() => [
     {
        id: "name",
        label: "Nombre",
        minWidth: 100,
        render: (row) => row.name,
      },
       {
        id: "description",
        label: "Descripción",
        minWidth: 100,
        render: (row) => row.description,
      },
    { id: 'minValue', label: 'Mínimo ', minWidth: 100,
      render: (row) => row.minValue
     },
     { id: 'maxValue', label: 'Máximo', minWidth: 100,
      render: (row) => row.maxValue
     },
    {
      id: 'value',
      label: 'Valor',
      minWidth: 200,
      render: row => row.value
    },
    {
      id: 'isActive',
      label: 'Estado',
      minWidth: 100,
      render: row => (
        <span className={row.isActive ? 'status status--active' : 'status status--inactive'}>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
        id: 'createdAt',
        label: 'Creado',
        minWidth: 100,
        render: row => new Date(row.createdAt!).toLocaleDateString('es-NI'),
      },
    {
      id: 'actions',
      label: 'Acciones',
      minWidth: 130,
      width: 150,
      align: 'center',
      render: row => (
        <>
          <IconButton size="small" onClick={() => openView(row.publicId)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => openEdit(row.publicId)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => toggleStatus(row.publicId)}>
            {row.isActive
              ? <ToggleOnIcon fontSize="small" color="success" />
              : <ToggleOffIcon fontSize="small" />
            }
          </IconButton>
        </>
      ),
    },
  ], [openView, openEdit, toggleStatus])

  return (
    <div className="sp-page__container">
      <div className="sp-page__header">
        <div className="sp-page__header-content">
          <h1 className="sp-page__title">Parámetros de dashboard en vivo</h1>
          <p className="sp-page__subtitle">Administra tus parámetros del dashboard en vivo</p>
        </div>
        <div className="sp-page__btnContainer">
          <Button variant="primary" onClick={openCreate}>
            Nuevo Parámetro
          </Button>
        </div>
      </div>

      {/* {error && <p className="sp-page__error">Error: {error. || error}</p>} */}

      <div className='table-contaner__search-filter__container'>
        <TextField
          label="Filtrar"
          variant="outlined"
          size="small"
          fullWidth
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className='table-contaner__search-filter'
        />
      </div>
      
      <CustomTable<DynamicParamResponseDto>
        columns={columns}
        rows={dynamicParams}
        count={totalCount}
        page={page - 1}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[20, 30, 50]}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={e => setPageSize(parseInt(e.target.value, 10))}
      />

      <DynamicParamsForm
        mode={modalMode}
        isOpen={isModalOpen}
        data={selectedDynamicParam}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  )
}