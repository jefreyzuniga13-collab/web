import useContact from "@/Hooks/Auth/useContact";
import type { ContactLogInterface } from "@/Interfaces/Auth/ContactInterface";
import type { Column } from '@/Interfaces/Common/CustomTable';
import IconButton from "@mui/material/IconButton";
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import EditIcon from '@mui/icons-material/Edit';
import PersonPinCircleIcon from '@mui/icons-material/PersonPinCircle';
import { selectIsCallCenter } from "@/Context/Slices/Auth/authSlice";
import CallCenterClienteModal from "@/Components/Crm/CallCenterClienteModal";
import Button from "@/Components/Common/Button";
import CustomTable from "@/Components/Common/CustomTable";
import '@/Styles/Auth/ContactPage.css';
import ContactModalForm from "@/Components/Auth/ContactModalForm";
import SearchFilter from "@/Components/Common/SearchFilter";
import { ImWhatsapp } from "react-icons/im";
import { RiMessengerLine } from "react-icons/ri";
import { FaInstagram } from "react-icons/fa6";
import { getClassificationCode } from "@/Utils/contactClassification";

export default function ContactPage() {
  const {
    openView,
    openCreate,
    openEdit,
    toggle,
    verify,
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
    loadingList,
    refetchPage
  } = useContact();

  const isCallCenter = useSelector(selectIsCallCenter);
  const [clienteContactId, setClienteContactId] = useState<number | null>(null);

  const columns: Column<ContactLogInterface>[] = useMemo(() => {
    const lista: Column<ContactLogInterface>[] = [
    {
      id: 'fullName',
      label: 'Nombre Completo',
      minWidth: 80,
      render: row => row.fullName ?? row.waName
    },
    {
        id: "metaChannelId",
        label: "Red Social",
        minWidth: 30,
        render: (row) => row.metaChannelId == 1 ? <ImWhatsapp className="whatsapp-icon" style={{ verticalAlign: 'middle' }} />
        : row.metaChannelId == 2 ? <RiMessengerLine size={18} className="messenger-icon"/> 
        : <FaInstagram size={16} className="instagram-icon"/>,
      },
     {
      id: 'contactClassificationName',
      label: 'Tipificación',
      minWidth: 80,
      render: row => {
        const name = row.contactClassificationName?.trim()
        if (!name) return "-"

        const code = getClassificationCode(
          row.contactClassificationBgColor,
          name
        )

        return (
          <span className={`contact-page__classification ${code}`}>
            {name}
          </span>
        )
      }
    },
    {
      id: 'clienteCodigo',
      label: 'Fuente',
      minWidth: 100,
      hideBelow: 'md',
      render: row=>{
        if(row.clienteCodigo == null) return "No específicado"
        if(Number(row.clienteCodigo)  < 50000) return "INNOVA"
        if(Number(row.clienteCodigo) >= 50000) return "PC GROUP"
      }
    },
    {
      id: 'companyName',
      label: 'Nombre Empresa',
      minWidth: 80,
      hideBelow: 'lg',
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
      hideBelow: 'md',
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
      hideBelow: 'lg',
      render: row => new Date(row.createdAt!).toLocaleDateString('es-NI')
    },
    {
      id: 'actions',
      label: 'Acciones',
      minWidth: 150,
      render: row => (
        <>
          <IconButton size="small" onClick={() => openView(row)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => openEdit(row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => toggle(row.id as number)}>
            {row.isActive ? (
              <ToggleOnIcon fontSize="small" color="success" />
            ) : (
              <ToggleOffIcon fontSize="small" />
            )}
          </IconButton>
          {isCallCenter && (
            <IconButton
              size="small"
              title={row.codClientePcg ? `Gestionar Cliente ${row.codClientePcg}` : "Gestionar Cliente"}
              onClick={() => setClienteContactId(row.id)}
            >
              <PersonPinCircleIcon fontSize="small" color={row.codClientePcg?.trim() ? "success" : "disabled"} />
            </IconButton>
          )}
          {/* <IconButton size="medium" onClick={() => verify(row.id)}>
            {row.isVerified ? (
              <CheckBoxIcon fontSize="medium" color="success" />
            ) : (
              <CheckBoxOutlineBlankIcon fontSize="medium" />
            )}
          </IconButton> */}
        </>
      )
    }
  ];

    if (!isCallCenter) return lista;

    const clienteErp: Column<ContactLogInterface> = {
      id: 'codClientePcg',
      label: 'Cliente Vinculado',
      minWidth: 100,
      render: row => row.codClientePcg?.trim()
        ? <span className="status status--active">{row.codClientePcg}</span>
        : <span className="status status--neutral">Sin vincular</span>
    };

    return lista
      .filter(col => col.id !== 'clienteCodigo' && col.id !== 'companyName')
      .flatMap(col => (col.id === 'phone' ? [col, clienteErp] : [col]));
  }, [openView, openEdit, toggle, verify, isCallCenter]);

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

      <div className="table-contaner__search-filter__container">
        <SearchFilter value={globalFilter} onApply={setGlobalFilter} />
      </div> 
      <CustomTable<ContactLogInterface>
        columns={columns}
        rows={data}
        loading={loadingList}
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
        loading={loading}
      />

      {clienteContactId !== null && (
        <CallCenterClienteModal
          key={clienteContactId}
          isOpen
          contactId={clienteContactId}
          onClose={() => setClienteContactId(null)}
          onCambio={() => void refetchPage()}
        />
      )}
    </div>
  );
}