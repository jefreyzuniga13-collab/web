import { useMemo } from "react"
import type { ServiceResponseDto } from "@/Interfaces/Crm/ServiceInterface"
import type { Column } from "@/Interfaces/Common/CustomTable"
import Button from "@/Components/Common/Button"
import CustomTable from "@/Components/Common/CustomTable"
import IconButton from "@mui/material/IconButton"
import VisibilityIcon from "@mui/icons-material/Visibility"
import ToggleOffIcon from "@mui/icons-material/ToggleOff"
import ToggleOnIcon from "@mui/icons-material/ToggleOn"
import { EditIcon } from "lucide-react"
import "@/Styles/Setting/OpeningHourPage.css"
import "@/Styles/Setting/WorkShiftPage.css"
// import { format, parseISO } from "date-fns"
import { TextField } from "@mui/material"
import { useService } from "@/Hooks/Crm/useService"
// import Spinner from "@/Components/Common/Spinner"
import ServicioModal from  '@/Components/Crm/ServicioModal'

export default function WorkShiftPage() {
  const {
    services,
    // loading,
    error,
    page,
    pageSize,
    totalCount,
    setPage,
    setPageSize,
    toggleStatus,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    isModalOpen,
    modalMode,
    selectedService,
    globalFilter,
    setGlobalFilter
  } = useService()

  const columns = useMemo<Column<ServiceResponseDto>[]>(() => [
    {
      id: "name",
      label: "Nonbre",
      minWidth: 150,
      render: row => row.name,
    },
    {
      id: "description",
      label: "Descripción",
      minWidth: 150,
      render: row => row.description,
    },
    {
      id: "isActive",
      label: "Activo",
      minWidth: 90,
      render: row => (
        <span className={row.isActive ? 'status status--active' : 'status status--inactive'}>
           {row.isActive ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      id: "createdByName",
      label: "Creado por",
      minWidth: 150,
      render: row => row.createdByName,
    },
    {
      id: "updatedByName",
        label: "Ult. Actualizado Por",
      minWidth: 150,
      render: row => row.updatedByName,
    },
    // {
    //   id: "createdAt",
    //   label: "Creado",
    //   minWidth: 110,
    //   render: row => {
    //     if(!row.createdAt) return '-';
    //     const date = parseISO(row.createdAt);
    //     return <span>{format(date, 'dd/MM/yyyy')}</span>
    //   }
    // },
    // {
    //   id: "updatedAt",
    //   label: "Actualizado",
    //   minWidth: 110,
    //   render: row => {
    //     if(!row.updatedAt) return '-';
    //     const date = parseISO(row.updatedAt)
    //     return <span>{format(date, 'dd/MM/yyyy')}</span>
    //   }
    // },
    {
      id: "actions",
      label: "Acciones",
      minWidth: 130,
      align: "center",
      render: row => (
        <>
          <IconButton size="small" onClick={() => openView(row.id)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => openEdit(row.id)}>
            <EditIcon size={16} />
          </IconButton>
          <IconButton size="small" onClick={() => toggleStatus(row.id)}>
            {row.isActive ? (
              <ToggleOnIcon fontSize="small" color="success"/>
            ) : (
              <ToggleOffIcon fontSize="small" />
            )}
          </IconButton>
        </>
      ),
    },
  ], [openView, openEdit, toggleStatus])

  return (
    <div className="ws-page__container">
      <div className="ws-page__header">
        <div className="ws-page__header-content">
          <h1 className="ws-page__title">Gestión Servicios</h1>
          <p className="ws-page__subtitle">
            Administración de los servicios para hojas de trabajo
          </p>
        </div>
        <div className="ws-page__btnContainer">
          <Button variant="primary" onClick={openCreate} className="ws-page__btn">
          Nuevo Servicio
        </Button>
        </div>
      </div>

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
      {/* {loading && <div className="ws-page__loading"><Spinner/></div>} */}
      {error && <p className="ws-page__error">Error: {error.message}</p>}

      <CustomTable<ServiceResponseDto>
        columns={columns}
        rows={services}
        count={totalCount}
        page={page - 1}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[20, 30, 50]}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={e => setPageSize(parseInt(e.target.value, 5))}
      />

        <ServicioModal
          mode={modalMode}
          isOpen={isModalOpen}
          data={selectedService}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
    </div>
  )
}