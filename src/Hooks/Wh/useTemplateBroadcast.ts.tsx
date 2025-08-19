// Hooks/Wh/useTemplateBroadcastSmart.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { WaTemplateService } from '@/Services/Wa/WaTemplateService'
import type { WaTemplateResponseDto } from '@/Interfaces/Wh/TemplateInterface'
import type { SendTemplateBatchRequest, SendTemplateBatchResult } from '@/Interfaces/Wh/TemplateSendInterfaces'
import { describeTemplate, type TemplateDescriptor } from '@/Utils/describeTemplate'
import { MediaService } from '@/Services/MediaService '
import useContact from '@/Hooks/Contact/useContact'

const normalizePhoneNi = (raw: string) => {
  const d = (raw || '').replace(/\D/g, '')
  if (d.startsWith('505') && d.length === 11) return d
  if (d.length === 8) return `505${d}`
  return d
}

export function useTemplateBroadcastSmart() {

  const [approved, setApproved] = useState<WaTemplateResponseDto[]>([])
  const [tpl, setTpl] = useState<WaTemplateResponseDto | null>(null)
  const [desc, setDesc] = useState<TemplateDescriptor | null>(null)


  const [bodyVars, setBodyVars] = useState<string[]>([])
  const [urlParam, setUrlParam] = useState<string>('') 
  const [headerMedia, setHeaderMedia] = useState<{ id?: string; preview?: string } | null>(null)


  const [mode, setMode] = useState<'db'|'csv'>('db')
  const contacts = useContact()
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvRows, setCsvRows] = useState(0)

  // preview del body con variables
  const bodyPreview = useMemo(() => {
    if (!desc) return ''
    let t = desc.bodyText || ''
    bodyVars.forEach((v, i) => { t = t.replace(new RegExp(`{{${i+1}}}`, 'g'), v ?? '') })
    return t
  }, [desc, bodyVars])

  // carga de plantillas aprobadas
  const loadApproved = useCallback(async () => {
    const list = await WaTemplateService.GetAllAsync(false)
    const approvedOnly = list.filter(x => (x.status ?? x.name) === 'Approved')
    setApproved(approvedOnly)
    if (!tpl && approvedOnly.length) setTpl(approvedOnly[0])
  }, [tpl])

  // cuando cambie tpl => actualizar descriptor y requeridos
  useEffect(() => {
    if (!tpl) { setDesc(null); return }
    const d = describeTemplate((tpl as any).components ?? (tpl as any).componentsJson)
    setDesc(d)
    // ajustar arrays requeridos
    setBodyVars(Array(d.bodyVarCount).fill(''))
    setUrlParam('')
    setHeaderMedia(null)
  }, [tpl])

  // subir media si se requiere (el usuario elige archivo)
  const pickHeaderMedia = useCallback(async (file: File) => {
    const res = await MediaService.uploadForWhatsApp(file)
    setHeaderMedia({ id: res.waMediaId, preview: res.publicUrl })
  }, [])

  // CSV simple: name,phone[,var1,var2,...][,buttonParam]
  const parseCsv = useCallback(async (file: File) => {
    const text = await file.text()
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    setCsvRows(lines.length)
    return lines.map(line => {
      const cols = line.split(',').map(c => c.trim())
      const name = cols[0] || ''
      const phone = normalizePhoneNi(cols[1] || '')
      let vars: string[] = []
      let btn: string | undefined
      if (cols.length > 2) {
        if (cols.length > 3) { vars = cols.slice(2, cols.length - 1); btn = cols.at(-1) }
        else { vars = [cols[2]] }
      }
      return { name, phone, vars, btn }
    })
  }, [])

  // construir payloads
  const buildPayloadFromDb = useCallback(async (): Promise<SendTemplateBatchRequest | null> => {
    if (!tpl || !desc) return null
    const idSet = new Set(selectedIds)
    const rows = contacts.data.filter(c => idSet.has(c.id as number))
    if (!rows.length) return null

    const needUrlParam = desc.buttons.some(b => b.type === 'URL' && b.requiresParam)
    const needMedia = desc.header.needsMedia
    const recipients = rows.map(r => ({
      phone: normalizePhoneNi(r.phone),
      fullName: r.waName || r.fullName || null,
      variables: desc.bodyVarCount ? bodyVars : undefined,
      headerMediaId: needMedia ? headerMedia?.id : undefined,
      buttonUrlParam: needUrlParam ? urlParam : undefined
    }))

    return {
      templateName: tpl.name!,
      language: tpl.language || 'es',
      buttonUrlBase: needUrlParam ? undefined : undefined, // si tu botón tiene base fija ya viene en la plantilla
      headerMediaId: needMedia ? headerMedia?.id : undefined,
      recipients
    }
  }, [tpl, desc, selectedIds, contacts.data, bodyVars, headerMedia, urlParam])

  const buildPayloadFromCsv = useCallback(async (): Promise<SendTemplateBatchRequest | null> => {
    if (!tpl || !desc || !csvFile) return null
    const rows = await parseCsv(csvFile)

    const needUrlParam = desc.buttons.some(b => b.type === 'URL' && b.requiresParam)
    const needMedia = desc.header.needsMedia

    const recipients = rows
      .filter(r => !!r.phone)
      .map(r => ({
        phone: r.phone,
        fullName: r.name || null,
        variables: desc.bodyVarCount
          ? (r.vars.length ? r.vars : bodyVars) // si CSV no trae vars, usa las globales
          : undefined,
        headerMediaId: needMedia ? headerMedia?.id : undefined,
        buttonUrlParam: needUrlParam ? (r.btn ?? urlParam) : undefined
      }))

    if (!recipients.length) return null
    return {
      templateName: tpl.name!,
      language: tpl.language || 'es',
      headerMediaId: needMedia ? headerMedia?.id : undefined,
      recipients
    }
  }, [tpl, desc, csvFile, parseCsv, bodyVars, headerMedia, urlParam])

  // validación UI
  const canSend = useMemo(() => {
    if (!tpl || !desc) return false
    if (desc.bodyVarCount && bodyVars.some(v => !v?.trim())) return false
    if (desc.header.needsMedia && !headerMedia?.id) return false
    if (desc.buttons.some(b => b.type === 'URL' && b.requiresParam) && !urlParam?.trim() && mode === 'db') return false
    if (mode === 'db' && !selectedIds.length) return false
    if (mode === 'csv' && !csvFile) return false
    return true
  }, [tpl, desc, bodyVars, headerMedia, urlParam, mode, selectedIds.length, csvFile])

  const send = useCallback(async (): Promise<SendTemplateBatchResult> => {
    const payload = mode === 'db' ? await buildPayloadFromDb() : await buildPayloadFromCsv()
    if (!payload) throw new Error('Faltan datos.')
    return WaTemplateService.SendBatchNewConversationsAsync(payload)
  }, [mode, buildPayloadFromDb, buildPayloadFromCsv])

  return {
    // plantilla
    approved, loadApproved, tpl, setTpl, desc,
    bodyVars, setBodyVars, urlParam, setUrlParam,
    headerMedia, pickHeaderMedia, bodyPreview,

    // destinatarios
    mode, setMode,
    contacts, selectedIds, setSelectedIds,
    csvFile, setCsvFile, csvRows,

    // acciones
    canSend, send
  }
}