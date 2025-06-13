// src/Pages/SupportPage.tsx
import React, { useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import { useDispatch } from 'react-redux'
import { InboxList } from '@/Components/Chat/InboxList'
import { ChatWindow } from '@/Components/Chat/ChatWindow'
import { ContactDetail } from '@/Components/Chat/ContactDetail'
import { ConversationHistoryModal } from '@/Components/Chat/ConversationHistoryModal'
import { getConversation, closeConversation } from '@/Services/ConversationService'
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'
import { openAssignModal } from '@/Context/Slices/assignModalSlice'
import '@/Styles/Chat/SupportPage.css'

import { RiChatHistoryFill } from 'react-icons/ri'
import { FaUserAlt, FaClipboard } from 'react-icons/fa'

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
  const dispatch = useDispatch()
  const [convId, setConvId] = useState<number | null>(null)
  const [conversation, setConversation] = useState<ConversationDto | null>(null)
  const [filter, setFilter] = useState<'all' | 'waiting' | 'human' | 'closed'>('all')
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [contactDetailToggle, setContactDetailToggle] = useState(false)

  const authRaw = localStorage.getItem('auth') || '{}'
  const { accessToken, userId } = JSON.parse(authRaw) as AuthStorage
  const { role } = jwtDecode<JwtPayload>(accessToken)
  const isAdmin = role.toLowerCase() === 'admin'

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

  const handleAssignClick = () => {
    if (!convId || !conversation) return

    if (isAdmin) {
      dispatch(openAssignModal(conversation))
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
            <option value="closed">Cerradas</option>
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
          <div className="btn-container">
            {convId && (
              <>
                <button
                  className={`contact-detail-button ${convId ? 'active' : 'disabled'}`}
                  onClick={() => setShowHistoryModal(true)}
                  disabled={!convId}
                >
                  <RiChatHistoryFill size={16} /> Historial
                </button>

                <button
                  className={`contact-detail-button ${convId ? 'active' : 'disabled'}`}
                  onClick={() => setContactDetailToggle(t => !t)}
                  disabled={!convId}
                >
                  <FaClipboard size={16} /> Detalles
                </button>
              </>
            )}

            <button
              className={`assign-button ${isAdmin ? '' : 'button-cerrar'}`}
              disabled={!convId}
              onClick={handleAssignClick}
            >
              <FaUserAlt size={16} /> {isAdmin ? 'Asignar' : 'Cerrar'}
            </button>
          </div>
        </header>

        <ChatWindow conversationId={convId ?? undefined} userId={userId} />
      </main>

      {contactDetailToggle && (
        <div className="modal-overlay">
          <aside className="info-sidebar">
            <ContactDetail
              conversationId={convId ?? undefined}
              contactDetailToggle={contactDetailToggle}
              setContactDetailToggle={setContactDetailToggle}
            />
          </aside>
        </div>
      )}

      <ConversationHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        conversationId={convId || 0}
      />
    </div>
  )
}

export default SupportPage