import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react"
import { TextField, Tooltip } from "@mui/material"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import { MdCheckCircle, MdClear, MdDelete } from "react-icons/md"
import { FaUserLock } from "react-icons/fa"
import { GiPriceTag } from "react-icons/gi"

import Input from "@/Services/Components/Common/Input"
import vacio from "@/assets/vacio.png"
import { selectAplicaDescuento, selectAplicaDescuentoUsuario, selectUserId } from "@/Context/Slices/Auth/authSlice"
import { authService } from "@/Services/auth/AuthService"

import { formatearDecimales } from "@/Utils/calcularIVA"
import { safeNumber } from "@/Utils/ECommerce/utils"
import { normalizarDescuentoInput } from "@/Utils/ECommerce/descuentoGlobal"

import {
  TipoDescuento,
  type AplicarDescuentoGlobalParams,
  type AplicarDescuentoProductoParams,
} from "@/Interfaces/Crm/CartPCGInterface"

import type { CartDetailView } from "@/Interfaces/Crm/LogCartInterface"

/**
 * Porcentaje máximo visible permitido.
 *
 * Ejemplos:
 * 50    -> 50%
 * 50.25 -> 50.25%
 * 100   -> 100%
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
  const aplicaDescuentoUsuario = useSelector(selectAplicaDescuentoUsuario)
  const puedeSolicitarDescuento = aplicaDescuento && aplicaDescuentoUsuario
  const userId = useSelector(selectUserId)
  const [descuentoAutorizado, setDescuentoAutorizado] = useState(false)
  const [mostrarCapturaClave, setMostrarCapturaClave] = useState(false)
  const [claveDescuento, setClaveDescuento] = useState("")
  const [validandoClave, setValidandoClave] = useState(false)

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
   * Limpia cualquier estado de descuento cuando la empresa
   * tiene deshabilitada esta funcionalidad.
   */
  useEffect(() => {
    setDescuentoAutorizado(false)
    setMostrarCapturaClave(false)
    setClaveDescuento("")
    if (puedeSolicitarDescuento) return

    descuentoLockRef.current = false
    setProductoSeleccionado(null)
    setDescuentoInput("")
    setAplicandoDescuento(false)
  }, [puedeSolicitarDescuento, userId])

  const confirmarClaveDescuento = useCallback(async () => {
    if (!claveDescuento || validandoClave) return
    setValidandoClave(true)
    try {
      const response = await authService.confirmPasswordAsync(claveDescuento)
      if (!response.success || !response.data) {
        toast.error(response.message || "La contraseña no es válida.")
        return
      }
      setDescuentoAutorizado(true)
      setMostrarCapturaClave(false)
      setClaveDescuento("")
      toast.success("Clave confirmada para una aplicación de descuento.")
    } catch {
      toast.error("No se pudo validar la contraseña.")
    } finally {
      setValidandoClave(false)
    }
  }, [claveDescuento, validandoClave])

  const seleccionarProducto = useCallback(
    (
      key: string,
      detail: AplicarDescuentoProductoParams["detalle"]
    ) => {
      if (!puedeSolicitarDescuento || !descuentoAutorizado || aplicandoDescuento) return

      if (detail.permiteDescuento !== "S") {
        toast.info("Este producto no permite descuento.")
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
    [puedeSolicitarDescuento, descuentoAutorizado, aplicandoDescuento]
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
        descuentoNormalizado =
          normalizarDescuentoInput(valor)
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

      if (
        !Number.isFinite(valorNumerico) ||
        valorNumerico < 0
      ) {
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

      /*
       * No se usa toFixed, Math.round, parseInt
       * ni ninguna transformación que recorte decimales.
       */
      return descuentoNormalizado
    },
    []
  )

  /**
   * Aplica el descuento desde un único control:
   *
   * - Con producto seleccionado: descuento por producto.
   * - Sin producto seleccionado: descuento global.
   */
  const handleDiscountBlur = useCallback(
    async (event: FocusEvent<HTMLInputElement>) => {
      if (!puedeSolicitarDescuento || !descuentoAutorizado || descuentoLockRef.current) return

      const input = event.currentTarget
      const nextTarget =
        event.relatedTarget as HTMLElement | null

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
      if (
        nextTarget?.dataset.discountProductKey !== undefined
      ) {
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
        setDescuentoAutorizado(false)
        setDescuentoInput("")
      }
    },
    [
      puedeSolicitarDescuento,
      descuentoAutorizado,
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

      const productoEliminadoKey =
        productoSeleccionado?.key

      void handleRemoveItem(
        cartUserId,
        detail.noPedido,
        String(companySistema)
          .trim()
          .toUpperCase() === "P"
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
          onChange={(event) =>
            setSearch(event.target.value)
          }
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
          const itemKey = crearClaveLinea(
            detail,
            index
          )

          if (detail.tipoComponente === "P") {
            const productoKey = crearClaveProducto(
              detail,
              index
            )

            const permiteDescuento =
              puedeSolicitarDescuento &&
              descuentoAutorizado &&
              detail.permiteDescuento === "S"

            const estaSeleccionado =
              puedeSolicitarDescuento &&
              descuentoAutorizado &&
              productoSeleccionado?.key === productoKey

            const porcentajeActual =
              obtenerPorcentajeActual(detail)

            const montoActual =
              obtenerMontoActual(detail)

            const tieneDescuentoActual =
              Boolean(porcentajeActual) ||
              montoActual > 0

            const className = [
              "carPCPanel-content__list",
              puedeSolicitarDescuento && descuentoAutorizado
                ? permiteDescuento
                  ? "carPCPanel-content__list--selectable"
                  : "carPCPanel-content__list--discountDisabled"
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
                role={
                  permiteDescuento
                    ? "button"
                    : undefined
                }
                tabIndex={
                  permiteDescuento && !aplicandoDescuento
                    ? 0
                    : -1
                }
                data-discount-product-key={
                  permiteDescuento
                    ? productoKey
                    : undefined
                }
                aria-pressed={
                  permiteDescuento
                    ? estaSeleccionado
                    : undefined
                }
                aria-disabled={
                  puedeSolicitarDescuento
                    ? !permiteDescuento ||
                      aplicandoDescuento
                    : undefined
                }
                onClick={
                  permiteDescuento
                    ? () =>
                        seleccionarProducto(
                          productoKey,
                          detail
                        )
                    : undefined
                }
                onKeyDown={
                  permiteDescuento
                    ? (event) =>
                        handleProductKeyDown(
                          event,
                          productoKey,
                          detail
                        )
                    : undefined
                }
              >
                <div className="carPCPanel-content__list-imgContainer">
                  <img
                    src={detail.imagen || vacio}
                    alt={
                      detail.descripcion ||
                      "Imagen del producto"
                    }
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
                      ? `C$ ${formatearDecimales(
                          detail.precioV
                        )}`
                      : ""}
                  </p>

                  {aplicaDescuento && (
  <div className="carPCPanel-content__discountStatus">
    {tieneDescuentoActual ? (
      <>
        {porcentajeActual && (
          <span>
            Descuento: {porcentajeActual}%
          </span>
        )}

        {montoActual > 0 && (
          <span>
            Monto: C${" "}
            {formatearDecimales(montoActual)}
          </span>
        )}
      </>
    ) : !permiteDescuento ? (
      <span className="carPCPanel-content__discountStatus--disabled">
        No permite descuento individual
      </span>
    ) : (
      <span>Sin descuento aplicado</span>
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
                        detail.descripcion ||
                        "producto"
                      }`}
                      disabled={aplicandoDescuento}
                      onClick={(event) =>
                        handleRemoveProduct(
                          event,
                          detail
                        )
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
                      ? `C$ ${formatearDecimales(
                          detail.precioV
                        )}`
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

      {puedeSolicitarDescuento && !descuentoAutorizado && (
        <div className="carPCPanel-stepContent__descuento">
          {!mostrarCapturaClave ? (
            <button
              type="button"
              className="carPCPanel-stepContent__discountAuthorize"
              aria-label="Autorizar un descuento"
              onClick={() => setMostrarCapturaClave(true)}
            >
              <FaUserLock aria-hidden="true" />
              <span>Autorizar descuento</span>
            </button>
          ) : (
            <form
              className="carPCPanel-stepContent__discountAuth"
              onSubmit={(event) => {
                event.preventDefault()
                void confirmarClaveDescuento()
              }}
            >
              <div className="carPCPanel-stepContent__discountAuthHeading">
                <FaUserLock aria-hidden="true" />
                <div>
                  <strong>Autorizar descuento</strong>
                  <span>Ingresa tu contraseña para aplicar un descuento.</span>
                </div>
              </div>
              <TextField
                autoFocus
                fullWidth
                size="small"
                type="password"
                label="Contraseña del usuario"
                value={claveDescuento}
                autoComplete="current-password"
                onChange={(event) => setClaveDescuento(event.target.value)}
              />
              <div className="carPCPanel-stepContent__discountAuthActions">
                <button
                  type="button"
                  className="carPCPanel-stepContent__discountAuthCancel"
                  disabled={validandoClave}
                  onClick={() => {
                    setMostrarCapturaClave(false)
                    setClaveDescuento("")
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="carPCPanel-stepContent__discountAuthSubmit"
                  disabled={!claveDescuento || validandoClave}
                >
                  {validandoClave ? "Validando…" : "Confirmar clave"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {puedeSolicitarDescuento && descuentoAutorizado && (
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
                handleTipoDescuentoChange(
                  event.target.value
                )
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
