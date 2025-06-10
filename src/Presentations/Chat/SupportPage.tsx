import React, { useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import { InboxList } from '@/Components/Chat/InboxList'
import { ChatWindow } from '@/Components/Chat/ChatWindow'
import { AssignModal } from '@/Components/Chat/AssignModal'
import { ContactDetail } from '@/Components/Chat/ContactDetail'
import { getConversation, closeConversation } from '@/Services/ConversationService'
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'
import '@/Styles/Chat/SupportPage.css'

interface AuthStorage {
  accessToken: string
  refreshToken: string
  expiresAt: string
  userId: number
}

interface JwtPayload {
  role: string
}

const SupportPage: React.FC = () => {
  const [convId, setConvId] = useState<number | null>(null)
  const [conversation, setConversation] = useState<ConversationDto | null>(null)
  const [showAssign, setShowAssign] = useState(false)
  const [filter, setFilter] = useState<'all' | 'waiting' | 'human' | 'closed'>('all')

  const [contactDetailToggle, setContactDetailToggle] = useState(false);
  
  // Lee auth
  const authRaw = localStorage.getItem('auth') || '{}'
  const { accessToken, userId } = JSON.parse(authRaw) as AuthStorage

  const { role } = jwtDecode<JwtPayload>(accessToken)
  const isAdmin = role.toLowerCase().toString() === 'admin'

  // Cargar detalle de la conversación
  useEffect(() => {
    if (!convId) {
      setConversation(null)
      return
    }
    getConversation(convId)
      .then(res => setConversation(res.data.data))
      .catch(console.error)
  }, [convId])

  const handleAfterAssign = () => {
    if (!convId) return
    getConversation(convId)
      .then(res => setConversation(res.data.data))
      .catch(console.error)
  }

  // Asignar o cerrar
  const handleAssignClick = () => {
    if (!convId) return

    if (isAdmin) {
      setShowAssign(true)
    } else {
      closeConversation(convId)
        .then(handleAfterAssign)
        .catch(console.error)
    }
  }

  return (
    <div className="support-layout">
      
      <aside className="sidebar">
        <div className="inbox-header">
          <h3 className="inbox-title">Conversaciones</h3>
          <select
            className="filter-dropdown"
            value={filter}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange={e => setFilter(e.target.value as any)}
          >
            
            <option value="all">Todos</option>
            <option value="bot">Bot</option>
            <option value="waiting">Pendientes</option>
            <option value="human">Asignadas</option>
            {/* <option value="closed">Cerradas</option> */}
          </select>
        </div>
        <InboxList
          selectedId={convId ?? undefined}
          onSelect={setConvId}
          filter={filter}
        />
      </aside>

      <main className="main-content">
        <header className="main-header">
          <h2 className="main-title">Chat</h2>
         <div className='btn-container'>
           {convId && (
            <button className={`contact-detail-button ${!convId ? 'diabled' : 'active'}`}
              onClick={() => setContactDetailToggle(!contactDetailToggle)}
              disabled={!convId}
              >
              {contactDetailToggle ? 'Ocultar Detalles' : 'Mostrar Detalles'}
          </button>
            )}

           <button
            className="assign-button"
            disabled={!convId}
            onClick={handleAssignClick}
          >
            {isAdmin ? 'Asignar' : 'Cerrar'}
          </button>
         </div>
        </header>
        <ChatWindow conversationId={convId ?? undefined} userId={userId} />
      </main>
     {contactDetailToggle && (
      <div className='modal-overlay'>
          <aside className="info-sidebar">
        <ContactDetail conversationId={convId ?? undefined} contactDetailToggle={contactDetailToggle} setContactDetailToggle={setContactDetailToggle} />
      </aside>
      </div>
      )}
       <AssignModal
        conversation={conversation ?? undefined}
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        onAssigned={handleAfterAssign}
      />

    </div>
  )
}

export default SupportPage