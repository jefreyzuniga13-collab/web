import { useEffect, useState, type FormEvent } from "react"
import Button from "@/Components/Common/Button"
import Input from "@/Components/Common/Input"
import { Label } from "@/Components/Common/Label"
import CustomAutocomplete from "@/Components/Common/CustomAutocomplete"
import TimePickerField from "@/Components/Common/TimePickerField"
import { format } from "date-fns"
import type {
  BarrioCall,
  PrecioTransporte,
  SucursalCall
} from "@/Services/Ecommerce/CallCenterService"
import "@/Styles/Crm/OpeningHourModal.css"

export interface BarrioFormValues {
  codEmpresa: string
  codSucursal: string
  descripcion: string
  codPrecioTrans: string
  atender: string
  horaMaxima: string
}

interface Props {
  isOpen: boolean
  data: BarrioCall | null
  sucursales: SucursalCall[]
  precios: PrecioTransporte[]
  onClose: () => void
  onSubmit: (values: BarrioFormValues) => Promise<void>
}

const vacio: BarrioFormValues = {
  codEmpresa: "01",
  codSucursal: "",
  descripcion: "",
  codPrecioTrans: "",
  atender: "S",
  horaMaxima: "18:00"
}

function horaADate(hora: string): Date | null {
  const match = hora.match(/^(\d{2}):(\d{2})/)
  if (!match) return null
  const fecha = new Date()
  fecha.setHours(Number(match[1]), Number(match[2]), 0, 0)
  return fecha
}

export default function CallCenterBarrioModal({
  isOpen,
  data,
  sucursales,
  precios,
  onClose,
  onSubmit
}: Props) {
  const [form, setForm] = useState<BarrioFormValues>(vacio)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setError("")
    setForm(
      data
        ? {
            codEmpresa: data.codEmpresa || "01",
            codSucursal: data.codSucursal,
            descripcion: data.descripcion,
            codPrecioTrans: data.codPrecioTrans,
            atender: data.atender === "S" ? "S" : "N",
            horaMaxima: data.horaMaxima || "18:00"
          }
        : { ...vacio, codSucursal: sucursales[0]?.codigo ?? "" }
    )
  }, [data, isOpen, sucursales])

  if (!isOpen) return null

  const opcionesSucursal = sucursales.map((item) => ({
    value: item.codigo,
    label: `${item.codigo} - ${item.sucursal}`
  }))

  const opcionesPrecio = precios.map((item) => ({
    value: item.codPrecioTrans,
    label: `${item.descripcion} · NIO ${item.precio.toFixed(2)}`
  }))

  const cambiar = (campo: keyof BarrioFormValues, valor: string) =>
    setForm((prev) => ({ ...prev, [campo]: valor }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.descripcion.trim()) return setError("El nombre del barrio es obligatorio")
    if (!form.codSucursal) return setError("Selecciona la sucursal")
    if (!form.codPrecioTrans) return setError("Selecciona la lista de precio")
    if (!form.horaMaxima) return setError("Indica la hora máxima de pedido")

    setLoading(true)
    try {
      await onSubmit({ ...form, descripcion: form.descripcion.trim() })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="oh-modal__overlay">
      <div className="oh-modal__container crm-form">
        <header className="oh-modal__header">
          <div className="oh-modal__header-text">
            <h2 className="oh-modal__title">{data ? "Editar barrio" : "Nuevo barrio"}</h2>
            <p className="oh-modal__subtitle">
              {data ? `Código ${data.codBarrio}` : "El código se genera automáticamente."}
            </p>
          </div>
          <button type="button" className="oh-modal__close" onClick={onClose} aria-label="Cerrar">×</button>
        </header>

        <form className="oh-modal__body" onSubmit={handleSubmit}>
          <div className="oh-modal__grid">
            <div className="oh-modal__col oh-modal__col--full">
              <Label>Barrio o zona</Label>
              <Input
                value={form.descripcion}
                maxLength={200}
                onChange={(event) => cambiar("descripcion", event.target.value)}
              />
            </div>

            <div className="oh-modal__col">
              <Label>Sucursal</Label>
              <CustomAutocomplete
                disablePortal={false}
                placeholder="Buscar sucursal"
                options={opcionesSucursal}
                value={opcionesSucursal.find((item) => item.value === form.codSucursal) ?? null}
                onChange={(option) => cambiar("codSucursal", option ? String(option.value) : "")}
              />
            </div>

            <div className="oh-modal__col">
              <Label>Lista de precio</Label>
              <CustomAutocomplete
                disablePortal={false}
                placeholder="Buscar lista de precio"
                options={opcionesPrecio}
                value={opcionesPrecio.find((item) => item.value === form.codPrecioTrans) ?? null}
                onChange={(option) => cambiar("codPrecioTrans", option ? String(option.value) : "")}
              />
            </div>

            <div className="oh-modal__col">
              <Label>Hora máxima de pedido</Label>
              <TimePickerField
                // label="Hora máxima"
                value={horaADate(form.horaMaxima)}
                onChange={(fecha) => cambiar("horaMaxima", fecha ? format(fecha, "HH:mm") : "")} label={""}              />
            </div>

            <div className="oh-modal__col oh-modal__col-isActive oh-modal__field--checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={form.atender === "S"}
                  onChange={(event) => cambiar("atender", event.target.checked ? "S" : "N")}
                />
                Se atiende esta zona
              </label>
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
