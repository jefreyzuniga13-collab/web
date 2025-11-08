// TicketModal.tsx
import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import Button from '@/Components/Common/Button'
import Input from '@/Components/Common/Input'
import { Textarea } from '@/Components/Common/Textarea'
import { Label } from '@/Components/Common/Label'
import Select from '@/Components/Common/Select'
import '@/Styles/Chat/TicketModal.css'
import useConversations from '@/Hooks/Conversation/useConversations'
import type { Prioridad } from '@/Interfaces/Crm/TicketInterface'
import { useUsers } from '@/Hooks/User/useUsers'
import { jwtDecode } from 'jwt-decode'
import DatePickerField from '@/Components/Common/DatePickerField'

interface TicketModalProps {
  isOpen: boolean
  onClose: () => void
  codCliente: string
  clientName?: string
  contactId: number
  conversationId: number
}

interface JwtPayload {
  role: string
}

interface AuthStorage {
  accessToken: string
  refreshToken: string
  expiresAt: string
  userId: number
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
  const [responsibleId, setResponsibleId] = useState<number | null>(null)
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; description?: string; priority?: string; responsibleId?: string }>({})
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const authRaw = localStorage.getItem('auth') || '{}'
  const { accessToken, userId } = JSON.parse(authRaw) as AuthStorage
  const { role } = jwtDecode<JwtPayload>(accessToken)
  const isAdmin = role.toLowerCase() === 'admin'

  const { handleCreateTicket } = useConversations()
  const { fetchPage, users } = useUsers()

  useEffect(() => {
    if (!isOpen || !isAdmin) return
    fetchPage()
  }, [isOpen, isAdmin, fetchPage])

  const priorityOptions = useMemo(
    () => [
      { label: 'Alta', value: 'Alta' },
      { label: 'Media', value: 'Media' },
      { label: 'Baja', value: 'Baja' }
    ],
    []
  )


  const responsibleOptions = useMemo(() => {
  if (!users || !Array.isArray(users)) return []
  return users
    .filter(u => {
      const roles = Array.isArray(u.roles)
        ? u.roles.map(r =>
           (r.roleName ?? '').toLowerCase()
          )
        : []

      if (roles.includes('support')) return true
      if (roles.includes('admin')) return u.userId === userId
      return false
    })
    .map(u => ({
      label: u.fullName ?? String(u.userId),
      value: String(u.userId)
    }))
}, [users, userId])


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
    if (!responsibleId) e.responsibleId = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const date = new Date();
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
        archivos: files,
        responsibleId: responsibleId,
        DueDate: dueDate ? dueDate : date,
      })
      setTitle('')
      setDescription('')
      setPriority('')
      setFiles([])
      setResponsibleId(null)
      setDueDate(null)
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
          <h3 className="tm-title">
            Crear Ticket
            <span className="tm-title__client">{clientName ? ` - ${clientName}` : ''}</span>
          </h3>
          <button className="tm-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>

        <form className="tm-body" onSubmit={submit}>
          <div className="tm-grid2 tm-grid2--three">
            <div className="tm-field">
              <Label htmlFor="tk-title">Título *</Label>
              <Input
                id="tk-title"
                placeholder="Título del ticket"
                value={title}
                onChange={e => setTitle(e.target.value)}
                error={errors.title}
              />
            </div>

            <div className="tm-field">
              <Label htmlFor="tk-priority">Prioridad *</Label>
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

            {isAdmin && (
              <div className="tm-field">
                <Label htmlFor="tk-responsible">Responsable *</Label>
                <Select
                  id="tk-responsible"
                  name="responsable"
                  value={responsibleId != null ? String(responsibleId) : ''}
                  onChange={e => setResponsibleId(e.target.value ? Number(e.target.value) : null)}
                  options={responsibleOptions}
                  placeholder="Seleccione responsable"
                   error={errors.responsibleId}
                />
              </div>
            )}

            <div className="tm-field">
            <Label htmlFor="tk-due">Fecha Entrega</Label>
            <DatePickerField
              label=""
              value={dueDate}
              onChange={setDueDate}
              className="tm-due-date"
            />
          </div>
          </div>

          <div className="tm-field">
            <Label htmlFor="tk-desc">Descripción n*</Label>
            <Textarea
              id="tk-desc"
              placeholder="Descripción del ticket"
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
                  <button type="button" className="tm-link" onClick={handlePickFiles}>
                    buscar
                  </button>
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
                        {Intl.NumberFormat(undefined, {
                          style: 'unit',
                          unit: 'byte',
                          unitDisplay: 'narrow'
                        }).format(f.size)}
                      </span>
                    </div>
                    <button type="button" className="tm-file-remove" onClick={() => removeFile(i)}>
                      Eliminar
                    </button>
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