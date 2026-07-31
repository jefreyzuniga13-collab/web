import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react"
import { useSelector } from "react-redux"
import { Tooltip } from "@mui/material"
import { toast } from "react-toastify"
import { MdCheckCircle, MdClear, MdDelete } from "react-icons/md"
import { GiPriceTag } from "react-icons/gi"

import Input from "@/Components/Common/Input"
import vacio from "@/assets/vacio.png"

import { selectAplicaDescuento } from "@/Context/Slices/Auth/authSlice"

import { formatearDecimales } from "@/Utils/calcularIVA"
import { safeNumber } from "@/Utils/ECommerce/utils"
import {
  formatearPorcentaje,
  normalizarDescuentoInput,
} from "@/Utils/ECommerce/descuentoGlobal"

import {
  TipoDescuento,
  type AplicarDescuentoGlobalParams,
  type AplicarDescuentoProductoParams,
} from "@/Interfaces/Crm/CartPCGInterface"

import type { CartDetailView } from "@/Interfaces/Crm/LogCartInterface"

/**
 * Porcentaje máximo permitido en la interfaz.
 */
const MAX_DESCUENTO_PORCENTUAL_UI = 100

interface Props {
  search: string
  setSearch: (value: string) => void
  filteredDetails: CartDetailView[]
  companySistema?: string | null

  handleRemoveItem: (
    idUsuario: number,
    noPedido: number,
    codProducto: string,
    unico: string
  ) => Promise<void>

  cartUserId: number

  aplicarDescuentoGlobal: (
    params: AplicarDescuentoGlobalParams
  ) => Promise<boolean>

  aplicarDescuentoProducto: (
    params: AplicarDescuentoProductoParams
  ) => Promise<boolean>
}

type ProductoSeleccionado = {
  key: string
  detail: AplicarDescuentoProductoParams["detalle"]
}

const crearClaveLinea = (
  detail: CartDetailView["detail"],
  index: number
): string => {
  return [
    detail.tipoComponente || "",
    detail.unico || "",
    detail.codProducto || "",
    detail.codOpcion || "",
    detail.financiamiento ?? detail.indice ?? index,
    index,
  ].join("-")
}

const crearClaveProducto = (
  detail: CartDetailView["detail"],
  index: number
): string => {
  return [
    detail.unico || "",
    detail.codProducto || "",
    detail.financiamiento ?? detail.indice ?? index,
  ].join("-")
}

const obtenerPorcentajeActual = (
  detail: CartDetailView["detail"]
): string => {
  const value = String(detail.porcenDescto ?? "").trim()

  return value && Number(value) !== 0 ? value : ""
}

const obtenerMontoActual = (
  detail: CartDetailView["detail"]
): number => {
  return safeNumber(detail.descuento, 0)
}

export default function CartPanelProductStep({
  search,
  setSearch,
  filteredDetails,
  companySistema,
  handleRemoveItem,
  cartUserId,
  aplicarDescuentoGlobal,
  aplicarDescuentoProducto,
}: Props) {
  const aplicaDescuento = useSelector(selectAplicaDescuento)

  const [productoSeleccionado, setProductoSeleccionado] =
    useState<ProductoSeleccionado | null>(null)

  const [tipoDescuento, setTipoDescuento] =
    useState<TipoDescuento>(TipoDescuento.P)

  const [descuentoInput, setDescuentoInput] = useState("")
  const [aplicandoDescuento, setAplicandoDescuento] = useState(false)

  /**
   * Evita solicitudes duplicadas disparadas por onBlur.
   */
  const descuentoLockRef = useRef(false)

  /**
   * Limpia cualquier estado de descuento si la empresa
   * deshabilita esta funcionalidad.
   */
  useEffect(() => {
    if (aplicaDescuento) return

    descuentoLockRef.current = false
    setProductoSeleccionado(null)
    setDescuentoInput("")
    setAplicandoDescuento(false)
  }, [aplicaDescuento])

  const seleccionarProducto = useCallback(
    (
      key: string,
      detail: AplicarDescuentoProductoParams["detalle"]
    ) => {
      if (!aplicaDescuento || aplicandoDescuento) return

      if (detail.permiteDescuento !== "S") {
        toast.info("Este producto no permite descuento individual.")
        return
      }

      setProductoSeleccionado((actual) => {
        if (actual?.key === key) {
          return null
        }

        return {
          key,
          detail,
        }
      })

      /*
       * Evita conservar un valor escrito para otro producto
       * o para el descuento global.
       */
      setDescuentoInput("")
    },
    [aplicaDescuento, aplicandoDescuento]
  )

  const handleProductKeyDown = useCallback(
    (
      event: KeyboardEvent<HTMLDivElement>,
      key: string,
      detail: AplicarDescuentoProductoParams["detalle"]
    ) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return
      }

      event.preventDefault()
      seleccionarProducto(key, detail)
    },
    [seleccionarProducto]
  )

  const handleTipoDescuentoChange = useCallback(
    (value: string) => {
      setTipoDescuento(value as TipoDescuento)
      setDescuentoInput("")
    },
    []
  )

  const validarDescuento = useCallback(
    (
      valor: string,
      tipo: TipoDescuento
    ): string | null => {
      let descuentoNormalizado = ""

      try {
        descuentoNormalizado = normalizarDescuentoInput(valor)
      } catch (error) {
        toast.warning(
          error instanceof Error
            ? error.message
            : "Ingrese un descuento numérico válido."
        )

        return null
      }

      if (!descuentoNormalizado) {
        return ""
      }

      const valorNumerico = Number(descuentoNormalizado)

      if (!Number.isFinite(valorNumerico) || valorNumerico < 0) {
        toast.warning("Ingrese un descuento válido.")
        return null
      }

      if (
        tipo === TipoDescuento.P &&
        valorNumerico > MAX_DESCUENTO_PORCENTUAL_UI
      ) {
        toast.warning(
          `El descuento porcentual debe estar entre 0 y ${MAX_DESCUENTO_PORCENTUAL_UI}.`
        )

        return null
      }

      return descuentoNormalizado
    },
    []
  )

  /**
   * Aplica el descuento desde un único control:
   *
   * - Con producto seleccionado: descuento individual.
   * - Sin producto seleccionado: descuento global.
   */
  const handleDiscountBlur = useCallback(
    async (event: FocusEvent<HTMLInputElement>) => {
      if (!aplicaDescuento || descuentoLockRef.current) return

      const input = event.currentTarget
      const nextTarget = event.relatedTarget as HTMLElement | null

      /*
       * No aplicar cuando el usuario está cambiando
       * el tipo de descuento.
       */
      if (nextTarget?.id === "tipoDescuento") {
        return
      }

      /*
       * No aplicar al producto anterior cuando el usuario
       * está seleccionando otra fila.
       */
      if (nextTarget?.dataset.discountProductKey !== undefined) {
        return
      }

      const descuentoNormalizado = validarDescuento(
        descuentoInput,
        tipoDescuento
      )

      if (descuentoNormalizado === null) {
        input.focus()
        return
      }

      setDescuentoInput(descuentoNormalizado)

      if (!descuentoNormalizado) return

      descuentoLockRef.current = true
      setAplicandoDescuento(true)

      try {
        const aplicado = productoSeleccionado
          ? await aplicarDescuentoProducto({
              detalle: productoSeleccionado.detail,
              descuento: descuentoNormalizado,
              tipo: tipoDescuento,
            })
          : await aplicarDescuentoGlobal({
              descuento: descuentoNormalizado,
              tipo: tipoDescuento,
            })

        if (!aplicado) {
          input.focus()
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : productoSeleccionado
              ? "No se pudo aplicar el descuento al producto."
              : "No se pudo aplicar el descuento global."
        )

        input.focus()
      } finally {
        descuentoLockRef.current = false
        setAplicandoDescuento(false)
      }
    },
    [
      aplicaDescuento,
      aplicarDescuentoGlobal,
      aplicarDescuentoProducto,
      descuentoInput,
      productoSeleccionado,
      tipoDescuento,
      validarDescuento,
    ]
  )

  const handleRemoveProduct = useCallback(
    (
      event: MouseEvent<HTMLButtonElement>,
      detail: CartDetailView["detail"]
    ) => {
      event.stopPropagation()

      const productoEliminadoKey = productoSeleccionado?.key

      void handleRemoveItem(
        cartUserId,
        detail.noPedido,
        String(companySistema).trim().toUpperCase() === "P"
          ? String(detail.codProducto ?? "")
          : "",
        String(detail.unico ?? "")
      ).then(() => {
        /*
         * Limpia la selección si se eliminó
         * el producto que estaba seleccionado.
         */
        if (
          productoEliminadoKey &&
          productoEliminadoKey === productoSeleccionado?.key
        ) {
          setProductoSeleccionado(null)
          setDescuentoInput("")
        }
      })
    },
    [
      cartUserId,
      companySistema,
      handleRemoveItem,
      productoSeleccionado,
    ]
  )

  return (
    <div className="carPCPanel-stepContent">
      <div className="searchInputWithClear">
        <Input
          id="searchProduct"
          name="searchProduct"
          value={search}
          placeholder="Buscar categoría o producto"
          onChange={(event) => setSearch(event.target.value)}
        />

        {search.trim() && (
          <button
            type="button"
            className="searchInputWithClear__button"
            onClick={() => setSearch("")}
            aria-label="Limpiar búsqueda"
            title="Limpiar búsqueda"
          >
            <MdClear fontSize={20} />
          </button>
        )}
      </div>

      <div className="carPCPanel-products">
        {filteredDetails.map(({ detail }, index) => {
          const itemKey = crearClaveLinea(detail, index)

          if (detail.tipoComponente === "P") {
            const productoKey = crearClaveProducto(detail, index)

            const permiteDescuento = detail.permiteDescuento === "S"

            const puedeSeleccionarDescuento =
              aplicaDescuento && permiteDescuento

            const estaSeleccionado =
              puedeSeleccionarDescuento &&
              productoSeleccionado?.key === productoKey

            const porcentajeActual = obtenerPorcentajeActual(detail)
            const montoActual = obtenerMontoActual(detail)

            const tieneDescuentoActual =
              Boolean(porcentajeActual) || montoActual > 0

            const className = [
              "carPCPanel-content__list",
              puedeSeleccionarDescuento
                ? "carPCPanel-content__list--selectable"
                : aplicaDescuento
                  ? "carPCPanel-content__list--discountDisabled"
                  : "",
              estaSeleccionado
                ? "carPCPanel-content__list--selected"
                : "",
            ]
              .filter(Boolean)
              .join(" ")

            return (
              <div
                key={itemKey}
                className={className}
                role={puedeSeleccionarDescuento ? "button" : undefined}
                tabIndex={
                  puedeSeleccionarDescuento && !aplicandoDescuento
                    ? 0
                    : -1
                }
                data-discount-product-key={
                  puedeSeleccionarDescuento ? productoKey : undefined
                }
                aria-pressed={
                  puedeSeleccionarDescuento
                    ? estaSeleccionado
                    : undefined
                }
                aria-disabled={
                  aplicaDescuento
                    ? !puedeSeleccionarDescuento || aplicandoDescuento
                    : undefined
                }
                onClick={() => {
                  if (!puedeSeleccionarDescuento) return

                  seleccionarProducto(productoKey, detail)
                }}
                onKeyDown={(event) => {
                  if (!puedeSeleccionarDescuento) return

                  handleProductKeyDown(event, productoKey, detail)
                }}
              >
                <div className="carPCPanel-content__list-imgContainer">
                  <img
                    src={detail.imagen || vacio}
                    alt={detail.descripcion || "Imagen del producto"}
                    className="carPCPanel-content__list-image"
                  />

                  <p className="carPCPanel-content__list-flootingQuantity">
                    {detail.cantidad}
                  </p>
                </div>

                <div className="carPCPanel-content__list-info">
                  <div className="carPCPanel-content__list-header">
                    <p className="carPCPanel-content__list-text">
                      {detail.descripcion}
                    </p>

                    {estaSeleccionado && (
                      <span className="carPCPanel-content__selectedIndicator">
                        <MdCheckCircle size={16} />
                        Seleccionado
                      </span>
                    )}
                  </div>

                  <p className="carPCPanel-content__list-price">
                    {safeNumber(detail.precioV, 0) > 0
                      ? `C$ ${formatearDecimales(detail.precioV)}`
                      : ""}
                  </p>

                  {aplicaDescuento && (
                    <div className="carPCPanel-content__discountStatus">
                      {!permiteDescuento && (
                        <span className="carPCPanel-content__discountStatus--disabled">
                          No permite descuento individual
                        </span>
                      )}

                      {tieneDescuentoActual ? (
                        <>
                          {porcentajeActual && (
                            <span>
                              Descuento aplicado:{" "}
                              {formatearPorcentaje(porcentajeActual)}%
                            </span>
                          )}

                          {montoActual > 0 && (
                            <span>
                              Monto descontado: C${" "}
                              {formatearDecimales(montoActual)}
                            </span>
                          )}
                        </>
                      ) : (
                        permiteDescuento && (
                          <span>Sin descuento aplicado</span>
                        )
                      )}
                    </div>
                  )}
                </div>

                <Tooltip title="Eliminar producto">
                  <span>
                    <button
                      type="button"
                      className="carPCPanel-content__removeIcon"
                      aria-label={`Eliminar ${
                        detail.descripcion || "producto"
                      }`}
                      disabled={aplicandoDescuento}
                      onClick={(event) =>
                        handleRemoveProduct(event, detail)
                      }
                    >
                      <MdDelete fontSize={24} />
                    </button>
                  </span>
                </Tooltip>
              </div>
            )
          }

          if (detail.tipoComponente === "O") {
            return (
              <div
                key={itemKey}
                className="carPCPanel-content__list__opcion"
              >
                <div className="carPCPanel-content__list-info-opcion">
                  <p className="carPCPanel-content__list-opcion">
                    {detail.descripcion}
                  </p>

                  <p className="carPCPanel-content__list-price">
                    {safeNumber(detail.precioV, 0) > 0
                      ? `C$ ${formatearDecimales(detail.precioV)}`
                      : ""}
                  </p>
                </div>

                <div className="carPCPanel-content__list-imgContainer">
                  <p className="carPCPanel-content__list-flootingQuantity-opcion">
                    {detail.cantidad}
                  </p>
                </div>
              </div>
            )
          }

          return null
        })}
      </div>

      {aplicaDescuento && (
        <div
          className={[
            "carPCPanel-stepContent__descuento",
            productoSeleccionado
              ? "carPCPanel-stepContent__descuento--product"
              : "carPCPanel-stepContent__descuento--global",
          ].join(" ")}
        >
          <div className="carPCPanel-stepContent__descuentoHeader">
            <div className="carPCPanel-stepContent__descuentoText">
              <GiPriceTag size={18} />

              <span>
                {productoSeleccionado
                  ? "Descuento del producto"
                  : "Descuento global"}
              </span>
            </div>

            {productoSeleccionado && (
              <button
                type="button"
                className="carPCPanel-stepContent__clearSelection"
                disabled={aplicandoDescuento}
                onClick={() => {
                  setProductoSeleccionado(null)
                  setDescuentoInput("")
                }}
              >
                <MdClear size={17} />
                Quitar selección
              </button>
            )}
          </div>

          {productoSeleccionado && (
            <p className="carPCPanel-stepContent__selectedProduct">
              {productoSeleccionado.detail.descripcion ||
                productoSeleccionado.detail.codProducto}
            </p>
          )}

          <div className="carPCPanel-stepContent__descuentoControls">
            <select
              id="tipoDescuento"
              className="checkout-input"
              value={tipoDescuento}
              disabled={aplicandoDescuento}
              aria-label="Tipo de descuento"
              onChange={(event) =>
                handleTipoDescuentoChange(event.target.value)
              }
            >
              <option value={TipoDescuento.P}>
                Porcentual (%)
              </option>

              <option value={TipoDescuento.A}>
                Monto absoluto (C$)
              </option>
            </select>

            <Input
              type="text"
              inputMode="decimal"
              id="descuentoInput"
              name="descuento"
              value={descuentoInput}
              className="carPCPanel-stepContent__descuentoButton"
              aria-label={
                productoSeleccionado
                  ? "Descuento del producto seleccionado"
                  : "Descuento global"
              }
              placeholder={
                tipoDescuento === TipoDescuento.P
                  ? "Ejemplo: 50.25"
                  : "Ejemplo: 150.75"
              }
              disabled={aplicandoDescuento}
              onChange={(event) =>
                setDescuentoInput(event.target.value)
              }
              onBlur={(event) => {
                void handleDiscountBlur(event)
              }}
            />
          </div>

          <small className="carPCPanel-stepContent__descuentoHelp">
            {aplicandoDescuento
              ? productoSeleccionado
                ? "Aplicando descuento al producto..."
                : "Aplicando descuento global..."
              : tipoDescuento === TipoDescuento.P
                ? `Ingrese un porcentaje entre 0 y ${MAX_DESCUENTO_PORCENTUAL_UI}.`
                : "Ingrese el monto exacto que desea descontar."}
          </small>
        </div>
      )}
    </div>
  )
}