
import { useState, useEffect, useCallback } from 'react';
import { getMessages } from '@/Utils/ApiConfig';
import { useSignalR } from '@/Context/SignalRContext';
import type { MessageDto, AttachmentDto } from '@/Interfaces/Chat/ChatInterfaces';

const useMessages = (conversationId?: number) => {
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const { 
    joinConversation, 
    leaveConversation, 
    onNewMessage, 
    offNewMessage,
    onMessageStatusChanged,
    offMessageStatusChanged
  } = useSignalR();

  const receiveHandler = useCallback(
    (payload: { message: MessageDto; attachments: AttachmentDto[] }) => {
      if (payload.message.conversationId !== conversationId) return;
      setMessages(prev => [
        ...prev,
        { ...payload.message, attachments: payload.attachments }
      ]);
    },
    [conversationId]
  );

  const statusHandler = useCallback(
    (updatedMessage: MessageDto) => {
      if (updatedMessage.conversationId !== conversationId) return;
      setMessages(prev =>
        prev.map(m =>
          m.messageId === updatedMessage.messageId
            ? { 
                ...m, 
                status: updatedMessage.status, 
                deliveredAt: updatedMessage.deliveredAt, 
                readAt: updatedMessage.readAt 
              }
            : m
        )
      );
    },
    [conversationId]
  );

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    
    let mounted = true;

    onNewMessage(receiveHandler);
    onMessageStatusChanged(statusHandler);
    joinConversation(conversationId);

    getMessages(conversationId)
      .then(res => mounted && setMessages(res.data.data))
      .catch(() => {});

    return () => {
      mounted = false;
      leaveConversation(conversationId);
      offNewMessage(receiveHandler);
      offMessageStatusChanged(statusHandler);
    };
  }, [
    conversationId,
    receiveHandler,
    statusHandler,
    onNewMessage,
    offNewMessage,
    onMessageStatusChanged,
    offMessageStatusChanged,
    joinConversation,
    leaveConversation
  ]);

  return messages;
};

export default useMessages;