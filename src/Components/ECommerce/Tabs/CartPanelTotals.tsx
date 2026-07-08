import { formatearDecimales } from "@/Utils/calcularIVA"

import type {
  InvoiceTotalsDto
} from "@/Interfaces/Crm/CartPCGInterface"

interface Props {
  /**
   * Totales calculados por PCG.
   */
  invoiceTotalsDto: InvoiceTotalsDto | null

  /**
   * Transporte efectivo tomado del paso 2.
   */
  effectiveShipping: number

  /**
   * Indica si retira en sucursal.
   */
  retiraSucursal: "S" | "N"

  /**
   * Dirección guardada seleccionada.
   */
  selectedAddressId: number | null

  /**
   * Dirección manual digitada por agente.
   */
  addDescription: string
}

export default function CartPanelTotals({
  invoiceTotalsDto,
  effectiveShipping,
  retiraSucursal,
  selectedAddressId,
  addDescription
}: Props) {
  return (
    <div className="productTab-content-footer carPCPanel-totals">
      {invoiceTotalsDto?.subTotal != null &&
        invoiceTotalsDto.subTotal > 0 && (
          <div className="productTab-content__container">
            <p className="productTab-content-footer__title">Subtotal:</p>

            <span className="productTab-content-footer__value">
              C$ {formatearDecimales(invoiceTotalsDto.subTotal)}
            </span>
          </div>
        )}

      {invoiceTotalsDto?.descuento != null &&
        invoiceTotalsDto.descuento > 0 && (
          <div className="productTab-content__container">
            <p className="productTab-content-footer__title">Descuento:</p>

            <span className="productTab-content-footer__value">
              C$ {formatearDecimales(invoiceTotalsDto.descuento)}
            </span>
          </div>
        )}

      {invoiceTotalsDto?.iva != null && invoiceTotalsDto.iva > 0 && (
        <div className="productTab-content__container">
          <p className="productTab-content-footer__title">IVA:</p>

          <span className="productTab-content-footer__value">
            C$ {formatearDecimales(invoiceTotalsDto.iva)}
          </span>
        </div>
      )}

      {effectiveShipping > 0 && (
        <div className="productTab-content__container">
          <p className="productTab-content-footer__title">Transporte:</p>

          <span className="productTab-content-footer__value">
            C$ {formatearDecimales(effectiveShipping)}
          </span>
        </div>
      )}

      {invoiceTotalsDto?.total != null && invoiceTotalsDto.total > 0 && (
        <div className="productTab-content__container">
          <p className="productTab-content-footer__title">
            {`Total${
              retiraSucursal === "N" &&
              selectedAddressId == null &&
              addDescription.trim().length === 0
                ? " Más envío"
                : ""
            }:`}
          </p>

          <span className="productTab-content-footer__totalValue">
            C$ {formatearDecimales(invoiceTotalsDto.total)}
          </span>
        </div>
      )}
    </div>
  )
}