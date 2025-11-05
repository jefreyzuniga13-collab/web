import { useMemo } from "react"
import {useClasicClient} from '@/Hooks/Crm/useClasicClient'
import type { Column } from "@/Interfaces/Common/CustomTable"
import CustomTable from "@/Components/Common/CustomTable"
import IconButton from "@mui/material/IconButton"
import { EditIcon } from "lucide-react"
import "@/Styles/Setting/OpeningHourPage.css"
import "@/Styles/Setting/WorkShiftPage.css"
import { TextField } from "@mui/material"
import type { ClientResponseDTO } from "@/Interfaces/Crm/ClientInterface"
import {useNavigate} from 'react-router-dom'

export default function ClientPage() {
  const {
    clients,
    error,
    page,
    pageSize,
    totalCount,
    setPage,
    setPageSize,
    globalFilter,
    setGlobalFilter
  } = useClasicClient()

  const navigate = useNavigate();

  const columns = useMemo<Column<ClientResponseDTO>[]>(() => [
    {
      id: "name",
      label: "Nombre",
      minWidth: 150,
      render: row => row.name,
    },
    {
      id: "workModel",
      label: "Modelo de trabajo",
      minWidth: 150,
      render: row => row.workModel,
    },
    {
      id: "priority",
      label: "Prioridad",
      minWidth: 150,
      render: row => row.priority,
    },
    {
      id: "supportType",
      label: "Tipo soporte",
      minWidth: 150,
      render: row => row.supportType,
    },
    {
      id: "isSupportActive",
      label: "Soporte",
      minWidth: 90,
      render: row => (
        <span className={row.isSupportActive ? 'status status--active' : 'status status--inactive'}>
           {row.isActive ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      id: "actions",
      label: "Acciones",
      minWidth: 130,
      align: "center",
      render: row => (
        <>
          <IconButton size="small" onClick={
            () => 
              navigate(`/clientManagementPanel/${row.id}`)
            }>
            <EditIcon size={16} />
          </IconButton>
        </>
      ),
    },
  ], [navigate])

  return (
    <div className="ws-page__container">
      <div className="ws-page__header">
        <div className="ws-page__header-content">
          <h1 className="ws-page__title">Gestión Asignación de Turnos</h1>
          <p className="ws-page__subtitle">
            Administración de clientes PCG - INNOVA
          </p>
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
      {error && <p className="ws-page__error">Error: {error.message}</p>}

      <CustomTable<ClientResponseDTO>
        columns={columns}
        rows={clients}
        count={totalCount}
        page={page - 1}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[20, 30, 50]}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={e => setPageSize(parseInt(e.target.value, 5))}
      />
    </div>
  )
}