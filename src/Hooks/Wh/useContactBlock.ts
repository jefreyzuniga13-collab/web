import { useMutation, 
  // useQuery,
   useQueryClient } from "@tanstack/react-query";
import {
  blockWhatsapp,
  unblockWhatsapp,
  // getWhatsappBlocks,
  blockMessenger,
  unblockMessenger,
  blockInstagram,
  unblockInstagram,
} from "@/Services/chat/MessageService";
import { type ChannelType, CHANNEL } from "@/Interfaces/Wh/MetaChannelId";

type BlockPayload = {
  channel: ChannelType;
  identifier: string;
};

const whatsappBlocksKey = ["whatsapp-blocks"];

export function useContactBlock() {
  const queryClient = useQueryClient();

  // const whatsappBlocksQuery = useQuery({
  //   queryKey: whatsappBlocksKey,
  //   queryFn: async () => {
  //     const res = await getWhatsappBlocks();
  //     return res.data.data;
  //   },
  //   staleTime: 1000 * 60 * 2
  // });

  const blockMutation = useMutation({
    mutationFn: async ({ channel, identifier }: BlockPayload) => {
      if (!identifier?.trim()) {
        throw new Error("Identificador requerido.");
      }

      const cleanId = identifier.trim();

      switch (channel) {
        case CHANNEL.Whatsapp:
          return await blockWhatsapp(cleanId);

        case CHANNEL.Messenger:
          return await blockMessenger(cleanId);

        case CHANNEL.Instagram:
          return await blockInstagram(cleanId);

        default:
          throw new Error("Canal no soportado.");
      }
    },
    onSuccess: (_, variables) => {
      if (variables.channel === CHANNEL.Whatsapp) {
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
        case CHANNEL.Whatsapp:
          return await unblockWhatsapp(cleanId);

        case CHANNEL.Messenger:
          return await unblockMessenger(cleanId);

        case CHANNEL.Instagram:
          return await unblockInstagram(cleanId);

        default:
          throw new Error("Canal no soportado.");
      }
    },
    onSuccess: (_, variables) => {
      if (variables.channel === CHANNEL.Whatsapp) {
        queryClient.invalidateQueries({ queryKey: whatsappBlocksKey });
      }
    },
  });


  return {
    // whatsappBlockedNumbers: whatsappBlocksQuery.data ?? [],
    // isLoadingWhatsappBlocks: whatsappBlocksQuery.isLoading,
    // refetchWhatsappBlocks: whatsappBlocksQuery.refetch,
    blockContact: blockMutation.mutateAsync,
    unblockContact: unblockMutation.mutateAsync,
    isBlocking: blockMutation.isPending,
    isUnblocking: unblockMutation.isPending,
    blockError: blockMutation.error,
    unblockError: unblockMutation.error,
  };
}