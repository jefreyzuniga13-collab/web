/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react'
import Button from '@/Components/Common/Button'
import { Label } from '@/Components/Common/Label'
import Input from '@/Components/Common/Input'
import Select from '@/Components/Common/Select'
import type { WaTemplateResponseDto } from '@/Interfaces/Wh/TemplateInterface'
import useContact from '@/Hooks/Contact/useContact'
import { WaTemplateService } from '@/Services/Wa/WaTemplateService'
import * as XLSX from 'xlsx'

type HeaderKind = 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'

function parseComponents(raw: any): any[] {
  try {
    if (!raw) return []
    if (typeof raw === 'string') return JSON.parse(raw)
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function countVars(text: string | null | undefined): { varCount: number; indices: number[] } {
  if (!text) return { varCount: 0, indices: [] }
  const re = /\{\{(\d+)}}/g
  const idxs: number[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) idxs.push(Number(m[1]))
  const max = idxs.length ? Math.max(...idxs) : 0
  return { varCount: max, indices: Array.from(new Set(idxs)).sort((a, b) => a - b) }
}

function buildSchema(template: WaTemplateResponseDto) {
  const comps = parseComponents(template.components)
  let headerType: HeaderKind = 'NONE'
  let headerTextVars = 0
  let requiresMedia = false
  let bodyVars = 0
  const urlButtonsDynamic: Array<{ index: number; url: string; hasDynamic: boolean }> = []

  comps.forEach((c: any) => {
    if (c?.type === 'HEADER') {
      const fmt = String(c.format || '').toUpperCase()
      if (fmt === 'TEXT') {
        headerType = 'TEXT'
        headerTextVars = countVars(c.text).varCount
      } else if (fmt === 'IMAGE' || fmt === 'VIDEO' || fmt === 'DOCUMENT') {
        headerType = fmt as HeaderKind
        requiresMedia = true
      }
    }
    if (c?.type === 'BODY') bodyVars = countVars(c.text).varCount
    if (c?.type === 'BUTTONS' && Array.isArray(c.buttons)) {
      c.buttons.forEach((b: any, i: number) => {
        if (b?.type === 'URL') {
          const url = String(b.url || '')
          const dyn = /\{\{\d+}}/.test(url)
          urlButtonsDynamic.push({ index: i, url, hasDynamic: dyn })
        }
      })
    }
  })

  return { headerType: headerType as HeaderKind, headerTextVars, requiresMedia, bodyVars, urlButtonsDynamic }
}

type Props = {
  isOpen: boolean
  template: WaTemplateResponseDto
  onClose: () => void
}

export default function WaTemplateSendModal({ isOpen, template, onClose }: Props) {
  const { data } = useContact()
  const [source, setSource] = useState<'contacts' | 'excel'>('contacts')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const schema = useMemo(() => buildSchema(template), [template])
  const [headerTextValue, setHeaderTextValue] = useState('')
  const [bodyParams, setBodyParams] = useState<string[]>([])

  useEffect(() => {
    setBodyParams(Array.from({ length: Math.max(0, schema.bodyVars) }, () => ''))
  }, [schema.bodyVars])

  if (!isOpen) return null

  const getPhonesFromContacts = (): Array<{ phone: string; fullName: string }> => {
    const byId = new Map<number, { phone: string; fullName: string }>()
    data.forEach((c: any) => byId.set(c.id, { phone: c.phone, fullName: c.fullName ?? c.phone }))
    return selectedIds.map(id => byId.get(id)).filter(Boolean) as Array<{ phone: string; fullName: string }>
  }

  const getPhonesFromExcel = async (): Promise<Array<{ phone: string; fullName: string }>> => {
    if (!excelFile) return []
    const arrayBuf = await excelFile.arrayBuffer()
    const wb = XLSX.read(arrayBuf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: '', raw: false })
    const out = rows
      .map(r => {
        const fullName = String(r.fullName ?? r.FullName ?? r.name ?? r.Name ?? '').trim()
        const rawPhone = String(r.phone ?? r.Phone ?? '').trim()
        const phone = rawPhone.replace(/[^\d+]/g, '')
        return { phone, fullName: fullName || phone }
      })
      .filter(x => !!x.phone)
    return out
  }

  const validate = (rows: Array<{ phone: string; fullName: string }>) => {
    if (!rows.length) return 'Selecciona al menos un destinatario.'
    if (schema.requiresMedia) return 'Esta plantilla requiere media en el HEADER y no es soportada.'
    if (schema.headerType === 'TEXT' && schema.headerTextVars > 0) return 'Esta plantilla tiene variables en el HEADER no soportadas.'
    if (schema.bodyVars > 0) {
      const missing = bodyParams.findIndex(x => !String(x || '').trim())
      if (missing >= 0) return `Completa el valor para {{${missing + 1}}} del BODY.`
    }
    return ''
  }

  const handleSend = async () => {
    let rows: Array<{ phone: string; fullName: string }> = []
    if (source === 'contacts') rows = getPhonesFromContacts()
    else rows = await getPhonesFromExcel()
    rows = rows.filter(r => !!r.phone).map(r => ({ phone: r.phone.trim(), fullName: (r.fullName ?? r.phone).trim() }))
    const seen = new Set<string>()
    rows = rows.filter(r => (seen.has(r.phone) ? false : (seen.add(r.phone), true)))
    const msg = validate(rows)
    if (msg) {
      alert(msg)
      return
    }
    const payload = {
      templateName: template.name,
      language: template.language ?? 'es',
      recipients: rows.map(r => ({
        phone: r.phone,
        fullName: r.fullName,
        variables: schema.bodyVars > 0 ? bodyParams.map(v => String(v)) : []
      }))
    }
    await WaTemplateService.SendBatchNewConversationsAsync(payload)
    onClose()
  }

  const RequirementChip = ({ children }: { children: any }) => (
    <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 8, background: '#eef2ff', color: '#334155', fontWeight: 600, marginRight: 8 }}>{children}</span>
  )

  return (
    <div className="sp-modal__overlay max">
      <div className="sp-modal__container max-modal">
        <header className="sp-modal__header">
          <h2 className="sp-modal__title">Enviar plantilla: {template.name}</h2>
          <button type="button" className="sp-modal__close" onClick={onClose}>×</button>
        </header>

        <div className="sp-modal__body" style={{ display: 'grid', gap: 12 }}>
          <div>
            <Label>Requisitos (según la plantilla)</Label>
            <div style={{ marginTop: 6 }}>
              {schema.headerType !== 'NONE' && (
                <RequirementChip>
                  HEADER: {schema.headerType}
                  {schema.requiresMedia ? ' (requiere media — no soportado)' : (schema.headerTextVars ? ' (tiene {{1}} — no soportado)' : '')}
                </RequirementChip>
              )}
              <RequirementChip>BODY: {schema.bodyVars} vars</RequirementChip>
            </div>
          </div>

          <div>
            <Label>Fuente de destinatarios</Label>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant={source === 'contacts' ? 'primary' : 'secondary'} onClick={() => setSource('contacts')}>Contactos</Button>
              <Button variant={source === 'excel' ? 'primary' : 'secondary'} onClick={() => setSource('excel')}>Excel</Button>
            </div>
          </div>

          {/*Usar componente mas amigable, son muchos data lo que hay y se llega aver muy comprimido las opciones  */}
          {source === 'contacts' && (
            <div className='selected_contacts'>
              <Label>Selecciona contactos</Label>
              <Select
                multiple
                value={selectedIds as any}
                onChange={e => {
                  const opts = Array.from((e.target as HTMLSelectElement).selectedOptions)
                  setSelectedIds(opts.map(o => Number(o.value)))
                }}
               options={data.map((c: any) => ({
                  value: c.id,
                  label: `${c.companyName ?? ""} - ${c.fullName ?? ""} - ${c.phone ?? ""}`
                }))}

                className="sp-modal__select-extra"
              />
            </div>
          )}

          {source === 'excel' && (
            <div>
              <Label>Sube Excel con columnas "fullName" y "phone" (o al menos "phone")</Label>
              <Input type="file" accept=".xlsx" onChange={e => setExcelFile(e.target.files?.[0] || null)} />
            </div>
          )}

          {/* {schema.headerType === ('TEXT' as HeaderKind) && schema.headerTextVars === 0 && (
            <div>
              <Label>HEADER TEXT (informativo):</Label>
              <Input
                placeholder="Texto del header (no se envía)"
                value={headerTextValue}
                onChange={e => setHeaderTextValue(e.target.value)}
              />
            </div>
          )} */}

          {schema.bodyVars > 0 && (
            <div>
              <Label>BODY — completa las variables</Label>
              <div style={{ display: 'grid', gap: 8 }}>
                {Array.from({ length: schema.bodyVars }, (_, i) => (
                  <div key={i} style={{ display: 'grid', gap: 4 }}>
                    <span className="sp-modal__label">Valor para {`{{${i + 1}}}`}</span>
                    <Input
                      value={bodyParams[i] ?? ''}
                      onChange={e => {
                        const next = [...bodyParams]
                        next[i] = e.target.value
                        setBodyParams(next)
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>

        <footer className="sp-modal__footer">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSend}>Enviar</Button>
        </footer>
      </div>
    </div>
  )
}