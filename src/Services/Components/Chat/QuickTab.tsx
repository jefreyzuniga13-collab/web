// import React from 'react'
// import useQuickTab from '@/Hooks/Chat/useQuickTab'
// import '@/Styles/Chat/QuickTab.css'

// const DetailPanelMensajesRapidos: React.FC = () => {
//   const { qQuick, setQQuick, filteredQuick, handleSendQuick } = useQuickTab()

//   return (
//     <>
//       <header className="detailPanel-quick__header">
//         <h5 className="detailPanel-content-header__title">Mensajes rápidos</h5>
//         <input
//           className="detailPanel-quick__search"
//           placeholder="Buscar…"
//           value={qQuick}
//           onChange={e => setQQuick(e.target.value)}
//           aria-label="Buscar mensajes rápidos"
//         />
//       </header>

//       <div className="detailPanel-quick">
//         {filteredQuick.length === 0 ? (
//           <p className="detailPanel-quick__empty">
//             No hay mensajes rápidos configurados.
//           </p>
//         ) : (
//           <ul className="detailPanel-quick__list">
//             {filteredQuick.map((opt, i) => (
//               <li key={`${opt}-${i}`} className="detailPanel-quick__item">
//                 <div
//                   className="detailPanel-quick__text"
//                   style={{
//                     whiteSpace: 'pre-wrap',
//                     wordBreak: 'break-word',
//                     overflowWrap: 'anywhere',
//                     textAlign: 'left',
//                   }}
//                 >
//                   {opt}
//                 </div>
//                 <div className="detailPanel-quick__actions">
//                   <button
//                     type="button"
//                     className="btn btn--primary"
//                     onClick={() => handleSendQuick(opt)}
//                     title="Enviar ahora"
//                   >
//                     Enviar
//                   </button>
//                 </div>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
//     </>
//   )
// }

// export default DetailPanelMensajesRapidos