import { useState, useEffect, useCallback } from 'react';
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces';
import { getConversation, updateTag } from '@/Services/ConversationService';
import { useSignalR } from '@/Context/SignalRContext';

interface UseContactDetailResult {
  conv: ConversationDto | null;
  tags: string[];
  newTag: string;
  loading: boolean;
  error: string | null;
  isAddingTag: boolean;
  showHistoryModal: boolean;
  setIsAddingTag: (adding: boolean) => void;
  setNewTag: (tag: string) => void;
  handleAddTag: () => void;
  handleRemoveTag: (tag: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  openHistoryModal: () => void;
  closeHistoryModal: () => void;
  retryFetch: () => void;
}

export function useContactDetail(conversationId?: number): UseContactDetailResult {
  const [conv, setConv] = useState<ConversationDto | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const signalR = useSignalR();

  const fetchDetail = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getConversation(conversationId);
      const data = res.data.data;
      setConv(data);
      setTags(data.tags ?? []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar los detalles de la conversación.');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const saveTags = useCallback(
    async (newTags: string[]) => {
      if (!conv) return;
      setTags(newTags);
      try {
        await updateTag(conv.conversationId, newTags);
        setConv((v) => (v ? { ...v, tags: newTags } : v));
      } catch (err) {
        console.error('Error al guardar etiquetas:', err);
      }
    },
    [conv],
  );

  const handleAddTag = useCallback(() => {
    const name = newTag.trim();
    if (!name) return;
    saveTags([...tags, name]);
    setNewTag('');
    setIsAddingTag(false);
  }, [newTag, saveTags, tags]);

  const handleRemoveTag = useCallback(
    (tag: string) => {
      saveTags(tags.filter((t) => t !== tag));
    },
    [saveTags, tags],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleAddTag();
      } else if (e.key === 'Escape') {
        setIsAddingTag(false);
        setNewTag('');
      }
    },
    [handleAddTag],
  );

  const openHistoryModal = useCallback(() => setShowHistoryModal(true), []);
  const closeHistoryModal = useCallback(() => setShowHistoryModal(false), []);
  const retryFetch = useCallback(() => void fetchDetail(), [fetchDetail]);

  useEffect(() => {
    if (!conversationId) {
      setConv(null);
      setTags([]);
      return;
    }
    fetchDetail();

    const handler = (updated: ConversationDto) => {
      if (updated.conversationId === conversationId) {
        setConv(updated);
        setTags(updated.tags ?? []);
      }
    };

    signalR.onConversationUpdated?.(handler);
    signalR.onConversationCreated?.(handler);

    return () => {
      signalR.offConversationUpdated?.(handler);
      signalR.offConversationCreated?.(handler);
    };
  }, [conversationId, fetchDetail, signalR]);

  return {
    conv,
    tags,
    newTag,
    loading,
    error,
    isAddingTag,
    showHistoryModal,
    setIsAddingTag,
    setNewTag,
    handleAddTag,
    handleRemoveTag,
    handleKeyDown,
    openHistoryModal,
    closeHistoryModal,
    retryFetch,
  };
}