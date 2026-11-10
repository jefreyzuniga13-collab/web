import { useEffect, useState, type FormEvent } from "react"
import Button from "@/Components/Common/Button"
import Input from "@/Components/Common/Input"
import { Label } from "@/Components/Common/Label"
import CustomAutocomplete from "@/Components/Common/CustomAutocomplete"
import { Textarea } from "@/Components/Common/Textarea"
import "@/Styles/Crm/OpeningHourModal.css"

export interface BarrioOption {
  codBarrio: string
  codSucursal: string
  descripcion: string
  precio: number
}

interface Props {
  isOpen: boolean
  barrios: BarrioOption[]
  recibeInicial: string
  onClose: () => void
  onSubmit: (values: { barrio: BarrioOption; direccion: string; recibe: string }) => Promise<void>
}

export default function CallCenterDireccionModal({
  isOpen,
  barrios,
  recibeInicial,
  onClose,
  onSubmit
}: Props) {
  const [codBarrio, setCodBarrio] = useState("")
  const [direccion, setDireccion] = useState("")
  const [recibe, setRecibe] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setCodBarrio("")
    setDireccion("")
    setRecibe(recibeInicial)
    setError("")
  }, [barrios, isOpen, recibeInicial])

  if (!isOpen) return null

  const barrio = barrios.find((item) => item.codBarrio === codBarrio)

  const opcionesBarrio = barrios.map((item) => ({
    value: item.codBarrio,
    label: `${item.descripcion} · C$ ${item.precio.toFixed(2)}`
  }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!barrio) return setError("Selecciona el barrio")
    if (!direccion.trim()) return setError("Escribe la dirección de entrega")

    setLoading(true)
    try {
      await onSubmit({ barrio, direccion: direccion.trim(), recibe: recibe.trim() })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="oh-modal__overlay">
      <div className="oh-modal__container crm-form">
        <header className="oh-modal__header">
          <div className="oh-modal__header-text">
            <h2 className="oh-modal__title">Nueva dirección</h2>
            <p className="oh-modal__subtitle">
              El costo de transporte se toma del barrio seleccionado.
            </p>
          </div>
          <button type="button" className="oh-modal__close" onClick={onClose} aria-label="Cerrar">×</button>
        </header>

        <form className="oh-modal__body" onSubmit={handleSubmit}>
          <div className="oh-modal__grid">
            <div className="oh-modal__col oh-modal__col--full">
              <Label>Barrio</Label>
              <CustomAutocomplete
                placeholder="Buscar barrio"
                options={opcionesBarrio}
                value={opcionesBarrio.find((item) => item.value === codBarrio) ?? null}
                onChange={(option) => setCodBarrio(option ? String(option.value) : "")}
              />
            </div>

            <div className="oh-modal__col oh-modal__col--full">
              <Label>Dirección</Label>
              <Textarea
                rows={3}
                value={direccion}
                placeholder="Dirección de entrega"
                onChange={(event) => setDireccion(event.target.value)}
              />
            </div>

            <div className="oh-modal__col oh-modal__col--full">
              <Label>Quién recibe</Label>
              <Input
                value={recibe}
                maxLength={200}
                onChange={(event) => setRecibe(event.target.value)}
              />
            </div>

            {error && <div className="oh-modal__error oh-modal__col--full">{error}</div>}
          </div>

          <footer className="oh-modal__footer">
            <Button variant="secondary" onClick={onClose} className="oh-modal__btn" disabled={loading}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" className="oh-modal__btn" loading={loading}>
              Crear y usar
            </Button>
          </footer>
        </form>
      </div>
    </div>
  )
}
