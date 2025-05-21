import React, { useState, useEffect } from 'react'
import { SignalRProvider } from '@/Context/SignalRContext'
import { InboxList } from '@/Components/Chat/InboxList'
import { ChatWindow } from '@/Components/Chat/ChatWindow'
import { AssignModal } from '@/Components/Chat/AssignModal'
import { ContactDetail } from '@/Components/Chat/ContactDetail'
import { getConversation } from '@/Services/ConversationService'
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'
import '@/Styles/Chat/SupportPage.css'

const SupportPage: React.FC = () => {
  const [convId, setConvId] = useState<number | null>(null)
  const [conversation, setConversation] = useState<ConversationDto | null>(null)
  const [showAssign, setShowAssign] = useState(false)
  const [filter, setFilter] = useState<'all' | 'waiting' | 'human' | 'closed'>('all')

  const authRaw = localStorage.getItem('auth') || '{}'
  const { accessToken: token, userId } = JSON.parse(authRaw) as { accessToken: string; userId: number }

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

  return (
    <SignalRProvider token={token}>
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
              <option value="waiting">Pendientes</option>
              <option value="human">En espera</option>
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
            <button
              className="assign-button"
              disabled={!convId}
              onClick={() => setShowAssign(true)}
            >
              Asignar
            </button>
          </header>
          <ChatWindow conversationId={convId ?? undefined} userId={userId} />
        </main>

        <aside className="info-sidebar">
          <ContactDetail conversationId={convId ?? undefined} />
        </aside>
      </div>

      <AssignModal
        conversation={conversation ?? undefined}
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        onAssigned={handleAfterAssign}
      />
    </SignalRProvider>
  )
}

export default SupportPage