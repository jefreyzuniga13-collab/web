import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  createHubConnection,
  joinConversation,
  leaveConversation,
  onNewMessage,
  offNewMessage,
  onNewHumanRequest,
  offNewHumanRequest,
  onConversationCreated,
  offConversationCreated
} from '@/Services/signalr'
import type { MessageDto, AttachmentDto, ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'
import { ThreeDot } from 'react-loading-indicators'

interface SignalRContextValue {
  joinConversation: (id: number) => void
  leaveConversation: (id: number) => void
  onNewMessage: (
    handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void
  ) => void
  offNewMessage: (
    handler: (payload: { message: MessageDto; attachments: AttachmentDto[] }) => void
  ) => void
  onNewHumanRequest: (
    handler: (payload: { conversationId: number; fromPhone: string }) => void
  ) => void
  offNewHumanRequest: (
    handler: (payload: { conversationId: number; fromPhone: string }) => void
  ) => void
  onConversationCreated: (handler: (convo: ConversationDto) => void) => void
  offConversationCreated: (handler: (convo: ConversationDto) => void) => void
}

const SignalRContext = createContext<SignalRContextValue>({
  joinConversation: () => {},
  leaveConversation: () => {},
  onNewMessage: () => {},
  offNewMessage: () => {},
  onNewHumanRequest: () => {},
  offNewHumanRequest: () => {},
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
      .catch(() => setReady(true))
  }, [token])

  if (!ready) {
    return (
      <div className='loader-container'>
        <ThreeDot />
      </div>
    )
  }

  return (
    <SignalRContext.Provider value={{
      joinConversation,
      leaveConversation,
      onNewMessage,
      offNewMessage,
      onNewHumanRequest,
      offNewHumanRequest,
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