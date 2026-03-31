import { useMutation } from "@tanstack/react-query";
import type { UserEcommerceDto } from "@/Interfaces/Ecommerce/UserEcommerceInterface";
import { UserEcommerceService } from "@/Services/Ecommerce/UserEcommerceService";
import { toast } from "react-toastify";
import type { ApiPCGResponse } from "@/Interfaces/Common/GlobalPCGInterface";
export const useUserEcommerce = () => {
    
  const mutation = useMutation<
    ApiPCGResponse<number>,
    Error,
    UserEcommerceDto
  >({
    mutationFn: async (req) => {
      const res = await UserEcommerceService.Create(req);

      if (!res.success) {
        throw new Error(res.message);
      }

      return res;
    },
    onSuccess: (response) => {
      toast.success(response.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    userEcommerce: mutation.data?.data ?? null,
    response: mutation.data ?? null,
    loading: mutation.isPending,
    error: mutation.error,
    createAsync: mutation.mutateAsync,
    create: mutation.mutate,
    reset: mutation.reset,
  };
};