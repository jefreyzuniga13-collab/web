/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { UserSessionService } from "@/Services/auth/UserSessionService";
import type { UserSessionResponseDto } from "@/Interfaces/Auth/UserSession";

export const useUserSession = () => {
  const [sessions, setSessions] = useState<UserSessionResponseDto[]>([]);
  const [selectedSession, setSelectedSession] = useState<UserSessionResponseDto | null>(null);
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingItem, setLoadingItem] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const fetchPage = useCallback(
    async (p = page, s = pageSize) => {
      setLoadingList(true);
      setError(null);
      try {
        const resp = await UserSessionService.getAll(p, s, globalFilter);

        const items =
          (resp as any).items ??
          (resp as any).data ??
          [];

        const meta = (resp as any).meta ?? (resp as any).metaData ?? {};
        setSessions(items);
        setTotalCount(meta.totalCount ?? 0);
        setPageState(meta.currentPage ?? p);
        setPageSizeState(meta.pageSize ?? s);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoadingList(false);
      }
    },
    [globalFilter, page, pageSize]
  );

  const fetchById = useCallback(async (id: number) => {
    setLoadingItem(true);
    setError(null);
    try {
      const us = await UserSessionService.getById(id);
      setSelectedSession(us);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoadingItem(false);
    }
  }, []);

  const toggleStatus = useCallback(async (id: number) => {
    setLoadingItem(true);
    setError(null);
    try {
      const updated = await UserSessionService.toggle(id);
      setSessions(list => list.map(s => (s.id === updated.id ? updated : s)));
    } catch (err: any) {
      setError(err);
    } finally {
      setLoadingItem(false);
    }
  }, []);

  const openView = useCallback(
    (id: number) => {
      const cached = sessions.find(s => s.id === id) || null;
      setSelectedSession(cached);
      setIsModalOpen(true);
      fetchById(id);
    },
    [sessions, fetchById]
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedSession(null);
  }, []);

  const exportPdf = useCallback(async (id: number, title?: string, subtitle?: string) => {
    await UserSessionService.exportPdf({
      sessionId: id,
      title,
      subtitle,
    });
  }, []);

  useEffect(() => {
    fetchPage();
  }, [fetchPage, globalFilter]);

  return {
    sessions,
    selectedSession,
    loading: loadingList || loadingItem,
    loadingList,
    error,
    page,
    pageSize,
    totalCount,
    setPage: (p: number) => fetchPage(p, pageSize),
    setPageSize: (s: number) => fetchPage(1, s),
    isModalOpen,
    openView,
    closeModal,
    toggleStatus,
    exportPdf,
    globalFilter,
    setGlobalFilter,
  };
};