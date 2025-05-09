import { useEffect, useState } from 'react';
import { getMessages } from '@/Utils/ApiConfig';
import { useSignalR } from '@/Context/SignalRContext';
import type{ MessageDto } from '@/Interfaces/Chat/ChatInterfaces';

export function useMessages(conversationId?: number) {
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const { joinConversation, onReceiveMessage } = useSignalR();

  useEffect(() => {
    if (!conversationId) return;

    joinConversation(conversationId);
    getMessages(conversationId)
      .then(res => setMessages(res.data.data))
      .catch(console.error);

    onReceiveMessage(payload => {
      if (payload.Message.conversationId === conversationId) {
        setMessages(ms => [...ms, payload.Message]);
      }
    });
  }, [conversationId]);

  return messages;
}