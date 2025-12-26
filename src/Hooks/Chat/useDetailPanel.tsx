import { useCallback, useEffect, useRef, } from "react";
import useContact from "@/Hooks/Contact/useContact";
import { formatNiPhone, displayOrDash, formatDate } from "@/Utils/formatters";
import { useDetailTabs } from "@/Hooks/Chat/DetailPanel/useDetailTabs";
import { useQuickReplies } from "@/Hooks/Chat/DetailPanel/useQuickReplies";

export const useDetailPanel = 
(contactId?: number, selectedParam?: unknown) => {
  const {
    optionMenu,
    setOptionMenu,
  } = useDetailTabs(selectedParam);

  const {
    qQuick,
    setQQuick,
    quickOptions,
    filteredQuick,
    handleSendQuick,
  } = useQuickReplies(selectedParam);

  const {
    selectedData,
    fetchById: fetchContactById,
  } = useContact(contactId);

  const lastContactIdRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (
      typeof contactId === "number" &&
      contactId > 0 &&
      lastContactIdRef.current !== contactId
    ) {
      lastContactIdRef.current = contactId;
      fetchContactById(contactId).catch(() => {});
    }
  }, [contactId, fetchContactById]);

  const refreshContact = useCallback(() => {
    if (typeof contactId === "number" && contactId > 0) {
      return fetchContactById(contactId);
    }
    return Promise.resolve();
  }, [contactId, fetchContactById]);

  return {
    optionMenu,
    setOptionMenu,
    selectedData,
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