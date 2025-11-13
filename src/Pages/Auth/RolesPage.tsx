// import { useMemo } from 'react'
// import CustomTable from '@/Components/Common/CustomTable'
// import Button from '@/Components/Common/Button'
// import IconButton from '@mui/material/IconButton'
// import VisibilityIcon from '@mui/icons-material/Visibility'
// import EditIcon from '@mui/icons-material/Edit'
// import ToggleOnIcon from '@mui/icons-material/ToggleOn'
// import ToggleOffIcon from '@mui/icons-material/ToggleOff'
// import { TextField } from '@mui/material'
// import { useRoles } from '@/Hooks/Role/useRole'
// import type { RoleResponseDto } from '@/Interfaces/Auth/AuthInterface'
// import type { Column } from '@/Interfaces/Common/CustomTable'
// import RoleForm from '@/Components/Auth/RoleForm'
// import '@/Styles/Auth/RolesPage.css'

// export default function RolesPage() {
//   const {
//     roles,
//     selectedRole,
//     page,
//     pageSize,
//     totalCount,
//     setPage,
//     setPageSize,
//     modalMode,
//     isModalOpen,
//     openCreate,
//     openEdit,
//     openView,
//     closeModal,
//     handleSubmit,
//     toggleRole,
//     globalFilter,
//     setGlobalFilter,
//   } = useRoles()

//   const columns: Column<RoleResponseDto>[] = useMemo(
//     () => [
//       {
//         id: 'roleName',
//         label: 'Nombre',
//         minWidth: 160,
//       },
//       {
//         id: 'description',
//         label: 'Descripción',
//         minWidth: 200,
//         render: (row: RoleResponseDto) =>
//           row.description
//             ? row.description.length > 80
//               ? `${row.description.slice(0, 80)}...`
//               : row.description
//             : '—',
//       },
//       {
//         id: 'isActive',
//         label: 'Estado',
//         minWidth: 100,
//         render: (row: RoleResponseDto) => (
//           <span
//             className={
//               row.isActive ? 'status status--active' : 'status status--inactive'
//             }
//           >
//             {row.isActive ? 'Activo' : 'Inactivo'}
//           </span>
//         ),
//       },
//       {
//         id: 'actions',
//         label: 'Acciones',
//         minWidth: 140,
//         align: 'center',
//         render: (row: RoleResponseDto) => (
//           <>
//             <IconButton size="small" onClick={() => openView(row.roleId)}>
//               <VisibilityIcon fontSize="small" />
//             </IconButton>
//             <IconButton size="small" onClick={() => openEdit(row.roleId)}>
//               <EditIcon fontSize="small" />
//             </IconButton>
//             <IconButton size="small" onClick={() => toggleRole(row.roleId)}>
//               {row.isActive ? (
//                 <ToggleOnIcon fontSize="small" color="success" />
//               ) : (
//                 <ToggleOffIcon fontSize="small" />
//               )}
//             </IconButton>
//           </>
//         ),
//       },
//     ],
//     [openView, openEdit, toggleRole]
//   )

//   const filteredRoles = useMemo(() => {
//     const term = globalFilter.trim().toLowerCase()
//     if (!term) return roles
//     return roles.filter(
//       r =>
//         r.roleName.toLowerCase().includes(term) ||
//         (r.description ?? '').toLowerCase().includes(term)
//     )
//   }, [roles, globalFilter])

//   return (
//     <div className="roles-page__container">
//       <div className="roles-page__header">
//         <div className="roles-page__header-content">
//           <h1 className="roles-page__title">Roles</h1>
//           <p className="roles-page__subtitle">Administra los roles del sistema</p>
//         </div>
//         <div className="roles-page__btnContainer">
//           <Button variant="primary" onClick={openCreate}>
//             Nuevo Rol
//           </Button>
//         </div>
//       </div>

//       <div className="table-container__search-filter__container">
//         <TextField
//           label="Filtrar"
//           variant="outlined"
//           size="small"
//           fullWidth
//           value={globalFilter}
//           onChange={(e) => setGlobalFilter(e.target.value)}
//           className="table-container__search-filter"
//         />
//       </div>

//       <CustomTable<RoleResponseDto>
//         columns={columns}
//         rows={filteredRoles}
//         count={totalCount}
//         page={page - 1}
//         rowsPerPage={pageSize}
//         rowsPerPageOptions={[20, 30, 50]}
//         onPageChange={(_, newPage) => setPage(newPage + 1)}
//         onRowsPerPageChange={(e) => setPageSize(parseInt(e.target.value, 10))}
//       />

//       <RoleForm
//         mode={modalMode}
//         isOpen={isModalOpen}
//         data={selectedRole}
//         onClose={closeModal}
//         onSubmit={handleSubmit}
//       />
//     </div>
//   )
// }