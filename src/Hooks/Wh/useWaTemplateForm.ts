/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  WaTemplateRequestDto,
  WaTemplateResponseDto,
} from '@/Interfaces/Wh/TemplateInterface'
import type { TemplateCategoryResponseDto } from '@/Interfaces/Chat/TemplateCategoryInterfaces'
import { TemplateCategoryService } from '@/Services/chat/TemplateCategoryService'

export type FormMode = 'create' | 'view'

export interface UseWaTemplateFormParams {
  mode: FormMode
  data?: WaTemplateResponseDto | null
  onSubmit: (values: WaTemplateRequestDto) => void
}

/** Segmento de texto enriquecido: texto normal o variable con ejemplo */
type RichSegment =
  | { kind: 'text'; text: string }
  | { kind: 'var'; id: number; example: string }

interface HeaderStateText {
  enabled: boolean
  /** Vista previa para el input (con ejemplos) */
  text: string
  /** Segmentos para identificar variables y convertir a {{n}} al enviar */
  segments: RichSegment[]
}

interface BodyState {
  enabled: boolean
  /** Vista previa para el textarea (con ejemplos) */
  text: string
  /** Segmentos para identificar variables y convertir a {{n}} al enviar */
  segments: RichSegment[]
}

interface FooterState {
  enabled: boolean
  text: string
}

interface LocalFormState {
  displayName: string
  externalName: string
  language: string
  categoryId: number | null
  categoryName: string | null
  isActive: boolean
  header: HeaderStateText          // SOLO TEXT
  body: BodyState                  // SOLO TEXT
  footer: FooterState              // SOLO TEXT
}

function toSnakeCase(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  return trimmed
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/^_+|_+$/g, '')
    .replace(/__+/g, '_')
}

/** Concatena segmentos a string de vista previa */
function segmentsToPreview(segments: RichSegment[]): string {
  return segments.map(s => s.kind === 'text' ? s.text : s.example).join('')
}

/** Convierte segmentos a texto con placeholders {{n}} y devuelve también los ejemplos */
function segmentsToTemplateText(segments: RichSegment[]): { text: string; examples: string[] } {
  let counter = 0
  const examples: string[] = []
  const text = segments.map(s => {
    if (s.kind === 'text') return s.text
    counter += 1
    examples.push(s.example)
    return `{{${counter}}}`
  }).join('')
  return { text, examples }
}

/** Inserta una variable en un vector de segmentos, en una posición de caret global */
function insertVarAt(
  segments: RichSegment[],
  caretIndex: number,
  newVar: { id: number; example: string }
): RichSegment[] {
  let accLen = 0
  const out: RichSegment[] = []
  let inserted = false

  for (const seg of segments) {
    const segText = seg.kind === 'text' ? seg.text : seg.example
    const start = accLen
    const end = accLen + segText.length

    if (!inserted && caretIndex >= start && caretIndex <= end) {
      const offset = caretIndex - start
      if (seg.kind === 'text') {
        const left = seg.text.slice(0, offset)
        const right = seg.text.slice(offset)
        if (left) out.push({ kind: 'text', text: left })
        out.push({ kind: 'var', id: newVar.id, example: newVar.example })
        if (right) out.push({ kind: 'text', text: right })
      } else {
        // Si el caret cae dentro de una variable, lo insertamos antes
        out.push({ kind: 'var', id: newVar.id, example: newVar.example })
        out.push(seg)
      }
      inserted = true
    } else {
      out.push(seg)
    }
    accLen = end
  }

  if (!inserted) {
    // caret estaba al final
    out.push({ kind: 'var', id: newVar.id, example: newVar.example })
  }
  return out
}

/** Quita una variable por id */
function removeVarById(segments: RichSegment[], varId: number): RichSegment[] {
  const out: RichSegment[] = []
  for (const seg of segments) {
    if (seg.kind === 'var' && seg.id === varId) continue
    out.push(seg)
  }
  // fusiona textos contiguos
  const merged: RichSegment[] = []
  for (const seg of out) {
    const last = merged[merged.length - 1]
    if (last && last.kind === 'text' && seg.kind === 'text') {
      last.text += seg.text
    } else {
      merged.push(seg)
    }
  }
  return merged
}

/** Reconstruye segments preservando variables ya existentes (si editan fuera de los ejemplos) */
function rebuildSegmentsPreservingVars(
  oldSegments: RichSegment[],
  newPreview: string
): RichSegment[] {
  const vars = oldSegments.filter(s => s.kind === 'var') as Array<{ kind:'var'; id:number; example:string }>
  let pos = 0
  const out: RichSegment[] = []

  for (const v of vars) {
    const idx = newPreview.indexOf(v.example, pos)
    if (idx === -1) {
      // editaron dentro del ejemplo → fallback simple
      return [{ kind: 'text', text: newPreview }]
    }
    const before = newPreview.slice(pos, idx)
    if (before) out.push({ kind: 'text', text: before })
    out.push({ kind: 'var', id: v.id, example: v.example })
    pos = idx + v.example.length
  }
  const tail = newPreview.slice(pos)
  if (tail) out.push({ kind: 'text', text: tail })
  return out
}

export function useWaTemplateForm({
  mode,
  data,
  onSubmit,
}: UseWaTemplateFormParams) {
  const isView = mode === 'view'

  const [categories, setCategories] = useState<Array<{ label: string; value: number }>>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  // Contador de IDs de variables (estable por ciclo de vida del hook)
  const nextVarIdRef = useRef(1)

  const fetchAllCategories = useCallback(async () => {
    setLoadingCategories(true)
    try {
      const pageSize = 50
      let page = 1
      const acc: TemplateCategoryResponseDto[] = []
      while (true) {
        const resp = await TemplateCategoryService.getAllAsync('', page, pageSize)
        acc.push(...resp.items)
        if (resp.items.length < pageSize) break
        page += 1
      }
      setCategories(
        acc.filter(x => x.isActive).map(x => ({ label: x.name, value: x.id }))
      )
    } finally {
      setLoadingCategories(false)
    }
  }, [])

  const initialState: LocalFormState = useMemo(() => ({
    displayName: '',
    externalName: '',
    language: 'es',
    categoryId: null,
    categoryName: null,
    isActive: true,
    header: { enabled: true, text: '', segments: [{ kind: 'text', text: '' }] },
    body:   { enabled: true, text: '', segments: [{ kind: 'text', text: '' }] },
    footer: { enabled: true, text: '' },
  }), [])

  const [form, setForm] = useState<LocalFormState>(initialState)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => { fetchAllCategories() }, [fetchAllCategories])

  useEffect(() => {
    if (isView && data) {
      // Intentar inferir componentes desde data.components (si viene)
      let header: HeaderStateText = { enabled: false, text: '', segments: [{ kind: 'text', text: '' }] }
      let body: BodyState        = { enabled: false, text: '', segments: [{ kind: 'text', text: '' }] }
      let footer: FooterState    = { enabled: false, text: '' }

      try {
        const comps = (typeof data.components === 'string'
          ? JSON.parse(data.components as string)
          : data.components) as any[]

        if (Array.isArray(comps)) {
          comps.forEach(c => {
            if (!c?.type) return
            if (c.type === 'HEADER') {
              const txt = c.text ?? ''
              header = { enabled: true, text: txt, segments: [{ kind: 'text', text: txt }] }
            }
            if (c.type === 'BODY') {
              const txt = c.text ?? ''
              body = { enabled: true, text: txt, segments: [{ kind: 'text', text: txt }] }
            }
            if (c.type === 'FOOTER') {
              footer = { enabled: true, text: c.text ?? '' }
            }
          })
        }
      } catch { /* ignore */ }

      setForm({
        displayName: data.name ?? '',
        externalName: toSnakeCase(data.name ?? ''),
        language: data.language ?? 'es',
        categoryId: data.templateCategoryId ?? null,
        categoryName: data.templateCategoryName ?? null,
        isActive: !!data.isActive,
        header, body, footer,
      })
      setErrors({})
    }

    if (mode === 'create') {
      setForm(initialState)
      setErrors({})
    }
  }, [mode, isView, data, initialState])

  const setDisplayName = useCallback((val: string) => {
    setForm(prev => ({
      ...prev,
      displayName: val,
      externalName: toSnakeCase(val),
    }))
    if (errors.displayName) setErrors(e => ({ ...e, displayName: '' }))
  }, [errors.displayName])

  const setLanguage = useCallback((val: string) => {
    setForm(prev => ({ ...prev, language: val }))
    if (errors.language) setErrors(e => ({ ...e, language: '' }))
  }, [errors.language])

  const setCategory = useCallback((idStr: string) => {
    const id = Number(idStr)
    const cat = categories.find(c => c.value === id)
    setForm(prev => ({ ...prev, categoryId: id || null, categoryName: cat?.label ?? null }))
    if (errors.categoryId) setErrors(e => ({ ...e, categoryId: '' }))
  }, [categories, errors.categoryId])

  const setIsActive = useCallback((checked: boolean) => {
    setForm(prev => ({ ...prev, isActive: checked }))
  }, [])

  // ====== HEADER (solo TEXT) ======
  const setHeaderEnabled = useCallback((v: boolean) => {
    setForm(prev => ({ ...prev, header: { ...prev.header, enabled: v } }))
  }, [])

  /** Actualiza header preservando variables existentes */
  const setHeaderText = useCallback((txt: string) => {
    setForm(prev => {
      const h = prev.header
      const newSegments = rebuildSegmentsPreservingVars(h.segments, txt)
      return { ...prev, header: { ...h, text: txt, segments: newSegments } }
    })
  }, [])

  // ====== BODY (solo TEXT) ======
  const setBodyEnabled = useCallback((v: boolean) => {
    setForm(prev => ({ ...prev, body: { ...prev.body, enabled: v } }))
  }, [])

  /** Actualiza body preservando variables existentes */
  const setBodyText = useCallback((txt: string) => {
    setForm(prev => {
      const newSegments = rebuildSegmentsPreservingVars(prev.body.segments, txt)
      return { ...prev, body: { ...prev.body, text: txt, segments: newSegments } }
    })
  }, [])

  // ====== VARIABLES (HEADER/BODY) ======
  const insertHeaderVar = useCallback((example: string, caretIndex?: number) => {
    setForm(prev => {
      const { segments, text } = prev.header
      const caret = typeof caretIndex === 'number' ? caretIndex : text.length
      const newId = nextVarIdRef.current++
      const newSegments = insertVarAt(segments, caret, { id: newId, example })
      const newPreview = segmentsToPreview(newSegments)
      return { ...prev, header: { ...prev.header, segments: newSegments, text: newPreview } }
    })
  }, [])

  const insertBodyVar = useCallback((example: string, caretIndex?: number) => {
    setForm(prev => {
      const { segments, text } = prev.body
      const caret = typeof caretIndex === 'number' ? caretIndex : text.length
      const newId = nextVarIdRef.current++
      const newSegments = insertVarAt(segments, caret, { id: newId, example })
      const newPreview = segmentsToPreview(newSegments)
      return { ...prev, body: { ...prev.body, segments: newSegments, text: newPreview } }
    })
  }, [])

  const removeHeaderVar = useCallback((varId: number) => {
    setForm(prev => {
      const newSegments = removeVarById(prev.header.segments, varId)
      const newPreview = segmentsToPreview(newSegments)
      return { ...prev, header: { ...prev.header, segments: newSegments, text: newPreview } }
    })
  }, [])

  const removeBodyVar = useCallback((varId: number) => {
    setForm(prev => {
      const newSegments = removeVarById(prev.body.segments, varId)
      const newPreview = segmentsToPreview(newSegments)
      return { ...prev, body: { ...prev.body, segments: newSegments, text: newPreview } }
    })
  }, [])

  const getHeaderParts = useCallback((): Array<{ text: string; isVar: boolean; id?: number }> => {
    return form.header.segments.map(s =>
      s.kind === 'text' ? { text: s.text, isVar: false } : { text: s.example, isVar: true, id: s.id }
    )
  }, [form.header])

  const getBodyParts = useCallback((): Array<{ text: string; isVar: boolean; id?: number }> => {
    return form.body.segments.map(s =>
      s.kind === 'text' ? { text: s.text, isVar: false } : { text: s.example, isVar: true, id: s.id }
    )
  }, [form.body])

  // ====== VALIDACIÓN ======
  const validate = useCallback(() => {
    const e: Record<string, string> = {}
    if (!form.displayName.trim()) e.displayName = 'El nombre es requerido'
    if (!form.externalName.trim()) e.externalName = 'No se pudo generar el nombre interno'
    if (!form.language.trim()) e.language = 'Idioma requerido'
    if (!form.categoryId) e.categoryId = 'Categoría requerida'
    if (form.body.enabled && !form.body.text.trim()) e.bodyText = 'Texto del cuerpo requerido'
    
    if (form.header.text.length  > 60) e.headerText = 'Longitud maxima del encabezado es 60'
    if (form.footer.text.length  > 60) e.footerText = 'Longitud maxima del pie de pagina es 60'

    setErrors(e)
    return Object.keys(e).length === 0
  }, [form])

  // ====== BUILD COMPONENTS (WhatsApp Cloud: incluye example.{header_text|body_text}) ======
const buildComponents = useCallback(() => {
  const comps: any[] = []

    if (form.header.enabled && form.header.text.trim()) {
      const { text, examples } = segmentsToTemplateText(form.header.segments)
      const headerComp: any = { type: 'HEADER', format: 'TEXT', text }
      // Para HEADER: arreglo de strings (no anidado)
      if (examples.length) headerComp.example = { header_text: examples }
      comps.push(headerComp)
    }

    if (form.body.enabled) {
      const { text, examples } = segmentsToTemplateText(form.body.segments)
      const bodyComp: any = { type: 'BODY', text }
      // ⚠️ Para BODY: arreglo de arreglos [[...]]
      // cada subarreglo representa un set completo de variables {{1}}, {{2}}, ...
      if (examples.length) bodyComp.example = { body_text: [examples] }
      comps.push(bodyComp)
    }

    if (form.footer.enabled && form.footer.text.trim()) {
      comps.push({ type: 'FOOTER', text: form.footer.text })
    }

    return comps
  }, [form.header, form.body, form.footer])



      // ====== FOOTER ======
    const setFooterEnabled = useCallback((v: boolean) => {
      setForm(prev => ({ ...prev, footer: { ...prev.footer, enabled: v } }))
    }, [])

    const setFooterText = useCallback((txt: string) => {
      setForm(prev => ({ ...prev, footer: { ...prev.footer, text: txt } }))
    }, [])



  // ====== SUBMIT ======
  const submit = useCallback(async () => {
    if (!validate()) return
    const components = buildComponents()
    const payload: WaTemplateRequestDto = {
      id: 0,
      externalName: form.externalName,
      language: form.language,
      templateCategoryId: form.categoryId!,
      templateCategoryName: form.categoryName,
      templateStatus: 'Approved' as any,
      externalId: null,
      componentsJson: JSON.stringify(components),
      isActive: form.isActive,
    }
    onSubmit(payload)
    setForm(initialState) // Limpiar al enviar
  }, [validate, buildComponents, form, onSubmit, initialState])

  return {
    // estado y errores
    form,
    errors,
    isView,
    categories,
    loadingCategories,

    // setters base
    setDisplayName,
    setLanguage,
    setCategory,
    setIsActive,

    // header (texto + variables)
    setHeaderEnabled,
    setHeaderText,
    insertHeaderVar,
    removeHeaderVar,
    getHeaderParts,

    // body (texto + variables)
    setBodyEnabled,
    setBodyText,
    insertBodyVar,
    removeBodyVar,
    getBodyParts,

    // footer
    setFooterEnabled,
    setFooterText,

    // envío
    submit,
  }
}