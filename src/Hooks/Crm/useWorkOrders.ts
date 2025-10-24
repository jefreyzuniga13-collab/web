/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkOrderService } from "@/Services/Crm/WorkOrderService";
import type { PagedResponse } from "@/Interfaces/GlobalInterface";
import type {
  WorkOrderRequestDto,
  WorkOrderResponseDto,
} from "@/Interfaces/Crm/WorkOrderInterface";

export function useWorkOrders(initialFilter = "") {
  const [filter, setFilter] = useState(initialFilter);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [data, setData] = useState<PagedResponse<WorkOrderResponseDto> | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(
    async (f = filter, p = page, s = size) => {
      setLoading(true);
      setError(null);
      try {
        const res = await WorkOrderService.getAllAsync(f, p, s);
        setData(res);
        setPage(res.meta.currentPage);
        setSize(res.meta.pageSize);
      } catch (e: any) {
        setError(e);
      } finally {
        setLoading(false);
      }
    },
    [filter, page, size]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo(() => data?.items ?? [], [data]);
  const total = data?.meta.totalCount ?? 0;

  const getById = useCallback(
    (id: number) => WorkOrderService.getByIdAsync(id),
    []
  );
  const create = useCallback(
    (v: WorkOrderRequestDto) => WorkOrderService.createAsync(v),
    []
  );
  const update = useCallback(
    (id: number, v: WorkOrderRequestDto) => WorkOrderService.updateAsync(id, v),
    []
  );
  const toggle = useCallback(
    (id: number) => WorkOrderService.toggleStatusAsync(id),
    []
  );
  const setPagination = useCallback((p: number, s: number) => {
    setPage(p);
    setSize(s);
  }, []);

  return {
    filter,
    setFilter,
    page,
    size,
    items,
    total,
    loading,
    error,
    load,
    getById,
    create,
    update,
    toggle,
    setPagination,
  };
}