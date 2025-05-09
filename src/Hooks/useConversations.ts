import { useEffect, useState } from 'react';
import { getConversations } from '@/Utils/ApiConfig';
import type{ ConversationDto } from '@/Interfaces/Chat/ChatInterfaces';
//import { ApiResponse } from '../utils/ApiResponse';

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationDto[]>([]);

  useEffect(() => {
    getConversations()
      .then(res => setConversations(res.data.data))
      .catch(console.error);
  }, []);

  return conversations;
}