// src/layouts/MainLayout.tsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '@/Components/Chat/Menu'
import type { AuthData } from '@/Interfaces/Auth/AuthInterface'
import { useAssignmentEvents } from '@/Hooks/useAssignmentEvents'

import AssignedModal from '@/Components/Chat/AssignedModal'
import AdminResponseModal from '@/Components/Chat/AdminResponseModal'
import SupportForcedModal from '@/Components/Chat/SupportForcedModal'
import AdminForcedModal from '@/Components/Chat/AdminForcedModal'
//import { forceAssign } from '@/Services/ConversationService'

const MainLayout: React.FC = () => {
  // 1) Solo si estás autentificado tienes userId
  const authRaw = localStorage.getItem('auth') || '{}'
  const { userId } = JSON.parse(authRaw) as AuthData
  const isAuthenticated = Boolean(userId)

  // 2) Hook que expone qué modales mostrar
  const {
    requestedConv, clearRequested,
    responsePayload, clearResponse,
    forcedConv, clearForced,
    forcedAdminPayload, clearForcedAdmin
  } = useAssignmentEvents()

  // 3) Función auxiliar para forzar desde el modal de admin
  // const handleForceFromResponse = async (
  //   conversationId: number,
  //   targetAgentId: number,
  //   comment: string
  // ) => {
  //   await forceAssign(conversationId, targetAgentId, comment)
  //   clearResponse()
  // }

  if (!isAuthenticated) {
    // Si no hay sesión, no levantamos ningún modal ni SignalR
    return <Outlet />
  }

  return (
    <div className="general-container">
      <Navbar id={Number(userId)} />

      {/* Modales globales de asignación */}
      {requestedConv !== null && (
        <AssignedModal
          conversationId={requestedConv}
          onClose={clearRequested}
        />
      )}

      {responsePayload !== null && (<AdminResponseModal
              conversationId={responsePayload.conversationId}
              accepted={responsePayload.accepted}
              comment={responsePayload.comment}
              onClose={clearResponse}
          />
        // <AdminResponseModal
        //   conversationId={responsePayload.conversationId}
        //   accepted={responsePayload.accepted}
        //   comment={responsePayload.comment}
        //   onClose={clearResponse}
        //   // Le pasas la función para forzar asignación
        //   onForceAssign={handleForceFromResponse}
        // />
        
      )}

      {forcedConv !== null && (
        <SupportForcedModal
          conversationId={forcedConv}
          comment={forcedAdminPayload?.comment || ''}
          onClose={clearForced}
        />
      )}

      {forcedAdminPayload !== null && (
        <AdminForcedModal
          conversationId={forcedAdminPayload.conversationId}
          targetAgentId={forcedAdminPayload.targetAgentId}
          comment={forcedAdminPayload.comment}
          onClose={clearForcedAdmin}
        />
      )}

      {/*Resto de la UI de tu app */}
      <Outlet />
    </div>
  )
}

export default MainLayout