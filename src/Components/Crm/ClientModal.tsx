// import { useEffect, useState } from 'react'
// import Button from '@/Components/Common/Button'
// import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
// import { Autocomplete, TextField } from '@mui/material'
// import { useWorkShiftForm } from '@/Hooks/Setting/useWorkShiftForm'
// import { useOpeningHour } from '@/Hooks/Setting/useOpeningHour'
// import { userService } from '@/Services/User/UserService'
// import '@/Styles/Setting/WorkShiftModal.css'
// import { parse } from 'date-fns'
// import type { ClientRequestDTO, ClientResponseDTO } from '@/Interfaces/Crm/ClientInterface'
// import { useClientForm } from '@/Hooks/Crm/useClientForm'

// interface Props {
//   mode: 'create' | 'update' | 'view'
//   isOpen: boolean
//   data?: ClientResponseDTO | null
//   onClose: () => void
//   onSubmit: (values: ClientRequestDTO) => void
// }

// export default function WorkShiftModal({
//   mode,
//   isOpen,
//   data,
//   onClose,
//   onSubmit,
// }: Props) {

//   const {
//     errors,
//     form,
//     handleCheckbox,
//     handleSubmit,
//     isView
//   } = useClientForm({ mode, data, onSubmit })

//   if (!isOpen) return null

//   return (
//     <div className="ws-modal__overlay">
//       <div className="ws-modal__container">
//         <header className="ws-modal__header">
//           <h2 className="ws-modal__title">
//             {mode === 'create' ? 'Crear cliente' : mode === 'update' ? 'Editar cliente' : 'Detalle del cliente'}
//           </h2>
//           <button type="button" className="ws-modal__close" onClick={onClose}>×</button>
//         </header>
//         <form className="ws-modal__body" onSubmit={handleSubmit}>
//           <div className="ws-modal__grid">

//             <div className="ws-modal__col">
//               <label className="ws-modal__field--checkbox">
//                 <input
//                   type="checkbox"
//                   name="isActive"
//                   checked={form.isActive}
//                   onChange={handleCheckbox}
//                   disabled={isView}
//                 /> Activo
//               </label>
//             </div>
//           </div>

//           <footer className="ws-modal__footer">
//             <Button
//               variant="secondary"
//               onClick={onClose}
//               className="ws-modal__btn ws-modal__btn--cancel"
//             >
//               Cancelar
//             </Button>
//             {!isView && (
//               <Button
//                 variant="primary"
//                 type="submit"
//                 className="ws-modal__btn ws-modal__btn--confirm"
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