import { useEffect, useMemo, useState } from "react"
import "@/Styles/Ecommerce/CartPage.css"
import noimageavailable from "@/assets/img/noimageavailable.webp"
import { useNavigate } from "react-router-dom"
import type { TempLinkResolveResponseDto } from "@/Interfaces/Common/GlobalPCGInterface"
import CustomLoader from "@/Components/Common/CustomLoader"
import Lottie from "lottie-react"
import EmptyCartPlayer from "@/assets/lottie/Empty.json"
import {
  selectCarPCG,
  selectCartError,
  selectCartLoading,
  getProductFromCarAsync
} from "@/Context/Slices/Ecommerce/cartSlice"
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux"
import type { RootState, AppDispatch } from "@/Context"
import type { LogCartResponseDto } from "@/Interfaces/Crm/LogCartInterface"
import useLogCart from "@/Hooks/Crm/useLogCard"
import type { ListDetalleCarrito } from "@/Interfaces/Crm/CartPCGInterface"

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
      await dispatch(
        getProductFromCarAsync({
          codCliente: payload.contactId,
          noPedido: payload.orderId
        })
      )

      const log = await fetchByContactId(payload.contactId)
      setExistingLog(log)
    }

    run()
  }, [dispatch, fetchByContactId, payload])

  const productGroups = useMemo<ProductGroup[]>(() => {
    const groups: ProductGroup[] = []

    carPCG?.forEach((group) => {
      let currentProduct: ProductGroup | null = null

      group.listDetalle?.forEach((item) => {
        if (item.tipoComponente === "P") {
          currentProduct = {
            product: item,
            options: []
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
      maximumFractionDigits: 2
    })
  }

  const getImage = (image?: string | null) => {
    const img = String(image ?? "").trim()
    return img.length > 0 ? img : noimageavailable
  }

  const goToCheckout = () => {
    if (hasItems) navigate("/checkout", { state: { payload } })
  }

  if (loading) {
    return (
      <main className="cart-page cart-page--centered">
        <CustomLoader />
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
                  <>
                    <tr
                      className="cart-table__row cart-table__row--product"
                      key={`product-${product.unico ?? product.codProducto ?? index}`}
                    >
                      <td className="cart-table__cell cart-table__cell--product">
                        <div className="cart-item">
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
                                {options.length} opción{options.length === 1 ? "" : "es"}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="cart-table__cell cart-table__cell--price">
                        {formatMoney(product.precioV)}
                      </td>

                      <td className="cart-table__cell cart-table__cell--qty">
                        <div className="cart-qty">
                          <span className="cart-qty__value">
                            {product.cantidad}
                          </span>
                        </div>
                      </td>

                      <td className="cart-table__cell cart-table__cell--total">
                        Producto principal
                      </td>
                    </tr>

                    {options.map((option, optionIndex) => (
                      <tr
                        className="cart-table__row cart-table__row--option"
                        key={`option-${product.unico ?? index}-${option.unico ?? option.codProducto ?? optionIndex}`}
                      >
                        <td className="cart-table__cell cart-table__cell--product">
                          <div className="cart-item cart-item--option">
                            <div className="cart-item__option-indicator" />

                            <div className="cart-item__image-wrapper cart-item__image-wrapper--option">
                              <img
                                src={getImage(option.imagen)}
                                className="cart-item__image"
                                alt={option.descripcion ?? "Opción"}
                              />
                            </div>

                            <div className="cart-item__info">
                              <p className="cart-item__name cart-item__name--option">
                                {option.descripcion}
                              </p>

                              {option.observaciones && (
                                <span className="cart-item__note">
                                  {option.observaciones}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="cart-table__cell cart-table__cell--price cart-table__cell--option">
                          {formatMoney(option.precioV)}
                        </td>

                        <td className="cart-table__cell cart-table__cell--qty cart-table__cell--option">
                          <div className="cart-qty cart-qty--option">
                            <span className="cart-qty__value cart-qty__value--option">
                              {option.cantidad}
                            </span>
                          </div>
                        </td>

                        <td className="cart-table__cell cart-table__cell--total cart-table__cell--option">
                          Opción del producto
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </section>

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
            Dale un vistazo a nuestras novedades y empieza a solicitar productos y llenar tu carrito.
          </p>
        </section>
      )}
    </main>
  )
}

export default CarPage