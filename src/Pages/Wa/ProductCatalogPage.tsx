import { useMemo } from 'react'
import CustomTable from '@/Components/Common/CustomTable'
import Button from '@/Components/Common/Button'
import IconButton from '@mui/material/IconButton'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import ToggleOnIcon from '@mui/icons-material/ToggleOn'
import ToggleOffIcon from '@mui/icons-material/ToggleOff'
import ProductCatalogFormModal from '@/Components/Wh/ProductCatalogFormModal'
import { useProductCatalog } from '@/Hooks/Wh/useProductCatalog'
import type { ProductCatalogResponse } from '@/Interfaces/Wh/ProductCatalogInterfaces'
import type { Column } from '@/Interfaces/Common/CustomTable'
import '@/Styles/Crm/SystemParamsPage.css'
import { TextField } from '@mui/material'


export default function SystemParamsPage() {
  const {
    productCatalog,
    selectedProductCatalog,
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
    toggleSystemParam,
    globalFilter,
    setGlobalFilter
  } = useProductCatalog()

  const columns: Column<ProductCatalogResponse>[] = useMemo(() => [
    {
        id: "name",
        label: "Nombre",
        minWidth: 80,
    },
    {
        id: "description",
        label: "Descripción",
        minWidth: 110,
        render: row => row.description != null ? row.description : '-'
    },
     {
        id: "createdByName",
        label: "Creado Por",
        minWidth: 110,
        render: row => row.createdByName != null ? row.createdByName : '-'
    },
     {
        id: "createdByName",
        label: "Actualizado Por",
        minWidth: 80,
        render: row => row.createdByName != null ? row.updatedByName : '-'
    },
    {
      id: 'isActive',
      label: 'Estado',
      minWidth: 80,
      render: row => (
        <span className={row.isActive ? 'status status--active' : 'status status--inactive'}>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
        id: "createdAt",
        label: "Creado",
        minWidth: 100,
        render: row => row.createdAt != null ? new Date(row.createdAt!).toLocaleString('es-NI'): '-'
    },
    {
        id: "updatedAt",
        label: "Actualizado",
        minWidth: 80,
        render: row => row.updatedAt != null ? new Date(row.updatedAt!).toLocaleString('es-NI'): '-'
    },
    {
      id: 'actions',
      label: 'Acciones',
      minWidth: 130,
      align: 'center',
      render: row => (
        <>
          <IconButton size="small" onClick={() => openView(row.id)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => openEdit(row.id)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => toggleSystemParam(row.id)}>
            {row.isActive
              ? <ToggleOnIcon fontSize="small" color="success" />
              : <ToggleOffIcon fontSize="small" />
            }
          </IconButton>
        </>
      ),
    },
  ], [openView, openEdit, toggleSystemParam])

  return (
    <div className="sp-page__container">
      <div className="sp-page__header">
        <div className="sp-page__header-content">
          <h1 className="sp-page__title">Catálogo de productos</h1>
          <p className="sp-page__subtitle">Administra tus ctalogos de productos de WhatsApp</p>
        </div>
        <div className="sp-page__btnContainer">
          <Button variant="primary" onClick={openCreate}>
            Nuevo Catálogo
          </Button>
        </div>
      </div>

       <div className='table-contaner__search-filter__container'>
        <TextField
          label="Filtrar"
          variant="outlined"
          size="medium"
          fullWidth
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className='table-contaner__search-filter'
        />
      </div> 

      {/* {error && <p className="sp-page__error">Error: {error. || error}</p>} */}

      <CustomTable<ProductCatalogResponse>
        columns={columns}
        rows={productCatalog}
        count={totalCount}
        page={page - 1}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[5, 10, 20, 50]}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={e => setPageSize(parseInt(e.target.value, 10))}
      />

      <ProductCatalogFormModal
        mode={modalMode}
        isOpen={isModalOpen}
        data={selectedProductCatalog}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  )
}