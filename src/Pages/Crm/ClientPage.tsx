import { useMemo } from "react"
import {useClasicClient} from '@/Hooks/Crm/useClasicClient'
import type { Column } from "@/Interfaces/Common/CustomTable"
import CustomTable from "@/Components/Common/CustomTable"
import IconButton from "@mui/material/IconButton"
import { MdOutlineEdit } from "react-icons/md";
import "@/Styles/Crm/OpeningHourPage.css"
import "@/Styles/Crm/WorkShiftPage.css"
import '@/Styles/Crm/SystemParamsPage.css'
import { TextField } from "@mui/material"
import type { ClientProcResponse } from "@/Interfaces/Crm/ClientInterface"
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

  const columns = useMemo<Column<ClientProcResponse>[]>(() => [
    {
      id: "name",
      label: "Nombre",
      minWidth: 150,
      render: row => row.name,
    },
    {
      id: "registeredName",
      label: "Nombre Social",
      minWidth: 150,
      render: row => row.registeredName,
    },
    {
      id: "email",
      label: "Correo",
      minWidth: 150,
      render: row => row.email,
    },
    // {
    //   id: "location",
    //   label: "Ubicación",
    //   minWidth: 150,
    //   width: 100,
    //   maxWidth: 100,
    //   render: row => row.location,
    // },
    // {
    //   id: "phone",
    //   label: "Telefono",
    //   minWidth: 150,
    //   render: row => row.phone,
    // },
    // {
    //   id: "workModel",
    //   label: "Modelo de trabajo",
    //   minWidth: 150,
    //   render: row => row.workModel,
    // },
    {
      id: "priority",
      label: "Prioridad",
      minWidth: 100,
      render: row => row.priority,
    },
    // {
    //   id: "supportType",
    //   label: "Tipo soporte",
    //   minWidth: 100,
    //   render: row => row.supportType,
    // },
    {
      id: "enviromentType",
      label: "Entorno",
      minWidth: 100,
      render: row => row.enviromentType,
    },
    {
      id: "isSupportActive",
      label: "Soporte",
      minWidth: 90,
      render: row => (
        <span className={row.isSupportActive ? 'status status--active' : 'status status--inactive'}>
           {row.isSupportActive ? 'Activo' : 'Inactivo'}
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
              navigate(`/clientManagementPanel/${row.clientId}`)
            }>
            <MdOutlineEdit size={16} />
          </IconButton>
        </>
      ),
    },
  ], [navigate])

  return (
    <div className="sp-page__container">
      <div className="sp-page__header">
        <div className="sp-page__header-content">
          <h1 className="sp-page__title">Gestión de clientes</h1>
          <p className="sp-page__subtitle">
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

       <CustomTable<ClientProcResponse>
              columns={columns}
              rows={clients}
              count={totalCount}
              page={page - 1}
              rowsPerPage={pageSize}
              rowsPerPageOptions={[20, 30, 50]}
              onPageChange={(_, newPage) => setPage(newPage + 1)}
              onRowsPerPageChange={e => setPageSize(parseInt(e.target.value, 10))}
            />
    </div>
  )
}