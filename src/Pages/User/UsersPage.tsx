/* eslint-disable @typescript-eslint/no-explicit-any */
import CustomTable from '@/Components/Common/CustomTable'
import Button from '@/Components/Common/Button'
import IconButton from '@mui/material/IconButton'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import ToggleOnIcon from '@mui/icons-material/ToggleOn'
import ToggleOffIcon from '@mui/icons-material/ToggleOff'
import Modal from '@/Components/Users/Modal'
import UserForm from '@/Components/Users/UserForm'
import { useUsers } from '@/Hooks/User/useUsers'
import '@/Styles/Users/UsersPage.css'
import type { Column } from '@/Interfaces/Common/CustomTable'
import { TextField } from '@mui/material'

export default function UsersPage() {
  
  const {
    users,
    currentUser,
    companies,
    error,
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
    toggleUser,
    globalFilter,
    setGlobalFilter,
  } = useUsers()

  const columns: Column<any>[] = [
    { id: 'fullName', label: 'Nombre', minWidth: 110 },
    { id: 'email',    label: 'Email',  minWidth: 70 },
     {
      id: 'roles',
      label: 'Roles',
      minWidth: 80,
      render: row => row.roles.map((r: { roleName: string }) => r.roleName).join(', ')
    },
    {
      id: 'isActive',
      label: 'Estado',
      minWidth: 80,
      render: row => (
        <span className={row.isActive ? 'status status--active' : 'status status--inactive'}>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
     { id: 'createdAt', label: 'Creado', minWidth: 80, render: row => new Date(row.createdAt!).toLocaleDateString('es-NI') },
    {
      id: 'actions',
      label: 'Acciones',
      minWidth: 100,
      align: 'center',
      render: row => (
        <>
          <IconButton size="medium" onClick={() => openView(row.userId)}>
            <VisibilityIcon fontSize="medium" />
          </IconButton>
          <IconButton size="medium" onClick={() => openEdit(row.userId)}>
            <EditIcon fontSize="medium" />
          </IconButton>
          <IconButton size="medium" onClick={() => toggleUser(row.userId)}>
            {row.isActive
              ? <ToggleOnIcon fontSize="medium" color="success" />
              : <ToggleOffIcon fontSize="medium" />
            }
          </IconButton>
        </>
      )
    }
  ]

  return (
    <div className="users-page__container">
      <div className="users-page__header">
        <div className="users-page__header-content">
          <h1 className="users-page__title">Administración de Usuarios</h1>
          <p className="users-page__subtitle">
            Gestiona roles y estado de acceso de tu equipo
          </p>
        </div>
        <div className="users-page__btnContainer">
          <Button variant="primary" onClick={openCreate}>
            Nuevo Usuario
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

      {error && <p className="users-page__error">Error: {error}</p>}

      <CustomTable<any>
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
          modalMode === 'create' ? 'Crear Usuario'
          : modalMode === 'edit'   ? 'Editar Usuario'
          :                          'Detalle Usuario'
        }
        size="large"
      >
        { modalMode === 'create' && (
          <UserForm
            companies={companies}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        )}
        { (modalMode === 'edit' || modalMode === 'view') && currentUser && (
          <UserForm
            initialData={currentUser}
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