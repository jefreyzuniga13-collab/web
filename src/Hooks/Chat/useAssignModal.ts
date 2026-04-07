import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import type { AppDispatch, RootState } from "@/Context";
import { closeAssignModal } from "@/Context/Slices/Chat/assignModalSlice";
import {
  CONVERSATION_STATUS,
  CONVERSATION_STATUS_OPTIONS,
} from "@/Constants/conversation";
import { QUERY_KEYS } from "@/Constants/queryKeys";
import { useUserPresence } from "@/Hooks/Auth/useUserPresence";
import type {
  AgentDto,
  ConversationDto,
  ConversationStatus,
} from "@/Interfaces/Chat/ChatInterfaces";
import { getAgents } from "@/Services/auth/AgentService";
import {
  assignAgent,
  closeConversation as apiCloseConversation,
} from "@/Services/chat/ConversationService";
import { handleMutationError } from "@/Utils/Https/handleMutationError";

type SafeConversation = {
  conversationId: number;
  status: ConversationStatus;
  assignedAgentId: number;
};

type AssignModalHook = {
  isDropdownOpen: boolean;
  statusOptions: { value: ConversationStatus; label: string; color: string }[];
  isOpen: boolean;
  selectedAgent: string;
  selectedAgentData: AgentDto | null;
  agents: AgentDto[];
  selectedIsOnline: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  setSelectedAgent: (agentId: string) => void;
  handleAssign: () => Promise<void>;
  handleStatusChange: (newStatus: ConversationStatus) => void;
  handleClose: () => void;
  loading: boolean;
};

type AssignModalState = {
  isOpen: boolean;
  conversation?: ConversationDto | null;
};

type AgentsResponse = {
  data: {
    data: AgentDto[];
  };
};

function normalizeConversation(
  conversation: ConversationDto | null | undefined
): SafeConversation | null {
  if (!conversation) {
    return null;
  }

  return {
    conversationId: conversation.conversationId,
    status: conversation.status,
    assignedAgentId:
      typeof conversation.assignedAgentId === "number" &&
      Number.isFinite(conversation.assignedAgentId)
        ? conversation.assignedAgentId
        : 0,
  };
}

export function useAssignModal(): AssignModalHook {
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();

  const { isOpen, conversation } = useSelector(
    (state: RootState): AssignModalState => state.assignModal
  );

  const safeConversation = normalizeConversation(conversation);

  const [selectedAgent, setSelectedAgent] = useState("");
  const [status, setStatus] = useState<ConversationStatus>(
    CONVERSATION_STATUS.BOT
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const selectedAgentId = selectedAgent !== "" ? Number(selectedAgent) : 0;
  const { isOnline: selectedIsOnline } = useUserPresence(selectedAgentId);

  const { data: agents = [], isFetching } = useQuery<AgentDto[]>({
    queryKey: QUERY_KEYS.agents,
    enabled: isOpen,
    queryFn: async () => {
      const response = (await getAgents()) as AgentsResponse;
      return response.data.data;
    },
  });

  useEffect(() => {
    if (!safeConversation) {
      setSelectedAgent("");
      setStatus(CONVERSATION_STATUS.BOT);
      return;
    }

    setSelectedAgent(
      safeConversation.assignedAgentId > 0
        ? safeConversation.assignedAgentId.toString()
        : ""
    );
    setStatus(safeConversation.status);
  }, [safeConversation]);

  const assignMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!safeConversation) {
        return;
      }

      if (status === CONVERSATION_STATUS.CLOSED) {
        await apiCloseConversation(safeConversation.conversationId);
        return;
      }

      if (status === CONVERSATION_STATUS.HUMAN) {
        await assignAgent(
          safeConversation.conversationId,
          selectedAgent,
          status
        );
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.conversations,
      });

      toast.success(
        status === CONVERSATION_STATUS.CLOSED
          ? "Conversación cerrada correctamente."
          : "Agente asignado correctamente."
      );

      dispatch(closeAssignModal());
    },
    onError: handleMutationError,
  });

  const handleStatusChange = (newStatus: ConversationStatus) => {
    if (newStatus === CONVERSATION_STATUS.HUMAN) {
      if (selectedAgent === "") {
        toast.warn("Debes seleccionar un agente.");
        return;
      }

      if (!selectedIsOnline) {
        toast.warn("Agente desconectado.");
        return;
      }
    }

    if (newStatus === CONVERSATION_STATUS.BOT && selectedAgent !== "") {
      toast.warn("No puedes usar Bot con agente.");
      return;
    }

    setStatus(newStatus);
  };

  const handleAssign = async () => {
    if (!safeConversation) {
      return;
    }

    await assignMutation.mutateAsync();
  };

  const handleClose = () => {
    dispatch(closeAssignModal());
  };

  const selectedAgentData =
    agents.find((agent) => agent.userId.toString() === selectedAgent) ?? null;

  return {
    isDropdownOpen,
    statusOptions: CONVERSATION_STATUS_OPTIONS,
    isOpen,
    selectedAgent,
    selectedAgentData,
    agents,
    selectedIsOnline,
    setIsDropdownOpen,
    setSelectedAgent,
    handleAssign,
    handleStatusChange,
    handleClose,
    loading: assignMutation.isPending || isFetching,
  };
}