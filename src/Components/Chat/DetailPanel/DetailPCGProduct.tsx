import { useEffect, useMemo, useState } from "react"
import { FaShoppingCart } from "react-icons/fa"
import { useProductPCG } from "@/Hooks/useProductPCG"
import type {
  listaOpciones,
  ProductoModificadorPCGInterface,
  ProductoPCGInterface
} from "@/Interfaces/Chat/ProductPCGInterface"
import type { CarDto, ListDetalleCarrito } from "@/Interfaces/Crm/CartPCGInterface"
import "@/Styles/Chat/DetailPanel/DetailProduct.css"
import noimageavailable from "@/assets/noimageavailable.webp"
import {
  addProductToCarAsync,
  selectCartLoading
} from "@/Context/Slices/Cart/cartSlice"
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux"
import type { RootState, AppDispatch } from "@/Context"
import useLogCart from "@/Hooks/Crm/useLogCard"
import type { LogCartRequestDto } from "@/Interfaces/Crm/LogCartInterface"
import { toast } from "react-toastify"

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

interface Props {
  detail: ProductoPCGInterface
  contactId: number
  conversationId: number
  setDetailProduct: (detailP: ProductoPCGInterface | null) => void
  setselectedCategory: (category: string | null) => void
}

const DetailPCGProduct = ({
  detail,
  contactId,
  conversationId,
  setDetailProduct,
  setselectedCategory
}: Props) => {
  const [cantidad, setCantidad] = useState<number>(1)
  const [total, setTotal] = useState<number>(0)
  const [observacion, setObservacion] = useState<string>("")
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({})
  const [optionQuantities, setOptionQuantities] = useState<Record<string, number>>({})
  const { productModifiers, getProductModifiers } = useProductPCG()
  const dispatch = useAppDispatch()
  const loading = useAppSelector(selectCartLoading)
  const { create: createLogCart, fetchByContactId } = useLogCart()

  useEffect(() => {
    if (!detail?.codProducto) return
    getProductModifiers(detail.codProducto)
  }, [detail?.codProducto, getProductModifiers])

  useEffect(() => {
    if (!productModifiers || productModifiers.length === 0) {
      setSelectedOptions({})
      setOptionQuantities({})
      return
    }

    const initialSelected: Record<string, string[]> = {}
    const initialQuantities: Record<string, number> = {}

    productModifiers.forEach((mod: ProductoModificadorPCGInterface) => {
      const key = String(mod.codModificador)
      const defaults = mod.listOpciones
        .filter((op: listaOpciones) => op.esOpcionDefecto === "S")
        .map((op: listaOpciones) => op.codOpcion)

      if (defaults.length > 0) {
        const maxSel = Number(mod.maximoSel ?? 0)
        const limited = maxSel > 0 ? defaults.slice(0, maxSel) : defaults
        initialSelected[key] = limited

        limited.forEach(cod => {
          const op = mod.listOpciones.find(o => o.codOpcion === cod)
          const maxPerItem = op?.cantidad ?? 1
          const base = 1
          initialQuantities[cod] = base > maxPerItem ? maxPerItem : base
        })
      }
    })

    setSelectedOptions(initialSelected)
    setOptionQuantities(initialQuantities)
  }, [productModifiers])

  const optionIndex = useMemo(() => {
    const map = new Map<
      string,
      {
        codOpcion: string
        descripcionOp: string
        codPrecio: number | string
        precioVenta: number
        cantidad: number
        totalMenu: number
        codUm: string
        codTipoModificador?: string
        codModificador?: string
      }
    >()
    if (productModifiers) {
      productModifiers.forEach((mod: ProductoModificadorPCGInterface) => {
        mod.listOpciones.forEach((op: listaOpciones) => {
          map.set(op.codOpcion, {
            codOpcion: op.codOpcion,
            descripcionOp: op.descripcionOp,
            codPrecio: op.codPrecio,
            precioVenta: Number(op.precioVenta),
            cantidad: op.cantidad,
            totalMenu: op.precioVenta * op.cantidad,
            codUm: op.codUm,
            codTipoModificador: mod.codTipoModificador,
            codModificador: mod.codModificador
          })
        })
      })
    }
    return map
  }, [productModifiers])

  useEffect(() => {
    if (!productModifiers || productModifiers.length === 0) return

    setOptionQuantities(prev => {
      const updated = { ...prev }

      productModifiers.forEach((mod: ProductoModificadorPCGInterface) => {
        const key = String(mod.codModificador)
        const selectedForMod = selectedOptions[key] ?? []

        mod.listOpciones.forEach((op: listaOpciones) => {
          const id = op.codOpcion
          if (!selectedForMod.includes(id)) return

          const maxPerItem = op.cantidad ?? 1
          const minPerItem = 1
          const current = updated[id]

          let next = current ?? minPerItem
          if (next < minPerItem) next = minPerItem
          if (next > maxPerItem) next = maxPerItem
          updated[id] = next
        })
      })

      return updated
    })
  }, [productModifiers, selectedOptions])

  useEffect(() => {
    let optionsTotal = 0
    Object.values(selectedOptions).forEach(optionIds => {
      optionIds.forEach(id => {
        const option = optionIndex.get(id)
        if (option) {
          const qtyPerItem = optionQuantities[id] ?? 1
          optionsTotal += qtyPerItem * cantidad * Number(option.precioVenta)
        }
      })
    })
    const basePrice = cantidad * Number(detail.precio ?? 0)
    setTotal(basePrice + optionsTotal)
  }, [cantidad, selectedOptions, optionQuantities, optionIndex, detail])

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    if (Number.isNaN(value) || value <= 0) {
      setCantidad(1)
    } else {
      setCantidad(value)
    }
  }

  const handleToggleOption = (modifier: ProductoModificadorPCGInterface, codOpcion: string) => {
    setSelectedOptions(prev => {
      const key = String(modifier.codModificador)
      const current = prev[key] ?? []
      let nextForModifier: string[] = []

      const maxSel = Number(modifier.maximoSel ?? 0)

      if (modifier.esMultipleSeleccion) {
        if (current.includes(codOpcion)) {
          nextForModifier = current.filter(id => id !== codOpcion)

          setOptionQuantities(prevQty => {
            const rest = { ...prevQty }
            delete rest[codOpcion]
            return rest
          })
        } else {
          const op = modifier.listOpciones.find(o => o.codOpcion === codOpcion)
          const maxPerItem = op?.cantidad ?? 1
          const base = 1
          const initialQty = Math.min(base, maxPerItem)

          const currentTotal = current.reduce(
            (sum, id) => sum + (optionQuantities[id] ?? 1),
            0
          )

          if (maxSel > 0 && currentTotal + initialQty > maxSel) {
            toast.warning(
              `No puede seleccionar más de ${maxSel} en "${modifier.descripcionMod}".`
            )
            return prev
          }

          nextForModifier = [...current, codOpcion]

          setOptionQuantities(prevQty => ({
            ...prevQty,
            [codOpcion]: prevQty[codOpcion] ?? initialQty
          }))
        }
      } else {
        if (current.includes(codOpcion)) {
          nextForModifier = []
          setOptionQuantities(prevQty => {
            const rest = { ...prevQty }
            delete rest[codOpcion]
            return rest
          })
        } else {
          const op = modifier.listOpciones.find(o => o.codOpcion === codOpcion)
          const maxPerItem = op?.cantidad ?? 1
          const base = 1
          const initialQty = Math.min(base, maxPerItem)

          nextForModifier = [codOpcion]

          setOptionQuantities(prevQty => ({
            ...prevQty,
            [codOpcion]: prevQty[codOpcion] ?? initialQty
          }))
        }
      }

      return { ...prev, [key]: nextForModifier }
    })
  }

  const isOptionSelected = (modifier: ProductoModificadorPCGInterface, codOpcion: string) => {
    const key = String(modifier.codModificador)
    const current = selectedOptions[key] ?? []
    return current.includes(codOpcion)
  }

  const handleOptionQuantityChange = (
    modifier: ProductoModificadorPCGInterface,
    codOpcion: string,
    value: number
  ) => {
    if (Number.isNaN(value)) return

    let safe = value < 1 ? 1 : value

    const option = optionIndex.get(codOpcion)
    const maxPerItem = option?.cantidad ?? Number.MAX_SAFE_INTEGER
    if (safe > maxPerItem) safe = maxPerItem

    const key = String(modifier.codModificador)
    const selectedForMod = selectedOptions[key] ?? []

    if (!selectedForMod.includes(codOpcion)) return

    const maxSel = Number(modifier.maximoSel ?? 0)

    if (maxSel > 0) {
      const totalOther = selectedForMod
        .filter(id => id !== codOpcion)
        .reduce((sum, id) => sum + (optionQuantities[id] ?? 1), 0)

      const remaining = maxSel - totalOther

      if (remaining <= 0) {
        toast.warning(
          `Ya alcanzó el máximo de ${maxSel} para "${modifier.descripcionMod}".`
        )
        return
      }

      if (safe > remaining) {
        safe = remaining
        toast.warning(
          `Solo puede asignar hasta ${remaining} a esta opción para no superar ${maxSel} en "${modifier.descripcionMod}".`
        )
      }
    }

    setOptionQuantities(prev => ({
      ...prev,
      [codOpcion]: safe
    }))
  }

  const buildCartRequest = (): CarDto => {
    const items: ListDetalleCarrito[] = []
    const basePrice = Number(detail.precio ?? 0)
    const baseTotal = basePrice * cantidad

    const baseItem: ListDetalleCarrito = {
      tipoComponente: "P",
      indice: 1,
      codTipoModificador: "0000",
      codModificador: "00000",
      codGrupo: detail.codCategoria,
      codProducto: detail.codProducto,
      codOpcion: "00000",
      descripcion: detail.descripcion,
      cantidad,
      precioV: basePrice,
      totalMenu: baseTotal,
      codUm: detail.codUm,
      observaciones: observacion,
      unico: "",
      noPedido: 0,
      imagen: detail.imagen
    }

    items.push(baseItem)

    let index = 2
    Object.entries(selectedOptions).forEach(([modifierId, optionIds]) => {
      optionIds.forEach(id => {
        const option = optionIndex.get(id)
        if (!option) return

        const precioV = Number(option.precioVenta)
        const qtyPerItem = optionQuantities[id] ?? 1
        const qtyTotal = qtyPerItem * cantidad
        const totalMenu = precioV * qtyTotal

        const optionItem: ListDetalleCarrito = {
          tipoComponente: "O",
          indice: index++,
          codTipoModificador: option.codTipoModificador ?? "0000",
          codModificador: option.codModificador ?? modifierId,
          codGrupo: detail.codCategoria,
          codProducto: detail.codProducto,
          codOpcion: option.codOpcion,
          descripcion: option.descripcionOp,
          cantidad: qtyTotal,
          precioV,
          totalMenu,
          codUm: option.codUm,
          observaciones: observacion,
          unico: "",
          noPedido: 0,
          imagen: detail.imagen
        }

        items.push(optionItem)
      })
    })

    const totalCarrito = items.reduce((sum, item) => sum + item.totalMenu, 0)

    const carDto: CarDto = {
      tipoServicio: 8,
      noPedido: 0,
      fecha: new Date().toISOString(),
      total: totalCarrito,
      listDetalle: items
    }

    return carDto
  }

  const handleAddToCart = async () => {
    if (cantidad <= 0) {
      toast.warning("La cantidad debe ser al menos 1.")
      return
    }

    if (productModifiers && productModifiers.length > 0) {
      let firstError: string | null = null

      for (const mod of productModifiers) {
        if (mod.esRequerido !== "S") continue

        const key = String(mod.codModificador)
        const sel = selectedOptions[key] ?? []

        if (!mod.esMultipleSeleccion) {
          if (sel.length !== 1) {
            firstError = `Seleccione una opción en "${mod.descripcionMod}".`
            break
          }
        } else {
          if (sel.length === 0) {
            firstError = `Seleccione al menos una opción en "${mod.descripcionMod}".`
            break
          }
        }
      }

      if (firstError) {
        toast.warning(firstError)
        return
      }
    }

    const req = buildCartRequest()
    const existingLog = await fetchByContactId(contactId)

    if (existingLog) {
      // req.idUsuario = existingLog.orderId
      req.noPedido = existingLog.orderId
      await dispatch(addProductToCarAsync(req)).unwrap()
    } else {
      const cartCreated = await dispatch(addProductToCarAsync(req)).unwrap()
      const first = Array.isArray(cartCreated) ? cartCreated[0] : cartCreated
      const orderId = first?.noPedido

      const logOrderRequest: LogCartRequestDto = {
        orderId,
        contactId,
        conversationId,
        statusId: 1
      }

      await createLogCart(logOrderRequest)
    }

    setCantidad(1)
    setselectedCategory(null)
    setDetailProduct(null)
  }

  return (
    <div className="detail-product__container">
      <section className="detail-product__section">
        <div className="detail-product__image">
          <img
            src={detail.imagen != null ? detail.imagen : noimageavailable}
            aria-label="product-image"
            className="detail-image"
          />
        </div>

        <div className="detail-product__content">
          <div className="detail-content__text">
            <p className="detail-product__descriptions">{detail.descripcion}</p>
            <p className="detail-product__price">C$ {detail.precio}</p>
          </div>
          <p className="detail-product__content">{detail.contenido}</p>
        </div>

        {productModifiers != null && productModifiers.length > 0 && (
          <div className="product-modifiers">
            <header className="product-modifiers__content">
              {productModifiers.map((mod: ProductoModificadorPCGInterface, index: number) => (
                <div className="product-modifiers__product" key={index}>
                  <p className="product-modifiers__product__title">{mod.descripcionMod}</p>
                  <div className="product-modifiers__option__container">
                    {mod.listOpciones.map((op: listaOpciones, idx: number) => {
                      const selected = isOptionSelected(mod, op.codOpcion)
                      const currentQty = optionQuantities[op.codOpcion] ?? 1

                      return (
                        <div className="product-modifiers__options" key={idx}>
                          <input
                            type="checkbox"
                            className="product-modifiers__checkout"
                            id={String(op.codOpcion)}
                            checked={selected}
                            onChange={() => handleToggleOption(mod, op.codOpcion)}
                          />
                          <label
                            htmlFor={String(op.codOpcion)}
                            className="product-modifiers__option"
                          >
                            {op.descripcionOp}
                            {Number(op.precioVenta) > 0 && (
                              <span className="product-modifiers__option__price">
                                C$ {Number(op.precioVenta).toFixed(2)}
                              </span>
                            )}
                          </label>
                          {selected && (
                            <input
                              type="number"
                              className="product-modifiers__option__qty"
                              min={1}
                              value={currentQty}
                              onChange={e =>
                                handleOptionQuantityChange(
                                  mod,
                                  op.codOpcion,
                                  Number(e.target.value)
                                )
                              }
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </header>
          </div>
        )}
      </section>

      <div className="detailPanel-description__container">
        <textarea
          className="detailPanel-description__textarea"
          name="descripcion"
          id="descripcion"
          rows={5}
          placeholder="Ingrese descripción de item"
          value={observacion}
          onChange={e => setObservacion(e.target.value)}
        />
      </div>

      <footer className="detail-product__actions">
        <input
          type="number"
          className="detail-product__inputNumber"
          min={1}
          max={10}
          value={cantidad}
          onChange={handleQuantityChange}
        />
        <button
          type="button"
          className="productTab-buyButton"
          onClick={handleAddToCart}
          disabled={loading || cantidad <= 0}
        >
          {loading ? (
            <p className="button-text">Cargando</p>
          ) : (
            <>
              <span className="button-text">Agregar</span>
              <FaShoppingCart fontSize={16} />
            </>
          )}
        </button>
        {total > 0 && (
          <p className="productDetail-total">
            Total:
            <span className="productDetail-total__value">C$ {total.toFixed(2)}</span>
          </p>
        )}
      </footer>
    </div>
  )
}

export default DetailPCGProduct