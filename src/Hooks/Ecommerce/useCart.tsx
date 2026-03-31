import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { CartService } from "@/Services/Ecommerce/CartService";
import type { SendLinkRequestDto } from "@/Interfaces/Ecommerce/SendLinkInterface";
import type { ApiPCGResponse } from "@/Interfaces/Common/GlobalPCGInterface";

export const useCart = () => {
  const sendMessageLinkMutation = useMutation<
    ApiPCGResponse<boolean>,
    Error,
    SendLinkRequestDto
  >({
    mutationFn: async (req) => {
      const response = await CartService.SendMessageLink(req);

      if (!response.success) {
        throw new Error(response.message);
      }

      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message);
    },
    onError: (error) => {
      toast.error(error.message);
      console.error("Error. Company request.", error);
    },
  });

  const getMessageLinkMutation = useMutation<
    ApiPCGResponse<string>,
    Error,
    SendLinkRequestDto
  >({
    mutationFn: async (req) => {
      const response = await CartService.GetMessageLink(req);

      if (!response.success) {
        throw new Error(response.message);
      }

      return response;
    },
    onError: (error) => {
      toast.error(error.message);
      console.error("Error. Company request.", error);
    },
  });

  return {
    cart: sendMessageLinkMutation.data?.data ?? false,
    messageLink: getMessageLinkMutation.data?.data ?? null,
    sendMessageLink: sendMessageLinkMutation.mutate,
    sendMessageLinkAsync: sendMessageLinkMutation.mutateAsync,

    getMessageLink: getMessageLinkMutation.mutate,
    getMessageLinkAsync: getMessageLinkMutation.mutateAsync,

    loading:
      sendMessageLinkMutation.isPending || getMessageLinkMutation.isPending,

    error: sendMessageLinkMutation.error || getMessageLinkMutation.error,

    resetSendMessageLink: sendMessageLinkMutation.reset,
    resetGetMessageLink: getMessageLinkMutation.reset,
  };
};