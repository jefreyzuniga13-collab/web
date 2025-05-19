
import { useState, useEffect, useCallback } from 'react';
import { getConversations } from '@/Utils/ApiConfig';
import { useSignalR } from '@/Context/SignalRContext';
import { useUserRoles } from '@/Hooks/useUserRoles';
import type { ConversationDto, MessageDto, AttachmentDto } from '@/Interfaces/Chat/ChatInterfaces';

export function useConversations(filter: string = 'all'): ConversationDto[] {
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const { isAdmin, userId } = useUserRoles();
  const {
    onConversationCreated,
    offConversationCreated,
    onNewMessage,
    offNewMessage,
    onNewHumanRequest,
    offNewHumanRequest
  } = useSignalR();

  const handleHumanRequest = useCallback(
    (payload: { conversationId: number; fromPhone: string }) => {
      setConversations(prev =>
        prev.map(c =>
          c.conversationId === payload.conversationId
            ? { ...c, status: 'WaitingHuman' }
            : c
        )
      );
    },
    []
  );

  const handleNewConvo = useCallback(
    (newConvo: ConversationDto) => {
      // Solo añadir la conversación si es admin o si está asignada al usuario
      if (isAdmin || (newConvo.assignedAgentId?.toString() === userId)) {
        setConversations(prev => [newConvo, ...prev]);
      }
    },
    [isAdmin, userId]
  );

  const handleNewMessage = useCallback(
    (payload: { message: MessageDto; attachments: AttachmentDto[] }) => {
      const msg = payload.message;
      setConversations(prev =>
        prev
          .map(c =>
            c.conversationId === msg.conversationId
              ? {
                  ...c,
                  totalMensajes: (c.totalMensajes || 0) + 1,
                  ultimaActividad: msg.createdAt,
                  unreadCount: (c.unreadCount || 0) + 1
                }
              : c
          )
          .sort(
            (a, b) => {
              const dateA = new Date(a.ultimaActividad || a.lastActivity || a.createdAt).getTime();
              const dateB = new Date(b.ultimaActividad || b.lastActivity || b.createdAt).getTime();
              return dateB - dateA;
            }
          )
      );
    },
    []
  );

  useEffect(() => {
    let mounted = true;

    getConversations()
      .then(res => {
        if (!mounted) return;
        
        // Mapear los datos de la API al formato que espera nuestra UI
        let conversations = res.data.data.map(conv => ({
          ...conv,
          totalMensajes: conv.totalMessages || 0,
          ultimaActividad: conv.lastActivity || conv.updatedAt || conv.createdAt,
          duracion: conv.duration || "00:00:00",
          unreadCount: 0 // Por defecto, inicializamos en 0
        }));
        
        // Filtrar por rol y filtro adicional
        if (isAdmin) {
          console.log("Es admin o no es admin" , isAdmin)
          conversations = conversations.filter(conv => 
            conv.assignedAgentId?.toString() === userId
          );
        }
        
        // Aplicar filtro adicional si existe
        if (filter !== 'all') {
          conversations = conversations.filter(conv => {
            if (filter === 'pending') return conv.status === 'WaitingHuman';
            if (filter === 'mine') return conv.assignedAgentId?.toString() === userId;
            if (filter === 'closed') return conv.status === 'Closed';
            return true;
          });
        }
        
        setConversations(conversations);
      })
      .catch(console.error);

    onNewHumanRequest(handleHumanRequest);
    onConversationCreated(handleNewConvo);
    onNewMessage(handleNewMessage);

    return () => {
      mounted = false;
      offNewHumanRequest(handleHumanRequest);
      offConversationCreated(handleNewConvo);
      offNewMessage(handleNewMessage);
    };
  }, [
    filter,
    isAdmin,
    userId,
    handleHumanRequest,
    handleNewConvo,
    handleNewMessage,
    onNewHumanRequest,
    onConversationCreated,
    onNewMessage,
    offNewHumanRequest,
    offConversationCreated,
    offNewMessage
  ]);

  return conversations;
}