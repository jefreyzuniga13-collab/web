/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from 'react'
import { LuContact } from 'react-icons/lu'
import { FaRegBuilding } from 'react-icons/fa'
import { IoChatboxEllipsesOutline } from 'react-icons/io5'
import { useDetailPanel } from '@/Hooks/Chat/useDetailPanel'
import '@/Styles/Chat/DetailPanel.css'
import { useContactDetail } from '@/Hooks/Chat/useContactDetail'
import { Book, Check, Edit, Tag, X } from 'lucide-react'
import { ThreeDot } from 'react-loading-indicators'
import { intervalToDuration } from "date-fns";

type Props = {
  contactId?: number
  conversationId?: number  
  selectedParam?: unknown
  onSendNow?: (txt: string) => void | Promise<void>
}

export function formatConvDuration(raw?: string | number | null): string {
  if (!raw) return "—";

  let totalSec = 0;

  if (typeof raw === "string" && raw.includes(":")) {
    // Ejemplo: "4.06:27:07.2734041" => días.horas:min:seg
    const [daysPart, hms] = raw.split(".");
    const [hh, mm, ss] = hms.split(":").map(Number);
    const days = parseInt(daysPart, 10);

    totalSec = days * 86400 + hh * 3600 + mm * 60 + ss;
  } else {
    totalSec = Number(raw);
  }

  if (isNaN(totalSec) || totalSec < 0) return "—";

  const dur = intervalToDuration({ start: 0, end: totalSec * 1000 });

  const parts: string[] = [];
  if (dur.days) parts.push(`${dur.days}d`);
  if (dur.hours) parts.push(`${dur.hours}h`);
  if (dur.minutes) parts.push(`${dur.minutes}m`);
  if (dur.seconds) parts.push(`${dur.seconds}s`);

  return parts.length ? parts.join(" ") : "0s";
}

const formatNiPhone = (value?: string | number | null) => {
  if (value == null) return '---'
  const digits = String(value).replace(/\D/g, '')
  let local = digits.startsWith('505') ? digits.slice(3) : digits
  if (!local) return '---'
  if (local.length > 8) local = local.slice(-8)
  return `505 - ${local}`
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
    minute: '2-digit',
  }).format(d)
}

const DetailPanel: React.FC<Props> = ({
  contactId,
  conversationId,
  selectedParam,
  onSendNow,
}) => {
  const {
    selectedData,
    client,
    optionMenu,
    setOptionMenu,
    quickOptions,
    loading,
    error,
  } = useDetailPanel(contactId, selectedParam)

    const {
    conv,
    conversationTone,
    tags,
    isAddingTag,
    newTag,
    loading: convLoading,
    error: convError,
    setIsAddingTag,
    setNewTag,
    handleAddTag,
    handleRemoveTag,
    handleKeyDown,
  } = useContactDetail(Number(conversationId));

  const [q, setQ] = useState('')
  const filteredQuick = useMemo(() => {
    const n = q.toLowerCase()
    return quickOptions.filter((s) => s.toLowerCase().includes(n))
  }, [quickOptions, q])

  if (loading) return <div className="loader-container">
        <ThreeDot color="#0070B4" size="medium" />
      </div>
  if (error) return <div className="detailPanel-error">No se han podido cargar los detalles</div>

  const contactPhone = formatNiPhone(selectedData?.phone)
  const clientPhone = client?.telefono || client?.celular || ''
  const clientPhoneFmt = formatNiPhone(clientPhone)

  const handleSendQuick = async (text: string) => {
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
  }

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
            <header><h5>Detalles del contacto</h5></header>
            <div className="detailPanel-contactGroup-__container">
              <div className="detailPanel-contactGroup">
                <p className="detailPanel-contactGroup__title">Nombre: </p>
                <span className="detailsPanel-contactGroup__value">
                  {displayOrDash(selectedData?.fullName)}
                </span>
              </div>
              <div className="detailPanel-contactGroup">
                <p className="detailPanel-contactGroup__title">Teléfono: </p>
                <span className="detailsPanel-contactGroup__value">{contactPhone}</span>
              </div>
              <div className="detailPanel-contactGroup">
                <p className="detailPanel-contactGroup__title">WhatsApp: </p>
                <span className="detailsPanel-contactGroup__value">
                  {displayOrDash(selectedData?.waName)}
                </span>
              </div>
              <div className="detailPanel-contactGroup">
                <p className="detailPanel-contactGroup__title">Verificado: </p>
                <span className="detailsPanel-contactGroup__value">
                  {selectedData?.isVerified ? 'Verificado' : 'No Verificado'}
                </span>
              </div>
              <div className="detailPanel-contactGroup">
                <p className="detailPanel-contactGroup__title">Activo: </p>
                <span className="detailsPanel-contactGroup__value">
                  {selectedData?.isActive ? 'Activo' : 'No Activo'}
                </span>
              </div>
              <div className="detailPanel-contactGroup">
                <p className="detailPanel-contactGroup__title">Verificado por: </p>
                <span className="detailsPanel-contactGroup__value">
                  {displayOrDash(selectedData?.verifiedBy?.fullName)}
                </span>
              </div>
              <div className="detailPanel-contactGroup">
                <p className="detailPanel-contactGroup__title">Creado: </p>
                <span className="detailsPanel-contactGroup__value">
                  {formatDate(selectedData?.createdAt)}
                </span>
              </div>
              <div className="detailPanel-contactGroup">
                <p className="detailPanel-contactGroup__title">Actualizado: </p>
                <span className="detailsPanel-contactGroup__value">
                  {formatDate(selectedData?.updatedAt)}
                </span>
              </div>
              <div className="detailPanel-contactGroup">
                <p className="detailPanel-contactGroup__title">verifiedAt: </p>
                <span className="detailsPanel-contactGroup__value">
                  {formatDate(selectedData?.verifiedAt)}
                </span>
              </div>
            </div>
          </>
        )}

        {optionMenu === 2 && (
          <>
            <header><h5>Detalles del cliente</h5></header>
            <div>
              <div className="detailPanel-clientGroup">
                <p className="detailPanel-clientGroup__title">Código cliente</p>
                <span className="detailPanel-clientGroup__cliente">
                  {displayOrDash(client?.codCliente)}
                </span>
              </div>
              <div className="detailPanel-clientGroup">
                <p className="detailPanel-clientGroup__title">Nombre</p>
                <span className="detailPanel-clientGroup__cliente">
                  {displayOrDash(client?.nombre)}
                </span>
              </div>
              <div className="detailPanel-clientGroup">
                <p className="detailPanel-clientGroup__title">Teléfono</p>
                <span className="detailPanel-clientGroup__cliente">{clientPhoneFmt}</span>
              </div>
              <div className="detailPanel-clientGroup">
                <p className="detailPanel-clientGroup__title">Dirección</p>
                <span className="detailPanel-clientGroup__cliente">
                  {displayOrDash(client?.direccion)}
                </span>
              </div>
              <div className="detailPanel-clientGroup">
                <p className="detailPanel-clientGroup__title">Saldo Último Corte</p>
                <span className="detailPanel-clientGroup__cliente">
                  {client?.saldoUltimoCorte == null ? '---' : String(client?.saldoUltimoCorte)}
                </span>
              </div>
            </div>
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

            {filteredQuick.length === 0 ? (
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
    <header><h5>Detalles de la conversación</h5></header>

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
        {/* utilitario para filas */}
        {/*
          Pon esto arriba del return del componente si lo prefieres:
          const Row = ({label, value}:{label:string;value:React.ReactNode}) => (
            <div className="detailPanel-contactGroup">
              <p className="detailPanel-contactGroup__title">{label}</p>
              <span className="detailsPanel-contactGroup__value">{value ?? '---'}</span>
            </div>
          );
        */}
        {(() => {
          const Row = ({label, value}:{label:string;value:React.ReactNode}) => (
            <div className="detailPanel-contactGroup">
              <p className="detailPanel-contactGroup__title">{label}</p>
              <span className="detailsPanel-contactGroup__value">{value ?? '---'}</span>
            </div>
          );
          return (
            <>
              {/* Información general */}
              <div className="detailPanel-contactGroup-__container">
                <Row label="Empresa" value={conv.systemDefinedCompanyName ?? '---'} />
                <Row label="Contacto" value={conv.clientContactName ?? '---'} />
                <Row label="Número" value={conv.contactNumber ?? '---'} />
                <Row label="Canal" value={'WhatsApp'} />
                <Row label="Estado Reciente" value={conv.status ?? '---'} />
                <Row label="Duración" value={formatConvDuration(conv.duration)} />
              </div>

              {/* Línea de tiempo */}
              <div className="detailPanel-contactGroup-__container">
                <Row label="Creado" value={formatDate(conv.createdAt)} />
                <Row label="Solicitud de agente" value={formatDate(conv.agentRequestAt)} />
                <Row label="Asignación a agente" value={formatDate(conv.assignedAt)} />
                <Row label="Primer mensaje del agente" value={formatDate(conv.agentFirstMessageAt)} />
                <Row label="Último mensaje del agente" value={formatDate(conv.agentLastMessageAt)} />
                <Row label="Último mensaje del cliente" value={formatDate(conv.clientLastMessageAt)} />
                <Row label="Última actualización" value={formatDate(conv.updatedAt)} />
                <Row label="Cierre" value={formatDate(conv.closedAt)} />
              </div>

              {/* ======= Responsables */}
              <div className="detailPanel-contactGroup-__container">
                {conv.assignedByUserName && <Row label="Asignado por" value={conv.assignedByUserName} />}
                {conv.assignedAgentName && <Row label="Agente asignado" value={conv.assignedAgentName} />}
              </div>

              {/* Tono */}
              {conversationTone && (
                <div className="detailPanel-contactGroup-__container">
                  <Row
                    label="Tono de conversación"
                    value={<strong className={`conversation-toneText__${conversationTone.trim()}`}>{conversationTone}</strong>}
                  />
                </div>
              )}

              {/* Etiquetas */}
              <div className="detailPanel-tags" style={{marginTop:10}}>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <Tag size={16} />
                  <h6 style={{margin:0}}>Etiquetas</h6>
                  {!isAddingTag && (
                    <button className="section-action" onClick={() => setIsAddingTag(true)}>
                      <Edit size={14} /> <span>Editar</span>
                    </button>
                  )}
                </div>

                {tags.length === 0 ? (
                  <p className="detailPanel-quick__empty">No hay etiquetas</p>
                ) : (
                  <div className="tag-list" style={{marginTop:6}}>
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
                        <button className="tag-action-btn tag-cancel-btn" onClick={() => { setNewTag(''); setIsAddingTag(false); }}>
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )
        })()}
      </>
    )}
  </div>
)}

      </section>
    </div>
  )
}

export default DetailPanel