// src/Components/Tickets/TicketModal.tsx
import React, { useMemo, useRef, useState } from 'react'
import Button from '@/Components/Common/Button'
import Input from '@/Components/Common/Input'
import { Textarea } from '@/Components/Common/Textarea'
import { Label } from '@/Components/Common/Label'
import Select from '@/Components/Common/Select'
import '@/Styles/Chat/TicketModal.css'

type Priority = 'High' | 'Medium' | 'Low'

interface CreateTicketPayload {
  title: string
  description: string
  priority: Priority
  attachments: File[]
}

interface TicketModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit?: (payload: CreateTicketPayload) => Promise<void> | void
}

export default function TicketModal({ isOpen, onClose, onSubmit }: TicketModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority | ''>('')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; description?: string; priority?: string }>({})
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const priorityOptions = useMemo(
    () => [
      { label: 'Alta', value: 'High' },
      { label: 'Media', value: 'Medium' },
      { label: 'Baja', value: 'Low' }
    ],
    []
  )

  const handlePickFiles = () => fileInputRef.current?.click()

  const handleFiles = (list: FileList | null) => {
    if (!list) return
    const incoming = Array.from(list)
    setFiles(prev => {
      const map = new Map(prev.map(f => [f.name + f.size + f.lastModified, f]))
      for (const f of incoming) map.set(f.name + f.size + f.lastModified, f)
      return Array.from(map.values())
    })
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
      const payload: CreateTicketPayload = {
        title: title.trim(),
        description: description.trim(),
        priority: priority as Priority,
        attachments: files
      }
      if (onSubmit) await onSubmit(payload)
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
          <h3 className="tm-title">Crear Ticket</h3>
          <button className="tm-close" onClick={onClose} aria-label="Cerrar">×</button>
        </header>

        <form className="tm-body" onSubmit={submit}>
         <div className='tm-field__container'>
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
              name="priority"
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
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
            <div className="tm-attach">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="tm-file-input"
                onChange={e => handleFiles(e.target.files)}
              />
              <Button type="button" variant="secondary" onClick={handlePickFiles}>Agregar archivos</Button>
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
            <Button type="button" variant="tertiary" className="tm-btn" onClick={onClose} disabled={submitting}>
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