import { useMemo } from 'react'
import CustomTable from '@/Components/Common/CustomTable'
import Button from '@/Components/Common/Button'
import IconButton from '@mui/material/IconButton'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import ToggleOnIcon from '@mui/icons-material/ToggleOn'
import ToggleOffIcon from '@mui/icons-material/ToggleOff'
import TemplateCategoryModal from '@/Components/Chat/TemplateCategoryModal'
import { useTemplateCategory } from '@/Hooks/Chat/useTemplateCategory'
import type { TemplateCategoryResponseDto } from '@/Interfaces/Chat/TemplateCategoryInterfaces'
import type { Column } from '@/Interfaces/Common/CustomTable'
import '@/Styles/Setting/SystemParamsPage.css'

export default function SystemParamsPage() {
  const {
    templateCategories,
    selectedTemplateCategory,
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
  } = useTemplateCategory()

  const columns: Column<TemplateCategoryResponseDto>[] = useMemo(() => [
     {
        id: "name",
        label: "Nombre",
        minWidth: 100,
        type: "text"
      },
       {
        id: "description",
        label: "Descriptión",
        minWidth: 100,
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
        id: "createdByName",
        label: "Creado Por",
        minWidth: 120,
      },
      {
        id: "updatedByName",
        label: "Ult. Actualizado Por",
        minWidth: 120,
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
          <IconButton size="small" onClick={() => toggleStatus(row.id)}>
            {row.isActive
              ? <ToggleOnIcon fontSize="small" color="success" />
              : <ToggleOffIcon fontSize="small" />
            }
          </IconButton>
        </>
      ),
    },
  ], [openView, openEdit, templateCategories])

  return (
    <div className="sp-page__container">
      <div className="sp-page__header">
        <div className="sp-page__header-content">
          <h1 className="sp-page__title">Categorias de plantillas</h1>
          <p className="sp-page__subtitle">Administra categories de plantillas</p>
        </div>
        <div className="sp-page__btnContainer">
          <Button variant="primary" onClick={openCreate}>
            Nuevo categoria
          </Button>
        </div>
      </div>


      <CustomTable<TemplateCategoryResponseDto>
        columns={columns}
        rows={templateCategories}
        count={totalCount}
        page={page - 1}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[5, 10, 20, 50]}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={e => setPageSize(parseInt(e.target.value, 10))}
      />

      <TemplateCategoryModal
        mode={modalMode}
        isOpen={isModalOpen}
        data={selectedTemplateCategory}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  )
}