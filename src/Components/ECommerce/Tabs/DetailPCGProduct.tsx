/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FaShoppingCart } from "react-icons/fa"
import { IoMdSend } from "react-icons/io"
import { MdInventory } from "react-icons/md"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { MdOutlineArrowBackIos, MdOutlineArrowForwardIos } from "react-icons/md"
import { toast } from "react-toastify"

import Button from "@/Components/Common/Button"
import vacio from "@/assets/vacio.png"
import "@/Styles/Ecommerce/DetailProduct.css"

import type {
  listaOpciones,
  ProductoModificadorPCGInterface,
  ProductoPCGInterface,
} from "@/Interfaces/Chat/ProductPCGInterface"
import type { SelectedInterface } from "./ProductTab"

import { useProductPCG } from "@/Hooks/Ecommerce/tabs/useProductPCG"
import { useBranchesByProduct } from "@/Hooks/Ecommerce/tabs/useBranchesByProduct"
import { useCartPCGFlowCtx } from "@/Context/CartPCGFlowProvider"
import { useProductMessageComposer } from "@/Hooks/Ecommerce/tabs/useProductMessageComposer"
import type {
  AddProductParams,
  SelectedModifierOption,
} from "@/Hooks/Ecommerce/payment/useCartPCGFlow"

interface Props {
  detail: ProductoPCGInterface
  setDetailProduct: (detailP: ProductoPCGInterface | null) => void
  setselectedCategory: (category: SelectedInterface | null) => void
  currentIndex: number
  totalCount: number
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void
  onBack: () => void
}

type SelectedOptionsMap = Record<string, string[]>
type OptionQtyMap = Record<string, number>

const clampQty = (n: number) => {
  if (!Number.isFinite(n) || n <= 0) return 1
  if (n > 1000) return 1000
  return Math.floor(n)
}

const esSi = (value?: string | boolean | null) => {
  return value === true || value === "S"
}

const DetailPCGProduct = ({
  detail,
  setDetailProduct,
  setselectedCategory,
  currentIndex,
  totalCount,
  canPrev,
  canNext,
  onPrev,
  onNext,
  // onBack,
}: Props) => {

  const [cantidad, setCantidad] = useState(1)
  const [observacion, setObservacion] = useState("")
  const [total, setTotal] = useState(0)
  const [branchUiSelected, setBranchUiSelected] = useState<string | null>(null)
  const [branchNameUiSelected, setBranchNameUiSelected] = useState("")
  const [wherehouseUiSelected, setWherehouseUiSelected] = useState("")
  const [wherehouseCodeUiSelected, setWherehouseCodeUiSelected] = useState("")
  const [serieUiSelected, setSerieCodeUiSelected] = useState("")

  const [selectedOptions, setSelectedOptions] = useState<SelectedOptionsMap>({})
  const [optionQuantities, setOptionQuantities] = useState<OptionQtyMap>({})
  const [openImg, setOpenImg] = useState(false)

  const sendLockRef = useRef(false)
  const addLockRef = useRef(false)
  const bodyRef = useRef<HTMLElement | null>(null)

  const { conversationId, locked, addProduct } = useCartPCGFlowCtx()
  const { sending, sendProductMessage } = useProductMessageComposer()
  const { productModifiers, getProductModifiers } = useProductPCG()

  const { rows: branchRows, loading: loadingBranches } = useBranchesByProduct(
    detail.codProducto
  )

  const imageSrc = useMemo(() => detail.imagen || vacio, [detail.imagen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenImg(false)
    }

    if (openImg) window.addEventListener("keydown", onKey)

    return () => window.removeEventListener("keydown", onKey)
  }, [openImg])

  useEffect(() => {
    setCantidad(1)
    setObservacion("")
    setTotal(0)
    setSelectedOptions({})
    setOptionQuantities({})
    setBranchUiSelected(null)
    setBranchNameUiSelected("")
    setWherehouseUiSelected("")
    setWherehouseCodeUiSelected("")
    setSerieCodeUiSelected("")

    requestAnimationFrame(() => {
      bodyRef.current?.scrollTo({ top: 0 })
    })
  }, [detail.codProducto])

  useEffect(() => {
    if (!detail.tieneOpcion) {
      getProductModifiers("")
      setSelectedOptions({})
      setOptionQuantities({})
      return
    }

    getProductModifiers(detail.codProducto)
  }, [detail.codProducto, detail.tieneOpcion, getProductModifiers])

  useEffect(() => {
    if (!detail.tieneOpcion || !productModifiers?.length) {
      setSelectedOptions({})
      setOptionQuantities({})
      return
    }

    const initialSelected: SelectedOptionsMap = {}
    const initialQuantities: OptionQtyMap = {}

    productModifiers.forEach((mod) => {
      const key = String(mod.codModificador)
      const maxSel = Number(mod.maximoSel ?? 0)

      const defaults =
        mod.listOpciones
          ?.filter((op) => op.esOpcionDefecto === "S")
          .map((op) => String(op.codOpcion)) ?? []

      if (!defaults.length) return

      const limited = maxSel > 0 ? defaults.slice(0, maxSel) : defaults

      initialSelected[key] = limited

      limited.forEach((codOpcion) => {
        initialQuantities[codOpcion] = 1
      })
    })

    setSelectedOptions(initialSelected)
    setOptionQuantities(initialQuantities)
  }, [detail.tieneOpcion, productModifiers])

  useEffect(() => {
    if (locked) {
      setBranchUiSelected(locked.branch ?? null)
      setBranchNameUiSelected(locked.branchName ?? "")
      setWherehouseUiSelected(locked.wherehouse ?? "")
      setWherehouseCodeUiSelected((locked.wherehouseCode ?? "").trim())
      setSerieCodeUiSelected((locked.serie ?? "").trim())
      return
    }

    if (!branchRows.length) return

    const first = branchRows[0]

    setBranchUiSelected(first.codsucursal)
    setBranchNameUiSelected(first.sucursal ?? "")
    setWherehouseUiSelected(first.nombodega ?? "")
    setWherehouseCodeUiSelected((first.codbodega ?? "").trim())
    setSerieCodeUiSelected((first.serie ?? "").trim())
  }, [branchRows, locked])

  const optionIndex = useMemo(() => {
    const map = new Map<string, listaOpciones & { codModificador?: string }>()

    productModifiers?.forEach((mod) => {
      mod.listOpciones?.forEach((op) => {
        map.set(String(op.codOpcion), {
          ...op,
          codModificador: String(mod.codModificador),
        })
      })
    })

    return map
  }, [productModifiers])

  const getSelectedQtyByModifier = useCallback(
    (modifier: ProductoModificadorPCGInterface, exceptCodOpcion?: string) => {
      const key = String(modifier.codModificador)
      const selected = selectedOptions[key] ?? []

      return selected.reduce((sum, id) => {
        if (exceptCodOpcion && id === exceptCodOpcion) return sum
        return sum + clampQty(optionQuantities[id] ?? 1)
      }, 0)
    },
    [selectedOptions, optionQuantities]
  )

  const isOptionSelected = useCallback(
    (modifier: ProductoModificadorPCGInterface, codOpcion: string) => {
      const key = String(modifier.codModificador)
      return (selectedOptions[key] ?? []).includes(String(codOpcion))
    },
    [selectedOptions]
  )

  const handleToggleOption = useCallback(
    (modifier: ProductoModificadorPCGInterface, codOpcion: string) => {
      const key = String(modifier.codModificador)
      const optionId = String(codOpcion)
      const maxSel = Number(modifier.maximoSel ?? 0)
      const multiple = esSi(modifier.esMultipleSeleccion)

      setSelectedOptions((prev) => {
        const current = prev[key] ?? []
        const alreadySelected = current.includes(optionId)

        if (alreadySelected) {
          setOptionQuantities((prevQty) => {
            const nextQty = { ...prevQty }
            delete nextQty[optionId]
            return nextQty
          })

          return {
            ...prev,
            [key]: current.filter((id) => id !== optionId),
          }
        }

        if (!multiple) {
          setOptionQuantities((prevQty) => {
            const nextQty = { ...prevQty }

            current.forEach((id) => {
              delete nextQty[id]
            })

            nextQty[optionId] = 1

            return nextQty
          })

          return {
            ...prev,
            [key]: [optionId],
          }
        }

        const currentTotal = current.reduce((sum, id) => {
          return sum + clampQty(optionQuantities[id] ?? 1)
        }, 0)

        if (maxSel > 0 && currentTotal + 1 > maxSel) {
          toast.warning(
            `No puede seleccionar más de ${maxSel} en "${modifier.descripcionMod}".`
          )
          return prev
        }

        setOptionQuantities((prevQty) => ({
          ...prevQty,
          [optionId]: prevQty[optionId] ?? 1,
        }))

        return {
          ...prev,
          [key]: [...current, optionId],
        }
      })
    },
    [optionQuantities]
  )

  const handleOptionQuantityChange = useCallback(
    (
      modifier: ProductoModificadorPCGInterface,
      codOpcion: string,
      value: number
    ) => {
      const optionId = String(codOpcion)

      if (Number.isNaN(value)) return

      const key = String(modifier.codModificador)
      const selected = selectedOptions[key] ?? []

      if (!selected.includes(optionId)) return

      const maxSel = Number(modifier.maximoSel ?? 0)
      const otherTotal = getSelectedQtyByModifier(modifier, optionId)

      let safe = clampQty(value)

      if (maxSel > 0) {
        const remaining = maxSel - otherTotal

        if (remaining <= 0) {
          toast.warning(
            `Ya alcanzó el máximo de ${maxSel} en "${modifier.descripcionMod}".`
          )
          return
        }

        if (safe > remaining) {
          safe = remaining
          toast.warning(`Solo puede asignar hasta ${remaining} a esta opción.`)
        }
      }

      setOptionQuantities((prev) => ({
        ...prev,
        [optionId]: safe,
      }))
    },
    [selectedOptions, getSelectedQtyByModifier]
  )

  useEffect(() => {
    const base = clampQty(cantidad) * Number(detail.precio ?? 0)

    let optionsTotal = 0

    Object.entries(selectedOptions).forEach(([, ids]) => {
      ids.forEach((id) => {
        const op = optionIndex.get(String(id))
        const qty = clampQty(optionQuantities[String(id)] ?? 1)

        if (op) {
          optionsTotal += qty * clampQty(cantidad) * Number(op.precioVenta ?? 0)
        }
      })
    })

    setTotal(base + optionsTotal)
  }, [cantidad, selectedOptions, optionQuantities, optionIndex, detail.precio])

  const validateRequiredModifiers = useCallback(() => {
    if (!detail.tieneOpcion) return true
    if (!productModifiers?.length) return true

    for (const mod of productModifiers) {
      const key = String(mod.codModificador)
      const selected = selectedOptions[key] ?? []
      const maxSel = Number(mod.maximoSel ?? 0)

      const totalQty = selected.reduce((sum, id) => {
        return sum + clampQty(optionQuantities[id] ?? 1)
      }, 0)

      if (mod.esRequerido === "S" && selected.length === 0) {
        toast.warning(`Seleccione al menos una opción en "${mod.descripcionMod}".`)
        return false
      }

      if (maxSel > 0 && totalQty > maxSel) {
        toast.warning(`No puede superar ${maxSel} en "${mod.descripcionMod}".`)
        return false
      }
    }

    return true
  }, [detail.tieneOpcion, productModifiers, selectedOptions, optionQuantities])

  const resolveBranchPayload = useCallback(() => {
    if (branchUiSelected && wherehouseCodeUiSelected) {
      return {
        branch: branchUiSelected,
        branchName: branchNameUiSelected,
        wherehouse: wherehouseUiSelected,
        wherehouseCode: wherehouseCodeUiSelected,
        serie: serieUiSelected,
      }
    }

    if (locked) {
      return {
        branch: locked.branch,
        branchName: locked.branchName,
        wherehouse: locked.wherehouse,
        wherehouseCode: locked.wherehouseCode,
        serie: locked.serie,
      }
    }

    return {}
  }, [
    locked,
    branchUiSelected,
    branchNameUiSelected,
    wherehouseUiSelected,
    wherehouseCodeUiSelected,
    serieUiSelected,
  ])

const buildModifierOptionsPayload = useCallback((): SelectedModifierOption[] => {
  if (!detail.tieneOpcion || !productModifiers?.length) return []

  const result: SelectedModifierOption[] = []

  productModifiers.forEach((mod) => {
    const key = String(mod.codModificador)
    const selected = selectedOptions[key] ?? []

    selected.forEach((id) => {
      const op = mod.listOpciones?.find(
        (x) => String(x.codOpcion) === String(id)
      )

      if (!op) return

      const codOpcion = String(op.codOpcion)
      const quantity = clampQty(optionQuantities[codOpcion] ?? 1)

      const item: SelectedModifierOption = {
        codTipoModificador: String(
          mod.codTipoModificador ?? op.codTipoModificador ?? ""
        ),
        codModificador: String(mod.codModificador),
        descripcionMod: String(mod.descripcionMod ?? ""),
        codOpcion,
        descripcionOp: String(op.descripcionOp ?? ""),
        codPrecio: String(op.codPrecio ?? "01"),
        precioVenta: Number(op.precioVenta ?? 0),
        cantidad: quantity,
        codUm: String(op.codUm ?? ""),
        aplicaIva: String(op.aplicaIva ?? ""),
      }

      result.push(item)
    })
  })

  return result
}, [
  detail.tieneOpcion,
  productModifiers,
  selectedOptions,
  optionQuantities,
])

  const handleAddToCart = useCallback(async () => {
    if (addLockRef.current) return

    addLockRef.current = true

    try {
      const qty = clampQty(cantidad)

      if (qty <= 0) {
        toast.warning("La cantidad debe ser al menos 1.")
        return
      }

      if (!validateRequiredModifiers()) return

      const payload: AddProductParams & any = {
        product: detail,
        qty,
        observacion,
        modifierOptions: buildModifierOptionsPayload(),
        ...resolveBranchPayload(),
      }

      await addProduct(payload)

      setCantidad(1)
      setselectedCategory(null)
      setDetailProduct(null)
    } finally {
      addLockRef.current = false
    }
  }, [
    addProduct,
    cantidad,
    observacion,
    detail,
    resolveBranchPayload,
    buildModifierOptionsPayload,
    validateRequiredModifiers,
    setDetailProduct,
    setselectedCategory,
  ])

  const handleSendMessage = useCallback(async () => {
    if (sendLockRef.current) return

    sendLockRef.current = true

    try {
      await sendProductMessage({
        product: detail,
        conversationId,
        observation: observacion,
      })
    } finally {
      sendLockRef.current = false
    }
  }, [conversationId, detail, observacion, sendProductMessage])

  const actionsDisabled = sending
  const canPickBranch = !locked

  return (
    <section className="detail-product__container">
      <header className="detail-product__stickyHeader detail-product__carouselHeader">

        <span>
          {currentIndex} / {totalCount}
        </span>

        <div className="detail-product__navGroup">
          <button
            type="button"
            className="detail-product__navBtn"
            onClick={onPrev}
            disabled={!canPrev}
            aria-label="Anterior"
            title="Anterior"
          >
            <MdOutlineArrowBackIos fontSize={16} />
          </button>

          <button
            type="button"
            className="detail-product__navBtn"
            onClick={onNext}
            disabled={!canNext}
            aria-label="Siguiente"
            title="Siguiente"
          >
            <MdOutlineArrowForwardIos fontSize={18} />
          </button>
        </div>
      </header>

      <section ref={bodyRef as any} className="detail-product__scrollBody">
        <section className="detail-product__section">
          <div className="detail-product__image">
            <button
              type="button"
              className="detail-product__imageBtn"
              onClick={() => setOpenImg(true)}
              aria-label="Ver imagen en pantalla completa"
            >
              <img
                src={imageSrc}
                className="detail-image"
                aria-label="product-image"
              />
            </button>
          </div>

          <div className="detail-product__content">
            <p className="detail-product__descriptions">
              {detail.codProducto} {detail.descripcion}
            </p>

            <p className="detail-product__price">C$ {detail.precio}</p>

            <p className="detail-product__descriptions-marca">
              {detail.marca ?? ""}
            </p>

            {Number(detail.existencia ?? 0) > 0 && (
              <p className="detail-product__existencia">
                <MdInventory fontSize={12} /> {detail.existencia}
              </p>
            )}

            {detail.contenido && (
              <p className="detail-product__contentText">{detail.contenido}</p>
            )}

            {detail.tieneOpcion && productModifiers.length > 0 && (
              <div className="product-modifiers">
                <header className="product-modifiers__content">
                  {productModifiers.map((mod) => {
                    const key = String(mod.codModificador)
                    const selected = selectedOptions[key] ?? []
                    const maxSel = Number(mod.maximoSel ?? 0)

                    const selectedQty = selected.reduce((sum, id) => {
                      return sum + clampQty(optionQuantities[id] ?? 1)
                    }, 0)

                    return (
                      <div className="product-modifiers__product" key={key}>
                        <p className="product-modifiers__product__title">
                          {mod.descripcionMod}
                          {mod.esRequerido === "S" && <span> *</span>}
                          {maxSel > 0 && (
                            <small className="product-modifiers__limit">
                              {" "}
                              {selectedQty}/{maxSel}
                            </small>
                          )}
                        </p>

                        <div className="product-modifiers__option__container">
                          {mod.listOpciones?.map((op) => {
                            const optionId = String(op.codOpcion)
                            const selectedOption = isOptionSelected(mod, optionId)
                            const currentQty = optionQuantities[optionId] ?? 1

                            return (
                              <div
                                className="product-modifiers__options"
                                key={optionId}
                              >
                                <input
                                  type="checkbox"
                                  className="product-modifiers__checkout"
                                  id={`${key}-${optionId}`}
                                  checked={selectedOption}
                                  onChange={() =>
                                    handleToggleOption(mod, optionId)
                                  }
                                />

                                <label
                                  htmlFor={`${key}-${optionId}`}
                                  className="product-modifiers__option"
                                >
                                  {op.descripcionOp}

                                  {Number(op.precioVenta ?? 0) > 0 && (
                                    <span className="product-modifiers__option__price">
                                      C$ {Number(op.precioVenta).toFixed(2)}
                                    </span>
                                  )}

                                  {Number(op.precioVenta ?? 0) <= 0 && (
                                    <span className="product-modifiers__option__price">
                                      Precio incluido
                                    </span>
                                  )}
                                </label>

                                {selectedOption && (
                                  <input
                                    type="number"
                                    className="product-modifiers__option__qty"
                                    min={1}
                                    max={maxSel > 0 ? maxSel : 1000}
                                    value={currentQty}
                                    onChange={(e) =>
                                      handleOptionQuantityChange(
                                        mod,
                                        optionId,
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
                    )
                  })}
                </header>
              </div>
            )}

            {!loadingBranches && (
              <div className="detail-product__branchList">
                {branchRows.map((b) => {
                  const whCode = (b.codbodega ?? "").trim()

                  const isActive =
                    branchUiSelected === b.codsucursal &&
                    wherehouseCodeUiSelected === whCode

                  const isDisabled = !!locked && !isActive

                  return (
                    <button
                      key={`${b.codsucursal}-${b.codbodega}`}
                      className={`detail-product__branchItem ${
                        isActive ? "detail-product__branchItem--active" : ""
                      } ${
                        isDisabled
                          ? "detail-product__branchItem--disabled"
                          : ""
                      }`}
                      type="button"
                      disabled={!canPickBranch && !isActive}
                      onClick={() => {
                        if (!canPickBranch) return

                        setBranchUiSelected(b.codsucursal)
                        setBranchNameUiSelected(b.sucursal ?? "")
                        setWherehouseUiSelected(b.nombodega ?? "")
                        setWherehouseCodeUiSelected(whCode)
                        setSerieCodeUiSelected((b.serie ?? "").trim())
                      }}
                    >
                      <div className="detail-product__branchItemMain">
                        <span className="detail-product__branchCode">
                          {b.codsucursal}
                        </span>

                        <span className="detail-product__branchName">
                          {b.sucursal}
                        </span>

                        <span className="detail-product__branchSerie">
                          {b.nombodega}
                        </span>
                      </div>

                      <div className="detail-product__branchItemMeta">
                        {b.existencia > 0 && (
                        <span className="detail-product__branchStock">
                          {b.existencia} {b.medida}
                        </span>
                        )}

                        <span
                          className={`detail-product__branchCheck ${
                            isActive ? "isActive" : ""
                          }`}
                        >
                          {isActive ? "✓" : ""}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {loadingBranches && (
              <div className="detail-product__branchListLoading">
                Cargando sucursales...
              </div>
            )}

            <textarea
              className="detailPanel-description__textarea"
              rows={4}
              placeholder="Observación"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
            />

            <div className="productDetail-total__container">
              {total > 0 && (
                <p className="productDetail-total">
                  Total:{" "}
                  <span className="productDetail-total__value">
                    C$ {total.toFixed(2)}
                  </span>
                </p>
              )}
            </div>
          </div>
        </section>
      </section>

      <footer className="detail-product__actions detail-product__stickyFooter">
        <div className="detail-product__footer">
          <input
            type="number"
            min={1}
            max={1000}
            value={cantidad}
            onChange={(e) => setCantidad(clampQty(Number(e.target.value)))}
            className="detail-product__inputNumber"
          />

          <button
            type="button"
            className="productTab-buyButton"
            onClick={handleAddToCart}
            disabled={actionsDisabled}
          >
            <FaShoppingCart />
          </button>

          <Button disabled={actionsDisabled} onClick={handleSendMessage}>
            {actionsDisabled ? <AiOutlineLoading3Quarters /> : <IoMdSend />}
          </Button>
        </div>
      </footer>

      {openImg && (
        <div
          className="detail-product__imgModal"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenImg(false)}
        >
          <button
            type="button"
            className="detail-product__imgModalClose"
            onClick={() => setOpenImg(false)}
            aria-label="Cerrar"
          >
            ✕
          </button>

          <img
            src={imageSrc}
            className="detail-product__imgModalImage"
            alt="Imagen ampliada"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  )
}

export default DetailPCGProduct