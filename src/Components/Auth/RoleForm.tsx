// import React from 'react'
// import Button from '@/Components/Common/Button'
// import Input from '@/Components/Common/Input'
// import { Label } from '@/Components/Common/Label'
// import { Textarea } from '@/Components/Common/Textarea'
// import { TextField, IconButton } from '@mui/material'
// import ToggleOnIcon from '@mui/icons-material/ToggleOn'
// import ToggleOffIcon from '@mui/icons-material/ToggleOff'
// import { useRoleForm } from '@/Hooks/Role/useRoleForm'
// import { useRoleMenus } from '@/Hooks/Role/useRoleMenus'
// import type { RoleResponseDto } from '@/Interfaces/Auth/AuthInterface'
// import type { MenuResponseDto, RoleMenuResponseDto } from '@/Interfaces/Auth/MenuInterfaces'
// import '@/Styles/Auth/RoleForm.css'

// type Mode = 'create' | 'update' | 'view'

// interface RoleFormProps {
//   mode: Mode
//   isOpen: boolean
//   data: RoleResponseDto | null
//   onClose: () => void
//   onSubmit: (values: { roleName: string; description?: string | null }) => void
// }

// export default function RoleForm({ mode, isOpen, data, onClose, onSubmit }: RoleFormProps) {
//   const { form, errors, isView, handleChange, handleSubmit } = useRoleForm({ mode, data, onSubmit })
//   const roleId = data?.roleId ?? 0
//   const hasRole = roleId > 0
//   const { relations, menus, loading, error, toggleMenu, assignMenu } = useRoleMenus(roleId)
//   const [menuIdToAdd, setMenuIdToAdd] = React.useState<string>('')

//   if (!isOpen) return null

//   const handleAddMenu = () => {
//     const parsed = Number(menuIdToAdd)
//     if (!Number.isInteger(parsed) || parsed <= 0 || !hasRole) return
//     assignMenu(parsed).finally(() => setMenuIdToAdd(''))
//   }

//   return (
//     <div className="role-modal__overlay">
//       <div className="role-modal__container">
//         <header className="role-modal__header">
//           <h2 className="role-modal__title">
//             {mode === 'create' && 'Crear Rol'}
//             {mode === 'update' && 'Editar Rol'}
//             {mode === 'view' && 'Detalle del Rol'}
//           </h2>
//           <button type="button" className="role-modal__close" onClick={onClose}>
//             ×
//           </button>
//         </header>

//         <form className="role-modal__body" onSubmit={handleSubmit}>
//           <div className="role-modal__grid">
//             <div className="role-modal__col">
//               <Label htmlFor="roleName" className="role-modal__label">Nombre *</Label>
//               <Input
//                 id="roleName"
//                 name="roleName"
//                 value={form.roleName}
//                 onChange={handleChange}
//                 disabled={isView}
//                 className="role-modal__input"
//               />
//               {errors.roleName && <div className="role-modal__error">{errors.roleName}</div>}
//             </div>

//             <div className="role-modal__col role-modal__col--full">
//               <Label htmlFor="description" className="role-modal__label">Descripción</Label>
//               <Textarea
//                 id="description"
//                 name="description"
//                 value={form.description ?? ''}
//                 onChange={handleChange}
//                 rows={4}
//                 disabled={isView}
//                 className="role-modal__input"
//               />
//             </div>
//           </div>

//           {hasRole && (
//             <section className="role-modal__access">
//               <div className="role-modal__access-header">
//                 <h3 className="role-modal__subtitle">Accesos (Menús)</h3>
//                 <div className="role-modal__assign">
//                   <TextField
//                     label="Agregar por MenuId"
//                     variant="outlined"
//                     size="small"
//                     value={menuIdToAdd}
//                     onChange={(e) => setMenuIdToAdd(e.target.value)}
//                     className="role-modal__assign-input"
//                   />
//                   <Button
//                     type="button"
//                     variant="secondary"
//                     onClick={handleAddMenu}
//                     disabled={loading || isView || !menuIdToAdd.trim()}
//                   >
//                     Agregar
//                   </Button>
//                 </div>
//               </div>

//               {error && <div className="role-modal__error">Error: {error.message}</div>}

//               <div className="role-modal__lists">
//                 <div className="role-modal__list">
//                   <h4 className="role-modal__list-title">Menús Activos</h4>
//                   <ul>
//                     {menus.map((m: MenuResponseDto) => (
//                       <li key={m.menuId} className="role-modal__item">
//                         <span className="role-modal__item-name">{m.name}</span>
//                         {!isView && (
//                           <IconButton
//                             size="small"
//                             onClick={() => toggleMenu(m.menuId)}
//                             disabled={loading}
//                             aria-label={`Desactivar ${m.name}`}
//                           >
//                             <ToggleOnIcon fontSize="small" color="success" />
//                           </IconButton>
//                         )}
//                       </li>
//                     ))}
//                     {menus.length === 0 && <li className="role-modal__empty">Sin menús activos</li>}
//                   </ul>
//                 </div>

//                 <div className="role-modal__list">
//                   <h4 className="role-modal__list-title">Relaciones (todas)</h4>
//                   <ul>
//                     {relations.map((r: RoleMenuResponseDto) => (
//                       <li key={`${r.roleId}-${r.menuId}`} className="role-modal__item">
//                         <span className="role-modal__item-name">
//                           {r.menuName ?? `MenuId ${r.menuId}`}
//                         </span>
//                         <span className={r.isActive ? 'status status--active' : 'status status--inactive'}>
//                           {r.isActive ? 'Activo' : 'Inactivo'}
//                         </span>
//                         {!isView && (
//                           <IconButton
//                             size="small"
//                             onClick={() => toggleMenu(r.menuId)}
//                             disabled={loading}
//                             aria-label={r.isActive ? 'Desactivar' : 'Activar'}
//                           >
//                             {r.isActive ? (
//                               <ToggleOnIcon fontSize="small" color="success" />
//                             ) : (
//                               <ToggleOffIcon fontSize="small" />
//                             )}
//                           </IconButton>
//                         )}
//                       </li>
//                     ))}
//                     {relations.length === 0 && <li className="role-modal__empty">Sin relaciones registradas</li>}
//                   </ul>
//                 </div>
//               </div>
//             </section>
//           )}

//           <footer className="role-modal__footer">
//             <Button
//               variant="secondary"
//               onClick={onClose}
//               className="role-modal__btn role-modal__btn--cancel"
//               type="button"
//             >
//               Cancelar
//             </Button>
//             {!isView && (
//               <Button
//                 variant="primary"
//                 type="submit"
//                 className="role-modal__btn role-modal__btn--confirm"
//               >
//                 {mode === 'create' ? 'Crear' : 'Guardar'}
//               </Button>
//             )}
//           </footer>
//         </form>
//       </div>
//     </div>
//   )
// }