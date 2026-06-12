import { useMemo, useState } from "react";
import { parseQuickOptions } from "@/Utils/formatters";

export interface UseQuickRepliesResult {
  qQuick: string;
  setQQuick: (v: string) => void;
  quickOptions: string[];
  filteredQuick: string[];
  handleSendQuick: (
    text: string,
    onSendNow?: (t: string) => void | Promise<void>
  ) => Promise<void>;
}


/**
 * Lógica para opciones rápidas de respuesta en el chat:
 * filtrar, seleccionar y procesar el envío.
 */

export const useQuickReplies = (
  selectedParam?: unknown
): UseQuickRepliesResult => {
  const quickOptions = useMemo(() => {
    const arr = parseQuickOptions(selectedParam);
    const uniq = Array.from(new Set(arr.map(s => s.trim()))).filter(Boolean);
    return uniq;
  }, [selectedParam]);

  const [qQuick, setQQuick] = useState("");

  const filteredQuick = useMemo(() => {
    const base = quickOptions;
    const n = qQuick.toLowerCase();
    return base.filter(s => s.toLowerCase().includes(n));
  }, [quickOptions, qQuick]);

  const handleSendQuick = async (
    text: string,
    onSendNow?: (t: string) => void | Promise<void>
  ) => {
    if (onSendNow) {
      await onSendNow(text);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = (window as unknown) as any;

    if (typeof w.__CHAT_SEND_QUICK__ === "function") {
      w.__CHAT_SEND_QUICK__(text);
      return;
    }

    window.dispatchEvent(
      new CustomEvent("chat:sendQuick", { detail: { text } })
    );
  };

  return {
    qQuick,
    setQQuick,
    quickOptions,
    filteredQuick,
    handleSendQuick,
  };
};