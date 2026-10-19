import { formatearDecimales } from "@/Utils/calcularIVA"

import type {
  InvoiceTotalsDto
} from "@/Interfaces/Crm/CartPCGInterface"
import type { SINO } from "@/Interfaces/Ecommerce/FacturaTempo"

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
  retiraSucursal: SINO

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
  const hasAddress =
    selectedAddressId != null || addDescription.trim().length > 0

  /**
   * Preferir el transporte del consolidado; si aún no viene,
   * mostrar el ingresado en entrega para que el subtotal no quede oculto.
   */
  const transporteVisible =
    invoiceTotalsDto?.transporte != null && invoiceTotalsDto.transporte > 0
      ? invoiceTotalsDto.transporte
      : retiraSucursal !== "S" && hasAddress && effectiveShipping > 0
        ? effectiveShipping
        : 0

  return (
    <div className="productTab-content-footer carPCPanel-totals">
      {invoiceTotalsDto?.subTotal != null &&
        invoiceTotalsDto.subTotal > 0 && (
          <div className="productTab-content__container">
            <p className="productTab-content-footer__title">Subtotal:</p>

            <span className="productTab-content-footer__value">
              NIO {formatearDecimales(invoiceTotalsDto.subTotal)}
            </span>
          </div>
        )}

      {invoiceTotalsDto?.descuento != null &&
        invoiceTotalsDto.descuento > 0 && (
          <div className="productTab-content__container">
            <p className="productTab-content-footer__title">Descuento:</p>

            <span className="productTab-content-footer__value">
              NIO {formatearDecimales(invoiceTotalsDto.descuento)}
            </span>
          </div>
        )}

      {invoiceTotalsDto?.iva != null && invoiceTotalsDto.iva > 0 && (
        <div className="productTab-content__container">
          <p className="productTab-content-footer__title">IVA:</p>

          <span className="productTab-content-footer__value">
            NIO {formatearDecimales(invoiceTotalsDto.iva)}
          </span>
        </div>
      )}

      {transporteVisible > 0 && (
        <div className="productTab-content__container">
          <p className="productTab-content-footer__title">Transporte:</p>

          <span className="productTab-content-footer__value">
            NIO {formatearDecimales(transporteVisible)}
          </span>
        </div>
      )}

      {invoiceTotalsDto?.total != null && invoiceTotalsDto.total > 0 && (
        <div className="productTab-content__container">
          <p className="productTab-content-footer__title">
            {`Total${
              retiraSucursal === "N" && !hasAddress
                ? " Más envío"
                : ""
            }:`}
          </p>

          <span className="productTab-content-footer__totalValue">
            NIO {formatearDecimales(invoiceTotalsDto.total)}
          </span>
        </div>
      )}
    </div>
  )
}
