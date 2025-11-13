// import { useEffect } from 'react'
// import { useParams } from 'react-router-dom'
// import useConversations from '@/Hooks/Conversation/useConversations'
// import CustomTable from '@/Components/Common/CustomTable'
// import IconButton from '@mui/material/IconButton'
// import VisibilityIcon from '@mui/icons-material/Visibility'
// import type { Column } from '@/Interfaces/Common/CustomTable'
// import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'
// import ConversationDetailModal from '@/Components/Conversation/ConversationDetailModalProps'
// import "@/Styles/Conversation/ConversationaPage.css"
// import Button from '@/Components/Common/Button'
// import type { StateTranslation } from '@/Interfaces/GlobalInterface'
// import { stateTranslations } from '@/Utils/Translation/stateTranslations'
// // import Spinner from '@/Components/Common/Spinner'

// export default function ConversationsPage() {
//   const { state = '' } = useParams<{ state: string }>()
//   const {
//     data,
//     page,
//     pageSize,
//     totalCount,
//     loading,
//     error,
//     stateFilter,
//     changeState,
//     setPage,
//     setPageSize,
//     openView,
//     closeModal,
//     isModalOpen,
//     selectedConversation,
//     navigationBack
//   } = useConversations({ initialState: state })

//   useEffect(() => {
//     changeState(state)
//   }, [state, changeState])

//   const columns: Column<ConversationDto>[] = [
//     { id: 'clientContactName', label: 'Cliente', minWidth: 90, render: r => r.clientContactName ?? '-' },
//     { id: 'contactNumber', label: 'Contacto', minWidth: 90 },
//     {
//       id: 'status', label: 'Estado', minWidth: 90,
//       render: row => (
//         <span className={`status_${row.status} status`}>
//           {stateTranslations[row.status as StateTranslation]}
//         </span>
//       )
//     },
//     { id: 'createdAt', label: 'Creado', minWidth: 110, render: r => new Date(r.createdAt).toLocaleString('es-NI') },
//     { id: 'assignedAgentName', label: 'Asignada', minWidth: 110, render: r => r.assignedAgentName ?? '-' },
//     { id: 'clientFirstMessage', label: 'Primer Mensaje Cliente', minWidth: 110, render: r => new Date(r.clientFirstMessage).toLocaleString('es-NI') ?? '-' },
//     // { id: 'clientLastMessageAt', label: 'Ultimo Mensaje Cliente', minWidth: 120, render: r => new Date(r.clientLastMessage).toLocaleString('es-NI') ?? '-' },
//     { id: 'clientLastMessageAt', label: 'Último mensaje cliente', minWidth: 110, render: r => new Date(r.clientLastMessageAt!).toLocaleString('es-NI') },
//     {
//       id: 'actions',
//       label: 'Acciones',
//       minWidth: 80,
//       render: r => (
//         <IconButton size="small" onClick={() => openView(r)}>
//           <VisibilityIcon fontSize="medium" />
//         </IconButton>
//       )
//     }
//   ]

//   return (
//     <div className="conversations-page__container">
//       <header className="conversations-page__header">
//         <div className='conversations-page__text'>
//           <h1 className="conversations-page__title">Conversaciones</h1>
//         <p className="conversations-page__subtitle">
//           Filtradas por estado: {stateTranslations[stateFilter as StateTranslation]}
//            {/* {stateFilter || 'Todos'} */}
//         </p>
//         </div>

//          <div className='conversations-page__btnContainer'>
//                   <Button variant="primary" onClick={navigationBack} className='oh-page_btn'>
//                     Regresar
//                   </Button>
//         </div>
//       </header>

//       {/* {loading && <Spinner size={40} text="Cargando datos..." />} */}
//       {error && <p className="conversations-page__error">Error: {error.message}</p>}

//       {!loading && !error && (
//         <CustomTable<ConversationDto>
//           columns={columns}
//           rows={data}
//           count={totalCount}
//           page={page - 1}
//           rowsPerPage={pageSize}
//           rowsPerPageOptions={[5, 10, 20, 50]}
//           onPageChange={(_, newPage) => setPage(newPage + 1)}
//           onRowsPerPageChange={e => setPageSize(parseInt(e.target.value, 10))}
//         />
//       )}

//       <ConversationDetailModal
//         isOpen={isModalOpen}
//         data={selectedConversation}
//         onClose={closeModal}
//       />
//     </div>
//   )
// }