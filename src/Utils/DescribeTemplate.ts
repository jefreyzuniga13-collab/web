/* eslint-disable @typescript-eslint/no-explicit-any */
export type HeaderKind = 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'
export type ButtonKind = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'

export type TemplateDescriptor = {
  header: { kind: HeaderKind; needsMedia: boolean }
  bodyText: string
  bodyVarCount: number
  buttons: Array<{ type: ButtonKind; requiresParam?: boolean }>
}

function safeParse(json: unknown): any[] {
  if (!json) return []
  if (typeof json === 'string') {
    try { return JSON.parse(json) } catch { return [] }
  }
  if (Array.isArray(json)) return json
  return []
}

export function describeTemplate(components: unknown): TemplateDescriptor {
  const comps = safeParse(components)

  // HEADER
  const headerComp = comps.find((c: any) => String(c?.type).toUpperCase() === 'HEADER')
  const headerFormat = String(headerComp?.format ?? 'NONE').toUpperCase() as HeaderKind
  const needsMedia = !!headerComp && headerFormat !== 'NONE' && headerFormat !== 'TEXT'

  // BODY
  const bodyComp = comps.find((c: any) => String(c?.type).toUpperCase() === 'BODY')
  const bodyText: string = String(bodyComp?.text ?? '')
  const bodyVarCount = (bodyText.match(/{{\d+}}/g) ?? []).length

  // BUTTONS
  const btnsComp = comps.find((c: any) => String(c?.type).toUpperCase() === 'BUTTONS')
  const buttonsRaw: any[] = Array.isArray(btnsComp?.buttons) ? btnsComp.buttons : []
  const buttons = buttonsRaw.map(b => {
    const t = String(b?.type ?? '').toUpperCase() as ButtonKind
    if (t === 'URL') {
      const url = String(b?.url ?? '')
      // Si la url de la plantilla tiene {{1}} => al enviar requiere parámetro
      return { type: 'URL' as const, requiresParam: /{{\d+}}/.test(url) }
    }
    return { type: (t || 'QUICK_REPLY') as ButtonKind }
  })

  return {
    header: { kind: headerFormat || 'NONE', needsMedia },
    bodyText,
    bodyVarCount,
    buttons
  }
}
