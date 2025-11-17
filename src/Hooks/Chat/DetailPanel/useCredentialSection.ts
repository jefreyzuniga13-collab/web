/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ClientResponseDTO,
  CredentialRequestDTO,
  CredentialResponseDTO,
} from "@/Interfaces/Crm/ClientInterface";
import { CredentialsService } from "@/Services/Crm/CredentialService";

export type CredScope = "client" | "device" | "system";
export type CredMode = "create" | "view" | "update";
export type ErrorBag = Record<string, string>;

export interface UseCredentialSectionArgs {
  client: ClientResponseDTO | null | any;
  addCredentialHostingAsync: (clientId: number, dto: CredentialRequestDTO) => Promise<any>;
  addCredentialForDeviceAsync: (
    clientId: number,
    deviceId: number,
    dto: CredentialRequestDTO
  ) => Promise<any>;
  addCredentialForSystemAsync: (
    clientId: number,
    systemId: number,
    dto: CredentialRequestDTO
  ) => Promise<any>;
  reloadClient: () => Promise<void>;
}

export interface UseCredentialSectionResult {
  credentials: CredentialResponseDTO[];
  credModalOpen: boolean;
  setCredModalOpen: (v: boolean) => void;
  credMode: CredMode;
  setCredMode: (v: CredMode) => void;
  credScope: CredScope;
  setCredScope: (v: CredScope) => void;
  deviceTargetId: number | "";
  setDeviceTargetId: (v: number | "") => void;
  systemTargetId: number | "";
  setSystemTargetId: (v: number | "") => void;
  credReq: CredentialRequestDTO;
  setCredReq: (
    v: CredentialRequestDTO | ((prev: CredentialRequestDTO) => CredentialRequestDTO)
  ) => void;
  credErrors: ErrorBag;
  setCredErrors: (v: ErrorBag) => void;
  openCredCreate: () => void;
  openCredView: (c: CredentialResponseDTO) => void;
  openCredEdit: (c: CredentialResponseDTO) => void;
  saveCred: () => Promise<void>;
}

/**
 * Encapsula la gestión de credenciales para cliente, dispositivo o sistema.
 * Controla modal, contextos de destino, validación y persistencia.
 */
export const useCredentialSection = ({
  client,
  addCredentialHostingAsync,
  addCredentialForDeviceAsync,
  addCredentialForSystemAsync,
  reloadClient,
}: UseCredentialSectionArgs): UseCredentialSectionResult => {
  const credentials = useMemo<CredentialResponseDTO[]>(() => {
    const c = client as ClientResponseDTO | null;
    if (!c) return [];
    const host = (c.hostingCredentials ?? []) as CredentialResponseDTO[];
    const dev = (c.outsourcedDevices ?? []).flatMap((d: any) =>
      (d.credentials ?? []).map((cr: CredentialResponseDTO) => ({
        ...cr,
        outsourcedDeviceId: d.id,
        outsourcedDeviceName: d.name,
      }))
    );
    const sys = (c.outsourcedSystems ?? []).flatMap((sy: any) =>
      (sy.credentials ?? []).map((cr: CredentialResponseDTO) => ({
        ...cr,
        clientOutsourcedSystemsId: sy.id,
        clientOutsourcedSystemsName: sy.name,
      }))
    );
    return [...host, ...dev, ...sys];
  }, [client]);

  const [credModalOpen, setCredModalOpen] = useState(false);
  const [credMode, setCredMode] = useState<CredMode>("create");
  const [credScope, setCredScope] = useState<CredScope>("client");
  const [deviceTargetId, setDeviceTargetId] = useState<number | "">("");
  const [systemTargetId, setSystemTargetId] = useState<number | "">("");
  const [credReq, internalSetCredReq] = useState<CredentialRequestDTO>({
    catCredentialId: 0,
    clientId: (client as any)?.id ?? 0,
    outsourcedDeviceId: null,
    clientOutsourcedSystemId: null,
    user: "",
    password: "",
    instance: "",
    port: "",
    observation: "",
    isActive: true,
  });
  const [credErrors, setCredErrors] = useState<ErrorBag>({});

  const setCredReq = (
    v: CredentialRequestDTO | ((prev: CredentialRequestDTO) => CredentialRequestDTO)
  ) => {
    internalSetCredReq(v as any);
  };

  useEffect(() => {
    internalSetCredReq(s => ({
      ...s,
      clientId: (client as any)?.id ?? 0,
    }));
  }, [client?.id]);

  const credPayload = useMemo<CredentialRequestDTO>(() => {
    const clientId = (client as any)?.id ?? 0;
    if (credScope === "client") {
      return {
        ...credReq,
        clientId,
        outsourcedDeviceId: null,
        clientOutsourcedSystemId: null,
      };
    }
    if (credScope === "device") {
      return {
        ...credReq,
        clientId: null,
        outsourcedDeviceId: deviceTargetId === "" ? null : Number(deviceTargetId),
        clientOutsourcedSystemId: null,
      };
    }
    return {
      ...credReq,
      clientId: null,
      outsourcedDeviceId: null,
      clientOutsourcedSystemId:
        systemTargetId === "" ? null : Number(systemTargetId),
    };
  }, [credReq, credScope, client?.id, deviceTargetId, systemTargetId]);

  const openCredCreate = useCallback(() => {
    setCredMode("create");
    setCredScope("client");
    setDeviceTargetId("");
    setSystemTargetId("");
    setCredErrors({});
    internalSetCredReq({
      catCredentialId: 0,
      clientId: (client as any)?.id ?? 0,
      outsourcedDeviceId: null,
      clientOutsourcedSystemId: null,
      user: "",
      password: "",
      instance: "",
      port: "",
      observation: "",
      isActive: true,
    });
    setCredModalOpen(true);
  }, [client?.id]);

  const openCredView = useCallback(
    (c: CredentialResponseDTO) => {
      const scope: CredScope = c.outsourcedDeviceId
        ? "device"
        : c.clientOutsourcedSystemsId
        ? "system"
        : "client";
      setCredMode("view");
      setCredScope(scope);
      setDeviceTargetId(c.outsourcedDeviceId ?? "");
      setSystemTargetId(c.clientOutsourcedSystemsId ?? "");
      setCredErrors({});
      internalSetCredReq({
        id: c.id,
        catCredentialId: c.catCredencialId,
        clientId: scope === "client" ? (client as any)?.id ?? null : null,
        outsourcedDeviceId:
          scope === "device" ? c.outsourcedDeviceId ?? null : null,
        clientOutsourcedSystemId:
          scope === "system"
            ? c.clientOutsourcedSystemsId ?? null
            : null,
        user: c.user,
        password: "",
        instance: c.instance ?? "",
        port: c.port ?? "",
        observation: c.observation ?? "",
        isActive: c.isActive,
      } as CredentialRequestDTO);
      setCredModalOpen(true);
    },
    [client?.id]
  );

  const openCredEdit = useCallback(
    (c: CredentialResponseDTO) => {
      const scope: CredScope = c.outsourcedDeviceId
        ? "device"
        : c.clientOutsourcedSystemsId
        ? "system"
        : "client";
      setCredMode("update");
      setCredScope(scope);
      setDeviceTargetId(c.outsourcedDeviceId ?? "");
      setSystemTargetId(c.clientOutsourcedSystemsId ?? "");
      setCredErrors({});
      internalSetCredReq({
        id: c.id,
        catCredentialId: c.catCredencialId,
        clientId: scope === "client" ? (client as any)?.id ?? null : null,
        outsourcedDeviceId:
          scope === "device" ? c.outsourcedDeviceId ?? null : null,
        clientOutsourcedSystemId:
          scope === "system"
            ? c.clientOutsourcedSystemsId ?? null
            : null,
        user: c.user,
        password: "",
        instance: c.instance ?? "",
        port: c.port ?? "",
        observation: c.observation ?? "",
        isActive: c.isActive,
      } as CredentialRequestDTO);
      setCredModalOpen(true);
    },
    [client?.id]
  );

  const validateCred = useCallback((): boolean => {
    const e: ErrorBag = {};
    if (!credReq.catCredentialId || credReq.catCredentialId <= 0)
      e.catCredentialId = "Seleccione el tipo.";
    if (!credReq.user || credReq.user.trim().length === 0)
      e.user = "Usuario es obligatorio.";
    if (credReq.user && credReq.user.length > 255)
      e.user = "Máximo 255 caracteres.";
    if (!credReq.password || credReq.password.trim().length === 0)
      e.password = "Contraseña es obligatorio.";
    if (credReq.instance && credReq.instance.length > 100)
      e.instance = "Máximo 100 caracteres.";
    if (credReq.port && credReq.port.length > 100)
      e.port = "Máximo 100 caracteres.";
    if (credReq.observation && credReq.observation.length > 255)
      e.observation = "Máximo 255 caracteres.";
    if (credScope === "device" && !credPayload.outsourcedDeviceId)
      e.scope = "Seleccione un equipo.";
    if (credScope === "system" && !credPayload.clientOutsourcedSystemId)
      e.scope = "Seleccione un sistema.";
    setCredErrors(e);
    return Object.keys(e).length === 0;
  }, [credReq, credScope, credPayload]);

  const saveCred = useCallback(async () => {
    const clientId = (client as any)?.id;
    if (!clientId) return;
    if (!validateCred()) return;
    if (credMode === "update" && (credReq as any).id) {
      await CredentialsService.updateAsync(
        (credReq as any).id,
        credPayload
      );
    } else {
      if (credScope === "client") {
        await addCredentialHostingAsync(clientId, credPayload);
      } else if (
        credScope === "device" &&
        credPayload.outsourcedDeviceId
      ) {
        await addCredentialForDeviceAsync(
          clientId,
          credPayload.outsourcedDeviceId,
          credPayload
        );
      } else if (
        credScope === "system" &&
        credPayload.clientOutsourcedSystemId
      ) {
        await addCredentialForSystemAsync(
          clientId,
          credPayload.clientOutsourcedSystemId,
          credPayload
        );
      }
    }
    await reloadClient();
    setCredModalOpen(false);
  }, [
    client?.id,
    validateCred,
    credMode,
    credReq,
    credScope,
    credPayload,
    addCredentialHostingAsync,
    addCredentialForDeviceAsync,
    addCredentialForSystemAsync,
    reloadClient,
  ]);

  return {
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
  };
};

export default useCredentialSection;