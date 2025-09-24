import useContact from "@/Hooks/Contact/useContact";
import type { ContactLogInterface } from "@/Interfaces/Contact/ContactInterface";
import type { Column } from '@/Interfaces/Common/CustomTable';
import IconButton from "@mui/material/IconButton";
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { useMemo } from "react";
import EditIcon from '@mui/icons-material/Edit';
import Button from "@/Components/Common/Button";
import CustomTable from "@/Components/Common/CustomTable";
import '@/Styles/Contact/ContactPage.css';
import ContactModalForm from "@/Components/Contact/ContactModalForm";
import { TextField } from "@mui/material";

export default function ContactPage() {
  const {
    openView,
    openCreate,
    openEdit,
    toggle,
    verify,
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
    setGlobalFilter
  } = useContact();

  const columns: Column<ContactLogInterface>[] = useMemo(() => [
    {
      id: 'fullName',
      label: 'Nombre Completo',
      minWidth: 80,
      render: row => row.fullName ?? row.waName
    },
    {
      id: 'clienteCodigo',
      label: 'Fuente',
      minWidth: 100,
      render: row=>{
        if(row.clienteCodigo == null) return "No espesificado"
        if(row.clienteCodigo as number < 50000) return "INNOVA"
        if(row.clienteCodigo as number >= 50000) return "PC GROUP"
      }
    },
    {
      id: 'companyName',
      label: 'Nombre Empresa',
      minWidth: 80,
      render: row => row.companyName ?? '-'
    },
    {
      id: 'phone',
      label: 'Teléfono',
      minWidth: 70,
      render: row => {
        const phone = row.phone?.toString().replace(/\D/g, ''); // quitar caracteres no numéricos
        if (!phone) return '-';

        // Si ya comienza con 505
        if (phone.startsWith('505')) {
          return `505-${phone.slice(3)}`;
        }

        // Si no tiene 505, solo agregarlo
        return `505-${phone}`;
      }
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
      id: 'isVerified',
      label: 'Verificado',
      minWidth: 100,
      render: row => (
        <span className={row.isVerified ? 'status status--active' : 'status status--inactive'}>
          {row.isVerified ? 'Sí' : 'No'}
        </span>
      )
    },
    {
      id: 'status',
      label: 'Estado',
      minWidth: 120,
      render: row => {
        switch (row.status) {
          case 'New': return 'Nuevo';
          case 'PendingApproval': return 'Pendiente Aprobación';
          case 'Approved': return 'Aprobado';
          case 'Rejected': return 'Rechazado';
          case 'AwaitingFullName': return 'Esperando Nombre Completo';
          case 'AwaitingIdCard': return 'Esperando Cédula';
          case 'Completed': return 'Completado';
          default: return '-';
        }
      }
    },
    {
      id: 'createdAt',
      label: 'Creado',
      minWidth: 110,
      render: row => new Date(row.createdAt!).toLocaleDateString('es-NI')
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
          <IconButton size="medium" onClick={() => toggle(row.id as number)}>
            {row.isActive ? (
              <ToggleOnIcon fontSize="medium" color="success" />
            ) : (
              <ToggleOffIcon fontSize="medium" />
            )}
          </IconButton>
          <IconButton size="medium" onClick={() => verify(row.phone)}>
            {row.isVerified ? (
              <CheckBoxIcon fontSize="medium" color="success" />
            ) : (
              <CheckBoxOutlineBlankIcon fontSize="medium" />
            )}
          </IconButton>
        </>
      )
    }
  ], [openView, openEdit, toggle, verify]);

  return (
    <div className="contact-page__container">
      <div className="contact-page__header">
        <div className="contact-page__content">
          <h1 className="contact-page__title">Gestión de Contactos</h1>
          <p className="contact-page__subtitle">
            Listado de contactos verificados y no verificados que se han puesto en contacto.
          </p>
        </div>
        <div className="contact-page__buttons">
          <Button variant="primary" onClick={openCreate} className="contact-page__btn">
            Nuevo Contacto
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
      {error && <p className="contact-page__error">Error: {error.message}</p>}


      <CustomTable<ContactLogInterface>
        columns={columns}
        rows={data}
        count={totalCount}
        page={page - 1}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[20, 30, 50]}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={e => setPageSize(parseInt(e.target.value, 10))}
      />

      <ContactModalForm
        mode={modalMode}
        isOpen={isModalOpen}
        data={selectedData}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}