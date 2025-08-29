import type { WaTemplateResponseDto } from "@/Interfaces/Wh/TemplateInterface";
import { WaTemplateService } from "@/Services/Wa/WaTemplateService";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from 'xlsx'
import useContact from '@/Hooks/Contact/useContact'

/* eslint-disable @typescript-eslint/no-explicit-any */
type HeaderKind = "NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";

type Props = {
  isOpen: boolean
  template: WaTemplateResponseDto
  onClose: () => void
}

export function useWaTemplateSendModal({ isOpen, template, onClose }: Props){
  const {verifiedContact } = useContact() //Recuperar contactos verificados
  const [source, setSource] = useState<'contacts' | 'excel'>('contacts')//Fuente de datos
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [excelFile, setExcelFile] = useState<File | null>(null) //Archivo de excel subido
  
  const schema = useMemo(() => buildSchema(template), [template])

  const [headerTextValue, setHeaderTextValue] = useState('')
  const [bodyParams, setBodyParams] = useState<string[]>([])
  
  //Parse a json dle schema  de plantilla creada
  function parseComponents(raw: any): any[] {
    try {
      if (!raw) return [];
      if (typeof raw === "string") return JSON.parse(raw);
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function countVars(text: string | null | undefined): {
    varCount: number;
    indices: number[];
  } {
    //agregar variables al body
    if (!text) return { varCount: 0, indices: [] };
    const re = /\{\{(\d+)}}/g;
    const idxs: number[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) idxs.push(Number(m[1]));
    const max = idxs.length ? Math.max(...idxs) : 0;
    return {
      varCount: max,
      indices: Array.from(new Set(idxs)).sort((a, b) => a - b),
    };
  }

  //Construir esquema de plantilla, header, body, footer.
  function buildSchema(template: WaTemplateResponseDto) {
    const comps = parseComponents(template.components);
    let headerType: HeaderKind = "NONE";
    let headerTextVars = 0;
    let requiresMedia = false;
    let bodyVars = 0;
    const urlButtonsDynamic: Array<{
      index: number;
      url: string;
      hasDynamic: boolean;
    }> = [];

    comps.forEach((c: any) => {
      if (c?.type === "HEADER") {
        const fmt = String(c.format || "").toUpperCase();
        if (fmt === "TEXT") {
          headerType = "TEXT";
          headerTextVars = countVars(c.text).varCount;
        } else if (fmt === "IMAGE" || fmt === "VIDEO" || fmt === "DOCUMENT") {
          headerType = fmt as HeaderKind;
          requiresMedia = true;
        }
      }
      if (c?.type === "BODY") bodyVars = countVars(c.text).varCount;
      if (c?.type === "BUTTONS" && Array.isArray(c.buttons)) {
        c.buttons.forEach((b: any, i: number) => {
          if (b?.type === "URL") {
            const url = String(b.url || "");
            const dyn = /\{\{\d+}}/.test(url);
            urlButtonsDynamic.push({ index: i, url, hasDynamic: dyn });
          }
        });
      }
    });

    return {
      headerType: headerType as HeaderKind,
      headerTextVars,
      requiresMedia,
      bodyVars,
      urlButtonsDynamic,
    };
  }
  
  useEffect(() => {
    setBodyParams(Array.from({ length: Math.max(0, schema.bodyVars) }, () => ''))
  }, [schema.bodyVars])

  if (!isOpen) return null

  //Recuperar propiedades del dto de contacto, recibido desde la api
  const getPhonesFromContacts = (): Array<{ phone: string; fullName: string }> => {
    const byId = new Map<number, { phone: string; fullName: string }>()
    verifiedContact.forEach((c: any) => byId.set(c.id, { phone: c.phone, fullName: c.fullName ?? c.phone }))
    return selectedIds.map(id => byId.get(id)).filter(Boolean) as Array<{ phone: string; fullName: string }>
  }

  
  const getPhonesFromExcel = async (): Promise<Array<{ phone: string; fullName: string }>> => {
    if (!excelFile) return []
    const arrayBuf = await excelFile.arrayBuffer()
    const wb = XLSX.read(arrayBuf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: '', raw: false })

    //Recuperar fullname y phone del excel.
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

  return {
    headerTextValue,
    source,
    schema,
    verifiedContact,
    selectedIds,
    bodyParams,
    setBodyParams,
    setHeaderTextValue,
    setExcelFile,
    setSelectedIds,
    setSource,
    handleSend,
  };
};