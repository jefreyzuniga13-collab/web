// src/Context/SignalRContext.tsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from 'react'
import {
  createHubConnection,
  joinConversation,
  leaveConversation,
  onReceiveMessage,
  offReceiveMessage,
  onNewHumanRequest,
  onConversationCreated,    // <-- importa
  offConversationCreated    // <-- importa
} from '@/Services/signalr'
import type {
  MessageDto,
  AttachmentDto,
  ConversationDto
} from '@/Interfaces/Chat/ChatInterfaces'
import { ThreeDot } from 'react-loading-indicators'

interface SignalRContextValue {
  joinConversation: (id: number) => void
  leaveConversation: (id: number) => void
  onReceiveMessage: (
    handler: (payload: { Message: MessageDto; Attachments: AttachmentDto[] }) => void
  ) => void
  offReceiveMessage: (
    handler: (payload: { Message: MessageDto; Attachments: AttachmentDto[] }) => void
  ) => void
  onNewHumanRequest: (
    handler: (payload: { conversationId: number; fromPhone: string }) => void
  ) => void
  onConversationCreated: (handler: (c: ConversationDto) => void) => void
  offConversationCreated: (handler: (c: ConversationDto) => void) => void
}

const SignalRContext = createContext<SignalRContextValue>({
  joinConversation: () => {},
  leaveConversation: () => {},
  onReceiveMessage: () => {},
  offReceiveMessage: () => {},
  onNewHumanRequest: () => {},
  onConversationCreated: () => {},
  offConversationCreated: () => {}
})

export const SignalRProvider: React.FC<{ token: string; children: ReactNode }> = ({
  token,
  children
}) => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    createHubConnection(token)
      .then(() => setReady(true))
      .catch(err => {
        console.error('Error conectando SignalR:', err)
        setReady(true)
      })
  }, [token])

  if (!ready) {
    return (
      <div className='loader-container'>
        <ThreeDot color="#3142cc" size="medium" text="" textColor="" />
      </div>
    )
  }

  return (
    <SignalRContext.Provider value={{
      joinConversation,
      leaveConversation,
      onReceiveMessage,
      offReceiveMessage,
      onNewHumanRequest,
      onConversationCreated,     
      offConversationCreated     
    }}>
      {children}
    </SignalRContext.Provider>
  )
}

export function useSignalR() {
  return useContext(SignalRContext)
}