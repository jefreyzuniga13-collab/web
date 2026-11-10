import { useEffect, useState, type FormEvent } from "react"
import Button from "@/Components/Common/Button"
import Input from "@/Components/Common/Input"
import { Label } from "@/Components/Common/Label"
import { soloMonto, type PrecioTransporte } from "@/Services/Ecommerce/CallCenterService"
import "@/Styles/Crm/OpeningHourModal.css"

interface Props {
  isOpen: boolean
  data: PrecioTransporte | null
  onClose: () => void
  onSubmit: (values: { descripcion: string; precio: number }) => Promise<void>
}

export default function CallCenterPrecioModal({ isOpen, data, onClose, onSubmit }: Props) {
  const [descripcion, setDescripcion] = useState("")
  const [precio, setPrecio] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setDescripcion(data?.descripcion ?? "")
    setPrecio(data ? String(data.precio) : "")
    setError("")
  }, [data, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const valor = Number(precio)
    if (!descripcion.trim()) return setError("La descripción es obligatoria")
    if (!precio || !Number.isFinite(valor) || valor < 0) return setError("Indica un precio válido")

    setLoading(true)
    try {
      await onSubmit({ descripcion: descripcion.trim(), precio: valor })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="oh-modal__overlay">
      <div className="oh-modal__container crm-form">
        <header className="oh-modal__header">
          <div className="oh-modal__header-text">
            <h2 className="oh-modal__title">
              {data ? "Editar precio de transporte" : "Nuevo precio de transporte"}
            </h2>
            <p className="oh-modal__subtitle">
              {data ? `Código ${data.codPrecioTrans}` : "El código se genera automáticamente."}
            </p>
          </div>
          <button type="button" className="oh-modal__close" onClick={onClose} aria-label="Cerrar">×</button>
        </header>

        <form className="oh-modal__body" onSubmit={handleSubmit}>
          <div className="oh-modal__grid">
            <div className="oh-modal__col">
              <Label>Descripción</Label>
              <Input
                value={descripcion}
                maxLength={200}
                onChange={(event) => setDescripcion(event.target.value)}
              />
            </div>
            <div className="oh-modal__col">
              <Label>Precio</Label>
              <Input
                inputMode="decimal"
                value={precio}
                placeholder="Ej. 50"
                onChange={(event) => setPrecio(soloMonto(event.target.value))}
              />
            </div>
            {error && <div className="oh-modal__error oh-modal__col--full">{error}</div>}
          </div>

          <footer className="oh-modal__footer">
            <Button variant="secondary" onClick={onClose} className="oh-modal__btn" disabled={loading}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" className="oh-modal__btn" loading={loading}>
              {data ? "Guardar" : "Crear"}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  )
}
