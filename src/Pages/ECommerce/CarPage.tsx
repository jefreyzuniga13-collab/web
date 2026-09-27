import { Fragment, useEffect, useMemo, useState } from "react"
import "@/Styles/Ecommerce/CartPage.css"
import noimageavailable from '@/assets/vacio.png'
import { useNavigate } from "react-router-dom"
import type { TempLinkResolveResponseDto } from "@/Interfaces/Common/GlobalPCGInterface"
import ListSkeleton from "@/Components/Common/ListSkeleton"
import Lottie from "lottie-react"
import EmptyCartPlayer from "@/assets/lottie/Empty.json"
import {
  selectCarPCG,
  selectCartError,
  selectCartLoading,
  getProductFromCarAsync,
} from "@/Context/Slices/Ecommerce/cartSlice"
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux"
import type { RootState, AppDispatch } from "@/Context"
import type { LogCartResponseDto } from "@/Interfaces/Crm/LogCartInterface"
import useLogCart from "@/Hooks/Crm/useLogCard"
import type { ListDetalleCarrito } from "@/Interfaces/Crm/CartPCGInterface"
import { formatearDecimales } from "@/Utils/calcularIVA"
import { applyPublicEmpresaId } from "@/Utils/ECommerce/publicEmpresa"

interface CarPageProps {
  payload: TempLinkResolveResponseDto
}

type ProductGroup = {
  product: ListDetalleCarrito
  options: ListDetalleCarrito[]
}

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

const CarPage: React.FC<CarPageProps> = ({ payload }) => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const carPCG = useAppSelector(selectCarPCG)
  const loading = useAppSelector(selectCartLoading)
  const error = useAppSelector(selectCartError)

  const [existingLog, setExistingLog] = useState<LogCartResponseDto | null>(null)
  const { fetchByContactId } = useLogCart()

  useEffect(() => {
    if (!payload?.contactId || !payload?.orderId) return

    const run = async () => {
      // Reaplica la empresa del link antes de consultar PCG (crítico en iPhone).
      applyPublicEmpresaId(payload.empresaId)

      await dispatch(
        getProductFromCarAsync({
          codCliente: payload.contactId,
          noPedido: payload.orderId,
        })
      )

      const log = await fetchByContactId(payload.contactId)
      setExistingLog(log)
    }

    void run()
  }, [dispatch, fetchByContactId, payload])

  const productGroups = useMemo<ProductGroup[]>(() => {
    const groups: ProductGroup[] = []

    carPCG?.forEach((group) => {
      let currentProduct: ProductGroup | null = null

      group.listDetalle?.forEach((item) => {
        if (item.tipoComponente === "P") {
          currentProduct = {
            product: item,
            options: [],
          }

          groups.push(currentProduct)
          return
        }

        if (item.tipoComponente === "O" && currentProduct) {
          currentProduct.options.push(item)
        }
      })
    })

    return groups
  }, [carPCG])

  const hasItems = productGroups.length > 0

  const formatMoney = (value?: number | null) => {
    return Number(value ?? 0).toLocaleString("es-NI", {
      style: "currency",
      currency: "NIO",
      maximumFractionDigits: 2,
    })
  }

  const getImage = (image?: string | null) => {
    const img = String(image ?? "").trim()
    return img.length > 0 ? img : noimageavailable
  }

  const getOptionLabel = (option: ListDetalleCarrito) => {
    const text = String(option.observaciones ?? "").trim()
    return text.length > 0 ? text : "Modificador"
  }

  const getProductKey = (product: ListDetalleCarrito, index: number) => {
    return `product-${product.unico ?? product.codProducto ?? index}`
  }

  const getOptionKey = (
    product: ListDetalleCarrito,
    option: ListDetalleCarrito,
    productIndex: number,
    optionIndex: number
  ) => {
    return `option-${
      product.unico ?? product.codProducto ?? productIndex
    }-${option.unico ?? option.codProducto ?? optionIndex}`
  }

  const goToCheckout = () => {
    if (hasItems) navigate("/checkout", { state: { payload } })
  }

  if (loading) {
    return (
      <main className="cart-page">
        <header className="cart-page__header">
          <h1 className="cart-page__title">Carrito de compra</h1>
        </header>
        <ListSkeleton variant="cart" count={5} />
      </main>
    )
  }

  if (error) {
    return (
      <main className="cart-page cart-page--centered">
        <div className="cart-page__error">
          <span className="cart-page__error-text">{error}</span>
        </div>
      </main>
    )
  }

  return (
    <main className="cart-page">
      <header className="cart-page__header">
        <h1 className="cart-page__title">Carrito de compra</h1>
        <h3 className="cart-page__subtitle">Sucursal: {existingLog?.branchName ?? ""}</h3>
      </header>

      {hasItems ? (
        <section className="cart-page__content">
          <section className="cart-page__table-section" aria-label="Carrito">
            <table className="cart-table">
              <thead className="cart-table__head">
                <tr className="cart-table__row cart-table__row--head">
                  <th className="cart-table__cell cart-table__cell--product">
                    Producto
                  </th>
                  <th className="cart-table__cell cart-table__cell--price">
                    Precio
                  </th>
                  <th className="cart-table__cell cart-table__cell--qty">
                    Cantidad
                  </th>
                  <th className="cart-table__cell cart-table__cell--total">
                    Contenido
                  </th>
                </tr>
              </thead>

              <tbody className="cart-table__body">
                {productGroups.map(({ product, options }, index) => (
                  <Fragment key={getProductKey(product, index)}>
                    <tr className="cart-table__row cart-table__row--product">
                      <td className="cart-table__cell cart-table__cell--product">
                        <div className="cart-item cart-item--product">
                          <div className="cart-item__image-wrapper">
                            <img
                              src={getImage(product.imagen)}
                              className="cart-item__image"
                              alt={product.descripcion ?? "Producto"}
                            />
                          </div>

                          <div className="cart-item__info">
                            <p className="cart-item__name">
                              {product.descripcion}
                            </p>

                            {product.observaciones && (
                              <span className="cart-item__note">
                                {product.observaciones}
                              </span>
                            )}

                            {options.length > 0 && (
                              <span className="cart-item__option-count">
                                {options.length} opción
                                {options.length === 1 ? "" : "es"}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="cart-table__cell cart-table__cell--price">
                        {product.precioV > 0 ? " C$ " + formatearDecimales(product.precioV) : ""}
                      </td>

                      <td className="cart-table__cell cart-table__cell--qty">
                        <div className="cart-qty">
                          <span className="cart-qty__value">
                            {product.cantidad}
                          </span>
                        </div>
                      </td>

                    </tr>

                    {options.map((option, optionIndex) => (
                      <tr
                        className="cart-table__row cart-table__row--option"
                        key={getOptionKey(product, option, index, optionIndex)}
                      >
                        <td className="cart-table__cell cart-table__cell--product">
                          <div className="cart-item cart-item--option">
                            <div className="cart-item__option-indicator" />

                            <div className="cart-item__image-wrapper cart-item__image-wrapper--option">
                            </div>

                            <div className="cart-item__info cart-item__info--option">
                              <span className="cart-item__modifier-label">
                                {getOptionLabel(option)}
                              </span>

                              <p className="cart-item__name cart-item__name--option">
                                {option.descripcion}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="cart-table__cell cart-table__cell--price cart-table__cell--option">
  
                          {option.precioV > 0 ? " C$ " + formatearDecimales(option.precioV) : "Incluido"}
                        </td>

                        <td className="cart-table__cell cart-table__cell--qty cart-table__cell--option">
                          <div className="cart-qty cart-qty--option">
                            <span className="cart-qty__value cart-qty__value--option">
                              {option.cantidad}
                            </span>
                          </div>
                        </td>

                        <td className="cart-table__cell cart-table__cell--total cart-table__cell--option">
                          Opción
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </section>

          {/* LLega a mostrar el 0.00, todo cuando no deberia por eso se estaba revisando el logcart
          desde el carpcgtab
          */}
          <aside className="cart-page__totals" aria-label="Total carrito">
            <h2 className="cart-totals__title">Total Carrito</h2>

            <div className="cart-totals__card">
              <div className="cart-totals__row">
                <span className="cart-totals__label">Subtotal</span>
                <span className="cart-totals__value cart-totals__value--strong">
                  {formatMoney(existingLog?.subTotal)}
                </span>
              </div>

              {existingLog != null && Number(existingLog.transCost) > 0 && (
                <div className="cart-totals__row">
                  <span className="cart-totals__label">Transporte</span>
                  <span className="cart-totals__value cart-totals__value--strong">
                    {formatMoney(existingLog.transCost)}
                  </span>
                </div>
              )}

            {existingLog != null && Number(existingLog.descuentoPantalla) > 0 && (
                <div className="cart-totals__row">
                  <span className="cart-totals__label">Descuento</span>
                  <span className="cart-totals__value cart-totals__value--strong">
                    {formatMoney(existingLog.descuentoPantalla)}
                  </span>
                </div>
              )}

              {existingLog != null && Number(existingLog.ivaPantalla) > 0 && (
                <div className="cart-totals__row">
                  <span className="cart-totals__label">IVA</span>
                  <span className="cart-totals__value">
                    {formatMoney(existingLog.ivaPantalla)}
                  </span>
                </div>
              )}

              <div className="cart-totals__row cart-totals__row--total">
                <span className="cart-totals__label">Total</span>
                <span className="cart-totals__value cart-totals__value--strong">
                  {formatMoney(existingLog?.totalEnPantalla)}
                </span>
              </div>

              <button
                type="button"
                className="cart-totals__button"
                onClick={goToCheckout}
                disabled={!hasItems}
              >
                <p className="cart-totals_text">Procesar Pago</p>
              </button>
            </div>
          </aside>
        </section>
      ) : (
        <section className="emptycart__container">
          <div className="emptycart__animation">
            <Lottie loop={false} autoplay animationData={EmptyCartPlayer} />
          </div>

          <h2 className="emptycart__container-title">
            Parece que tu carrito está vacío
          </h2>

          <p className="emptycart__container-subtitle">
            Dale un vistazo a nuestras novedades y empieza a solicitar productos
            y llenar tu carrito.
          </p>
        </section>
      )}
    </main>
  )
}

export default CarPage