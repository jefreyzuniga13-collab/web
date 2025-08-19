/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  WaTemplateRequestDto,
  WaTemplateResponseDto,
} from '@/Interfaces/Wh/TemplateInterface'
import api from '@/Utils/ApiConfig'
import type { TemplateCategoryResponseDto } from '@/Interfaces/Chat/TemplateCategoryInterfaces'
import {TemplateCategoryService} from '@/Services/chat/TemplateCategoryService'
import type { UploadForWhatsAppResult } from '@/Services/MediaService '

export type FormMode = 'create' | 'view'

export interface UseWaTemplateFormParams {
  mode: FormMode
  data?: WaTemplateResponseDto | null
  onSubmit: (values: WaTemplateRequestDto) => void
}

type HeaderFormat = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'

type ButtonKind = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'

interface HeaderStateText {
  enabled: boolean
  format: 'TEXT'
  text: string
}

interface HeaderStateMedia {
  enabled: boolean
  format: Exclude<HeaderFormat, 'TEXT'> // IMAGE | VIDEO | DOCUMENT
  exampleHandles: string[]             // nombres/ids retornados por POST /Media
}

type HeaderState = HeaderStateText | HeaderStateMedia

interface BodyState {
  enabled: boolean
  text: string  // soporta {{1}}, {{2}}, ...
}

interface FooterState {
  enabled: boolean
  text: string
}

type ButtonsRow =
  | { type: 'QUICK_REPLY'; text: string }
  | { type: 'URL'; text: string; url: string }           // puede llevar {{1}}
  | { type: 'PHONE_NUMBER'; text: string; phone_number: string }

interface ButtonsState {
  enabled: boolean
  rows: ButtonsRow[]
}

interface LocalFormState {
  displayName: string  
  externalName: string
  language: string
  categoryId: number | null
  categoryName: string | null
  isActive: boolean
  header: HeaderState
  body: BodyState
  footer: FooterState
  buttons: ButtonsState
  mediaFiles: File[]
  uploading: boolean
}

function toSnakeCase(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  return trimmed
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/^_+|_+$/g, '')
    .replace(/__+/g, '_')
}

export function useWaTemplateForm({
  mode,
  data,
  onSubmit,
}: UseWaTemplateFormParams) {
  const isView = mode === 'view'

  const [categories, setCategories] = useState<Array<{ label: string; value: number }>>([])
  const [loadingCategories, setLoadingCategories] = useState(false)

  const fetchAllCategories = useCallback(async () => {
    setLoadingCategories(true)
    try {
      const pageSize = 50
      let page = 1
      const acc: TemplateCategoryResponseDto[] = []
      while (true) {
        const resp = await TemplateCategoryService.getAllAsync(page, pageSize)
        acc.push(...resp.items)
        if (resp.items.length < pageSize) break
        page += 1
      }
      setCategories(
        acc
          .filter(x => x.isActive)
          .map(x => ({ label: x.name, value: x.id }))
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
    header: { enabled: true, format: 'TEXT', text: 'Título' },
    body: { enabled: true, text: 'Hola {{1}}, este es un mensaje.' },
    footer: { enabled: true, text: '' },
    buttons: { enabled: true, rows: [] },
    mediaFiles: [],
    uploading: false,
  }), [])

  const [form, setForm] = useState<LocalFormState>(initialState)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchAllCategories()
  }, [fetchAllCategories])

  useEffect(() => {
    if (isView && data) {
      // Intentar inferir componentes desde data.components (si viene)
      let header: HeaderState = { enabled: false, format: 'TEXT', text: '' }
      let body: BodyState = { enabled: false, text: '' }
      let footer: FooterState = { enabled: false, text: '' }
      let buttons: ButtonsState = { enabled: false, rows: [] }

      try {
        const comps = (typeof data.components === 'string'
          ? JSON.parse(data.components as string)
          : data.components) as any[]

        if (Array.isArray(comps)) {
          comps.forEach(c => {
            if (!c?.type) return
            if (c.type === 'HEADER') {
              if (c.format === 'TEXT') {
                header = { enabled: true, format: 'TEXT', text: c.text ?? '' }
              } else {
                //Imagen, video, etc
                const handles: string[] = c.example?.header_handle ?? []
                header = { enabled: true, format: c.format, exampleHandles: handles }
              }
            }
            if (c.type === 'BODY') {
              body = { enabled: true, text: c.text ?? '' }
            }
            if (c.type === 'FOOTER') {
              footer = { enabled: true, text: c.text ?? '' }
            }
            if (c.type === 'BUTTONS') {
              const rows: ButtonsRow[] = Array.isArray(c.buttons) ? c.buttons : []
              buttons = { enabled: true, rows }
            }
          })
        }
      } catch {
        // si no se puede parsear, mantenemos defaults
      }

      setForm({
        displayName: data.name ?? '',
        externalName: toSnakeCase(data.name ?? ''),
        language: data.language ?? 'es',
        categoryId: data.templateCategoryId ?? null,
        categoryName: data.templateCategoryName ?? null,
        isActive: !!data.isActive,
        header,
        body,
        footer,
        buttons,
        mediaFiles: [],
        uploading: false,
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
      externalName: toSnakeCase(val), // autogenera snake_case
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


  const setHeaderEnabled = useCallback((v: boolean) => {
    setForm(prev => ({ ...prev, header: { ...prev.header, enabled: v } as HeaderState }))
  }, [])

  const setHeaderFormat = useCallback((fmt: HeaderFormat) => {
    if (fmt === 'TEXT') {
      setForm(prev => ({ ...prev, header: { enabled: true, format: 'TEXT', text: 'Título' } }))
    } else {
      setForm(prev => ({ ...prev, header: { enabled: true, format: fmt, exampleHandles: [] } as HeaderStateMedia }))
    }
  }, [])

  const setHeaderText = useCallback((txt: string) => {
    setForm(prev => {
      if (prev.header.format !== 'TEXT') return prev
      return { ...prev, header: { ...prev.header, text: txt } as HeaderStateText }
    })
  }, [])
 
  const setHeaderMediaFiles = useCallback((files: File[]) => {
    setForm(prev => ({ ...prev, mediaFiles: files }))
  }, [])

  const setBodyEnabled = useCallback((v: boolean) => {
    setForm(prev => ({ ...prev, body: { ...prev.body, enabled: v } }))
  }, [])

  const setBodyText = useCallback((txt: string) => {
    setForm(prev => ({ ...prev, body: { ...prev.body, text: txt } }))
  }, [])

  const setFooterEnabled = useCallback((v: boolean) => {
    setForm(prev => ({ ...prev, footer: { ...prev.footer, enabled: v } }))
  }, [])

  const setFooterText = useCallback((txt: string) => {
    setForm(prev => ({ ...prev, footer: { ...prev.footer, text: txt } }))
  }, [])


  const setButtonsEnabled = useCallback((v: boolean) => {
    setForm(prev => ({ ...prev, buttons: { ...prev.buttons, enabled: v } }))
  }, [])

  const addButton = useCallback((kind: ButtonKind) => {
    setForm(prev => {
      const rows = [...prev.buttons.rows]
      if (kind === 'QUICK_REPLY') rows.push({ type: 'QUICK_REPLY', text: 'Responder' })
      if (kind === 'URL') rows.push({ type: 'URL', text: 'Abrir', url: 'https://mi.link/{{1}}' })
      if (kind === 'PHONE_NUMBER') rows.push({ type: 'PHONE_NUMBER', text: 'Llamar', phone_number: '505XXXXXXXX' })
      return { ...prev, buttons: { ...prev.buttons, rows } }
    })
  }, [])

  const updateButton = useCallback((index: number, field: string, value: string) => {
    setForm(prev => {
      const rows = [...prev.buttons.rows] as any[]
      rows[index] = { ...rows[index], [field]: value }
      return { ...prev, buttons: { ...prev.buttons, rows } }
    })
  }, [])

  const removeButton = useCallback((index: number) => {
    setForm(prev => {
      const rows = [...prev.buttons.rows]
      rows.splice(index, 1)
      return { ...prev, buttons: { ...prev.buttons, rows } }
    })
  }, [])


  const validate = useCallback(() => {
    const e: Record<string, string> = {}
    if (!form.displayName.trim()) e.displayName = 'El nombre es requerido'
    if (!form.externalName.trim()) e.externalName = 'No se pudo generar el nombre interno'
    if (!form.language.trim()) e.language = 'Idioma requerido'
    if (!form.categoryId) e.categoryId = 'Categoría requerida'
    // Header
    if (form.header.enabled) {
      if (form.header.format === 'TEXT') {
        if (!(form.header as HeaderStateText).text?.trim()) e.headerText = 'Texto de encabezado requerido'
      } else {
        // Media: si se suben archivos, luego pondremos handles
        // opcionalmente puedes exigir al menos 1 archivo:
        // if (form.mediaFiles.length === 0) e.headerMedia = 'Debes adjuntar al menos un archivo'
      }
    }
    // Body
    if (form.body.enabled && !form.body.text.trim()) e.bodyText = 'Texto del cuerpo requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }, [form])

const uploadMedia = useCallback(async (): Promise<string[]> => {
  if (!form.mediaFiles.length) return []
  try {
    setForm(prev => ({ ...prev, uploading: true }))
    const fd = new FormData()
    form.mediaFiles.forEach(f => fd.append('files', f))

    const { data } = await api.post<UploadForWhatsAppResult[]>(
      '/Media/upload-for-wh',
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )

    // 👇 aquí usamos el handle porque es para plantillas
    return Array.isArray(data)
      ? data.map(x => x.waMediaId).filter(Boolean)
      : []
  } finally {
    setForm(prev => ({ ...prev, uploading: false }))
  }
}, [form.mediaFiles])


  const buildComponents = useCallback((headerHandles: string[]) => {
    const comps: any[] = []

    if (form.header.enabled) {
      if (form.header.format === 'TEXT') {
        comps.push({ type: 'HEADER', format: 'TEXT', text: (form.header as HeaderStateText).text })
      } else {
        comps.push({
          type: 'HEADER',
          format: (form.header as HeaderStateMedia).format,
          example: { header_handle: headerHandles },
        })
      }
    }

    if (form.body.enabled) {
      comps.push({ type: 'BODY', text: form.body.text })
    }

    if (form.footer.enabled && form.footer.text.trim()) {
      comps.push({ type: 'FOOTER', text: form.footer.text })
    }

    if (form.buttons.enabled && form.buttons.rows.length) {
      comps.push({ type: 'BUTTONS', buttons: form.buttons.rows })
    }

    return comps
  }, [form.header, form.body, form.footer, form.buttons])


  const submit = useCallback(async () => {
    if (!validate()) return
    const handles = await uploadMedia()
    const components = buildComponents(handles)
    const payload: WaTemplateRequestDto = {
      id: 0,
      externalName: form.externalName,
      language: form.language,
      templateCategoryId: form.categoryId!,
      templateCategoryName: form.categoryName,
      templateStatus: 'Pending' as any,
      externalId: null,
      componentsJson: JSON.stringify(components),
      isActive: form.isActive,
    }
    onSubmit(payload)
  }, [validate, uploadMedia, buildComponents, form, onSubmit])

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

    // header
    setHeaderEnabled,
    setHeaderFormat,
    setHeaderText,
    setHeaderMediaFiles,

    // body
    setBodyEnabled,
    setBodyText,

    // footer
    setFooterEnabled,
    setFooterText,

    // buttons
    setButtonsEnabled,
    addButton,
    updateButton,
    removeButton,

    // envío
    submit,
  }
}