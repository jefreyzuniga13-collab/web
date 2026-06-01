/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react'
import CustomTable from '@/Components/Common/CustomTable'
import Button from '@/Components/Common/Button'
import IconButton from '@mui/material/IconButton'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import ToggleOnIcon from '@mui/icons-material/ToggleOn'
import ToggleOffIcon from '@mui/icons-material/ToggleOff'
import Modal from '@/Components/Auth/Modal'
import UserForm from '@/Components/Auth/UserForm'
import { TextField } from '@mui/material'
import '@/Styles/Auth/UsersPage.css'
import type { Column } from '@/Interfaces/Common/CustomTable'
import type { User } from '@/Interfaces/Auth/UserInterfaces'
import useClasicUser from '@/Hooks/Auth/useClasicUser'

export default function UsersPage() {
  const {
    users,
    selectedUser,
    companies,
    // roles,
    // error,
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
    create,
    update,
    toggle,
    globalFilter,
    setGlobalFilter,
  } = useClasicUser()

  const columns: Column<User>[] = useMemo(
    () => [
      { id: 'fullName', label: 'Nombre', minWidth: 110 },
      { id: 'codReferenciaPCG', label: 'Código referencia PCG', minWidth: 50 },
      { id: 'email', label: 'Correo', minWidth: 120 },
      {
        id: 'roles',
        label: 'Roles',
        minWidth: 100,
        render: row => row.roles.map(r => r.roleName).join(', '),
      },
      {
        id: 'isActive',
        label: 'Estado',
        minWidth: 90,
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
        minWidth: 120,
        align: 'center',
        render: row => (
          <>
            <IconButton size="medium" onClick={() => openView(row)}>
              <VisibilityIcon fontSize="medium" />
            </IconButton>
            <IconButton size="medium" onClick={() => openEdit(row)}>
              <EditIcon fontSize="medium" />
            </IconButton>
            <IconButton size="medium" onClick={() => toggle(row.userId)}>
              {row.isActive ? (
                <ToggleOnIcon fontSize="medium" color="success" />
              ) : (
                <ToggleOffIcon fontSize="medium" />
              )}
            </IconButton>
          </>
        ),
      },
    ],
    [openView, openEdit, toggle]
  )
const handleSubmit = async (data: any) => {
  if (modalMode === 'create') {
    return create(data)
  }

  if (modalMode === 'edit') {
    return update(data)
  }
}
  return (
    <div className="users-page__container">
      <div className="users-page__header">
        <div className="users-page__header-content">
          <h1 className="users-page__title">Administración de Usuarios</h1>
          <p className="users-page__subtitle">Gestiona roles, accesos y estado de tu equipo.</p>
        </div>
        <div className="users-page__btnContainer">
          <Button variant="primary" onClick={openCreate}>
            Nuevo Usuario
          </Button>
        </div>
      </div>

      <div className="table-contaner__search-filter__container">
        <TextField
          label="Filtrar"
          variant="outlined"
          size="medium"
          fullWidth
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="table-contaner__search-filter"
        />
      </div>

      <CustomTable<User>
        columns={columns}
        rows={users}
        count={totalCount}
        page={page - 1}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[20, 30, 50]}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={e => setPageSize(parseInt(e.target.value, 10))}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === 'create'
            ? 'Crear Usuario'
            : modalMode === 'edit'
            ? 'Editar Usuario'
            : 'Detalle Usuario'
        }
        size="large"
      >
        {modalMode === 'create' && (
          <UserForm companies={companies} onSubmit={handleSubmit} onCancel={closeModal} />
        )}
        {(modalMode === 'edit' || modalMode === 'view') && selectedUser && (
          <UserForm
            key={selectedUser.userId}
            initialData={selectedUser}
            companies={companies}
            isEditing={modalMode === 'edit'}
            isViewing={modalMode === 'view'}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        )}
      </Modal>
    </div>
  )
}