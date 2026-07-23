import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { contactService } from "@/Services/auth/ContactService";
import { formatNiPhone, displayOrDash, formatDate } from "@/Utils/formatters";
import { useDetailTabs } from "@/Hooks/DetailPanel/useDetailTabs";
import { useQuickReplies } from "@/Hooks/DetailPanel/useQuickReplies";

const CONTACT_STALE_TIME = 1000 * 60 * 5;
const CONTACT_GC_TIME = 1000 * 60 * 30;

const contactDetailKey = (contactId: number) =>
  ["contacts", "detail", contactId] as const;

export const useDetailPanel = (
  contactId?: number,
  selectedParam?: unknown
) => {
  const normalizedContactId = Number(contactId ?? 0);

  const { optionMenu, setOptionMenu } = useDetailTabs(selectedParam);

  const {
    qQuick,
    setQQuick,
    quickOptions,
    filteredQuick,
    handleSendQuick,
  } = useQuickReplies(selectedParam);

  /*
   * Se suscribe directamente a la misma caché utilizada por useContact.
   * De esta forma SupportPage y DetailPanel no mantienen dos cargas
   * independientes para el mismo contacto.
   */
  const contactQuery = useQuery({
    queryKey: contactDetailKey(normalizedContactId),
    enabled: normalizedContactId > 0,
    queryFn: () =>
      contactService.getContactByIdAsync(normalizedContactId),
    staleTime: CONTACT_STALE_TIME,
    gcTime: CONTACT_GC_TIME,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const refreshContact = useCallback(async () => {
    if (normalizedContactId <= 0) {
      return null;
    }

    const result = await contactQuery.refetch();

    return result.data ?? null;
  }, [contactQuery, normalizedContactId]);

  return {
    optionMenu,
    setOptionMenu,

    selectedData: contactQuery.data ?? null,
    loadingContact: contactQuery.isPending,
    fetchingContact: contactQuery.isFetching,
    contactError:
      contactQuery.error instanceof Error
        ? contactQuery.error
        : null,

    qQuick,
    setQQuick,
    quickOptions,
    filteredQuick,
    refreshContact,
    handleSendQuick,

    formatNiPhone,
    displayOrDash,
    formatDate,
  };
};

export default useDetailPanel;