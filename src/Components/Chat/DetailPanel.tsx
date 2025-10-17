/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { LuContact } from 'react-icons/lu'
import { FaRegBuilding } from 'react-icons/fa'
import { IoChatboxEllipsesOutline } from 'react-icons/io5'
import { useDetailPanel } from '@/Hooks/Chat/useDetailPanel'
import '@/Styles/Chat/DetailPanel.css'
import { useContactDetail } from '@/Hooks/Chat/useContactDetail'
import { Book, Check, Edit, Tag, X } from 'lucide-react'
import { ThreeDot } from 'react-loading-indicators'

type Props = {
  contactId?: number
  conversationId?: number
  selectedParam?: unknown
  onSendNow?: (txt: string) => void | Promise<void>
}

const PRIORIDADES = ['ALTA', 'MEDIA', 'BAJA'] as const
const TIPOS_SOPORTE = ['AAA', 'AA', 'A'] as const
const TIPOS_ENTORNO = ['LOCAL', 'NUBE', 'HIBRIDO'] as const
const CATEGORIAS = ['SQL', 'HOSTING', 'RDP', 'VPN', 'ANYDESK', 'EQUIPO', 'APLICACION', 'OTRO'] as const
const ALCANCES = ['CLIENTE', 'SUCURSAL', 'EQUIPO', 'SISTEMA'] as const

const formatNiPhone = (value?: string | number | null) => {
  if (value == null) return '---'
  const digits = String(value).replace(/\D/g, '')
  let local = digits.startsWith('505') ? digits.slice(3) : digits
  if (!local) return '---'
  if (local.length > 8) local = local.slice(-8)
  const first = local.slice(0, 4)
  const last = local.slice(4, 8)
  return `505 - ${first}${last ? ' ' + last : ''}`
}

const displayOrDash = (v?: string | number | null) =>
  v === null || v === undefined || v === '' ? '---' : String(v)

const formatDate = (v?: string | number | Date | null) => {
  if (!v) return '---'
  const d = new Date(v)
  if (isNaN(d.getTime())) return displayOrDash(v as any)
  return new Intl.DateTimeFormat('es-NI', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="detailPanel-contactGroup">
    <p className="detailPanel-contactGroup__title">{label}</p>
    <span className="detailPanel-contactGroup__value">{value ?? '---'}</span>
  </div>
)

const InfoGrid: React.FC<{ items: { label: string; value: React.ReactNode }[] }> = ({ items }) => (
  <div className="detailPanel-contactGroup-__container">
    {items.map((it) => (
      <Row key={it.label} label={it.label} value={it.value} />
    ))}
  </div>
)

const Field: React.FC<{
  label: string
  children: React.ReactNode
}> = ({ label, children }) => (
  <div className="dp-field">
    <label className="dp-label">{label}</label>
    {children}
  </div>
)

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input className="dp-input" {...props} />
)

const SelectInput: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & { placeholder?: string }
> = ({ placeholder, children, ...rest }) => (
  <select className="dp-select" {...rest}>
    {placeholder ? <option value="">{placeholder}</option> : null}
    {children}
  </select>
)

const DetailPanel: React.FC<Props> = ({ contactId, conversationId, selectedParam, onSendNow }) => {
  const { selectedData, client, optionMenu, setOptionMenu, quickOptions, loading, error } = useDetailPanel(
    contactId,
    selectedParam
  )

  const {
    conv,
    conversationTone,
    tags = [],
    isAddingTag,
    newTag,
    loading: convLoading,
    error: convError,
    setIsAddingTag,
    setNewTag,
    handleAddTag,
    handleRemoveTag,
    handleKeyDown
  } = useContactDetail(Number(conversationId))

  const [q, setQ] = useState('')

    const handleSendQuick = useCallback(
    async (text: string) => {
      try {
        if (onSendNow) {
          await onSendNow(text)
          return
        }
        const w = window as any
        if (typeof w.__CHAT_SEND_QUICK__ === 'function') {
          w.__CHAT_SEND_QUICK__(text)
          return
        }
        window.dispatchEvent(new CustomEvent('chat:sendQuick', { detail: { text } }))
      } catch {}
    },
    [onSendNow]
  )
  
  // === Estado editable (Cliente / Equipo / Sistema / Credenciales) ===
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  const [form, setForm] = useState<any>({
    // Campos “restantes” solicitados
    Prioridad: '',
    TipoSoporte: '',
    TipoEntorno: '',
    Categoria: '',
    Alcance: '',
    // Cliente
    ModeloTrabajo: '',
    Franquicia: false,
    TiempoLimiteHoras: '',
    Recurrencia: '',
    Observaciones: '',
    SoporteActivo: undefined,
    Activo: undefined,
    // Equipo
    Equipo_Nombre: '',
    DireccionIP: '',
    SistemaOperativo: '',
    VersionSO: '',
    // Sistema
    Sistema_Nombre: '',
    Sistema_Version: '',
    // Credenciales
    Usuario: '',
    ClaveCifrada: '',
    Instancia: '',
    Puerto: '',
  })

  // Inicializa el formulario cuando cargue el cliente
  useEffect(() => {
    if (!client) return
    const c: any = client
    setForm((prev: any) => ({
      ...prev,
      Prioridad: c.Prioridad ?? '',
      TipoSoporte: c.TipoSoporte ?? '',
      TipoEntorno: c.TipoEntorno ?? '',
      Categoria: c.Categoria ?? '',
      Alcance: c.Alcance ?? '',
      ModeloTrabajo: c.ModeloTrabajo ?? '',
      Franquicia: c.Franquicia ?? false,
      TiempoLimiteHoras: c.TiempoLimiteHoras ?? '',
      Recurrencia: c.Recurrencia ?? '',
      Observaciones: c.Observaciones ?? '',
      SoporteActivo: typeof c.SoporteActivo === 'boolean' ? c.SoporteActivo : undefined,
      Activo: typeof c.Activo === 'boolean' ? c.Activo : undefined,
      // Equipo
      Equipo_Nombre: c.Equipo_Nombre ?? '',
      DireccionIP: c.DireccionIP ?? '',
      SistemaOperativo: c.SistemaOperativo ?? '',
      VersionSO: c.VersionSO ?? '',
      // Sistema
      Sistema_Nombre: c.Sistema_Nombre ?? '',
      Sistema_Version: c.Sistema_Version ?? '',
      // Credenciales
      Usuario: c.Usuario ?? '',
      ClaveCifrada: c.ClaveCifrada ?? '',
      Instancia: c.Instancia ?? '',
      Puerto: c.Puerto ?? '',
    }))
  }, [client])

  const onF = useCallback((k: string, v: any) => {
    setForm((s: any) => ({ ...s, [k]: v }))
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      // Aquí puedes llamar a tu API directamente.
      // Por defecto disparamos un evento para que lo capture tu app.
      window.dispatchEvent(new CustomEvent('chat:updateClient', { detail: { contactId, payload: form } }))
      setEditing(false)
    } catch (e) {
      // opcional: mostrar toast
    } finally {
      setSaving(false)
    }
  }, [contactId, form])

  const filteredQuick = useMemo(() => {
    const n = q.toLowerCase()
    return (quickOptions || []).filter((s) => s.toLowerCase().includes(n))
  }, [quickOptions, q])

  if (loading)
    return (
      <div className="loader-container">
        <ThreeDot color="#0070B4" size="medium" />
      </div>
    )
  if (error) return <div className="detailPanel-error">No se han podido cargar los detalles</div>

  const contactPhone = formatNiPhone((selectedData as any)?.phone)


  const readOnlyClientItems = [
    { label: 'Modelo de trabajo', value: displayOrDash((client as any)?.ModeloTrabajo) },
    { label: 'Prioridad', value: displayOrDash((client as any)?.Prioridad) },
    { label: 'Tipo de soporte', value: displayOrDash((client as any)?.TipoSoporte) },
    { label: 'Tipo de entorno', value: displayOrDash((client as any)?.TipoEntorno) },
    { label: 'Categoría', value: displayOrDash((client as any)?.Categoria) },
    { label: 'Alcance', value: displayOrDash((client as any)?.Alcance) },
    {
      label: 'Soporte activo',
      value:
        (client as any)?.SoporteActivo ? 'Sí' : (client as any)?.SoporteActivo === false ? 'No' : '---'
    },
    {
      label: 'Franquicia',
      value: (client as any)?.Franquicia ? 'Sí' : (client as any)?.Franquicia === false ? 'No' : '---'
    },
    { label: 'Tiempo límite (h)', value: displayOrDash((client as any)?.TiempoLimiteHoras) },
    { label: 'Recurrencia', value: displayOrDash((client as any)?.Recurrencia) },
    { label: 'Últ. fecha de contacto', value: formatDate((client as any)?.UltFechaContacto) },
    { label: 'Últ. caso cerrado', value: formatDate((client as any)?.UltCasoCerrado) },
    { label: 'Observaciones', value: displayOrDash((client as any)?.Observaciones) },
    { label: 'Activo', value: (client as any)?.Activo ? 'Sí' : (client as any)?.Activo === false ? 'No' : '---' },
    // Equipo
    { label: 'Equipo - Nombre', value: displayOrDash((client as any)?.Equipo_Nombre) },
    { label: 'Equipo - IP', value: displayOrDash((client as any)?.DireccionIP) },
    { label: 'Equipo - SO', value: displayOrDash((client as any)?.SistemaOperativo) },
    { label: 'Equipo - Versión SO', value: displayOrDash((client as any)?.VersionSO) },
    // Sistema
    { label: 'Sistema - Nombre', value: displayOrDash((client as any)?.Sistema_Nombre) },
    { label: 'Sistema - Versión', value: displayOrDash((client as any)?.Sistema_Version) },
    // Credenciales (mostrar solo existencia)
    { label: 'Usuario', value: displayOrDash((client as any)?.Usuario) },
    { label: 'Instancia', value: displayOrDash((client as any)?.Instancia) },
    { label: 'Puerto', value: displayOrDash((client as any)?.Puerto) }
  ]

  return (
    <div className="detailPanel-container">
      <ul className="detail-panel__header">
        <li className={`detailPanel-option ${optionMenu === 1 ? 'is-active' : ''}`}>
          <button type="button" className="detailPanel-optionBtn" onClick={() => setOptionMenu(1)}>
            <LuContact size={20} className="detailPanel-optionBtn__icon" />
          </button>
        </li>
        <li className={`detailPanel-option ${optionMenu === 2 ? 'is-active' : ''}`}>
          <button type="button" className="detailPanel-optionBtn" onClick={() => setOptionMenu(2)}>
            <FaRegBuilding size={18} className="detailPanel-optionBtn__icon" />
          </button>
        </li>
        <li className={`detailPanel-option ${optionMenu === 3 ? 'is-active' : ''}`}>
          <button type="button" className="detailPanel-optionBtn" onClick={() => setOptionMenu(3)}>
            <IoChatboxEllipsesOutline size={18} className="detailPanel-optionBtn__icon" />
          </button>
        </li>
        <li className={`detailPanel-option ${optionMenu === 4 ? 'is-active' : ''}`}>
          <button type="button" className="detailPanel-optionBtn" onClick={() => setOptionMenu(4)}>
            <Book size={18} className="detailPanel-optionBtn__icon" />
          </button>
        </li>
      </ul>

      <section className="detailPanel-content">
        {optionMenu === 1 && (
          <>
            <header>
              <h5>Detalles del contacto</h5>
            </header>
            <InfoGrid
              items={[
                { label: 'Nombre', value: displayOrDash((selectedData as any)?.fullName) },
                { label: 'Teléfono', value: contactPhone },
                { label: 'WhatsApp', value: displayOrDash((selectedData as any)?.waName) },
                {
                  label: 'Verificado',
                  value: (selectedData as any)?.isVerified ? 'Verificado' : 'No Verificado'
                },
                { label: 'Activo', value: (selectedData as any)?.isActive ? 'Activo' : 'No Activo' },
                { label: 'Verificado por', value: displayOrDash((selectedData as any)?.verifiedBy?.fullName) },
                { label: 'Creado', value: formatDate((selectedData as any)?.createdAt) },
                { label: 'Actualizado', value: formatDate((selectedData as any)?.updatedAt) },
                { label: 'verifiedAt', value: formatDate((selectedData as any)?.verifiedAt) }
              ]}
            />
          </>
        )}

        {optionMenu === 2 && (
          <>
            <header className="dp-header">
              <h5>Detalles del cliente</h5>
              <div className="dp-actions">
                {!editing ? (
                  <button className="btn btn--primary" onClick={() => setEditing(true)}>
                    <Edit size={14} /> Editar
                  </button>
                ) : (
                  <>
                    <button
                      className="btn"
                      onClick={() => {
                        setEditing(false)
                        // reset a valores actuales del cliente
                        const c: any = client || {}
                        setForm((prev: any) => ({
                          ...prev,
                          Prioridad: c.Prioridad ?? '',
                          TipoSoporte: c.TipoSoporte ?? '',
                          TipoEntorno: c.TipoEntorno ?? '',
                          Categoria: c.Categoria ?? '',
                          Alcance: c.Alcance ?? '',
                          ModeloTrabajo: c.ModeloTrabajo ?? '',
                          Franquicia: c.Franquicia ?? false,
                          TiempoLimiteHoras: c.TiempoLimiteHoras ?? '',
                          Recurrencia: c.Recurrencia ?? '',
                          Observaciones: c.Observaciones ?? '',
                          SoporteActivo: typeof c.SoporteActivo === 'boolean' ? c.SoporteActivo : undefined,
                          Activo: typeof c.Activo === 'boolean' ? c.Activo : undefined,
                          Equipo_Nombre: c.Equipo_Nombre ?? '',
                          DireccionIP: c.DireccionIP ?? '',
                          SistemaOperativo: c.SistemaOperativo ?? '',
                          VersionSO: c.VersionSO ?? '',
                          Sistema_Nombre: c.Sistema_Nombre ?? '',
                          Sistema_Version: c.Sistema_Version ?? '',
                          Usuario: c.Usuario ?? '',
                          ClaveCifrada: c.ClaveCifrada ?? '',
                          Instancia: c.Instancia ?? '',
                          Puerto: c.Puerto ?? '',
                        }))
                      }}
                    >
                      Cancelar
                    </button>
                    <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                      {saving ? 'Guardando…' : 'Guardar cambios'}
                    </button>
                  </>
                )}
              </div>
            </header>

            {!editing ? (
              <InfoGrid items={readOnlyClientItems} />
            ) : (
              <div className="dp-formGrid">
                {/* Campos Restantes */}
                <div className="dp-sectionTitle">Clasificación</div>
                <Field label="Prioridad">
                  <SelectInput value={form.Prioridad} onChange={(e) => onF('Prioridad', e.target.value)} placeholder="Selecciona prioridad">
                    {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Tipo de soporte">
                  <SelectInput value={form.TipoSoporte} onChange={(e) => onF('TipoSoporte', e.target.value)} placeholder="Selecciona tipo">
                    {TIPOS_SOPORTE.map(p => <option key={p} value={p}>{p}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Tipo de entorno">
                  <SelectInput value={form.TipoEntorno} onChange={(e) => onF('TipoEntorno', e.target.value)} placeholder="Selecciona entorno">
                    {TIPOS_ENTORNO.map(p => <option key={p} value={p}>{p}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Categoría">
                  <SelectInput value={form.Categoria} onChange={(e) => onF('Categoria', e.target.value)} placeholder="Selecciona categoría">
                    {CATEGORIAS.map(p => <option key={p} value={p}>{p}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Alcance">
                  <SelectInput value={form.Alcance} onChange={(e) => onF('Alcance', e.target.value)} placeholder="Selecciona alcance">
                    {ALCANCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </SelectInput>
                </Field>

                {/* Cliente */}
                <div className="dp-sectionTitle">Cliente</div>
                <Field label="Modelo de trabajo">
                  <SelectInput value={form.ModeloTrabajo} onChange={(e) => onF('ModeloTrabajo', e.target.value)} placeholder="Selecciona modelo">
                    {TIPOS_ENTORNO.map(p => <option key={p} value={p}>{p}</option>)}
                  </SelectInput>
                </Field>
                <Field label="Franquicia">
                  <SelectInput value={String(!!form.Franquicia)} onChange={(e) => onF('Franquicia', e.target.value === 'true')}>
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </SelectInput>
                </Field>
                <Field label="Soporte activo">
                  <SelectInput value={form.SoporteActivo === undefined ? '' : String(!!form.SoporteActivo)} onChange={(e) => onF('SoporteActivo', e.target.value === 'true')} placeholder="Selecciona">
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </SelectInput>
                </Field>
                <Field label="Activo">
                  <SelectInput value={form.Activo === undefined ? '' : String(!!form.Activo)} onChange={(e) => onF('Activo', e.target.value === 'true')} placeholder="Selecciona">
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </SelectInput>
                </Field>
                <Field label="Tiempo límite (h)">
                  <TextInput type="number" value={form.TiempoLimiteHoras ?? ''} onChange={(e) => onF('TiempoLimiteHoras', e.target.value)} />
                </Field>
                <Field label="Recurrencia">
                  <TextInput value={form.Recurrencia ?? ''} onChange={(e) => onF('Recurrencia', e.target.value)} />
                </Field>
                <Field label="Observaciones">
                  <TextInput value={form.Observaciones ?? ''} onChange={(e) => onF('Observaciones', e.target.value)} />
                </Field>

                {/* Equipo */}
                <div className="dp-sectionTitle">Equipo</div>
                <Field label="Nombre del equipo">
                  <TextInput value={form.Equipo_Nombre ?? ''} onChange={(e) => onF('Equipo_Nombre', e.target.value)} />
                </Field>
                <Field label="Dirección IP">
                  <TextInput value={form.DireccionIP ?? ''} onChange={(e) => onF('DireccionIP', e.target.value)} />
                </Field>
                <Field label="Sistema Operativo">
                  <TextInput value={form.SistemaOperativo ?? ''} onChange={(e) => onF('SistemaOperativo', e.target.value)} />
                </Field>
                <Field label="Versión SO">
                  <TextInput value={form.VersionSO ?? ''} onChange={(e) => onF('VersionSO', e.target.value)} />
                </Field>

                {/* Sistema */}
                <div className="dp-sectionTitle">Sistema</div>
                <Field label="Nombre del sistema">
                  <TextInput value={form.Sistema_Nombre ?? ''} onChange={(e) => onF('Sistema_Nombre', e.target.value)} />
                </Field>
                <Field label="Versión del sistema">
                  <TextInput value={form.Sistema_Version ?? ''} onChange={(e) => onF('Sistema_Version', e.target.value)} />
                </Field>

                {/* Credenciales */}
                <div className="dp-sectionTitle">Credenciales</div>
                <Field label="Usuario">
                  <TextInput value={form.Usuario ?? ''} onChange={(e) => onF('Usuario', e.target.value)} />
                </Field>
                <Field label="Clave (cifrada)">
                  <div className="dp-password">
                    <TextInput type={showPwd ? 'text' : 'password'} value={form.ClaveCifrada ?? ''} onChange={(e) => onF('ClaveCifrada', e.target.value)} />
                    <button type="button" className="btn dp-togglePwd" onClick={() => setShowPwd(s => !s)}>
                      {showPwd ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </Field>
                <Field label="Instancia">
                  <TextInput value={form.Instancia ?? ''} onChange={(e) => onF('Instancia', e.target.value)} />
                </Field>
                <Field label="Puerto">
                  <TextInput type="number" value={form.Puerto ?? ''} onChange={(e) => onF('Puerto', e.target.value)} />
                </Field>
              </div>
            )}
          </>
        )}

        {optionMenu === 3 && (
          <div className="detailPanel-quick">
            <header className="detailPanel-quick__header">
              <h5>Mensajes rápidos</h5>
              <input
                className="detailPanel-quick__search"
                placeholder="Buscar…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </header>

            {(filteredQuick || []).length === 0 ? (
              <p className="detailPanel-quick__empty">No hay mensajes rápidos disponibles.</p>
            ) : (
              <ul
                className="detailPanel-quick__list"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 10 }}
              >
                {filteredQuick.map((opt, i) => (
                  <li key={`${opt}-${i}`} className="detailPanel-quick__item">
                    <div
                      className="detailPanel-quick__text"
                      style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                    >
                      {opt}
                    </div>
                    <div className="detailPanel-quick__actions">
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => handleSendQuick(opt)}
                        title="Enviar ahora"
                      >
                        Enviar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {optionMenu === 4 && (
          <div className="detailPanel-conv">
            <header>
              <h5>Detalles de la conversación</h5>
            </header>

            {!conversationId ? (
              <p className="detailPanel-quick__empty">Sin conversación seleccionada</p>
            ) : convLoading ? (
              <p className="detailPanel-quick__empty">Cargando…</p>
            ) : convError ? (
              <p className="detailPanel-quick__empty">No se pudo cargar la conversación.</p>
            ) : !conv ? (
              <p className="detailPanel-quick__empty">No hay datos de la conversación.</p>
            ) : (
              <>
                <InfoGrid
                  items={[
                    { label: 'Empresa', value: (conv as any).systemDefinedCompanyName ?? '---' },
                    { label: 'Contacto', value: (conv as any).clientContactName ?? '---' },
                    { label: 'Número', value: (conv as any).contactNumber ?? '---' },
                    { label: 'Canal', value: 'WhatsApp' },
                    {
                      label: 'Estado Reciente',
                      value: (
                        <strong className={`conversation-status__${String((conv as any).status || '').trim()}`}>
                          {(conv as any).status}
                        </strong>
                      )
                    }
                  ]}
                />

                <InfoGrid
                  items={[
                    { label: 'Creado', value: formatDate((conv as any).createdAt) },
                    { label: 'Solicitud de agente', value: formatDate((conv as any).agentRequestAt) },
                    { label: 'Asignación a agente', value: formatDate((conv as any).assignedAt) },
                    { label: 'Primer mensaje del agente', value: formatDate((conv as any).agentFirstMessageAt) },
                    { label: 'Último mensaje del agente', value: formatDate((conv as any).agentLastMessageAt) },
                    { label: 'Último mensaje del cliente', value: formatDate((conv as any).clientLastMessageAt) },
                    { label: 'Última actualización', value: formatDate((conv as any).updatedAt) },
                    { label: 'Cierre', value: formatDate((conv as any).closedAt) }
                  ]}
                />

                <div className="detailPanel-contactGroup-__container">
                  {(conv as any).assignedByUserName && (
                    <Row label="Asignado por" value={(conv as any).assignedByUserName} />
                  )}
                  {(conv as any).assignedAgentName && (
                    <Row label="Agente asignado" value={(conv as any).assignedAgentName} />
                  )}
                </div>

                {conversationTone && (
                  <InfoGrid
                    items={[
                      {
                        label: 'Tono de conversación',
                        value: (
                          <strong className={`conversation-toneText__${String(conversationTone).trim()}`}>
                            {conversationTone}
                          </strong>
                        )
                      }
                    ]}
                  />
                )}

                <div className="detailPanel-tags" style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag size={16} />
                    <h6 style={{ margin: 0 }}>Etiquetas</h6>
                    {!isAddingTag && (
                      <button className="section-action" onClick={() => setIsAddingTag(true)}>
                        <Edit size={14} /> <span>Editar</span>
                      </button>
                    )}
                  </div>

                  {tags.length === 0 ? (
                    <p className="detailPanel-quick__empty">No hay etiquetas</p>
                  ) : (
                    <div className="tag-list" style={{ marginTop: 6 }}>
                      {tags.map((t) => (
                        <div key={t} className="tag">
                          <span className="tag-text">{t}</span>
                          {isAddingTag && (
                            <button className="tag-remove" onClick={() => handleRemoveTag(t)}>
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {isAddingTag && (
                    <div className="tag-editor">
                      <div className="tag-input-container">
                        <input
                          className="tag-input"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Nueva etiqueta…"
                          onKeyDown={handleKeyDown}
                          maxLength={60}
                          autoFocus
                        />
                        <div className="tag-input-actions">
                          <button className="tag-action-btn tag-add-btn" onClick={handleAddTag} disabled={!newTag.trim()}>
                            <Check size={16} />
                          </button>
                          <button
                            className="tag-action-btn tag-cancel-btn"
                            onClick={() => {
                              setNewTag('')
                              setIsAddingTag(false)
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
        {/* Completo, con las solicitudes y campos editables agregados */}
      </section>
    </div>
  )
}

export default DetailPanel