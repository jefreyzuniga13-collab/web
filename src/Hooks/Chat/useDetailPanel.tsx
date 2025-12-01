import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import useClient from "@/Hooks/Crm/useClient";
import useContact from "@/Hooks/Contact/useContact";
import { useCatCredential } from "@/Hooks/Crm/useCatCredential";
import { useOutsourcedSystems } from "@/Hooks/Crm/useOutsourcedSystems";
import type { ClientResponseDTO } from "@/Interfaces/Crm/ClientInterface";
import type { PagedResponse } from "@/Interfaces/GlobalInterface";
import { useOutsourcedDevices } from "../Crm/useOutsourcedDevices";

import { formatNiPhone, displayOrDash, formatDate } from "@/Utils/formatters";
import { useDetailTabs } from "@/Hooks/Chat/DetailPanel/useDetailTabs";
import { useQuickReplies } from "@/Hooks/Chat/DetailPanel/useQuickReplies";
import { useDeviceSection } from "@/Hooks/Chat/DetailPanel/useDeviceSection";
import { useClientEditSection } from "@/Hooks/Chat/DetailPanel/useClientEditSection";
import { useCredentialSection } from "@/Hooks/Chat/DetailPanel/useCredentialSection";
import { useContactSection } from "@/Hooks/Chat/DetailPanel/useContactSection";
import { useSystemSection } from "@/Hooks/Chat/DetailPanel/useSystemSection";

export const useDetailPanel = 
(contactId?: number, selectedParam?: unknown) => {
  const {
    optionMenu,
    setOptionMenu,
    showMore,
    setShowMore,
    moreTab,
    setMoreTab,
    editBuffer,
    setEditBuffer,
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
    loading: contactLoading,
    error: contactError,
    fetchById: fetchContactById,
    getByClient: fetchContactsByClient,
  } = useContact(contactId);

  const {
    client,
    loading: clientLoading,
    error: clientError,
    setClient,
    getAllAsync: getClientsPaged,
    getByIdAsync: fetchClientByCodeOrId,
    updateAsync: updateClientAsync,
    addDeviceAsync,
    addSystemAsync,
    addCredentialHostingAsync,
    addCredentialForDeviceAsync,
    addCredentialForSystemAsync,
    linkExistingContactsAsync,
  } = useClient();

  const { update: updateOutsourcedDevices } = useOutsourcedDevices();
  const { catCredential } = useCatCredential();

  const {
    items: sysCatalog,
    page: sysPage,
    pageSize: sysPageSize,
    totalCount: sysTotal,
    fetchPage: fetchSysPage,
    setPage: setSysPage,
    setPageSize: setSysPageSize,
    globalFilter: sysGlobalFilter,
    setGlobalFilter: setSysGlobalFilter,
  } = useOutsourcedSystems();

  const loading = contactLoading || clientLoading;
  const error = contactError ?? clientError ?? null;

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

  const clienteCodigo = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c: any = selectedData;
    return (
      c?.clienteCodigo ??
      c?.codcli ??
      c?.codCliente ??
      c?.clientCode ??
      null
    );
  }, [selectedData]);

  const clientKeyId = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c: any = selectedData;
    return c?.clientId ?? c?.clienteId ?? null;
  }, [selectedData]);

  const [clientLocal, setClientLocal] = useState<ClientResponseDTO | null>(client ?? null);
  useEffect(() => {
    setClientLocal(client ?? null);
  }, [client]);

  const lastClientKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const code = clienteCodigo != null ? String(clienteCodigo).trim() : "";
    const key = clientKeyId ? `id:${clientKeyId}` : code ? `code:${code}` : null;

    if (!key) {
      lastClientKeyRef.current = null;
      setClient(null);
      setClientLocal(null);
      return;
    }

    if (lastClientKeyRef.current === key) return;

    lastClientKeyRef.current = key;

    if (clientKeyId) {
      fetchClientByCodeOrId(clientKeyId).catch(() => {});
    } else if (code) {
      fetchClientByCodeOrId(code).catch(() => {});
    }
  }, [clientKeyId, clienteCodigo, fetchClientByCodeOrId, setClient]);

  const reloadClient = useCallback(async () => {
    const code = clienteCodigo != null ? String(clienteCodigo).trim() : "";
    if (clientKeyId) await fetchClientByCodeOrId(clientKeyId);
    else if (code) await fetchClientByCodeOrId(code);
  }, [clientKeyId, clienteCodigo, fetchClientByCodeOrId]);

  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [clientPickerFilter, setClientPickerFilter] = useState("");
  const [clientPickerPage, setClientPickerPage] = useState(1);
  const [clientPickerSize, setClientPickerSize] = useState(10);
  const [clientPickerData, setClientPickerData] =
    useState<PagedResponse<ClientResponseDTO> | null>(null);

  const loadClientPicker = useCallback(async () => {
    const res = await getClientsPaged(
      clientPickerFilter,
      clientPickerPage,
      clientPickerSize
    );
    setClientPickerData(res);
  }, [
    getClientsPaged,
    clientPickerFilter,
    clientPickerPage,
    clientPickerSize,
  ]);

  useEffect(() => {
    if (clientPickerOpen) {
      loadClientPicker().catch(() => {});
    }
  }, [clientPickerOpen, loadClientPicker]);

  const pickClientAndLoad = useCallback(
    async (idOrCode: number | string) => {
      await fetchClientByCodeOrId(idOrCode);
      setClientPickerOpen(false);
    },
    [fetchClientByCodeOrId]
  );

  const clientPhone =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any)?.telefono || (client as any)?.celular || "";
  const clientPhoneFmt = formatNiPhone(clientPhone);

  const hostingCreds = useMemo(() => {
    const creds = (client as ClientResponseDTO)?.hostingCredentials ?? [];
    return creds.filter((c) => c);
  }, [client]);

  const [credSearch, setCredSearch] = useState("");
  const filteredHosting = useMemo(() => {
    const n = credSearch.trim().toLowerCase();
    if (!n) return hostingCreds;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return hostingCreds.filter((c: any) =>
      [c.catCredencialNames, c.user, c.instance, c.port, c.observation]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(n))
    );
  }, [hostingCreds, credSearch]);

  const clientRecordId = (client)?.id as number | undefined;

  useEffect(() => {
    if (contactId == null || contactId <= 0) {
      setClient(null);
      setClientLocal(null);
      return;
    }

    setClientLocal(null);
  }, [contactId, setClient]);

  const {
    clientEditOpen,
    setClientEditOpen,
    clientEdit,
    handleChange,
    handleNumberChange,
    saveClientEdits,
  } = useClientEditSection(
    clientLocal,
    clientRecordId,
    updateClientAsync,
    reloadClient
  );

  const {
    devs,
    devSearch,
    setDevSearch,
    filteredDevs,
    expandedDev,
    toggleExpandedDev,
    addDeviceOpen,
    setAddDeviceOpen,
    newDevice,
    setNewDevice,
    createDevice,
    deviceErrors,
    setDeviceErrors,
  } = useDeviceSection(client, addDeviceAsync, reloadClient, setClient);

  const {
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
  } = useSystemSection({
    clientId: clientRecordId,
    client,
    sysCatalog,
    sysPageSize,
    fetchSysPage,
    addSystemAsync,
    reloadClient,
    setClient,
  });

  const {
    contacts,
    pickCtcOpen,
    setPickCtcOpen,
    newContact,
    setNewContact,
    contactPickerItems,
    openContactPicker,
    addPickedContact,
  } = useContactSection({
    clientId: clientRecordId,
    client,
    fetchContactsByClient,
    linkExistingContactsAsync,
    reloadClient,
    setClient,
  });

  const {
    credentials,
    credModalOpen,
    setCredModalOpen,
    credMode,
    setCredMode,
    credScope,
    setCredScope,
    deviceTargetId,
    setDeviceTargetId,
    systemTargetId,
    setSystemTargetId,
    credReq,
    setCredReq,
    credErrors,
    setCredErrors,
    openCredCreate,
    openCredView,
    openCredEdit,
    saveCred,
  } = useCredentialSection({
    client: client as ClientResponseDTO | null,
    addCredentialHostingAsync,
    addCredentialForDeviceAsync,
    addCredentialForSystemAsync,
    reloadClient,
  });

  const refreshContact = useCallback(() => {
    if (typeof contactId === "number" && contactId > 0) {
      return fetchContactById(contactId);
    }
    return Promise.resolve();
  }, [contactId, fetchContactById]);

  const refreshClient = 
  useCallback(() => reloadClient(), [reloadClient]);

  return {
    optionMenu,
    setOptionMenu,
    selectedData,
    client,
    clienteCodigo,
    loading,
    error,
    qQuick,
    setQQuick,
    quickOptions,
    filteredQuick,
    clientPhoneFmt,
    showMore,
    setShowMore,
    moreTab,
    setMoreTab,
    editBuffer,
    setEditBuffer,
    hostingCreds,
    credSearch,
    setCredSearch,
    filteredHosting,

    devs,
    devSearch,
    setDevSearch,
    filteredDevs,
    expandedDev,
    toggleExpandedDev,
    addDeviceOpen,
    setAddDeviceOpen,
    newDevice,
    setNewDevice,
    createDevice,
    deviceErrors,
    setDeviceErrors,

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

    contacts,
    pickCtcOpen,
    setPickCtcOpen,
    newContact,
    setNewContact,
    contactPickerItems,
    openContactPicker,
    addPickedContact,

    clientLocal,
    setClientLocal,
    clientEditOpen,
    setClientEditOpen,
    clientEdit,
    handleChange,
    handleNumberChange,
    saveClientEdits,

    clientPickerOpen,
    setClientPickerOpen,
    clientPickerFilter,
    setClientPickerFilter,
    clientPickerPage,
    setClientPickerPage,
    clientPickerSize,
    setClientPickerSize,
    clientPickerData,
    loadClientPicker,
    pickClientAndLoad,

    refreshContact,
    refreshClient,
    handleSendQuick,

    formatNiPhone,
    displayOrDash,
    formatDate,

    sysCatalog,
    sysPage,
    sysPageSize,
    sysTotal,
    fetchSysPage,
    setSysPage,
    setSysPageSize,
    sysGlobalFilter,
    setSysGlobalFilter,

    credentials,
    credModalOpen,
    setCredModalOpen,
    credMode,
    setCredMode,
    credScope,
    setCredScope,
    deviceTargetId,
    setDeviceTargetId,
    systemTargetId,
    setSystemTargetId,
    credReq,
    setCredReq,
    credErrors,
    setCredErrors,
    openCredCreate,
    openCredView,
    openCredEdit,
    saveCred,

    catCredential,
    updateOutsourcedDevices,
  };
};

export default useDetailPanel;