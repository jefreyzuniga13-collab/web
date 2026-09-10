/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import "@/Styles/Crm/ClientManagementPanel.css";
import Button from "@/Components/Common/Button";
import ListSkeleton from "@/Components/Common/ListSkeleton";
import Input from "@/Components/Common/Input";
import { Label } from "@/Components/Common/Label";
import { Textarea } from "@/Components/Common/Textarea";
import Select from "@/Components/Common/Select";
import { IconButton } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { MdOutlineEdit } from "react-icons/md";
import CustomTable from "@/Components/Common/CustomTable";
import type { Column } from "@/Interfaces/Common/CustomTable";
import { useCatCredential } from "@/Hooks/Crm/useCatCredential";
import useClient from "@/Hooks/Crm/useClient";
import { OutsourcedDevicesService } from "@/Services/Crm/OutsourcedDeviceServices";
import { OutsourcedSystemsService } from "@/Services/Crm/OutsourcedSystemService";
import type {
  ClientResponseDTO,
  ClientUpdateRequestDTO,
  DeviceRequestDTO,
  CredentialRequestDTO,
  CredentialResponseDTO,
  OutsourcedDeviceResponseDTO,
  OutsourcedSystemsResponseDTO,
  SystemRequestDTO,
} from "@/Interfaces/Crm/ClientInterface";

import { useOutsourcedDevices } from "@/Hooks/Crm/useOutsourcedDevices";
import { CredentialsService } from "@/Services/Crm/CredentialService";

const supportTypeOptions = [
  { value: "", label: "Seleccione tipo soporte" },
  { value: "AAA", label: "AAA" },
  { value: "AA", label: "AA" },
  { value: "A", label: "A" },
];

const enviromentOptions = [
  { value: "", label: "Seleccione el ambiente" },
  { value: "Nube", label: "Nube" },
  { value: "Local", label: "Local" },
];

const priorityOptions = [
  { value: "", label: "Seleccione la prioridad" },
  { value: "Alta", label: "Alta" },
  { value: "Media", label: "Media" },
  { value: "Baja", label: "Baja" },
];

const scopeOptions = [
  { value: "client", label: "Cliente" },
  { value: "device", label: "Equipo" },
  { value: "system", label: "Sistema" },
];

type ErrorBag = Record<string, string>;

export default function ClientAdminPanel() {
  const { id } = useParams<{ id: string }>();
  const clientId = id ? Number(id) : 0;
  const [tab, setTab] = useState<1 | 2 | 3 | 4 | 5>(1);

  const {
    client,
    loading,
    getByIdAsync,
    updateAsync,
    addDeviceAsync,
    addSystemAsync,
    addSystemByIdAsync,
    addCredentialHostingAsync,
    addCredentialForDeviceAsync,
    addCredentialForSystemAsync,
  } = useClient();

  const { update: updateDeviceAsync } = useOutsourcedDevices();

  const [form, setForm] = useState<ClientUpdateRequestDTO>({
    workModel: "",
    priority: "",
    supportType: "",
    isSupportActive: false,
    isFranchise: false,
    supportLimitTime: null,
    enviromentType: "",
    observation: "",
  });
  const [isEdit, setIsEdit] = useState(false);
  const [generalErrors, setGeneralErrors] = useState<ErrorBag>({});

  useEffect(() => {
    if (clientId > 0) getByIdAsync(clientId);
  }, [clientId, getByIdAsync]);

  useEffect(() => {
    if (client) {
      const src = client as ClientResponseDTO;
      setForm({
        workModel: src.workModel ?? "",
        priority: src.priority ?? "",
        supportType: src.supportType ?? "",
        isSupportActive: src.isSupportActive,
        isFranchise: src.isFranchise,
        supportLimitTime: src.supportLimitTime ?? 1,
        enviromentType: src.enviromentType ?? "",
        observation: src.observation ?? "",
      });
    }
  }, [client]);

        const handleField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const { name, value, type, checked } = e.target as any;
            const v = type === "checkbox" ? checked : value;
            setForm((s) => ({ ...s, [name]: v }));
      };


  const handleSelect = (name: keyof ClientUpdateRequestDTO, value: any) => {
    setForm((s) => ({ ...s, [name]: value }));
  };

  const validateGeneral = (): boolean => {
    const e: ErrorBag = {};
    if (form.priority && form.priority.length > 50) e.priority = "Máximo 50 caracteres.";
    if (form.supportType && form.supportType.length > 50) e.supportType = "Máximo 50 caracteres.";
    if (form.supportLimitTime !== null && form.supportLimitTime !== undefined) {
      const n = Number(form.supportLimitTime);
      if (Number.isNaN(n) || n < 0) e.supportLimitTime = "Ingrese un número válido.";
    }
    setGeneralErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveGeneral = async () => {
    if (!validateGeneral()) return;
    if (clientId > 0) {
      await updateAsync(clientId, form);
      await getByIdAsync(clientId);
      setIsEdit(false);
    }
  };

  const { catCredential } = useCatCredential();

  const [equipments, setEquipments] = useState<OutsourcedDeviceResponseDTO[]>([]);
  const [systems, setSystems] = useState<OutsourcedSystemsResponseDTO[]>([]);
  const [credentials, setCredentials] = useState<CredentialResponseDTO[]>([]);

  const computeAllCredentials = useCallback((c: ClientResponseDTO | null) => {
    if (!c) return [] as CredentialResponseDTO[];
    const host = c.hostingCredentials ?? [];
    const dev = (c.outsourcedDevices ?? []).flatMap((d) =>
      (d.credentials ?? []).map((cr) => ({
        ...cr,
        outsourcedDeviceId: d.id,
        outsourcedDeviceName: d.name,
      }))
    );
    const sys = (c.outsourcedSystems ?? []).flatMap((sy) =>
      (sy.credentials ?? []).map((cr) => ({
        ...cr,
        clientOutsourcedSystemsId: sy.id,
        clientOutsourcedSystemsName: sy.name,
      }))
    );
    return [...host, ...dev, ...sys];
  }, []);

  useEffect(() => {
    setEquipments(client?.outsourcedDevices ?? []);
    setSystems(client?.outsourcedSystems ?? []);
    setCredentials(computeAllCredentials(client));
  }, [client, computeAllCredentials]);

  const [eqModalOpen, setEqModalOpen] = useState(false);
  const [eqMode, setEqMode] = useState<"create" | "view" | "update">("create");
  const [eqEditId, setEqEditId] = useState<number | null>(null);
  const [eqForm, setEqForm] = useState<DeviceRequestDTO>({
    name: "",
    description: "",
    ip: "",
    operatingSystem: "",
    versionSO: "",
    isActive: true,
  });

  const [eqErrors, setEqErrors] = useState<ErrorBag>({});

  const openEqCreate = () => {
    setEqForm({ name: "", description: "", ip: "", operatingSystem: "", versionSO: "", isActive: true });
    setEqErrors({});
    setEqMode("create");
    setEqEditId(null);
    setEqModalOpen(true);
  };

  const openEqViewRow = (d: OutsourcedDeviceResponseDTO) => {
    setEqForm({
      name: d.name,
      description: d.description ?? "",
      ip: d.ip ?? "",
      operatingSystem: d.operatingSystem ?? "",
      versionSO: d.versionSO ?? "",
      isActive: d.isActive,
    });
    setEqErrors({});
    setEqMode("view");
    setEqEditId(d.id);
    setEqModalOpen(true);
  };

  const openEqEditRow = (d: OutsourcedDeviceResponseDTO) => {
    setEqForm({
      name: d.name,
      description: d.description ?? "",
      ip: d.ip ?? "",
      operatingSystem: d.operatingSystem ?? "",
      versionSO: d.versionSO ?? "",
      isActive: d.isActive,
    });
    setEqErrors({});
    setEqMode("update");
    setEqEditId(d.id);
    setEqModalOpen(true);
  };


  const validateEq = (): boolean => {
    const e: ErrorBag = {};
    if (!eqForm.name || eqForm.name.trim().length === 0) e.name = "Nombre es obligatorio.";
    if (eqForm.name && eqForm.name.length > 255) e.name = "Máximo 255 caracteres.";
    if (eqForm.description && eqForm.description.length > 550) e.description = "Máximo 550 caracteres.";
    if (eqForm.ip && eqForm.ip.length > 100) e.ip = "Máximo 100 caracteres.";
    if (eqForm.operatingSystem && eqForm.operatingSystem.length > 100) e.operatingSystem = "Máximo 100 caracteres.";
    if (eqForm.versionSO && eqForm.versionSO.length > 100) e.versionSO = "Máximo 100 caracteres.";
    setEqErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveEq = async () => {
    if (!validateEq()) return;
    if (eqMode === "create") {
      await addDeviceAsync(clientId, eqForm);
    } else if (eqMode === "update" && eqEditId) {
      if (typeof updateDeviceAsync === "function") {
        await updateDeviceAsync(eqEditId, eqForm);
      } else {
        await OutsourcedDevicesService.updateAsync(eqEditId, eqForm);
      }
    }
    await getByIdAsync(clientId);
    setEqModalOpen(false);
  };

  const [sysModalOpen, setSysModalOpen] = useState(false);
  const [sysMode, setSysMode] = useState<"create" | "view" | "update">("create");
  const [, setSysEditId] = useState<number | null>(null);
  const [sysForm, setSysForm] = useState<SystemRequestDTO>({ outsourcedSystemsId: 0, isActive: true });
  const [systemsCatalog, setSystemsCatalog] = useState<OutsourcedSystemsResponseDTO[]>([]);

  useEffect(() => {
    OutsourcedSystemsService.getAllAsync("", 1, 1000).then((r) => setSystemsCatalog(r.items ?? []));
  }, []);

  const openSysCreate = () => {
    setSysForm({ outsourcedSystemsId: 0, isActive: true });
    setSysMode("create");
    setSysEditId(null);
    setSysModalOpen(true);
  };

  const openSysViewRow = (s: OutsourcedSystemsResponseDTO) => {
    setSysForm({ outsourcedSystemsId: s.id, isActive: s.isActive });
    setSysMode("view");
    setSysEditId(s.id);
    setSysModalOpen(true);
  };

  const openSysEditRow = (s: OutsourcedSystemsResponseDTO) => {
    setSysForm({ outsourcedSystemsId: s.id, isActive: s.isActive });
    setSysMode("update");
    setSysEditId(s.id);
    setSysModalOpen(true);
  };

  const saveSys = async () => {
    if (sysForm.outsourcedSystemsId <= 0) return;
    if (sysMode === "create") {
      if (typeof addSystemByIdAsync === "function") {
        await addSystemByIdAsync(clientId, sysForm.outsourcedSystemsId);
      } else {
        await addSystemAsync(clientId, sysForm);
      }
    }
    await getByIdAsync(clientId);
    setSysModalOpen(false);
  };

  const [credModalOpen, setCredModalOpen] = useState(false);
  const [credMode, setCredMode] = useState<"create" | "view" | "update">("create");
  const [credScope, setCredScope] = useState<"client" | "device" | "system">("client");
  const [deviceTargetId, setDeviceTargetId] = useState<number | "">("");
  const [systemTargetId, setSystemTargetId] = useState<number | "">("");
  const [credReq, setCredReq] = useState<CredentialRequestDTO>({
    catCredentialId: 0,
    clientId: clientId,
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

  const openCredCreate = () => {
    setCredMode("create");
    setCredScope("client");
    setDeviceTargetId("");
    setSystemTargetId("");
    setCredErrors({});
    setCredReq({
      catCredentialId: 0,
      clientId: clientId,
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
  };

  const openCredView = (c: CredentialResponseDTO) => {
    setCredMode("view");
    const scope: "client" | "device" | "system" = c.outsourcedDeviceId ? "device" : c.clientOutsourcedSystemsId ? "system" : "client";
    setCredScope(scope);
    setDeviceTargetId(c.outsourcedDeviceId ?? "");
    setSystemTargetId(c.clientOutsourcedSystemsId ?? "");
    setCredErrors({});
    setCredReq({
      id: c.id,
      catCredentialId: c.catCredencialId,
      clientId: scope === "client" ? clientId : null,
      outsourcedDeviceId: scope === "device" ? c.outsourcedDeviceId ?? null : null,
      clientOutsourcedSystemId: scope === "system" ? c.clientOutsourcedSystemsId ?? null : null,
      user: c.user,
      password: "",
      instance: c.instance ?? "",
      port: c.port ?? "",
      observation: c.observation ?? "",
      isActive: c.isActive,
    });
    setCredModalOpen(true);
  };

  const openCredEdit = (c: CredentialResponseDTO) => {
    const scope: "client" | "device" | "system" = c.outsourcedDeviceId ? "device" : c.clientOutsourcedSystemsId ? "system" : "client";
    setCredMode("update");
    setCredScope(scope);
    setDeviceTargetId(c.outsourcedDeviceId ?? "");
    setSystemTargetId(c.clientOutsourcedSystemsId ?? "");
    setCredErrors({});
    setCredReq({
      id: c.id,
      catCredentialId: c.catCredencialId,
      clientId: scope === "client" ? clientId : null,
      outsourcedDeviceId: scope === "device" ? c.outsourcedDeviceId ?? null : null,
      clientOutsourcedSystemId: scope === "system" ? c.clientOutsourcedSystemsId ?? null : null,
      user: c.user,
      password: "",
      instance: c.instance ?? "",
      port: c.port ?? "",
      observation: c.observation ?? "",
      isActive: c.isActive,
    });
    setCredModalOpen(true);
  };

  const credPayload = useMemo<CredentialRequestDTO>(() => {
    if (credScope === "client") return { ...credReq, clientId, outsourcedDeviceId: null, clientOutsourcedSystemId: null };
    if (credScope === "device") return { ...credReq, clientId: null, outsourcedDeviceId: deviceTargetId === "" ? null : Number(deviceTargetId), clientOutsourcedSystemId: null };
    return { ...credReq, clientId: null, outsourcedDeviceId: null, clientOutsourcedSystemId: systemTargetId === "" ? null : Number(systemTargetId) };
  }, [credReq, credScope, clientId, deviceTargetId, systemTargetId]);

  const validateCred = (): boolean => {
    const e: ErrorBag = {};
    if (!credReq.catCredentialId || credReq.catCredentialId <= 0) e.catCredentialId = "Seleccione el tipo.";
    if (!credReq.user || credReq.user.trim().length === 0) e.user = "Usuario es obligatorio.";
    if (credReq.user && credReq.user.length > 255) e.user = "Máximo 255 caracteres.";
    if (!credReq.password || credReq.password.trim().length === 0) e.password = "Contraseña es obligatorio.";
    if (credReq.instance && credReq.instance.length > 100) e.instance = "Máximo 100 caracteres.";
    if (credReq.port && credReq.port.length > 100) e.port = "Máximo 100 caracteres.";
    if (credReq.observation && credReq.observation.length > 255) e.observation = "Máximo 255 caracteres.";
    if (credScope === "device" && !credPayload.outsourcedDeviceId) e.scope = "Seleccione un equipo.";
    if (credScope === "system" && !credPayload.clientOutsourcedSystemId) e.scope = "Seleccione un sistema.";
    setCredErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveCred = async () => {
    if (!validateCred()) return;
    if (credMode === "update" && credReq.id) {
      await CredentialsService.updateAsync(credReq.id, credPayload);
    } else {
      if (credScope === "client") {
        await addCredentialHostingAsync(clientId, credPayload);
      } else if (credScope === "device" && credPayload.outsourcedDeviceId) {
        await addCredentialForDeviceAsync(clientId, credPayload.outsourcedDeviceId, credPayload);
      } else if (credScope === "system" && credPayload.clientOutsourcedSystemId) {
          await addCredentialForSystemAsync(
            clientId,
            credPayload.clientOutsourcedSystemId,
            credPayload
          );
        }

    }
    await getByIdAsync(clientId);
    setCredModalOpen(false);
  };

  const credColumns = useMemo<Column<CredentialResponseDTO>[]>(() => [
    { id: "catCredencialNames", label: "Tipo", minWidth: 140, render: (r) => r.catCredencialNames ?? r.catCredencialId },
    { id: "user", label: "Usuario", minWidth: 160, render: (r) => r.user },
    { id: "instance", label: "Instancia", minWidth: 120, render: (r) => r.instance ?? "-" },
    { id: "port", label: "Puerto", minWidth: 90, render: (r) => r.port ?? "-" },
    { id: "catCredencialNames", label: "Ámbito", minWidth: 180, render: (r) => r.outsourcedDeviceName ? `Equipo: ${r.outsourcedDeviceName}` : r.clientOutsourcedSystemsName ? `Sistema: ${r.clientOutsourcedSystemsName}` : "Cliente" },
    { id: "isActive", label: "Estado", minWidth: 110, render: (r) => <span className={r.isActive ? "status status--active" : "status status--inactive"}>{r.isActive ? "Activo" : "Inactivo"}</span> },
    { id: "actions", label: "Acciones", minWidth: 10, align: "right", render: (r) => (
      <>
        <IconButton size="small" onClick={() => openCredView(r)}>
          <VisibilityIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => openCredEdit(r)} aria-label="Editar">
          <MdOutlineEdit size={16} />
        </IconButton>
      </>
    ) },
  ], []);

  const eqColumns = useMemo<Column<OutsourcedDeviceResponseDTO>[]>(() => [
    { id: "name", label: "Nombre", minWidth: 150, render: (r) => r.name },
    { id: "description", label: "Descripción", minWidth: 160, render: (r) => r.description ?? "-" },
    { id: "ip", label: "IP", minWidth: 110, render: (r) => r.ip ?? "-" },
    { id: "operatingSystem", label: "SO", minWidth: 110, render: (r) => r.operatingSystem ?? "-" },
    { id: "versionSO", label: "Versión SO", minWidth: 110, render: (r) => r.versionSO ?? "-" },
    { id: "isActive", label: "Estado", minWidth: 100, render: (r) => <span className={r.isActive ? "status status--active" : "status status--inactive"}>{r.isActive ? "Activo" : "Inactivo"}</span> },
    { id: "actions", label: "Acciones", minWidth: 130, align: "right", render: (r) => (
      <>
        <IconButton size="small" onClick={() => openEqViewRow(r)}>
          <VisibilityIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => openEqEditRow(r)}>
          <MdOutlineEdit size={16} />
        </IconButton>
      </>
    ) },
  ], []);

  const sysColumns = useMemo<Column<OutsourcedSystemsResponseDTO>[]>(() => [
    { id: "name", label: "Nombre", minWidth: 160, render: (r) => r.name },
    { id: "description", label: "Descripción", minWidth: 180, render: (r) => r.description ?? "-" },
    { id: "version", label: "Versión", minWidth: 110, render: (r) => r.version ?? "-" },
    { id: "isActive", label: "Estado", minWidth: 100, render: (r) => <span className={r.isActive ? "status status--active" : "status status--inactive"}>{r.isActive ? "Activo" : "Inactivo"}</span> },
    { id: "actions", label: "Acciones", minWidth: 130, align: "right", render: (r) => (
      <>
        <IconButton size="small" onClick={() => openSysViewRow(r)}>
          <VisibilityIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => openSysEditRow(r)}>
          <MdOutlineEdit size={16} />
        </IconButton>
      </>
    ) },
  ], []);

  return (
    <section className="cap">
      <div className="cap__header">
        <h2 className="cap__title">Gestión del Cliente: {client?.name}</h2>
        <p className="cap__subtitle">Datos, credenciales, equipos y sistemas</p>
      </div>
      <div className="cap__layout">
        <aside className="cap__sidebar">
          <nav className="cap__menu" aria-label="Secciones del cliente">
            <button type="button" className={`cap__menuItem ${tab === 1 ? "cap__menuItem--active" : ""}`} onClick={() => setTab(1)}>Datos generales</button>
            <button type="button" className={`cap__menuItem ${tab === 2 ? "cap__menuItem--active" : ""}`} onClick={() => setTab(2)}>Credenciales</button>
            <button type="button" className={`cap__menuItem ${tab === 3 ? "cap__menuItem--active" : ""}`} onClick={() => setTab(3)}>Equipos</button>
            <button type="button" className={`cap__menuItem ${tab === 4 ? "cap__menuItem--active" : ""}`} onClick={() => setTab(4)}>Sistemas</button>
          </nav>
        </aside>

        <main className="cap__content">
          {tab === 1 && (
            <div className="cap__panel">
              {loading ? (
                <div className="cap__loader">
                  <ListSkeleton variant="detail" count={1} />
                </div>
              ) : (
                <div className="cap__grid cap__grid--form">
                  {!!Object.keys(generalErrors).length && <div className="cap__alert">Revise los campos marcados.</div>}
                  <div className="cap__field">
                    <Label htmlFor="supportType" className="cap__label">Tipo soporte</Label>
                    <Select id="supportType" value={form.supportType ?? ""} onChange={(e) => handleSelect("supportType", e.target.value)} options={supportTypeOptions} disabled={!isEdit} className={`cap__select ${generalErrors.supportType ? "has-error" : ""}`} />
                    {generalErrors.supportType && <div className="cap__error">{generalErrors.supportType}</div>}
                  </div>
                  
                  <div className="cap__field">
                    <Label htmlFor="priority" className="cap__label">Prioridad</Label>
                    <Select id="priority" value={form.priority ?? ""} onChange={(e) => handleSelect("priority", e.target.value)} options={priorityOptions} disabled={!isEdit} className={`cap__select ${generalErrors.priority ? "has-error" : ""}`} />
                    {generalErrors.priority && <div className="cap__error">{generalErrors.priority}</div>}
                  </div>

                  <div className="cap__field">
                    <Label htmlFor="supportLimitTime" className="cap__label">Límite de soporte (Horas por Día)</Label>
                    <Input id="supportLimitTime" name="supportLimitTime" type="number" value={form.supportLimitTime ?? 8} 
                    onChange={handleField} disabled={!isEdit} className={`cap__input ${generalErrors.supportLimitTime ? "has-error" : ""}`} />
                    {generalErrors.supportLimitTime && <div className="cap__error">{generalErrors.supportLimitTime}</div>}
                  </div>

                  <div className="cap__field">
                    <Label htmlFor="enviromentType" className="cap__label">Ambiente</Label>
                    <Select id="enviromentType" value={form.enviromentType ?? ""} onChange={(e) => handleSelect("enviromentType", e.target.value)} options={enviromentOptions} disabled={!isEdit} className="cap__select" />
                  </div>

                  <div className="cap__field cap__field--full">
                    <Label htmlFor="workModel" className="cap__label">Modelo de trabajo</Label>
                    <Textarea id="workModel" name="workModel" value={form.workModel ?? ""} onChange={handleField} disabled={!isEdit} className="cap__textarea" />
                  </div>


                  <div className="cap__field cap__field--inline  cap__field__row">
                    <input type="checkbox" id="isSupportActive" name="isSupportActive" checked={!!form.isSupportActive} onChange={handleField} disabled={!isEdit} />
                    <Label htmlFor="isSupportActive" className="cap__label cap__label--inline">Tiene soporte activo</Label>
                     <input type="checkbox" id="isFranchise" name="isFranchise" checked={!!form.isFranchise} onChange={handleField} disabled={!isEdit} />
                    <Label htmlFor="isFranchise" className="cap__label cap__label--inline">Es franquicia</Label>
                  </div>
                  <div className="cap__actions cap__field--full">
                    {!isEdit ? (
                      <Button variant="secondary" onClick={() => setIsEdit(true)} className="cap__btn" type="button">Editar</Button>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setIsEdit(false);
                            if (client) {
                              setForm({
                                workModel: client.workModel ?? "",
                                priority: client.priority ?? "",
                                supportType: client.supportType ?? "",
                                isSupportActive: client.isSupportActive,
                                isFranchise: client.isFranchise,
                                supportLimitTime: client.supportLimitTime ?? null,
                                enviromentType: client.enviromentType ?? "",
                                observation: client.observation ?? "",
                              });
                              setGeneralErrors({});
                            }
                          }}
                          className="cap__btn cap__btn--ghost"
                          type="button"
                        >
                          Cancelar
                        </Button>
                        <Button onClick={saveGeneral} className="cap__btn" type="button">Guardar</Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 2 && (
            <div className="cap__panel">
              <div className="cap__toolbar">
                <div className="cap__spacer" />
                <div className="cap__row">
                  <Button onClick={openCredCreate} type="button" className="cap__btn">Nueva credencial</Button>
                </div>
              </div>
              <CustomTable<CredentialResponseDTO>
                columns={credColumns}
                rows={credentials}
                loading={loading}
                count={credentials.length}
                page={0}
                rowsPerPage={credentials.length || 10}
                rowsPerPageOptions={[credentials.length || 10]}
                onPageChange={() => {}}
                onRowsPerPageChange={() => {}}
              />
              {credModalOpen && (
                <div className="cap__modal">
                  <div className="cap__dialog">
                    <div className="cap__dialogHeader">
                      <h3 className="cap__dialogTitle">{credMode === "create" ? "Nueva credencial" : "Detalle de credencial"}</h3>
                      <button className="cap__dialogClose" onClick={() => setCredModalOpen(false)} aria-label="Cerrar" type="button">×</button>
                    </div>
                    <div className="cap__dialogBody">
                      {!!Object.keys(credErrors).length && <div className="cap__alert">Revise los campos marcados.</div>}
                      <div className="cap__grid cap__grid--modal">
                        <div className="cap__field">
                          <Label htmlFor="cred_cat" className="cap__label">Tipo</Label>
                          <Select
                            id="cred_cat"
                            key={credReq.catCredentialId}
                            value={credReq.catCredentialId}
                            onChange={(e) => setCredReq((s) => ({ ...s, catCredentialId: Number(e.target.value) }))}
                            options={[{ value: 0, label: "Seleccione tipo" }, ...catCredential.map((x) => ({ value: x.id, label: x.name }))]}
                            disabled={credMode === "view"}
                            className={`cap__select ${credErrors.catCredentialId ? "has-error" : ""}`}
                          />
                          {credErrors.catCredentialId && <div className="cap__error">{credErrors.catCredentialId}</div>}
                        </div>
                        <div className="cap__field">
                          <Label htmlFor="cred_scope" className="cap__label">Ámbito</Label>
                          <Select id="cred_scope" value={credScope} onChange={(e) => setCredScope(e.target.value as any)} options={scopeOptions} disabled={credMode === "view"} className={`cap__select ${credErrors.scope ? "has-error" : ""}`} />
                          {credErrors.scope && <div className="cap__error">{credErrors.scope}</div>}
                        </div>
                        {credScope === "device" && (
                          <div className="cap__field">
                            <Label htmlFor="cred_device" className="cap__label">Equipo</Label>
                            <Select
                              id="cred_device"
                              value={deviceTargetId}
                              onChange={(e) => setDeviceTargetId(e.target.value === "" ? "" : Number(e.target.value))}
                              options={[{ value: "", label: "Seleccione equipo" }, ...equipments.map((d) => ({ value: d.id, label: d.name }))]}
                              disabled={credMode === "view"}
                              className="cap__select"
                            />
                          </div>
                        )}
                       {credScope === "system" && (
                            <div className="cap__field">
                              <Label htmlFor="cred_system" className="cap__label">Sistema</Label>
                              <Select
                                id="cred_system"
                                value={systemTargetId}
                                onChange={(e) =>
                                  setSystemTargetId(
                                    e.target.value === "" ? "" : Number(e.target.value)
                                  )
                                }
                                options={[
                                  { value: "", label: "Seleccione sistema" },
                                  ...systems.map((s) => ({
                                    value: s.id,
                                    label: s.name, 
                                  })),
                                ]}
                                disabled={credMode === "view"}
                                className="cap__select"
                              />
                            </div>
                          )}

                        <div className="cap__field">
                          <Label htmlFor="cred_user" className="cap__label">Usuario</Label>
                          <Input id="cred_user" value={credReq.user} maxLength={255} onChange={(e) => setCredReq((s) => ({ ...s, user: e.target.value }))} disabled={credMode === "view"} className={`cap__input ${credErrors.user ? "has-error" : ""}`} />
                          {credErrors.user && <div className="cap__error">{credErrors.user}</div>}
                        </div>
                        <div className="cap__field">
                          <Label htmlFor="cred_pass" className="cap__label">Contraseña</Label>
                          <Input id="cred_pass" type="password" value={credReq.password ?? ""} onChange={(e) => setCredReq((s) => ({ ...s, password: e.target.value }))} disabled={credMode === "view"} className="cap__input" />
                            {credErrors.password && <div className="cap__error">{credErrors.password}</div>}
                        </div>
                        <div className="cap__field">
                          <Label htmlFor="cred_instance" className="cap__label">Instancia</Label>
                          <Input id="cred_instance" value={credReq.instance ?? ""} maxLength={100} onChange={(e) => setCredReq((s) => ({ ...s, instance: e.target.value }))} disabled={credMode === "view"} className={`cap__input ${credErrors.instance ? "has-error" : ""}`} />
                          {credErrors.instance && <div className="cap__error">{credErrors.instance}</div>}
                        </div>
                        <div className="cap__field">
                          <Label htmlFor="cred_port" className="cap__label">Puerto</Label>
                          <Input id="cred_port" value={credReq.port ?? ""} maxLength={100} onChange={(e) => setCredReq((s) => ({ ...s, port: e.target.value }))} disabled={credMode === "view"} className={`cap__input ${credErrors.port ? "has-error" : ""}`} />
                          {credErrors.port && <div className="cap__error">{credErrors.port}</div>}
                        </div>
                        <div className="cap__field cap__field--full">
                          <Label htmlFor="cred_obs" className="cap__label">Observación</Label>
                          <Textarea id="cred_obs" value={credReq.observation ?? ""} onChange={(e) => setCredReq((s) => ({ ...s, observation: e.target.value }))} disabled={credMode === "view"} className={`cap__textarea ${credErrors.observation ? "has-error" : ""}`} />
                          {credErrors.observation && <div className="cap__error">{credErrors.observation}</div>}
                        </div>
                        <div className="cap__field cap__field--inline cap__field--full">
                          <input type="checkbox" id="cred_active" checked={!!credReq.isActive} onChange={(e) => setCredReq((s) => ({ ...s, isActive: e.target.checked }))} disabled={credMode === "view"} />
                          <Label htmlFor="cred_active" className="cap__label cap__label--inline">Activo</Label>
                        </div>
                      </div>
                    </div>
                    <div className="cap__dialogFooter">
                      <Button onClick={() => setCredModalOpen(false)} type="button" variant="secondary" className="cap__btn cap__btn--ghost">Cerrar</Button>
                      {credMode !== "view" && <Button onClick={saveCred} type="button" className="cap__btn">Guardar</Button>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 3 && (
            <div className="cap__panel">
              <div className="cap__toolbar">
                <div className="cap__spacer" />
                <div className="cap__row">
                  <Button onClick={openEqCreate} type="button" className="cap__btn">Nuevo equipo</Button>
                </div>
              </div>
              <CustomTable<OutsourcedDeviceResponseDTO>
                columns={eqColumns}
                rows={equipments}
                loading={loading}
                count={equipments.length}
                page={0}
                rowsPerPage={equipments.length || 10}
                rowsPerPageOptions={[equipments.length || 10]}
                onPageChange={() => {}}
                onRowsPerPageChange={() => {}}
              />
              {eqModalOpen && (
                <div className="cap__modal">
                  <div className="cap__dialog">
                    <div className="cap__dialogHeader">
                      <h3 className="cap__dialogTitle">{eqMode === "create" ? "Nuevo equipo" : "Editar/Ver equipo"}</h3>
                      <button className="cap__dialogClose" onClick={() => setEqModalOpen(false)} aria-label="Cerrar" type="button">×</button>
                    </div>
                    <div className="cap__dialogBody">
                      {!!Object.keys(eqErrors).length && <div className="cap__alert">Revise los campos marcados.</div>}
                      <div className="cap__grid cap__grid--modal">
                        <div className="cap__field">
                          <Label htmlFor="eq_name" className="cap__label">Nombre</Label>
                          <Input id="eq_name" value={eqForm.name} maxLength={255} onChange={(e) => setEqForm((s) => ({ ...s, name: e.target.value }))} disabled={eqMode === "view"} className={`cap__input ${eqErrors.name ? "has-error" : ""}`} />
                          {eqErrors.name && <div className="cap__error">{eqErrors.name}</div>}
                        </div>
                        <div className="cap__field">
                          <Label htmlFor="eq_ip" className="cap__label">IP</Label>
                          <Input id="eq_ip" value={eqForm.ip ?? ""} maxLength={100} onChange={(e) => setEqForm((s) => ({ ...s, ip: e.target.value }))} disabled={eqMode === "view"} className={`cap__input ${eqErrors.ip ? "has-error" : ""}`} />
                          {eqErrors.ip && <div className="cap__error">{eqErrors.ip}</div>}
                        </div>
                        <div className="cap__field">
                          <Label htmlFor="eq_os" className="cap__label">SO</Label>
                          <Input id="eq_os" value={eqForm.operatingSystem ?? ""} maxLength={100} onChange={(e) => setEqForm((s) => ({ ...s, operatingSystem: e.target.value }))} disabled={eqMode === "view"} className={`cap__input ${eqErrors.operatingSystem ? "has-error" : ""}`} />
                          {eqErrors.operatingSystem && <div className="cap__error">{eqErrors.operatingSystem}</div>}
                        </div>
                        <div className="cap__field">
                          <Label htmlFor="eq_ver" className="cap__label">Versión SO</Label>
                          <Input id="eq_ver" value={eqForm.versionSO ?? ""} maxLength={100} onChange={(e) => setEqForm((s) => ({ ...s, versionSO: e.target.value }))} disabled={eqMode === "view"} className={`cap__input ${eqErrors.versionSO ? "has-error" : ""}`} />
                          {eqErrors.versionSO && <div className="cap__error">{eqErrors.versionSO}</div>}
                        </div>
                        <div className="cap__field cap__field--full">
                          <Label htmlFor="eq_desc" className="cap__label">Descripción</Label>
                          <Textarea id="eq_desc" value={eqForm.description ?? ""} onChange={(e) => setEqForm((s) => ({ ...s, description: e.target.value }))} disabled={eqMode === "view"} className={`cap__textarea ${eqErrors.description ? "has-error" : ""}`} />
                          {eqErrors.description && <div className="cap__error">{eqErrors.description}</div>}
                        </div>

                        <div className="cap__field cap__field--inline">
                          <input type="checkbox" id="eq_active" checked={!!eqForm.isActive} onChange={(e) => setEqForm((s) => ({ ...s, isActive: e.target.checked }))} disabled={eqMode === "view"} />
                          <Label htmlFor="eq_active" className="cap__label cap__label--inline">Activo</Label>
                        </div>
                      </div>
                    </div>
                    <div className="cap__dialogFooter">
                      <Button onClick={() => setEqModalOpen(false)} type="button" variant="secondary" className="cap__btn cap__btn--ghost">Cerrar</Button>
                      {eqMode !== "view" && <Button onClick={saveEq} type="button" className="cap__btn">Guardar</Button>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 4 && (
            <div className="cap__panel">
              <div className="cap__toolbar">
                <div className="cap__spacer" />
                <div className="cap__row">
                  <Button onClick={openSysCreate} type="button" className="cap__btn">Vincular sistema</Button>
                </div>
              </div>
              <CustomTable<OutsourcedSystemsResponseDTO>
                columns={sysColumns}
                rows={systems}
                loading={loading}
                count={systems.length}
                page={0}
                rowsPerPage={systems.length || 10}
                rowsPerPageOptions={[systems.length || 10]}
                onPageChange={() => {}}
                onRowsPerPageChange={() => {}}
              />
              {sysModalOpen && (
                <div className="cap__modal">
                  <div className="cap__dialog cap__dialog--sm">
                    <div className="cap__dialogHeader">
                      <h3 className="cap__dialogTitle">{sysMode === "create" ? "Vincular sistema" : "Detalle/Editar sistema"}</h3>
                      <button className="cap__dialogClose" onClick={() => setSysModalOpen(false)} aria-label="Cerrar" type="button">×</button>
                    </div>
                    <div className="cap__dialogBody">
                      <div className="cap__grid cap__grid--mini">
                        <div className="cap__field">
                          <Label htmlFor="sys_id" className="cap__label">Sistema</Label>
                          <Select
                            id="sys_id"
                            value={sysForm.outsourcedSystemsId}
                            onChange={(e) => setSysForm((s) => ({ ...s, outsourcedSystemsId: Number(e.target.value) }))}
                            options={[{ value: 0, label: "Seleccione sistema" }, ...systemsCatalog.map((x) => ({ value: x.id, label: x.name }))]}
                            disabled={sysMode === "view"}
                            className="cap__select"
                          />
                        </div>
                        <div className="cap__field cap__field--inline cap__field--full">
                          <input type="checkbox" id="sys_active" checked={!!sysForm.isActive} onChange={(e) => setSysForm((s) => ({ ...s, isActive: e.target.checked }))} disabled={sysMode === "view"} />
                          <Label htmlFor="sys_active" className="cap__label cap__label--inline">Activo</Label>
                        </div>
                      </div>
                    </div>
                    <div className="cap__dialogFooter">
                      <Button onClick={() => setSysModalOpen(false)} type="button" variant="secondary">Cerrar</Button>
                      {sysMode !== "view" && <Button onClick={saveSys} type="button" className="cap__btn">Guardar</Button>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </section>
  );
}