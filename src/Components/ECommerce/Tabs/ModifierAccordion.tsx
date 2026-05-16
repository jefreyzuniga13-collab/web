import { useEffect, useMemo, useState } from "react"
import type {
  listaOpciones,
  ProductoModificadorPCGInterface,
} from "@/Interfaces/Chat/ProductPCGInterface"
import { formatearDecimales } from "@/Utils/calcularIVA"
import  '@/Styles/Ecommerce/ModifierAccordion.css'
import { LuChevronsDown } from "react-icons/lu";
import { FiChevronsUp } from "react-icons/fi";
type SelectedOptionsMap = Record<string, string[]>
type OptionQtyMap = Record<string, number>

type Props = {
  modifier: ProductoModificadorPCGInterface
  selectedOptions: SelectedOptionsMap
  optionQuantities: OptionQtyMap
  cantidadProducto: number
  onToggleOption: (
    modifier: ProductoModificadorPCGInterface,
    codOpcion: string
  ) => void
  onQuantityChange: (
    modifier: ProductoModificadorPCGInterface,
    codOpcion: string,
    value: number
  ) => void
}

type EstadoModificador = "Completado" | "Incompleto" | "Opcional"

const clampQty = (n: number) => {
  if (!Number.isFinite(n) || n <= 0) return 1
  if (n > 1000) return 1000
  return Math.floor(n)
}

// const esSi = (value?: string | boolean | null) => {
//   return value === true || value === "S"
// }

const getMaximoSeleccion = (modifier: ProductoModificadorPCGInterface) => {
  const max = Number(modifier.maximoSel ?? 0)
  return Number.isFinite(max) && max > 0 ? Math.floor(max) : 0
}

const getLimiteRealModificador = (
  modifier: ProductoModificadorPCGInterface,
  cantidadProducto: number
) => {
  const maxSel = getMaximoSeleccion(modifier)

  if (maxSel <= 0) return 0

  return clampQty(cantidadProducto) * maxSel
}

const getEstadoModificador = (
  modifier: ProductoModificadorPCGInterface,
  selectedQty: number,
  limiteReal: number
): EstadoModificador => {
  const requerido = modifier.esRequerido === "S"

  if (requerido && limiteReal > 0 && selectedQty >= limiteReal) {
    return "Completado"
  }

  if (requerido && limiteReal <= 0 && selectedQty > 0) {
    return "Completado"
  }

  if (requerido) {
    return "Incompleto"
  }

  if (!requerido && selectedQty > 0) {
    return "Completado"
  }

  return "Opcional"
}

const getSelectedQtyByModifier = (
  modifier: ProductoModificadorPCGInterface,
  selectedOptions: SelectedOptionsMap,
  optionQuantities: OptionQtyMap,
  exceptCodOpcion?: string
) => {
  const key = String(modifier.codModificador)
  const selected = selectedOptions[key] ?? []

  return selected.reduce((sum, id) => {
    if (exceptCodOpcion && id === exceptCodOpcion) return sum
    return sum + clampQty(optionQuantities[id] ?? 1)
  }, 0)
}

const ModifierAccordion = ({
  modifier,
  selectedOptions,
  optionQuantities,
  cantidadProducto,
  onToggleOption,
  onQuantityChange,
}: Props) => {
  const [open, setOpen] = useState(true)

  const key = String(modifier.codModificador)
  const selected = selectedOptions[key] ?? []
  const maxSel = getMaximoSeleccion(modifier)
  const limiteReal = getLimiteRealModificador(modifier, cantidadProducto)
  const requerido = modifier.esRequerido === "S"

  const selectedQty = useMemo(() => {
    return selected.reduce((sum, id) => {
      return sum + clampQty(optionQuantities[id] ?? 1)
    }, 0)
  }, [selected, optionQuantities])

  const estado = useMemo(() => {
    return getEstadoModificador(modifier, selectedQty, limiteReal)
  }, [modifier, selectedQty, limiteReal])

  useEffect(() => {
    if (estado === "Completado") {
      setOpen(false)
    }

    if (estado === "Incompleto") {
      setOpen(true)
    }
  }, [estado])

  const isOptionSelected = (codOpcion: string) => {
    return selected.includes(String(codOpcion))
  }

  return (
    <div
      className={`modifierAccordion modifierAccordion--${estado.toLowerCase()}`}
    >
      <button
        type="button"
        className="modifierAccordion__header"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="modifierAccordion__titleGroup">
          <span className="modifierAccordion__title">
            {modifier.descripcionMod}
            {requerido && <span className="modifierAccordion__required"> *</span>}
          </span>

          {maxSel > 0 && (
            <small className="modifierAccordion__counter">
              {selectedQty}/{limiteReal}
            </small>
          )}
        </div>

        <div className="modifierAccordion__right">
          <span
            className={`modifierAccordion__status modifierAccordion__status--${estado.toLowerCase()}`}
          >
            {estado}
          </span>

          <span className="modifierAccordion__arrow">
            {open ? <FiChevronsUp size={12} /> : <LuChevronsDown size={12} />}
          </span>
        </div>
      </button>

      {open && (
        <div className="modifierAccordion__body">
          {modifier.listOpciones?.map((op: listaOpciones) => {
            const optionId = String(op.codOpcion)
            const selectedOption = isOptionSelected(optionId)
            const currentQty = optionQuantities[optionId] ?? 1

            const otherTotal = getSelectedQtyByModifier(
              modifier,
              selectedOptions,
              optionQuantities,
              optionId
            )

            const maxOptionQty =
              limiteReal > 0 ? Math.max(1, limiteReal - otherTotal) : 1000

            return (
              <div className="modifierAccordion__option" key={optionId}>
                <input
                  type="checkbox"
                  className="modifierAccordion__checkbox"
                  id={`${key}-${optionId}`}
                  checked={selectedOption}
                  onChange={() => onToggleOption(modifier, optionId)}
                />

                <label
                  htmlFor={`${key}-${optionId}`}
                  className="modifierAccordion__label"
                >
                  <span className="modifierAccordion__desc">{op.descripcionOp}</span>

                  {Number(op.precioVenta ?? 0) > 0 && (
                    <span className="modifierAccordion__price">
                      C$ {formatearDecimales(op.precioVenta)}
                    </span>
                  )}
                </label>

                {selectedOption && (
                  <input
                    type="number"
                    className="modifierAccordion__qty"
                    min={1}
                    max={maxOptionQty}
                    value={currentQty}
                    onChange={(e) =>
                      onQuantityChange(modifier, optionId, Number(e.target.value))
                    }
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ModifierAccordion;