import { useSignalR } from "@/Context/SignalRContext";
import type { ConversationDto } from "@/Interfaces/Chat/ChatInterfaces";
import {
  getConversation,
  getConversationToneAsync,
  updateTag,
} from "@/Services/ConversationService";
import React, { useEffect, useState, useCallback } from "react";

export function useContactDetail(conversationId: number) {
  const [conv, setConv] = useState<ConversationDto | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [conversationTone, setConversationTone] =
    useState<string>("No disponible");

  const signalR = useSignalR();

  const getConversatioToneMethod = useCallback(
    async (conversationId: number): Promise<string> => {
      const toneResponse = await getConversationToneAsync(conversationId);
      const tone = Number(toneResponse);

      if (!tone) return "No disponible";
      if (tone < 0 || tone > 5) return "No disponible";

      if (tone == 1) return "Excelente";
      if (tone == 2) return "Bueno";
      if (tone == 3) return "Aceptable";
      if (tone == 4) return "Deficiente";
      if (tone == 5) return "Muy deficiente";
      return "No disponible";
    },
    []
  );

  // Carga o recarga datos de la conversación
  const fetchDetail = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getConversation(id);
      setConv(res.data.data);
      setTags(res.data.data.tags ?? []);
    } catch (err) {
      console.error(err);
      setError("Error al cargar los detalles de la conversación.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Persistir cambio de etiquetas
  const saveTags = useCallback(
    async (newTags: string[]) => {
      if (!conv) return;
      try {
        setTags(newTags);
        updateTag(conv.conversationId, newTags);
        setConv((v) => (v ? { ...v, tags: newTags } : v));
      } catch (err) {
        console.error("Error al guardar etiquetas:", err);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [conv]
  );

  const handleAddTag = () => {
    const name = newTag.trim();
    if (!name) return;
    saveTags([...tags, name]);
    setNewTag("");
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tag: string) => {
    saveTags(tags.filter((t) => t !== tag));
  };

  useEffect(() => {
    if (!conversationId) {
      setConv(null);
      setTags([]);
      return;
    }

    fetchDetail(conversationId);

    getConversatioToneMethod(conversationId).then((tone) => {
      setConversationTone(tone);
    });

    const handler = (updated: ConversationDto) => {
      if (updated.conversationId === conversationId) {
        setConv(updated);
        setTags(updated.tags ?? []);
      }
    };

    // Handle SignalR events if available
    if (signalR.onConversationUpdated) {
      signalR.onConversationUpdated(handler);
    }
    if (signalR.onConversationCreated) {
      signalR.onConversationCreated(handler);
    }

    return () => {
      if (signalR.offConversationUpdated) {
        signalR.offConversationUpdated(handler);
      }
      if (signalR.offConversationCreated) {
        signalR.offConversationCreated(handler);
      }
    };
  }, [conversationId, fetchDetail, getConversatioToneMethod, signalR]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTag();
    } else if (e.key === "Escape") {
      setIsAddingTag(false);
      setNewTag("");
    }
  };

  return {
    showHistoryModal,
    newTag,
    isAddingTag,
    tags,
    conversationTone,
    conv,
    loading,
    error,
    handleKeyDown,
    handleAddTag,
    setNewTag,
    setIsAddingTag,
    setShowHistoryModal,
    handleRemoveTag,
    fetchDetail,
  };
}