import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  blockWhatsapp,
  unblockWhatsapp,
  getWhatsappBlocks,
  blockMessenger,
  unblockMessenger,
  moveMessengerToSpam,
  blockInstagram,
  unblockInstagram,
  moveInstagramToSpam,
} from "@/Services/chat/MessageService";

type ChannelType = "whatsapp" | "messenger" | "instagram";

type BlockPayload = {
  channel: ChannelType;
  identifier: string;
};

const whatsappBlocksKey = ["whatsapp-blocks"];

export function useContactBlock() {
  const queryClient = useQueryClient();

  const whatsappBlocksQuery = useQuery({
    queryKey: whatsappBlocksKey,
    queryFn: async () => {
      const res = await getWhatsappBlocks();
      return res.data.data;
    },
    staleTime: 1000 * 60 * 2,
  });

  const blockMutation = useMutation({
    mutationFn: async ({ channel, identifier }: BlockPayload) => {
      if (!identifier?.trim()) {
        throw new Error("Identificador requerido.");
      }

      const cleanId = identifier.trim();

      switch (channel) {
        case "whatsapp":
          return await blockWhatsapp(cleanId);

        case "messenger":
          return await blockMessenger(cleanId);

        case "instagram":
          return await blockInstagram(cleanId);

        default:
          throw new Error("Canal no soportado.");
      }
    },
    onSuccess: (_, variables) => {
      if (variables.channel === "whatsapp") {
        queryClient.invalidateQueries({ queryKey: whatsappBlocksKey });
      }
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async ({ channel, identifier }: BlockPayload) => {
      if (!identifier?.trim()) {
        throw new Error("Identificador requerido.");
      }

      const cleanId = identifier.trim();

      switch (channel) {
        case "whatsapp":
          return await unblockWhatsapp(cleanId);

        case "messenger":
          return await unblockMessenger(cleanId);

        case "instagram":
          return await unblockInstagram(cleanId);

        default:
          throw new Error("Canal no soportado.");
      }
    },
    onSuccess: (_, variables) => {
      if (variables.channel === "whatsapp") {
        queryClient.invalidateQueries({ queryKey: whatsappBlocksKey });
      }
    },
  });

  const moveToSpamMutation = useMutation({
    mutationFn: async ({ channel, identifier }: BlockPayload) => {
      if (!identifier?.trim()) {
        throw new Error("Identificador requerido.");
      }

      const cleanId = identifier.trim();

      switch (channel) {
        case "messenger":
          return await moveMessengerToSpam(cleanId);

        case "instagram":
          return await moveInstagramToSpam(cleanId);

        case "whatsapp":
          throw new Error("WhatsApp no usa este endpoint de spam.");

        default:
          throw new Error("Canal no soportado.");
      }
    },
  });

  return {
    whatsappBlockedNumbers: whatsappBlocksQuery.data ?? [],
    isLoadingWhatsappBlocks: whatsappBlocksQuery.isLoading,
    refetchWhatsappBlocks: whatsappBlocksQuery.refetch,

    blockContact: blockMutation.mutateAsync,
    unblockContact: unblockMutation.mutateAsync,
    moveContactToSpam: moveToSpamMutation.mutateAsync,

    isBlocking: blockMutation.isPending,
    isUnblocking: unblockMutation.isPending,
    isMovingToSpam: moveToSpamMutation.isPending,

    blockError: blockMutation.error,
    unblockError: unblockMutation.error,
    moveToSpamError: moveToSpamMutation.error,
  };
}