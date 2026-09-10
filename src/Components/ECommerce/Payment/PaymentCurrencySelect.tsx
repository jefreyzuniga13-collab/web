import Select from "@/Components/Common/Select"
import { Label } from "@/Components/Common/Label"
import type {
  ObtenerDivisaPagosTipoRes
} from "@/Interfaces/Ecommerce/FacturaTempo"
import { safeStr } from "@/Utils/ECommerce/formatters"

type Props = {
  /**
   * Lista de opciones de divisa o tipo de pago retornadas por el backend.
   */
  divisaOpts: ObtenerDivisaPagosTipoRes[]

  /**
   * Divisa o tipo de pago actualmente seleccionado.
   */
  divisaSelected: ObtenerDivisaPagosTipoRes | null

  /**
   * Función para actualizar la divisa seleccionada.
   */
  setDivisaSelected: (value: ObtenerDivisaPagosTipoRes | null) => void

  /**
   * Indica si las opciones de divisa todavía se están cargando.
   */
  divisaLoading: boolean

  /**
   * Texto que se muestra sobre el select.
   * Se puede personalizar según el método de pago.
   */
  label?: string

  /**
   * Permite bloquear el campo desde el componente padre.
   */
  disabled?: boolean
}

export default function PaymentCurrencySelect({
  divisaOpts,
  divisaSelected,
  setDivisaSelected,
  divisaLoading,
  label = "Tipo de pago / banco *",
  disabled = false
}: Props) {
  return (
    <div className="checkout-field checkout-field--full">

    {/* <div className="checkout-field__payment-methods">
   <span className="checkout-title-label">Tipo de moneda</span>

    <div className="checkout-checkbox-container">
      <div className="checkout-checkbox-containerBody">
        <input
          type="radio"
          id="payTypeCordoba"
          name="currencyType"
          className="checkout-radio"
          checked
        />
        <label htmlFor="payTypeCordoba" className="checkout-label">
          Córdoba
        </label>
      </div>

      <div className="checkout-checkbox-containerBody">
        <input
          type="radio"
          id="payTypeDolar"
          name="currencyType"
          className="checkout-radio"
        />
        <label htmlFor="payTypeDolar" className="checkout-label">
          Dólar
        </label>
      </div>
    </div>
    </div> */}

    {/* <div>
      <input type="number" value={100} max={100000}/>
    </div> */}
    
    <div className="checkout-field__payment-methods">
      <Label htmlFor="payType">{label}</Label>

      <Select
        id="payType"
        value={safeStr(divisaSelected?.codigo)}
        disabled={disabled || divisaLoading}
        placeholder={divisaLoading ? "Cargando..." : "Seleccionar"}
        options={divisaOpts.map((item) => ({
          value: safeStr(item.codigo),
          label: item.nombre
        }))}
        onChange={(event) => {
          const code = safeStr(event.target.value)

          const found =
            divisaOpts.find((item) => safeStr(item.codigo) === code) ?? null

          setDivisaSelected(found)
        }}
      />
    </div>
    
    </div>
  )
}