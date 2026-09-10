import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contactService } from "@/Services/auth/ContactService";
import type {
  ContactClassificationGroupProj,
  ContactLogProj,
} from "@/Interfaces/Auth/ContactLogProj";
import type { PagedResponse } from "@/Interfaces/Common/GlobalInterface";
import { toast } from "react-toastify";

const contactClassificationKeys = {
  all: ["contact-classification"] as const,

  kanban: (filter: string, itemsPerColumn: number) =>
    [...contactClassificationKeys.all, "kanban", filter, itemsPerColumn] as const,
};

export default function useContactClassificationKanban() {
  const queryClient = useQueryClient();

  const [globalFilter, setGlobalFilterState] = useState("");
  const [itemsPerColumn, setItemsPerColumn] = useState(30);
  const [loadingColumnId, setLoadingColumnId] = useState<number | null>(null);

  const {
    data: kanbanData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<ContactClassificationGroupProj[], Error>({
    queryKey: contactClassificationKeys.kanban(globalFilter, itemsPerColumn),
    queryFn: () =>
      contactService.getContactClassificationKanban(
        globalFilter,
        itemsPerColumn
      ),
    staleTime: 1000 * 60 * 3,
  });

  const loadMoreMutation = useMutation<
    {
      columnId: number;
      response: PagedResponse<ContactLogProj>;
      nextPage: number;
      pageSize: number;
    },
    Error,
    {
      columnId: number;
      nextPage: number;
      pageSize: number;
    }
  >({
    mutationFn: async ({ columnId, nextPage, pageSize }) => {
      setLoadingColumnId(columnId);

      const response = await contactService.getContactClassificationKanbanItems(
        globalFilter,
        columnId,
        nextPage,
        pageSize
      );

      return {
        columnId,
        response,
        nextPage,
        pageSize,
      };
    },

    onSuccess: ({ columnId, response, nextPage, pageSize }) => {
      queryClient.setQueryData<ContactClassificationGroupProj[]>(
        contactClassificationKeys.kanban(globalFilter, itemsPerColumn),
        old => {
          if (!old) return old;

          return old.map(column => {
            if (column.contactClassificationId !== columnId) {
              return column;
            }

            const currentItems = column.items ?? [];
            const newItems = response.items ?? [];

            const mergedItems = [
              ...currentItems,
              ...newItems.filter(
                item => !currentItems.some(current => current.id === item.id)
              ),
            ];

            const total = response.meta?.totalCount ?? column.total;

            return {
              ...column,
              items: mergedItems,
              total,
              pageNumber: nextPage,
              pageSize,
              hasMore: mergedItems.length < total,
            };
          });
        }
      );
    },

    onError: () => {
      toast.error("Error al cargar más contactos de la clasificación");
    },

    onSettled: () => {
      setLoadingColumnId(null);
    },
  });

  const reclassifyMutation = useMutation({
    mutationFn: () => contactService.reclassifyContactsAsync(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: contactClassificationKeys.all,
      });
      toast.success("Tipificación actualizada.");
    },
    onError: () => {
      toast.error("No se pudo actualizar la tipificación.");
    },
  });

  const setGlobalFilter = useCallback((value: string) => {
    setGlobalFilterState(value);
  }, []);

  const reclassify = useCallback(() => {
    if (reclassifyMutation.isPending) return;
    return reclassifyMutation.mutateAsync();
  }, [reclassifyMutation]);

  const loadMoreColumn = useCallback(
    async (column: ContactClassificationGroupProj) => {
      if (!column.hasMore) return;
      if (loadMoreMutation.isPending) return;

      const nextPage = (column.pageNumber ?? 1) + 1;
      const pageSize = column.pageSize || itemsPerColumn;

      await loadMoreMutation.mutateAsync({
        columnId: column.contactClassificationId,
        nextPage,
        pageSize,
      });
    },
    [itemsPerColumn, loadMoreMutation]
  );

  const columns = useMemo(() => kanbanData ?? [], [kanbanData]);

  return {
    columns,
    globalFilter,
    itemsPerColumn,
    loading: isLoading || isFetching,
    loadingMore: loadMoreMutation.isPending,
    loadingColumnId,
    error,
    setGlobalFilter,
    setItemsPerColumn,
    loadMoreColumn,
    reclassify,
    reclassifying: reclassifyMutation.isPending,
    refetch,
  };
}