import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import { toast } from 'react-toastify'
import Button from '@/Services/Components/Common/Button'
import Input from '@/Services/Components/Common/Input'
import { Label } from '@/Services/Components/Common/Label'
import { contactService } from '@/Services/auth/ContactService'
import { WaTemplateService } from '@/Services/Wa/WaTemplateService'
import type { ContactLogInterface } from '@/Interfaces/Auth/ContactInterface'
import type { WaTemplateResponseDto } from '@/Interfaces/Wh/TemplateInterface'
import '@/Styles/Crm/SystemParamForm.css'
import '@/Styles/Wa/WaTemplate.css'

type Recipient = {
  phone: string
  fullName: string
}

type Props = {
  isOpen: boolean
  template: WaTemplateResponseDto
  onClose: () => void
  conversationId?: number | null
  presetRecipient?: Recipient | null
}

const WHATSAPP_CHANNEL = 1

export default function WaTemplateSendModal({
  isOpen,
  template,
  onClose,
  conversationId,
  presetRecipient
}: Props) {
  const [source, setSource] = useState<'contacts' | 'excel'>('contacts')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ContactLogInterface[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Recipient[]>([])
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (presetRecipient?.phone) {
      setSelected([presetRecipient])
      setSource('contacts')
    } else {
      setSelected([])
    }
  }, [isOpen, presetRecipient])

  useEffect(() => {
    if (!isOpen || source !== 'contacts') return

    const handle = window.setTimeout(async () => {
      setSearching(true)
      try {
        const page = await contactService.getAllAsync(query.trim(), 1, 30)
        const whatsapp = (page.items ?? []).filter(
          (contact) => Number(contact.metaChannelId) === WHATSAPP_CHANNEL && contact.phone
        )
        setResults(whatsapp)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => window.clearTimeout(handle)
  }, [isOpen, query, source])

  const selectedPhones = useMemo(
    () => new Set(selected.map((item) => item.phone)),
    [selected]
  )

  if (!isOpen) return null

  const toggleContact = (contact: ContactLogInterface) => {
    const phone = String(contact.phone ?? '').trim()
    if (!phone) return

    setSelected((current) => {
      if (current.some((item) => item.phone === phone)) {
        return current.filter((item) => item.phone !== phone)
      }

      return [
        ...current,
        {
          phone,
          fullName: contact.fullName || contact.waName || phone
        }
      ]
    })
  }

  const onExcel = async (file: File | null) => {
    if (!file) return

    const buffer = await file.arrayBuffer()
    const book = XLSX.read(buffer, { type: 'array' })
    const sheet = book.Sheets[book.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
      raw: false
    })

    const parsed = rows
      .map((row) => {
        const fullName = String(
          row.nombre ?? row.Nombre ?? row.fullName ?? row.FullName ?? row.name ?? row.Name ?? ''
        ).trim()
        const rawPhone = String(
          row.numero ?? row.Numero ?? row.telefono ?? row.Telefono ?? row.phone ?? row.Phone ?? ''
        ).trim()
        const phone = rawPhone.replace(/[^\d+]/g, '')
        return { phone, fullName: fullName || phone }
      })
      .filter((row) => row.phone.length > 0)

    const unique = new Map<string, Recipient>()
    parsed.forEach((row) => unique.set(row.phone, row))
    setSelected(Array.from(unique.values()))
    toast.info(`${unique.size} contacto(s) leídos del Excel.`)
  }

  const handleSend = async () => {
    if (selected.length === 0) {
      toast.error('Selecciona al menos un contacto.')
      return
    }

    setSending(true)
    try {
      const result = await WaTemplateService.SendBatchNewConversationsAsync({
        templateName: template.name,
        language: template.language || 'es',
        conversationId: conversationId ?? null,
        recipients: selected.map((item) => ({
          phone: item.phone,
          fullName: item.fullName,
          variables: []
        }))
      })

      if (result.failed > 0) {
        toast.warning(`Enviadas: ${result.sent}. Fallaron: ${result.failed}.`)
      } else {
        toast.success(`Plantilla enviada a ${result.sent} contacto(s).`)
      }

      onClose()
    } catch {
      toast.error('No se pudo enviar la plantilla.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="sp-modal__overlay">
      <div className="sp-modal__container wa-template-send">
        <header className="sp-modal__header">
          <div>
            <h2 className="sp-modal__title">Enviar plantilla</h2>
            <p className="wa-template-modal__subtitle">{template.name}</p>
          </div>
          <button type="button" className="sp-modal__close" onClick={onClose}>×</button>
        </header>

        <div className="sp-modal__body">
          <div className="wa-template-send__tabs">
            <Button
              type="button"
              variant={source === 'contacts' ? 'primary' : 'secondary'}
              onClick={() => setSource('contacts')}
            >
              Contactos
            </Button>
            <Button
              type="button"
              variant={source === 'excel' ? 'primary' : 'secondary'}
              onClick={() => setSource('excel')}
            >
              Excel
            </Button>
          </div>

          {source === 'contacts' ? (
            <>
              <Label>Buscar por nombre o número</Label>
              <div className="wa-template-send__search">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nombre o teléfono"
                />
              </div>
              <div className="wa-template-send__list">
                {searching && <p className="wa-template-field__hint">Buscando...</p>}
                {!searching && results.length === 0 && (
                  <p className="wa-template-field__hint">No hay contactos de WhatsApp.</p>
                )}
                {results.map((contact) => {
                  const active = selectedPhones.has(contact.phone)
                  return (
                    <button
                      key={contact.id}
                      type="button"
                      className={`wa-template-send__item ${active ? 'is-selected' : ''}`}
                      onClick={() => toggleContact(contact)}
                    >
                      <span className="wa-template-send__check" aria-hidden="true" />
                      <span>
                        {contact.fullName || contact.waName || 'Sin nombre'}
                        <small>{contact.phone}</small>
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="wa-template-send__excel">
              <Label>Excel con columnas nombre y numero</Label>
              <p className="wa-template-field__hint">
                La primera hoja. Cada fila es un contacto de esta empresa.
              </p>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={(event) => void onExcel(event.target.files?.[0] ?? null)}
              />
            </div>
          )}

          <p className="wa-template-field__hint">{selected.length} seleccionado(s)</p>
          <div className="wa-template-send__selected">
            {selected.map((item) => (
              <span key={item.phone} className="wa-template-send__chip">
                {item.fullName} · {item.phone}
                <button
                  type="button"
                  onClick={() => setSelected((current) => current.filter((row) => row.phone !== item.phone))}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <footer className="sp-modal__footer">
          <Button variant="secondary" onClick={onClose} disabled={sending}>Cancelar</Button>
          <Button variant="primary" onClick={() => void handleSend()} disabled={sending}>
            {sending ? 'Enviando...' : 'Enviar'}
          </Button>
        </footer>
      </div>
    </div>
  )
}
