import React, { useState, useEffect } from "react";
import { useSignalR as useSignalRContext } from "@/Context/SignalRContext"; 
import AssignedModal from "@/Components/Chat/AssignedModal";
import { jwtDecode } from "jwt-decode";
// import { useConversations } from "@/Hooks/useConversations";
import type { ConversationDto } from "@/Interfaces/Chat/ChatInterfaces";

// interface AssignPayload {
//   conversationId: number;
//   assignedAgentId: number;
// }

export const ChatPage: React.FC = () => {
//   const { conversations, loading, error, reload } = useConversations();

  const authRaw = localStorage.getItem("auth") || "{}";
  const { accessToken } = JSON.parse(authRaw) as { accessToken: string };
  const { sub: currentUserId } = jwtDecode<{ sub: string }>(accessToken);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignConversationId, setAssignConversationId] = useState<number | null>(null);

  const {
    onConversationUpdated,
    offConversationUpdated,
  } = useSignalRContext();

  const handleAssignNotification = (payload: ConversationDto) => {

    if (
      payload.assignmentStatus === "Assigned" &&
      payload.assignedAgentId === Number(currentUserId)
    ) {
      setAssignConversationId(payload.conversationId);
      setShowAssignModal(true);
    }
  };

  useEffect(() => {
    onConversationUpdated(handleAssignNotification);

    return () => {
      offConversationUpdated(handleAssignNotification);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onConversationUpdated, offConversationUpdated, currentUserId]);

  const handleModalClose = () => {
    setShowAssignModal(false);
    setAssignConversationId(null);
  };

  return (
    <div>
      {showAssignModal && assignConversationId !== null && (
        <AssignedModal
          conversationId={assignConversationId}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};