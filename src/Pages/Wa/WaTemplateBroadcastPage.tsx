/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react'
import { useTemplateBroadcastSmart } from '@/Hooks/Wh/useTemplateBroadcast.ts' // <- ojo al nombre
import Button from '@/Components/Common/Button'
import Input from '@/Components/Common/Input'
import Select from '@/Components/Common/Select'
import CustomTable from '@/Components/Common/CustomTable'
import type { Column } from '@/Interfaces/Common/CustomTable'
import type { ContactLogInterface } from '@/Interfaces/Contact/ContactInterface'
import { toast } from 'react-toastify'

export default function WaTemplateBroadcastSmartPage() {
  const vm = useTemplateBroadcastSmart()
  const [sending, setSending] = useState(false)

  useEffect(() => { vm.loadApproved() }, [vm])

  const templateOptions = useMemo(
    () => [
      { label: '— Selecciona —', value: '' },
      ...vm.approved.map(t => ({
        label: `${t.name || t.name} (${t.language})`,
        value: String(t.id),
      })),
    ],
    [vm.approved],
  )

  /** columnas de la tabla de contactos (usa tu CustomTable) */
  const cols: Column<ContactLogInterface>[] = useMemo(() => [
    {
      id: 'id',
      label: '',
      minWidth: 24,
      render: r => (
        <Input
          type="checkbox"
          checked={vm.selectedIds.includes(r.id!)}
          onChange={e => vm.setSelectedIds(prev =>
            e.target.checked ? [...prev, r.id!] : prev.filter(id => id !== r.id!)
          )}
        />
      ),
    },
    { id: 'waName', label: 'Nombre', minWidth: 160, render: r => r.waName || r.fullName || '-' },
    { id: 'phone', label: 'Teléfono', minWidth: 120 },
    { id: 'isActive', label: 'Activo', minWidth: 60, render: r => (r.isActive ? 'Sí' : 'No') },
  ], [vm.selectedIds])

  const onSend = async () => {
    try {
      setSending(true)
      const res = await vm.send()
      toast.success(`Enviados: ${res.sent}  |  Fallidos: ${res.failed}`)
      // si quieres, abrir modal con res.items
      console.log(res.items)
    } catch (e: any) {
      toast.error(e.message || 'Error al enviar')
    } finally {
      setSending(false)
    }
  }

  return (
<div className="sp-page__container" style={{overflow:"scroll"}}>
      <div className="sp-page__header">
        <div>
          <h1 className="sp-page__title">Enviar Plantillas Aprobadas</h1>
          <p className="sp-page__subtitle">La interfaz se adapta a la plantilla seleccionada</p>
        </div>
      </div>

      {/* === Sección 1: Selección de plantilla === */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div className="sp-modal__grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="sp-modal__label">Plantilla aprobada</label>
            <Select
              value={vm.tpl?.id ? String(vm.tpl.id) : ''}
              options={templateOptions}
              onChange={e => {
                const id = Number(e.target.value)
                const t = vm.approved.find(x => x.id === id) || null
                vm.setTpl(t)
              }}
              className="sp-modal__select"
            />
          </div>

          {vm.desc && (
            <div style={{ alignSelf: 'end', fontSize: 13, opacity: 0.9 }}>
              <div><b>HEADER:</b> {vm.desc.header.kind}{vm.desc.header.needsMedia ? ' (requiere media)' : ''}</div>
              <div><b>BODY vars:</b> {vm.desc.bodyVarCount}</div>
              <div>
                <b>BUTTONS:</b>{' '}
                {vm.desc.buttons.length
                  ? vm.desc.buttons.map(b => b.type + (b.requiresParam ? '({{1}})' : '')).join(', ')
                  : '—'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* === Sección 2: Requeridos por la plantilla (dinámico) === */}
      {vm.desc && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          {/* HEADER media */}
          {vm.desc.header.needsMedia && (
            <div style={{ marginBottom: 16 }}>
              <label className="sp-modal__label">Header media</label>
              <Input
                type="file"
                accept={
                  vm.desc.header.kind === 'IMAGE'
                    ? 'image/*'
                    : vm.desc.header.kind === 'VIDEO'
                    ? 'video/*'
                    : '*'
                }
                onChange={async e => {
                  if (e.target.files?.[0]) await vm.pickHeaderMedia(e.target.files[0])
                }}
              />
              {vm.headerMedia?.preview && (
                <div style={{ marginTop: 8 }}>
                  <small>Preview:</small><br />
                  {vm.desc.header.kind === 'IMAGE'
                    ? <img src={vm.headerMedia.preview} alt="" style={{ maxWidth: 180, borderRadius: 8 }} />
                    : <a href={vm.headerMedia.preview} target="_blank" rel="noreferrer">{vm.headerMedia.preview}</a>}
                </div>
              )}
            </div>
          )}

          {/* BODY vars */}
          {vm.desc.bodyVarCount > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label className="sp-modal__label">Variables del BODY</label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 8,
                marginTop: 6,
              }}>
                {Array.from({ length: vm.desc.bodyVarCount }).map((_, i) => (
                  <Input
                    key={i}
                    placeholder={`{{${i + 1}}}`}
                    value={vm.bodyVars[i] ?? ''}
                    onChange={e => {
                      const copy = [...vm.bodyVars]
                      copy[i] = e.target.value
                      vm.setBodyVars(copy)
                    }}
                  />
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                <b>Vista previa:</b> {vm.bodyPreview || '—'}
              </div>
            </div>
          )}

          {/* URL param (si algún botón lo exige) */}
          {vm.desc.buttons.some(b => b.type === 'URL' && b.requiresParam) && (
            <div>
              <label className="sp-modal__label">Parámetro para botón URL</label>
              <Input
                placeholder="p.ej. ABC123"
                value={vm.urlParam}
                onChange={e => vm.setUrlParam(e.target.value)}
              />
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
                Con CSV puedes traer un <code>buttonParam</code> por fila; este valor se usa como default.
              </div>
            </div>
          )}
        </div>
      )}

      {/* === Sección 3: Destinatarios (BD / CSV) === */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Button
            variant={vm.mode === 'db' ? 'primary' : 'secondary'}
            onClick={() => vm.setMode('db')}
          >
            Desde BD
          </Button>
          <Button
            variant={vm.mode === 'csv' ? 'primary' : 'secondary'}
            onClick={() => vm.setMode('csv')}
          >
            Desde CSV
          </Button>
        </div>

        {vm.mode === 'db' ? (
          <>
            <div style={{ marginBottom: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>Seleccionados: {vm.selectedIds.length}</span>
              <Button
                variant="secondary"
                onClick={() => vm.setSelectedIds(vm.contacts.data.map(x => x.id!))}
                disabled={vm.contacts.data.length === 0}
              >
                Seleccionar página
              </Button>
              <Button variant="secondary" onClick={() => vm.setSelectedIds([])}>
                Limpiar
              </Button>
            </div>

            <CustomTable<ContactLogInterface>
              columns={cols}
              rows={vm.contacts.data}
              count={vm.contacts.totalCount}
              page={vm.contacts.page - 1}
              rowsPerPage={vm.contacts.pageSize}
              onPageChange={(_, p) => vm.contacts.setPage(p + 1)}
              onRowsPerPageChange={e => vm.contacts.setPageSize(parseInt(e.target.value, 10))}
              rowsPerPageOptions={[5, 10, 20, 50]}
            />
          </>
        ) : (
          <div>
            <p style={{ marginBottom: 6 }}>
              CSV esperado: <code>name,phone[,var1,var2,...][,buttonParam]</code>
            </p>
            <Input type="file" accept=".csv" onChange={e => vm.setCsvFile(e.target.files?.[0] ?? null)} />
            {vm.csvFile && (
              <div style={{ marginTop: 6 }}>
                Archivo: <b>{vm.csvFile.name}</b> (filas ~ {vm.csvRows})
              </div>
            )}
          </div>
        )}
      </div>

      {/* === Acción === */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={onSend} disabled={!vm.canSend || sending}>
          {sending ? 'Enviando…' : 'Enviar'}
        </Button>
      </div>
    </div>
  )
}