/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import "@/Styles/Crm/ClientManagementPanel.css";
import Button from "@/Components/Common/Button";
import Input from "@/Components/Common/Input";
import { Label } from "@/Components/Common/Label";
import { Textarea } from "@/Components/Common/Textarea";
import Select from "@/Components/Common/Select";
import {IconButton } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import { EditIcon } from "lucide-react";
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
    // addSystemAsync,
    // addSystemByIdAsync,
    addCredentialHostingAsync,
    addCredentialForDeviceAsync,
    addCredentialForSystemAsync,
    // updateDeviceAsync,
    // updateClientSystemAsync,
  } = useClient();

  const {
    update: updateDeviceAsync
  } 
  =  useOutsourcedDevices();

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
        supportLimitTime: src.supportLimitTime ?? null,
        enviromentType: src.enviromentType ?? "",
        observation: src.observation ?? "",
      });
    }
  }, [client]);

  const handleField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as any;
    setForm((s) => ({ ...s, [name]: type === "checkbox" ? checked : value }));
  };
  const handleSelect = (name: keyof ClientUpdateRequestDTO, value: any) => {
    setForm((s) => ({ ...s, [name]: value }));
  };
  const saveGeneral = async () => {
    if (clientId > 0) {
      await updateAsync(clientId, form);
      await getByIdAsync(clientId);
      setIsEdit(false);
    }
  };

  const {
    catCredential,
    selectedCatCredential,
    loading: loadingCat,
    error: errorCat,
    page,
    pageSize,
    totalCount,
    setPage,
    setPageSize,
    openEdit,
    openView,
    closeModal,
    isModalOpen,
    modalMode,
    handleSubmit,
    toggleStatus
    // globalFilter,
    // setGlobalFilter,
  } = useCatCredential();

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
  const openEqCreate = () => {
    setEqForm({ name: "", description: "", ip: "", operatingSystem: "", versionSO: "", isActive: true });
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
    setEqMode("update");
    setEqEditId(d.id);
    setEqModalOpen(true);
  };
  const saveEq = async () => {
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sysEditId, setSysEditId] = useState<number | null>(null);
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
  
//   const saveSys = async () => {
//     if (sysMode === "create") {
//       if (sysForm.outsourcedSystemsId > 0) {
//         await addSystemByIdAsync(clientId, sysForm.outsourcedSystemsId);
//       } else {
//         await addSystemAsync(clientId, sysForm);
//       }
//     } else if (sysMode === "update" && sysEditId) {
//       if (typeof updateClientSystemAsync === "function") {
//         await updateClientSystemAsync(clientId, sysEditId, { isActive: sysForm.isActive, outsourcedSystemsId: sysForm.outsourcedSystemsId });
//       }
//     }
//     await getByIdAsync(clientId);
//     setSysModalOpen(false);
//   };

  const [credModalOpen, setCredModalOpen] = useState(false);
  const [credMode, setCredMode] = useState<"create" | "view" | 'update'>("create");
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
  const openCredCreate = () => {
    setCredMode("create");
    setCredScope("client");
    setDeviceTargetId("");
    setSystemTargetId("");
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
  const saveCred = async () => {
     if (credMode === "update" && credReq.id) {
      await CredentialsService.updateAsync(credReq.id, credPayload);
    } 
    if (credScope === "client") {
      await addCredentialHostingAsync(clientId, credPayload);
    } else if (credScope === "device" && credPayload.outsourcedDeviceId) {
      await addCredentialForDeviceAsync(clientId, credPayload.outsourcedDeviceId, credPayload);
    } else if (credScope === "system" && credPayload.clientOutsourcedSystemId) {
      await addCredentialForSystemAsync(clientId, credPayload.clientOutsourcedSystemId, credPayload);
    }
    await getByIdAsync(clientId);
    setCredModalOpen(false);
  };
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const openCredEdit = (c: CredentialResponseDTO) => {
    const scope: "client" | "device" | "system" = c.outsourcedDeviceId ? "device" : c.clientOutsourcedSystemsId ? "system" : "client";
    setCredMode("update");
    setCredScope(scope);
    setDeviceTargetId(c.outsourcedDeviceId ?? "");
    setSystemTargetId(c.clientOutsourcedSystemsId ?? "");
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

  
  const credColumns = useMemo<Column<CredentialResponseDTO>[]>(() => [
    { id: "catCredencialNames", label: "Tipo", minWidth: 140, render: (r) => r.catCredencialNames ?? r.catCredencialId },
    { id: "user", label: "Usuario", minWidth: 160, render: (r) => r.user },
    { id: "instance", label: "Instancia", minWidth: 120, render: (r) => r.instance ?? "-" },
    { id: "port", label: "Puerto", minWidth: 90, render: (r) => r.port ?? "-" },
    // { id: "scope", label: "Ámbito", minWidth: 180, render: (r) => r.outsourcedDeviceName ? `Equipo: ${r.outsourcedDeviceName}` : r.clientOutsourcedSystemsName ? `Sistema: ${r.clientOutsourcedSystemsName}` : "Cliente" },
    { id: "isActive", label: "Estado", minWidth: 110, render: (r) => <span className={r.isActive ? "status status--active" : "status status--inactive"}>{r.isActive ? "Activo" : "Inactivo"}</span> },
    { id: "actions", label: "Acciones", minWidth: 10, align: "right", render: (r) => (
      <>
      <IconButton size="small" onClick={() => openCredView(r)}>
        <VisibilityIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={() => openCredEdit(r)} aria-label="Editar">
            <EditIcon size={16} />
        </IconButton>
      </>
    ) },
  ], [openCredEdit, openCredView]);

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
          <EditIcon size={16} />
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
          <EditIcon size={16} />
        </IconButton>
      </>
    ) },
  ], []);

    const catCredentialColumn = useMemo<Column<{ id: number; name: string; description?: string; isActive?: boolean; }>[]>(() => [
                { id: "name", label: "Nombre", minWidth: 160, render: (r) => r.name },
                { id: "description", label: "Descripción", minWidth: 200, render: (r) => r.description ?? "-" },
                { id: "isActive", label: "Estado", minWidth: 110, render: (r) => <span className={r.isActive ? "status status--active" : "status status--inactive"}>{r.isActive ? "Activo" : "Inactivo"}</span> },
                { id: "actions", label: "Acciones", minWidth: 150, align: "center", render: (r) => (
                  <>
                    <IconButton size="small" onClick={() => openView(r.id)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => openEdit(r.id)}>
                      <EditIcon size={16} />
                    </IconButton>
                    <IconButton size="small" onClick={() => toggleStatus(r.id)}>
                      {r.isActive ? <ToggleOnIcon fontSize="small" color="success" /> : <ToggleOffIcon fontSize="small" />}
                    </IconButton>
                  </>
                ) },
              ], [openView, openEdit, toggleStatus]);

  return (
    <section className="userAdminPanel">
      <header className="userAdminPanel__tabs">
        <button className={`userAdminPanel__tab ${tab === 1 ? "userAdminPanel__tab--active" : ""}`} onClick={() => setTab(1)} type="button">Datos generales</button>
        <button className={`userAdminPanel__tab ${tab === 2 ? "userAdminPanel__tab--active" : ""}`} onClick={() => setTab(2)} type="button">Credenciales</button>
        <button className={`userAdminPanel__tab ${tab === 3 ? "userAdminPanel__tab--active" : ""}`} onClick={() => setTab(3)} type="button">Equipos</button>
        <button className={`userAdminPanel__tab ${tab === 4 ? "userAdminPanel__tab--active" : ""}`} onClick={() => setTab(4)} type="button">Sistemas</button>
        <button className={`userAdminPanel__tab ${tab === 5 ? "userAdminPanel__tab--active" : ""}`} onClick={() => setTab(5)} type="button">Catálogo de credenciales</button>
      </header>

      {tab === 1 && (
        <div className="userAdminPanel__section tabs1">
          {loading ? (
            <div className="userAdminPanel__loader">Cargando…</div>
          ) : (
            <div className="userAdminPanel__grid userAdminPanel__grid__generalData">
              <div className="userAdminPanel__field">
                <Label htmlFor="supportType" className="userAdminPanel__label">Tipo soporte</Label>
                <Select id="supportType" value={form.supportType ?? ""} onChange={(e) => handleSelect("supportType", e.target.value)} options={supportTypeOptions} disabled={!isEdit} className="userAdminPanel__select" />
              </div>
              <div className="userAdminPanel__field">
                <Label htmlFor="priority" className="userAdminPanel__label">Prioridad</Label>
                <Select id="priority" value={form.priority ?? ""} onChange={(e) => handleSelect("priority", e.target.value)} options={priorityOptions} disabled={!isEdit} className="userAdminPanel__select" />
              </div>
              <div className="userAdminPanel__field">
                <Label htmlFor="enviromentType" className="userAdminPanel__label">Ambiente</Label>
                <Select id="enviromentType" value={form.enviromentType ?? ""} onChange={(e) => handleSelect("enviromentType", e.target.value)} options={enviromentOptions} disabled={!isEdit} className="userAdminPanel__select" />
              </div>
              <div className="userAdminPanel__field">
                <Label htmlFor="supportLimitTime" className="userAdminPanel__label">Límite de soporte (Horas por Dia)</Label>
                <Input id="supportLimitTime" name="supportLimitTime" type="number" value={String(form.supportLimitTime ?? "")} onChange={handleField} disabled={!isEdit} className="userAdminPanel__input" />
              </div>
              <div className="userAdminPanel__field">
                <Label htmlFor="isSupportActive" className="userAdminPanel__label userAdminPanel__label--inline">Tiene soporte activo</Label>
                <input type="checkbox" id="isSupportActive" name="isSupportActive" checked={!!form.isSupportActive} onChange={handleField} disabled={!isEdit} />
              </div>
              <div className="userAdminPanel__field">
                <Label htmlFor="isFranchise" className="userAdminPanel__label userAdminPanel__label--inline">Es franquicia</Label>
                <input type="checkbox" id="isFranchise" name="isFranchise" checked={!!form.isFranchise} onChange={handleField} disabled={!isEdit} />
              </div>
              <div className="userAdminPanel__field">
                <Label htmlFor="workModel" className="userAdminPanel__label">Modelo de trabajo</Label>
                <Textarea id="workModel" name="workModel" value={form.workModel ?? ""} onChange={handleField} disabled={!isEdit} 
                className="userAdminPanel__textarea extented" />
              </div>
              <div className="userAdminPanel__field">
                <Label htmlFor="observation" className="userAdminPanel__label">Observación</Label>
                <Textarea id="observation" name="observation" value={form.observation ?? ""} onChange={handleField} disabled={!isEdit} 
                className="userAdminPanel__textarea extented" />
              </div>
              <div className="userAdminPanel__actions userAdminPanel__field--full">
                {!isEdit ? (
                  <Button variant="secondary" onClick={() => setIsEdit(true)} className="userAdminPanel__btn" type="button">Editar</Button>
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
                        }
                      }}
                      className="userAdminPanel__btn userAdminPanel__btn--ghost"
                      type="button"
                    >
                      Cancelar
                    </Button>
                    <Button onClick={saveGeneral} className="userAdminPanel__btn" type="button">Guardar</Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 2 && (
        <div className="userAdminPanel__section">
          <div className="userAdminPanel__toolbar">
            <div className="userAdminPanel__row">
              <Button onClick={openCredCreate} type="button" className="userAdminPanel__btn">Nueva credencial</Button>
            </div>
            <div className="userAdminPanel__spacer" />
          </div>
          <CustomTable<CredentialResponseDTO>
            columns={credColumns}
            rows={credentials}
            count={credentials.length}
            page={0}
            rowsPerPage={credentials.length || 10}
            rowsPerPageOptions={[credentials.length || 10]}
            onPageChange={() => {}}
            onRowsPerPageChange={() => {}}
          />
          {credModalOpen && (
            <div className="userAdminPanel__modal">
              <div className="userAdminPanel__modalDialog">
                <div className="userAdminPanel__modalHeader">
                  <h3 className="userAdminPanel__modalTitle">{credMode === "create" ? "Nueva credencial" : "Detalle de credencial"}</h3>
                  <button className="userAdminPanel__modalClose" onClick={() => setCredModalOpen(false)} aria-label="Cerrar" type="button">×</button>
                </div>
                <div className="userAdminPanel__modalBody">
                  <div className="userAdminPanel__grid">
                    <div className="userAdminPanel__field">
                      <Label htmlFor="cred_cat" className="userAdminPanel__label">Tipo</Label>
                      <Select
                        id="cred_cat"
                        value={credReq.catCredentialId}
                        onChange={(e) => setCredReq((s) => ({ ...s, catCredentialId: Number(e.target.value) }))}
                        options={[{ value: 0, label: "Seleccione tipo" }, ...catCredential.map((x) => ({ value: x.id, label: x.name }))]}
                        disabled={credMode === "view"}
                        className="userAdminPanel__select"
                      />
                    </div>
                    <div className="userAdminPanel__field">
                      <Label htmlFor="cred_scope" className="userAdminPanel__label">Ámbito</Label>
                      <Select id="cred_scope" value={credScope} onChange={(e) => setCredScope(e.target.value as any)} options={scopeOptions} disabled={credMode === "view"} className="userAdminPanel__select" />
                    </div>
                    {credScope === "device" && (
                      <div className="userAdminPanel__field">
                        <Label htmlFor="cred_device" className="userAdminPanel__label">Equipo</Label>
                        <Select
                          id="cred_device"
                          value={deviceTargetId}
                          onChange={(e) => setDeviceTargetId(e.target.value === "" ? "" : Number(e.target.value))}
                          options={[{ value: "", label: "Seleccione equipo" }, ...equipments.map((d) => ({ value: d.id, label: d.name }))]}
                          disabled={credMode === "view"}
                          className="userAdminPanel__select"
                        />
                      </div>
                    )}
                    {credScope === "system" && (
                      <div className="userAdminPanel__field">
                        <Label htmlFor="cred_system" className="userAdminPanel__label">Sistema</Label>
                        <Select
                          id="cred_system"
                          value={systemTargetId}
                          onChange={(e) => setSystemTargetId(e.target.value === "" ? "" : Number(e.target.value))}
                          options={[{ value: "", label: "Seleccione sistema" }, ...systemsCatalog.map((s) => ({ value: s.id, label: s.name }))]}
                          disabled={credMode === "view"}
                          className="userAdminPanel__select"
                        />
                      </div>
                    )}
                    <div className="userAdminPanel__field">
                      <Label htmlFor="cred_user" className="userAdminPanel__label">Usuario</Label>
                      <Input id="cred_user" value={credReq.user} onChange={(e) => setCredReq((s) => ({ ...s, user: e.target.value }))} disabled={credMode === "view"} className="userAdminPanel__input" />
                    </div>
                    <div className="userAdminPanel__field">
                      <Label htmlFor="cred_pass" className="userAdminPanel__label">Contraseña</Label>
                      <Input id="cred_pass" type="password" value={credReq.password ?? ""} onChange={(e) => setCredReq((s) => ({ ...s, password: e.target.value }))} disabled={credMode === "view"} className="userAdminPanel__input" />
                    </div>
                    <div className="userAdminPanel__field">
                      <Label htmlFor="cred_instance" className="userAdminPanel__label">Instancia</Label>
                      <Input id="cred_instance" value={credReq.instance ?? ""} onChange={(e) => setCredReq((s) => ({ ...s, instance: e.target.value }))} disabled={credMode === "view"} className="userAdminPanel__input" />
                    </div>
                    <div className="userAdminPanel__field">
                      <Label htmlFor="cred_port" className="userAdminPanel__label">Puerto</Label>
                      <Input id="cred_port" value={credReq.port ?? ""} onChange={(e) => setCredReq((s) => ({ ...s, port: e.target.value }))} disabled={credMode === "view"} className="userAdminPanel__input" />
                    </div>
                    <div className="userAdminPanel__field userAdminPanel__field--full">
                      <Label htmlFor="cred_obs" className="userAdminPanel__label">Observación</Label>
                      <Textarea id="cred_obs" value={credReq.observation ?? ""} onChange={(e) => setCredReq((s) => ({ ...s, observation: e.target.value }))} disabled={credMode === "view"} className="userAdminPanel__textarea" />
                    </div>
                    <div className="userAdminPanel__field userAdminPanel__field--check userAdminPanel__field--full">
                      <input type="checkbox" id="cred_active" checked={!!credReq.isActive} onChange={(e) => setCredReq((s) => ({ ...s, isActive: e.target.checked }))} disabled={credMode === "view"} />
                      <Label htmlFor="cred_active" className="userAdminPanel__label userAdminPanel__label--inline">Activo</Label>
                    </div>
                  </div>
                </div>
                <div className="userAdminPanel__modalFooter">
                  <Button onClick={() => setCredModalOpen(false)} type="button"  variant='secondary' className="userAdminPanel__btn userAdminPanel__btn--ghost">Cerrar</Button>
                  {credMode !== "view" && <Button onClick={saveCred} type="button" className="userAdminPanel__btn">Guardar</Button>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 3 && (
        <div className="userAdminPanel__section">
          <div className="userAdminPanel__toolbar">
            <div className="userAdminPanel__spacer" />
            <div className="userAdminPanel__row">
              <Button onClick={openEqCreate} type="button" className="userAdminPanel__btn">Nuevo equipo</Button>
            </div>
          </div>
          <CustomTable<OutsourcedDeviceResponseDTO>
            columns={eqColumns}
            rows={equipments}
            count={equipments.length}
            page={0}
            rowsPerPage={equipments.length || 10}
            rowsPerPageOptions={[equipments.length || 10]}
            onPageChange={() => {}}
            onRowsPerPageChange={() => {}}
          />
          {eqModalOpen && (
            <div className="userAdminPanel__modal">
              <div className="userAdminPanel__modalDialog">
                <div className="userAdminPanel__modalHeader">
                  <h3 className="userAdminPanel__modalTitle">{eqMode === "create" ? "Nuevo equipo" : eqMode === "update" ? "Editar equipo" : "Detalle del equipo"}</h3>
                  <button className="userAdminPanel__modalClose" onClick={() => setEqModalOpen(false)} aria-label="Cerrar" type="button">×</button>
                </div>
                <div className="userAdminPanel__modalBody">
                  <div className="userAdminPanel__grid">
                    <div className="userAdminPanel__field">
                      <Label htmlFor="eq_name" className="userAdminPanel__label">Nombre</Label>
                      <Input id="eq_name" value={eqForm.name} onChange={(e) => setEqForm((s) => ({ ...s, name: e.target.value }))} disabled={eqMode === "view"} className="userAdminPanel__input" />
                    </div>
                    <div className="userAdminPanel__field">
                      <Label htmlFor="eq_ip" className="userAdminPanel__label">IP</Label>
                      <Input id="eq_ip" value={eqForm.ip ?? ""} onChange={(e) => setEqForm((s) => ({ ...s, ip: e.target.value }))} disabled={eqMode === "view"} className="userAdminPanel__input" />
                    </div>
                    <div className="userAdminPanel__field">
                      <Label htmlFor="eq_os" className="userAdminPanel__label">SO</Label>
                      <Input id="eq_os" value={eqForm.operatingSystem ?? ""} onChange={(e) => setEqForm((s) => ({ ...s, operatingSystem: e.target.value }))} disabled={eqMode === "view"} className="userAdminPanel__input" />
                    </div>
                    <div className="userAdminPanel__field">
                      <Label htmlFor="eq_ver" className="userAdminPanel__label">Versión SO</Label>
                      <Input id="eq_ver" value={eqForm.versionSO ?? ""} onChange={(e) => setEqForm((s) => ({ ...s, versionSO: e.target.value }))} disabled={eqMode === "view"} className="userAdminPanel__input" />
                    </div>
                    <div className="userAdminPanel__field ">
                      <Label htmlFor="eq_active" className="userAdminPanel__label userAdminPanel__label--inline">Activo</Label>
                      <input type="checkbox" id="eq_active" checked={!!eqForm.isActive} onChange={(e) => setEqForm((s) => ({ ...s, isActive: e.target.checked }))} disabled={eqMode === "view"} />
                    </div>
                    <div className="userAdminPanel__field userAdminPanel__field--full">
                      <Label htmlFor="eq_desc" className="userAdminPanel__label">Descripción</Label>
                      <Textarea id="eq_desc" value={eqForm.description ?? ""} onChange={(e) => setEqForm((s) => ({ ...s, description: e.target.value }))} disabled={eqMode === "view"} className="userAdminPanel__textarea" />
                    </div>
                  </div>
                </div>
                <div className="userAdminPanel__modalFooter">
                  <Button onClick={() => setEqModalOpen(false)} type="button" variant="secondary" className="userAdminPanel__btn userAdminPanel__btn--ghost">Cerrar</Button>
                  {eqMode !== "view" && <Button onClick={saveEq} type="button" className="userAdminPanel__btn">Guardar</Button>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 4 && (
        <div className="userAdminPanel__section">
          <div className="userAdminPanel__toolbar">
            <div className="userAdminPanel__spacer" />
            <div className="userAdminPanel__row">
              <Button onClick={openSysCreate} type="button" className="userAdminPanel__btn">Nuevo sistema</Button>
            </div>
          </div>
          <CustomTable<OutsourcedSystemsResponseDTO>
            columns={sysColumns}
            rows={systems}
            count={systems.length}
            page={0}
            rowsPerPage={systems.length || 10}
            rowsPerPageOptions={[systems.length || 10]}
            onPageChange={() => {}}
            onRowsPerPageChange={() => {}}
          />
          {sysModalOpen && (
            <div className="userAdminPanel__modal">
              <div className="userAdminPanel__modalDialog">
                <div className="userAdminPanel__modalHeader">
                  <h3 className="userAdminPanel__modalTitle">{sysMode === "create" ? "Vincular sistema" : sysMode === "update" ? "Editar sistema vinculado" : "Detalle del sistema"}</h3>
                  <button className="userAdminPanel__modalClose" onClick={() => setSysModalOpen(false)} aria-label="Cerrar" type="button">×</button>
                </div>
                <div className="userAdminPanel__modalBody">
                  <div className="userAdminPanel__grid">
                    <div className="userAdminPanel__field">
                      <Label htmlFor="sys_id" className="userAdminPanel__label">Sistema</Label>
                      <Select
                        id="sys_id"
                        value={sysForm.outsourcedSystemsId}
                        onChange={(e) => setSysForm((s) => ({ ...s, outsourcedSystemsId: Number(e.target.value) }))}
                        options={[{ value: 0, label: "Seleccione sistema" }, ...systemsCatalog.map((x) => ({ value: x.id, label: x.name }))]}
                        disabled={sysMode === "view"}
                        className="userAdminPanel__select"
                      />
                    </div>
                    <div className="userAdminPanel__field userAdminPanel__field--check userAdminPanel__field--full">
                      <input type="checkbox" id="sys_active" checked={!!sysForm.isActive} onChange={(e) => setSysForm((s) => ({ ...s, isActive: e.target.checked }))} disabled={sysMode === "view"} />
                      <Label htmlFor="sys_active" className="userAdminPanel__label userAdminPanel__label--inline">Activo</Label>
                    </div>
                  </div>
                </div>
                {/* <div className="userAdminPanel__modalFooter">
                  <Button onClick={() => setSysModalOpen(false)} type="button" className="userAdminPanel__btn userAdminPanel__btn--ghost">Cerrar</Button>
                  {sysMode !== "view" && <Button onClick={saveSys} type="button" className="userAdminPanel__btn">Guardar</Button>}
                </div> */}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 5 && (
        <div className="userAdminPanel__section">
          <div className="userAdminPanel__toolbar">
            {/* <div className="filter" style={{ width: "min(420px,100%)" }}>
              <TextField
                label="Filtrar"
                variant="outlined"
                size="small"
                fullWidth
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </div> */}
            <div className="userAdminPanel__spacer" />
          </div>
          {loadingCat ? (
            <div className="userAdminPanel__loader">Cargando…</div>
          ) : errorCat ? (
            <div className="userAdminPanel__error">Ocurrió un error</div>
          ) : (
            <CustomTable<{ id: number; name: string; description?: string; isActive?: boolean; }>
              columns={catCredentialColumn}
              rows={catCredential}
              count={totalCount}
              page={page - 1}
              rowsPerPage={pageSize}
              rowsPerPageOptions={[10, 20, 30, 50]}
              onPageChange={(_, newPage) => setPage(newPage + 1)}
              onRowsPerPageChange={(e) => setPageSize(parseInt(e.target.value, 10))}
            />
          )}

          {isModalOpen && (
            <div className="userAdminPanel__modal">
              <div className="userAdminPanel__modalDialog">
                <div className="userAdminPanel__modalHeader">
                  <h3 className="userAdminPanel__modalTitle">{modalMode === "create" ? "Nuevo tipo de credencial" : modalMode === "update" ? "Editar tipo de credencial" : "Detalle del tipo"}</h3>
                  <button className="userAdminPanel__modalClose" onClick={closeModal} aria-label="Cerrar" type="button">×</button>
                </div>
                <div className="userAdminPanel__modalBody">
                  <div className="userAdminPanel__grid">
                    <div className="userAdminPanel__field userAdminPanel__field--full">
                      <Label className="userAdminPanel__label">Nombre</Label>
                      <Input value={selectedCatCredential?.name ?? ""} onChange={() => {}} disabled className="userAdminPanel__input" />
                    </div>
                  </div>
                </div>
                <div className="userAdminPanel__modalFooter">
                  <Button onClick={closeModal} type="button" className="userAdminPanel__btn userAdminPanel__btn--ghost">Cerrar</Button>
                  {modalMode !== "view" && <Button onClick={() => handleSubmit({} as any)} type="button" className="userAdminPanel__btn">Guardar</Button>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
//   Correjir solo un specto, es que cuando le da click en neuvo sistema Vincular sistema, solo select de seleccionar sistema, 
// pero no hay un boton para vincular, y hacer la peticion
//Completo, sin comentarios y completo. No modificar nada mas