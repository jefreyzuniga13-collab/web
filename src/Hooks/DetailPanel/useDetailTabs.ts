/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";

export type OptionMenu = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type MoreTab = "cred" | "dev" | "sys" | "ctc";

export interface UseDetailTabsResult {
  optionMenu: OptionMenu;
  setOptionMenu: (v: OptionMenu) => void;
  showMore: boolean;
  setShowMore: (v: boolean) => void;
  moreTab: MoreTab;
  setMoreTab: (v: MoreTab) => void;
  editBuffer: any;
  setEditBuffer: (v: any) => void;
}

const setTabFromParam = (p: unknown): OptionMenu => {
  if (typeof p === "number" && p >= 1 && p <= 7) return p as OptionMenu;

  if (typeof p === "string") {
    const s = p.toLowerCase();
    if (s.includes("contact")) return 3;
    // if (s.includes("client") || s.includes("cliente")) return 1;
    // if (s.includes("history") || s.includes("historial")) return 3;
    if (s.includes("conv") || s.includes("convers")) return 4;
    if (s.includes("quick") || s.includes("rápido")) return 5;
    if (s.includes("prod") || s.includes("product")) return 1;
    if (s.includes("cart") || s.includes("cart")) return 2;
  }

  return 1;
};

/**
 * Control de pestañas y paneles dentro del Detail Panel:
 * menú principal, subpaneles y buffer de edición.
 */
export const useDetailTabs = (
  selectedParam?: unknown
): UseDetailTabsResult => {
  const [optionMenu, setOptionMenu] = useState<OptionMenu>(1);
  const [showMore, setShowMore] = useState(false);
  const [moreTab, setMoreTab] = useState<MoreTab>("cred");
  const [editBuffer, setEditBuffer] = useState<any>(null);

  const applySelectedParam = useCallback(() => {
    if (selectedParam != null) {
      setOptionMenu(setTabFromParam(selectedParam));
    }
  }, [selectedParam]);

  useEffect(() => {
    applySelectedParam();
  }, [applySelectedParam]);

  return {
    optionMenu,
    setOptionMenu,
    showMore,
    setShowMore,
    moreTab,
    setMoreTab,
    editBuffer,
    setEditBuffer,
  };
};