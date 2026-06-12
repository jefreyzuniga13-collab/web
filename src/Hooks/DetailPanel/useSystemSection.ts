/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo, useState } from "react";
import type { SystemRequestDTO } from "@/Interfaces/Crm/ClientInterface";

export interface UseSystemSectionArgs {
  clientId?: number;
  client: any;
  sysCatalog: any[];
  sysPageSize: number;
  fetchSysPage: (page: number, size: number) => Promise<void> | void;
  addSystemAsync: (clientId: number, dto: SystemRequestDTO) => Promise<any>;
  reloadClient: () => Promise<void>;
  setClient: (updater: (prev: any) => any) => void;
}

export interface UseSystemSectionResult {
  systems: any[];
  sysSearch: string;
  setSysSearch: (v: string) => void;
  filteredSystems: any[];
  pickSysOpen: boolean;
  setPickSysOpen: (v: boolean) => void;
  newSystem: SystemRequestDTO;
  setNewSystem: (v: SystemRequestDTO) => void;
  openSystemPicker: () => void;
  addPickedSystem: () => Promise<void>;
}


/**
 * Gestiona los sistemas asociados al cliente: selección desde catálogo
 * y registro de nuevos sistemas en la relación cliente-sistema.
 */
export const useSystemSection = ({
  clientId,
  client,
  sysCatalog,
  sysPageSize,
  fetchSysPage,
  addSystemAsync,
  reloadClient,
  setClient,
}: UseSystemSectionArgs): UseSystemSectionResult => {
  const systems = useMemo(() => {
    const list = ((client as any)?.outsourcedSystems ?? []) as any[];
    return list.map(s => ({ ...s, credentials: s.credentials ?? [] }));
  }, [client]);

  const [sysSearch, setSysSearch] = useState("");
  const filteredSystems = useMemo(() => {
    const n = sysSearch.trim().toLowerCase();
    if (!n) return systems;
    return systems.filter((s: any) =>
      String(s.name).toLowerCase().includes(n) ||
      String(s.version ?? "").toLowerCase().includes(n)
    );
  }, [systems, sysSearch]);

  const [pickSysOpen, setPickSysOpen] = useState(false);
  const [newSystem, setNewSystem] = useState<SystemRequestDTO>({
    outsourcedSystemsId: 0,
    isActive: true,
  });

  const openSystemPicker = useCallback(() => {
    setPickSysOpen(true);
    fetchSysPage(1, sysPageSize);
  }, [fetchSysPage, sysPageSize]);

  const addPickedSystem = useCallback(async () => {
    if (!clientId || !newSystem.outsourcedSystemsId) return;
    const added = await addSystemAsync(clientId, newSystem);
    if (added) {
      setClient((prev: any) => {
        if (!prev) return prev;
        const list = Array.isArray(prev.outsourcedSystems)
          ? [...prev.outsourcedSystems]
          : [];
        const fromCatalog = sysCatalog.find(
          s => s.id === newSystem.outsourcedSystemsId
        );
        if (fromCatalog) {
          list.unshift({
            id: (added as any).id ?? Date.now(),
            name: fromCatalog.name,
            description: fromCatalog.description,
            version: fromCatalog.version,
            isActive: !!newSystem.isActive,
            credentials: [],
          });
        }
        return { ...prev, outsourcedSystems: list };
      });
    }
    await reloadClient();
    setNewSystem({ outsourcedSystemsId: 0, isActive: true });
    setPickSysOpen(false);
  }, [
    clientId,
    newSystem,
    addSystemAsync,
    reloadClient,
    sysCatalog,
    setClient,
  ]);

  return {
    systems,
    sysSearch,
    setSysSearch,
    filteredSystems,
    pickSysOpen,
    setPickSysOpen,
    newSystem,
    setNewSystem,
    openSystemPicker,
    addPickedSystem,
  };
};

export default useSystemSection;