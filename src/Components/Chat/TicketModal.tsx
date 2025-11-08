import React, { useMemo, useRef, useState, useCallback } from 'react'
import Button from '@/Components/Common/Button'
import Input from '@/Components/Common/Input'
import { Textarea } from '@/Components/Common/Textarea'
import { Label } from '@/Components/Common/Label'
import Select from '@/Components/Common/Select'
import '@/Styles/Chat/TicketModal.css'
import useConversations from '@/Hooks/Conversation/useConversations'
import type { Prioridad } from '@/Interfaces/Crm/TicketInterface'

interface TicketModalProps {
  isOpen: boolean
  onClose: () => void
  codCliente: string
  clientName?: string
  contactId: number
  conversationId: number
}

export default function TicketModal({
  isOpen,
  onClose,
  codCliente,
  clientName,
  contactId,
  conversationId
}: TicketModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Prioridad | ''>('')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; description?: string; priority?: string }>({})
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const { handleCreateTicket } = useConversations()

  const priorityOptions = useMemo(
    () => [
      { label: 'Alta', value: 'Alta' },
      { label: 'Media', value: 'Media' },
      { label: 'Baja', value: 'Baja' }
    ],
    []
  )

  const addFiles = useCallback((incoming: File[]) => {
    setFiles(prev => {
      const map = new Map(prev.map(f => [f.name + f.size + f.lastModified, f]))
      for (const f of incoming) map.set(f.name + f.size + f.lastModified, f)
      return Array.from(map.values())
    })
  }, [])

  const handlePickFiles = () => fileInputRef.current?.click()

  const handleFiles = (list: FileList | null) => {
    if (!list) return
    addFiles(Array.from(list))
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => {
    setIsDragging(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const list = e.dataTransfer.files
    if (!list || list.length === 0) return
    addFiles(Array.from(list))
  }

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx))

  const validate = () => {
    const e: typeof errors = {}
    if (!title.trim()) e.title = 'Requerido'
    if (!description.trim()) e.description = 'Requerido'
    if (!priority) e.priority = 'Seleccione una prioridad'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    try {
      setSubmitting(true)
      await handleCreateTicket({
        conversationId,
        codCliente,
        contactId,
        titulo: title.trim(),
        descripcion: description.trim(),
        prioridad: priority as Prioridad,
        archivos: files
      })
      setTitle('')
      setDescription('')
      setPriority('')
      setFiles([])
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="tm-overlay" onClick={onClose}>
      <div className="tm-container" onClick={e => e.stopPropagation()}>
        <header className="tm-header">
          <h3 className="tm-title">Crear Ticket{clientName ? ` - ${clientName}` : ''}</h3>
          <button className="tm-close" onClick={onClose} aria-label="Cerrar">×</button>
        </header>

        <form className="tm-body" onSubmit={submit}>
          <div className="tm-grid2">
            <div className="tm-field">
              <Label htmlFor="tk-title">Título</Label>
              <Input
                id="tk-title"
                placeholder="Asunto del ticket"
                value={title}
                onChange={e => setTitle(e.target.value)}
                error={errors.title}
              />
            </div>

            <div className="tm-field">
              <Label htmlFor="tk-priority">Prioridad</Label>
              <Select
                id="tk-priority"
                name="prioridad"
                value={priority}
                onChange={e => setPriority(e.target.value as Prioridad)}
                options={priorityOptions}
                placeholder="Seleccione prioridad"
                error={errors.priority}
              />
            </div>
          </div>

          <div className="tm-field">
            <Label htmlFor="tk-desc">Descripción</Label>
            <Textarea
              id="tk-desc"
              placeholder="Describe el problema o solicitud"
              rows={6}
              value={description}
              onChange={e => setDescription(e.target.value)}
              error={!!errors.description}
            />
            {errors.description && <span className="tm-error">{errors.description}</span>}
          </div>

          <div className="tm-field">
            <Label>Adjuntos</Label>
            <div
              className={`tm-attach-card ${isDragging ? 'is-dragging' : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <div className="tm-attach-left">
                <div className="tm-attach-text">
                  <strong>Arrastra y suelta</strong> tus archivos aquí o
                  <button type="button" className="tm-link" onClick={handlePickFiles}>buscar</button>
                </div>
              </div>
              <div className="tm-attach-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="tm-file-input"
                  onChange={e => handleFiles(e.target.files)}
                />
              </div>
            </div>

            {files.length > 0 && (
              <ul className="tm-files">
                {files.map((f, i) => (
                  <li key={f.name + f.size + f.lastModified} className="tm-file">
                    <div className="tm-file-meta">
                      <span className="tm-file-name">{f.name}</span>
                      <span className="tm-file-size">
                        {Intl.NumberFormat(undefined, { style: 'unit', unit: 'byte', unitDisplay: 'narrow' }).format(f.size)}
                      </span>
                    </div>
                    <button type="button" className="tm-file-remove" onClick={() => removeFile(i)}>Eliminar</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <footer className="tm-footer">
            <Button type="button" variant="secondary" className="tm-btn" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="tm-btn" disabled={submitting}>
              Crear Ticket
            </Button>
          </footer>
        </form>
      </div>
    </div>
  )
}