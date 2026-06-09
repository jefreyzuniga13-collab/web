import { useState, useEffect, useCallback } from "react";
import { selectIsAdmin, selectUserId } from "@/Context/Slices/Auth/authSlice";
import { useSignalR } from "@/Context/SignalRContext";
import type { ConversationDto,  MessageDto, AttachmentDto } from "@/Interfaces/Chat/ChatInterfaces";
import type { PaginationInfo } from "@/Interfaces/Common/GlobalInterface";
import { joinConversation} from "@/Services/signalr";
import { ConversationService } from "@/Services/chat/ConversationService";
import { useSelector } from "react-redux";

export type Filter =
  | "all"
  | "bot"
  | "waiting"
  | "human"
  | "closed"
  | "incomplete"
  | "paused";

export interface FormInterface {
  validFrom: Date | null;
  validTo: Date | null;
}

export interface UseConversationsResult {
  conversations: ConversationDto[];
  loading: boolean;
  error?: string;
  form: FormInterface;
  handleDate: (field: keyof FormInterface, d: Date | null) => void;
  applyDateFilter: () => void;
  clearFilter: () => void;
  page: number;
  pageSize: number;
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const initialRange = (): FormInterface => {
  const f = localStorage.getItem("convFrom");
  const t = localStorage.getItem("convTo");

  return f && t
    ? { validFrom: new Date(f), validTo: new Date(t) }
    : { validFrom: null, validTo: null };
};

const safeTime = (value?: string | null): number => {
  if (!value) return 0;

  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
};

export function useConversations(
  filter: Filter = "all",
  searchConversation: string
): UseConversationsResult {
  const isAdmin = useSelector(selectIsAdmin);
  const userId = useSelector(selectUserId);
  const [form, setForm] = useState<FormInterface>(initialRange());
  const [appliedRange, setAppliedRange] = useState<FormInterface>(initialRange());
  const [conversations, setConversations] = useState<ConversationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
  });

  const toApiState = (f: Filter) => (f === "all" ? undefined : f);

  const {
    onConversationCreated,
    offConversationCreated,
    onConversationUpdated,
    offConversationUpdated,
    onNewMessage,
    offNewMessage,
    onNewHumanRequest,
    offNewHumanRequest,
  } = useSignalR();

  const activityTs = useCallback((c: ConversationDto) => {
    const ts = Math.max(
      safeTime(c.lastActivity),
      safeTime(c.updatedAt),
      safeTime(c.clientLastMessageAt),
      safeTime(c.agentLastMessageAt),
      safeTime(c.createdAt)
    );

    return ts;
  }, []);

  const sortByActivity = useCallback(
    (list: ConversationDto[]) => {
      const sorted = [...list].sort((a, b) => activityTs(b) - activityTs(a));

      console.log("[useConversations] sortByActivity", {
        count: sorted.length,
        ids: sorted.map((x) => ({
          conversationId: x.conversationId,
          clientContactId: x.clientContactId,
          status: x.status,
          lastActivity: x.lastActivity,
        })),
      });

      return sorted;
    },
    [activityTs]
  );

  const dedupeByClientKeepNewest = useCallback(
    (list: ConversationDto[]) => {
      const map = new Map<number, ConversationDto>();

      for (const c of list) {
        const key = Number(c.clientContactId ?? c.conversationId ?? 0);
        const prev = map.get(key);

        if (!prev || activityTs(c) >= activityTs(prev)) {
          map.set(key, c);
        }
      }

      const result = sortByActivity(Array.from(map.values()));

      console.log("[useConversations] dedupeByClientKeepNewest", {
        input: list.length,
        output: result.length,
        ids: result.map((x) => ({
          conversationId: x.conversationId,
          clientContactId: x.clientContactId,
          status: x.status,
        })),
      });

      return result;
    },
    [activityTs, sortByActivity]
  );

  const matchesFilter = useCallback(
    (c: ConversationDto) => {
      let matches = true;

      switch (filter) {
        case "waiting":
          matches = c.status === "Waiting";
          break;
        case "bot":
          matches = c.status === "Bot";
          break;
        case "human":
          matches = c.status === "Human";
          break;
        case "closed":
          matches = c.status === "Closed";
          break;
        case "incomplete":
          matches = c.status === "Incomplete";
          break;
        case "paused":
          matches = c.status === "Paused";
          break;
        default:
          matches = true;
          break;
      }

      console.log("[useConversations] matchesFilter", {
        filter,
        conversationId: c.conversationId,
        status: c.status,
        matches,
      });

      return matches;
    },
    [filter]
  );

  const normalizeConversation = useCallback(
    (c: ConversationDto): ConversationDto => {
      const normalized = {
        ...c,
        lastActivity:
          c.lastActivity ??
          c.clientLastMessageAt ??
          c.agentLastMessageAt ??
          c.updatedAt ??
          c.createdAt,
        unreadCount: c.unreadCount ?? 0,
      };

      console.log("[useConversations] normalizeConversation", {
        conversationId: normalized.conversationId,
        clientContactId: normalized.clientContactId,
        status: normalized.status,
        lastActivity: normalized.lastActivity,
        unreadCount: normalized.unreadCount,
      });

      return normalized;
    },
    []
  );

  const mergeConversation = useCallback(
    (
      current: ConversationDto | undefined,
      updated: ConversationDto
    ): ConversationDto => {
      const merged = {
        ...current,
        ...updated,
        assignedAgentId:
          updated.assignedAgentId ?? current?.assignedAgentId ?? undefined,
        assignedByUserId:
          updated.assignedByUserId ?? current?.assignedByUserId ?? undefined,
        clientContactId:
          updated.clientContactId ?? current?.clientContactId ?? undefined,
        lastActivity:
          updated.lastActivity ??
          updated.clientLastMessageAt ??
          updated.agentLastMessageAt ??
          updated.updatedAt ??
          current?.lastActivity ??
          current?.clientLastMessageAt ??
          current?.agentLastMessageAt ??
          current?.updatedAt ??
          current?.createdAt ??
          updated.createdAt,
        unreadCount: updated.unreadCount ?? current?.unreadCount ?? 0,
      } as ConversationDto;

      const normalized = normalizeConversation(merged);

      console.log("[useConversations] mergeConversation", {
        current,
        updated,
        result: normalized,
      });

      return normalized;
    },
    [normalizeConversation]
  );

  const handleHumanRequest = useCallback(
    (payload: { conversationId: number }) => {
      console.log("[HOOK handleHumanRequest]", payload);

      setConversations((prev) => {
        const next = sortByActivity(
          prev.map((c) =>
            c.conversationId === payload.conversationId
              ? normalizeConversation({
                  ...c,
                  status: "Human" as ConversationDto["status"],
                  lastActivity:
                    c.lastActivity ??
                    c.updatedAt ??
                    c.clientLastMessageAt ??
                    c.createdAt,
                })
              : c
          )
        );

        console.log("[HOOK handleHumanRequest result]", next);
        return next;
      });
    },
    [normalizeConversation, sortByActivity]
  );


  const handleUpdatedConvo = useCallback(
  (updated: ConversationDto) => {
    const normalizedUpdated = normalizeConversation(updated);

    setConversations((prev) => {
      const current = prev.find(
        (p) => p.conversationId === normalizedUpdated.conversationId
      );

      const mergedConversation = mergeConversation(current, normalizedUpdated);

      void joinConversation(mergedConversation.conversationId);

      const base = prev.filter(
        (p) =>
          p.conversationId !== mergedConversation.conversationId &&
          p.clientContactId !== mergedConversation.clientContactId
      );

      const merged = matchesFilter(mergedConversation)
        ? [mergedConversation, ...base]
        : base;

      return dedupeByClientKeepNewest(merged);
    });
  },
  [
    dedupeByClientKeepNewest,
    matchesFilter,
    mergeConversation,
    normalizeConversation,
  ]
);
  
  const handleNewMessage = useCallback(
    (payload: { message: MessageDto; attachments: AttachmentDto[] }) => {
      console.log("[HOOK handleNewMessage received]", payload);

      const msg = payload.message;

      setConversations((prev) => {
        console.log("[HOOK handleNewMessage prev]", prev);

        const exists = prev.some((c) => c.conversationId === msg.conversationId);

        console.log("[HOOK handleNewMessage exists]", {
          conversationId: msg.conversationId,
          exists,
        });

        if (!exists) return prev;

        const updated = prev.map((c) => {
          if (c.conversationId !== msg.conversationId) return c;

          const isAssignedToMe =
            Number(c.assignedAgentId ?? 0) === Number(userId);

          const senderIsUser = Number(msg.senderUserId ?? 0) > 0;

          const unreadForAgent =
            senderIsUser || !isAssignedToMe
              ? c.unreadForAgent ?? 0
              : (c.unreadForAgent ?? 0) + 1;

          const unreadForAssigner =
            senderIsUser || isAssignedToMe
              ? c.unreadForAssigner ?? 0
              : (c.unreadForAssigner ?? 0) + 1;

          const nextConversation = normalizeConversation({
            ...c,
            totalMessages: (c.totalMessages ?? 0) + 1,
            updatedAt: msg.sentAt ?? c.updatedAt,
            lastActivity: msg.sentAt ?? c.lastActivity ?? c.updatedAt ?? c.createdAt,
            clientLastMessageAt: senderIsUser
              ? c.clientLastMessageAt
              : msg.sentAt ?? c.clientLastMessageAt,
            agentLastMessageAt: senderIsUser
              ? msg.sentAt ?? c.agentLastMessageAt
              : c.agentLastMessageAt,
            unreadCount: (c.unreadCount ?? 0) + 1,
            unreadForAgent,
            unreadForAssigner,
          } as ConversationDto);

          console.log("[HOOK handleNewMessage updated conversation]", nextConversation);

          return nextConversation;
        });

        const result = dedupeByClientKeepNewest(updated);

        console.log("[HOOK handleNewMessage result]", result);

        return result;
      });
    },
    [dedupeByClientKeepNewest, normalizeConversation, userId]
  );

  const handleNewConvo = useCallback(
    (newConvo: ConversationDto) => {
      console.log("[HOOK handleNewConvo received]", newConvo);

      const normalized = normalizeConversation(newConvo);

      if (!matchesFilter(normalized)) {
        console.log("[HOOK handleNewConvo ignored by filter]", {
          filter,
          conversationId: normalized.conversationId,
          status: normalized.status,
        });
        return;
      }

      console.log("[HOOK handleNewConvo joinConversation]", {
        conversationId: normalized.conversationId,
      });
      void joinConversation(normalized.conversationId);

      setConversations((prev) => {
        const base = prev.filter(
          (p) => p.clientContactId !== normalized.clientContactId
        );

        const result = dedupeByClientKeepNewest([normalized, ...base]);

        console.log("[HOOK handleNewConvo result]", result);

        return result;
      });
    },
    [dedupeByClientKeepNewest, filter, matchesFilter, normalizeConversation]
  );

  const handleDate = useCallback((field: keyof FormInterface, d: Date | null) => {
    console.log("[useConversations] handleDate", { field, value: d });
    setForm((f) => ({ ...f, [field]: d }));
  }, []);

  const applyDateFilter = useCallback(() => {
    console.log("[useConversations] applyDateFilter", { form });

    if (!form.validFrom && !form.validTo) return;

    setAppliedRange({
      validFrom: form.validFrom ? new Date(form.validFrom) : null,
      validTo: form.validTo ? new Date(form.validTo) : null,
    });

    setPage(1);
  }, [form]);

  const clearFilter = useCallback(() => {
    console.log("[useConversations] clearFilter");
    setForm({ validFrom: null, validTo: null });
    setAppliedRange({ validFrom: null, validTo: null });
    setPage(1);
  }, []);

  useEffect(() => {
    console.log("[useConversations] fetch effect", {
      filter,
      searchConversation,
      page,
      pageSize,
      appliedRange,
    });

    setLoading(true);
    setError("");

    ConversationService.getConversationsByRole(
      appliedRange.validFrom ?? undefined,
      appliedRange.validTo ?? undefined,
      searchConversation,
      page,
      pageSize,
      toApiState(filter)
    )
      .then((res) => {
        console.log("[useConversations] API response", res);

        const items = res.items.map((conv) =>
          normalizeConversation({
            ...conv,
            unreadCount: conv.unreadCount ?? 0,
          })
        );

        console.log("[useConversations] normalized API items", items);

        setPagination({
          currentPage: res.meta.currentPage,
          totalPages: res.meta.totalPages,
          totalItems: res.meta.totalCount,
          itemsPerPage: res.meta.pageSize,
        });

        setConversations((prev) => {
          const base = page === 1 ? [] : prev;
          const merged = [...base, ...items];
          const result = dedupeByClientKeepNewest(merged);

          console.log("[useConversations] setConversations from API", {
            prev,
            base,
            merged,
            result,
          });

          return result;
        });

        items.forEach((c) => {
          console.log("[useConversations] joinConversation from API", {
            conversationId: c.conversationId,
          });
          void joinConversation(c.conversationId);
        });
      })
      .catch((err) => {
        console.error("[useConversations] API error", err);
        setError(err.message);
      })
      .finally(() => {
        console.log("[useConversations] fetch finally");
        setLoading(false);
      });
  }, [
    appliedRange.validFrom,
    appliedRange.validTo,
    dedupeByClientKeepNewest,
    filter,
    normalizeConversation,
    page,
    pageSize,
    searchConversation,
  ]);

  useEffect(() => {
    console.log("[useConversations] register handlers", {
      isAdmin,
    });

    if (isAdmin) onConversationCreated(handleNewConvo);

    onConversationUpdated(handleUpdatedConvo);
    onNewMessage(handleNewMessage);
    onNewHumanRequest(handleHumanRequest);

    return () => {
      console.log("[useConversations] cleanup handlers");

      if (isAdmin) offConversationCreated(handleNewConvo);
      offConversationUpdated(handleUpdatedConvo);
      offNewMessage(handleNewMessage);
      offNewHumanRequest(handleHumanRequest);
    };
  }, [
    handleHumanRequest,
    handleNewConvo,
    handleNewMessage,
    handleUpdatedConvo,
    isAdmin,
    offConversationCreated,
    offConversationUpdated,
    offNewHumanRequest,
    offNewMessage,
    onConversationCreated,
    onConversationUpdated,
    onNewHumanRequest,
    onNewMessage,
  ]);

  useEffect(() => {
    console.log("[useConversations] reset list by filter/search", {
      filter,
      searchConversation,
    });

    setConversations([]);
    setPage(1);
  }, [filter, searchConversation]);

  useEffect(() => {
    console.log("[STATE conversations changed]", conversations);
  }, [conversations]);

  useEffect(() => {
    console.log("[STATE loading changed]", loading);
  }, [loading]);

  useEffect(() => {
    console.log("[STATE error changed]", error);
  }, [error]);

  useEffect(() => {
    console.log("[STATE pagination changed]", pagination);
  }, [pagination]);

  const onPageChange = useCallback((newPage: number) => {
    console.log("[useConversations] onPageChange", { from: page, to: newPage });
    setPage(newPage);
  }, [page]);

  const onPageSizeChange = useCallback((newSize: number) => {
    console.log("[useConversations] onPageSizeChange", {
      from: pageSize,
      to: newSize,
    });

    setPageSize(newSize);
    setPage(1);
  }, [pageSize]);

  return {
    conversations,
    loading,
    error,
    form,
    handleDate,
    applyDateFilter,
    clearFilter,
    page,
    pageSize,
    pagination,
    onPageChange,
    onPageSizeChange,
  };
}