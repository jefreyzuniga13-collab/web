 import useNotification from "@/Hooks/Notification/useNotification";
import type { Column } from '@/Interfaces/Common/CustomTable';
import type { NotificationResponseDto } from "@/Interfaces/Notification/NotificationInterfaces";
import IconButton from "@mui/material/IconButton";
import { useMemo } from "react";
import VisibilityIcon from '@mui/icons-material/Visibility';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import EditIcon from '@mui/icons-material/Edit';
import Button from "@/Components/Common/Button";
import CustomTable from "@/Components/Common/CustomTable";
import '@/Styles/Contact/ContactPage.css'
import NotificationModalForm from "@/Components/Notification/NotificationModalForm";
export default function NotificationsPage(){
  const {
    data,
    openCreateAsync,
    openEditAsync,
    openViewAsync,
    toggleAsync,
    error,
    totalCount,
    page,
    pageSize,
    setPage,
    setPageSize,
    isModalOpen,
    modalMode,
    handleSubmit,
    selectedData,
    closeModalAsync
  } = useNotification();

  const column: Column<NotificationResponseDto>[] = useMemo(()=>[

    {
      id: 'name',
      label: "Nombre",
      minWidth: 80,
      render: row=> row.name ?? ''
    },
    {
      id: 'description',
      label: "Descripción",
      minWidth: 100,
      render: row=> row.description ?? ''
    },
    {
      id: 'isActive',
      label: "Activo",
      minWidth: 80,
      render: row=> row.payload ?? ''
    },
    {
      id: 'isActive',
      label: 'Activo',
      minWidth: 70,
      render: row => (
        <span className={row.isActive ? 'status status--active' : 'status status--inactive'}>
          {row.isActive ? 'Sí' : 'No'}
        </span>
      )
    },
    {
      id: 'createdAt',
      label: "Fecha creación",
      minWidth: 100,
      render: row=> new Date(row.createdAt!).toLocaleDateString('es-NI')
    },
    {
      id: 'actions',
      label: 'Acciones',
      minWidth: 150,
      render: row => (
        <>
          <IconButton size="medium" onClick={() => openViewAsync(row)}>
            <VisibilityIcon fontSize="medium" />
          </IconButton>
          <IconButton size="medium" onClick={() => openEditAsync(row)}>
            <EditIcon fontSize="medium" />
          </IconButton>
          <IconButton size="medium" onClick={() => toggleAsync(row.id as number)}>
            {row.isActive ? (
              <ToggleOnIcon fontSize="medium" color="success" />
            ) : (
              <ToggleOffIcon fontSize="medium" />
            )}
          </IconButton>
        </>
  )}
  ], [openViewAsync, openEditAsync, toggleAsync]);

  return(
    <div className="contact-page__container">
          <div className="contact-page__header">
            <div className="contact-page__content">
              <h1 className="contact-page__title">Gestión de Notificaciones</h1>
              <p className="contact-page__subtitle">
                Catalogo de notificaciones gestiondas en el sitio
              </p>
            </div>
            <div className="contact-page__buttons">
              <Button variant="primary" onClick={openCreateAsync} className="contact-page__btn">
                Nueva Notificación
              </Button>
            </div>
          </div>
    
          {error && <p className="contact-page__error">Error: {error.message}</p>}
    
          <CustomTable<NotificationResponseDto>
            columns={column}
            rows={data}
            count={totalCount}
            page={page - 1}
            rowsPerPage={pageSize}
            rowsPerPageOptions={[5, 10, 20, 50]}
            onPageChange={(_, newPage) => setPage(newPage + 1)}
            onRowsPerPageChange={e => setPageSize(parseInt(e.target.value, 10))}
          />
    
          <NotificationModalForm
            mode={modalMode}
            isOpen={isModalOpen}
            data={selectedData}
            onClose={closeModalAsync}
            onSubmit={handleSubmit}
            />
        </div>
  )
}