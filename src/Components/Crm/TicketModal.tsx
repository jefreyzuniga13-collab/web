import React, { useMemo, 
  // useRef, 
  useState, useCallback, useEffect, 
  // type ChangeEvent
} from 'react'
import Button from '@/Components/Common/Button'
import Input from '@/Components/Common/Input'
import { Textarea } from '@/Components/Common/Textarea'
import { Label } from '@/Components/Common/Label'
import Select from '@/Components/Common/Select'
import '@/Styles/Crm/TicketModal.css'
import { useTicketDetail } from '@/Hooks/Crm/useTicketDetail'
// import type { Prioridad } from '@/Interfaces/Crm/TicketInterfaces'
import { useUsers } from '@/Hooks/Auth/useUsers'
import { jwtDecode } from 'jwt-decode'
import DatePickerField from '@/Components/Common/DatePickerField'
import { toast } from 'react-toastify'
import CustomAutocomplete from '@/Components/Common/CustomAutocomplete'
import type { AuthStorage, JwtPayload } from '@/Interfaces/Auth/AuthInterface'

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

  const [priority, setPriority] = useState<number>(1)

  const [responsibleId, setResponsibleId] = useState<number | null>(null)
  const [dueDate, setDueDate] = useState<Date | null>(null)
  // const [selectedColor, setSelectedColor] = useState('#ffffff'); 


  // const handleColorChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   setSelectedColor(event.target.value);
  // };
  // const [files, setFiles] = useState<File[]>([])

  const [errors, setErrors] = useState<{ title?: string; description?: string; priority?: string; responsibleId?: string;dueDate?: string; selectedColor?: string }>({})
  // const [isDragging, setIsDragging] = useState(false)
  // const fileInputRef = useRef<HTMLInputElement | null>(null)

  const authRaw = localStorage.getItem('auth') || '{}'
  const { accessToken } = JSON.parse(authRaw) as AuthStorage
  const { role } = jwtDecode<JwtPayload>(accessToken)
  const isAdmin = role.toLowerCase() === 'admin'

  const { createTicket, error, loading } = useTicketDetail()
  const { users, loading: usersLoading, page, pageSize, setPage, totalCount } = useUsers()

  const [allUsers, setAllUsers] = useState<typeof users>([])
  useEffect(() => {
    if (!isOpen || !isAdmin) return

    // Cada vez que abras el modal, reseteas y pides la primera página
    setAllUsers([])
    setPage(1)
  }, [isOpen, isAdmin, setPage])

  useEffect(() => {
    setAllUsers(prev => {
      const map = new Map(prev.map(u => [u.userId, u]))
      for (const u of users) {
        map.set(u.userId, u)
      }
      return Array.from(map.values())
    })
  }, [users])


  const hasMoreResponsibles = useMemo(
    () => page * pageSize < totalCount,
    [page, pageSize, totalCount]
  )


  const handleLoadMoreResponsibles = useCallback(() => {
    if (!hasMoreResponsibles || usersLoading) return
    setPage(page + 1)
  }, [hasMoreResponsibles, usersLoading, page, setPage])


  const priorityOptions = useMemo(
    () => [
      { label: 'Alta', value: 1 },
      { label: 'Media', value: 2 },
      { label: 'Baja', value: 3 }
    ],
    []
  )

  // const responsibleOptions = useMemo(() => {
  //   if (!users || !Array.isArray(users)) return []
  //   return users
  //     .filter(u => {
  //       const roles = Array.isArray(u.roles)
  //         ? u.roles.map(r =>
  //           (r.roleName ?? '').toLowerCase()
  //         )
  //         : []

  //       if (roles.includes('support')) return true
  //       if (roles.includes('admin')) return u.userId === userId
  //       return false
  //     })
  //     .map(u => ({
  //       label: u.fullName ?? String(u.userId),
  //       value: String(u.userId)
  //     }))
  // }, [users, userId])


  const responsibleOptions = useMemo(() => {
    if (!allUsers || !Array.isArray(allUsers)) return []
    return allUsers.map(u => ({
      label: u.fullName ?? String(u.userId),
      value: String(u.userId),
    }))
  }, [allUsers])


  // const addFiles = useCallback((incoming: File[]) => {
  //   setFiles(prev => {
  //     const map = new Map(prev.map(f => [f.name + f.size + f.lastModified, f]))
  //     for (const f of incoming) map.set(f.name + f.size + f.lastModified, f)
  //     return Array.from(map.values())
  //   })
  // }, [])

  // const handlePickFiles = () => fileInputRef.current?.click()

  // const handleFiles = (list: FileList | null) => {
  //   if (!list) return
  //   addFiles(Array.from(list))
  // }

  // const onDragOver = (e: React.DragEvent) => {
  //   e.preventDefault()
  //   setIsDragging(true)
  // }

  // const onDragLeave = () => {
  //   setIsDragging(false)
  // }

  // const onDrop = (e: React.DragEvent) => {
  //   e.preventDefault()
  //   setIsDragging(false)
  //   const list = e.dataTransfer.files
  //   if (!list || list.length === 0) return
  //   addFiles(Array.from(list))
  // }

  // const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx))

  const validate = () => {
    const e: typeof errors = {}
    if (!title.trim()) e.title = 'Requerido'
    if (!description.trim()) e.description = 'Requerido'
    if (!priority || priority == 0) e.priority = 'Seleccione una prioridad'
    if (isAdmin && !responsibleId) e.responsibleId = 'Requerido'
     if (!dueDate) e.dueDate = 'Requerida'
    //  if (!selectedColor) e.selectedColor = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return

    const resp = await createTicket({
      conversationId,
      codCliente,
      contactId,
      titulo: title.trim(),
      descripcion: description.trim(),
      prioridad: Number(priority),
      // archivos: files,
      archivos: [],
      responsibleId,
      DueDate: dueDate!,
      // selectedColor: selectedColor
    })

    if (!resp || !resp.success) {
      toast.error(resp?.message ?? 'Error al crear el ticket')
      return
    }

    toast.success(resp.message || 'Ticket creado correctamente')

    setTitle('')
    setDescription('')
    setPriority(1)
    // setFiles([])
    setResponsibleId(null)
    setDueDate(null)
    onClose()
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
                onChange={e => setPriority(Number(e.target.value))}
                options={priorityOptions}
                placeholder="Seleccione prioridad"
                error={errors.priority}
              />
            </div>

            {isAdmin && (
              <div className="tm-field">
                <Label htmlFor="tk-responsible">Responsable *</Label>
                <CustomAutocomplete
                  label="Responsable"
                  placeholder="Seleccione responsable"
                  value={
                    responsibleId != null
                      ? responsibleOptions.find(
                        o => Number(o.value) === Number(responsibleId)
                      ) || null
                      : null
                  }
                  onChange={(newOpt) =>
                    setResponsibleId(newOpt ? Number(newOpt.value) : null)
                  }
                  options={responsibleOptions}
                  error={!!errors.responsibleId}
                  helperText={errors.responsibleId}
                  hasMore={hasMoreResponsibles}
                  loading={usersLoading}
                  onLoadMore={handleLoadMoreResponsibles}
                />
              </div>
            )}


            <div className="tm-field">
              <Label htmlFor="tk-due">Fecha Entrega *</Label>
              <DatePickerField
                label=""
                value={dueDate}
                onChange={setDueDate}
                className="tm-due-date"
              />
              {errors.dueDate && <span className="tm-error">{errors.dueDate}</span>}
            </div>

            {/* <div className="tm-field">
               <Label htmlFor="tk-due">Seleccion color *</Label>
              <input
                type="color"
                id="colorInput"
                value={selectedColor}
                onChange={handleColorChange}
              />
            </div> */}

            {/* {errors.selectedColor && <span className="tm-error">{errors.selectedColor}</span>} */}
          </div>

          <div className="tm-field">
            <Label htmlFor="tk-desc">Descripción *</Label>
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

          {/* <div className="tm-field">
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
          </div> */}

          <footer className="tm-footer">
            <Button type="button" variant="secondary" className="tm-btn" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" className="tm-btn" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Ticket'}
            </Button>
          </footer>
          {error && (
            <p className="tm-error" style={{ marginTop: '0.5rem' }}>
              {error.message}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}