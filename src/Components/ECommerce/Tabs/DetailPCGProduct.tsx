import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FaFileInvoiceDollar, FaShoppingCart } from "react-icons/fa"
import { MdInventory } from "react-icons/md"
import { Check, CircleMinus, CirclePlus, ClipboardList } from "lucide-react"
import Tooltip from "@mui/material/Tooltip"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { MdOutlineArrowBackIos, MdOutlineArrowForwardIos } from "react-icons/md"
import { toast } from "react-toastify"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useSelector } from "react-redux"
import Button from "@/Components/Common/Button"
import ListSkeleton from "@/Components/Common/ListSkeleton"
import vacio from "@/assets/vacio.png"
import "@/Styles/Ecommerce/DetailProduct.css"
import "@/Styles/Ecommerce/ModifierAccordion.css"
import type {listaOpciones,ProductoModificadorPCGInterface,ProductoPCGInterface} from "@/Interfaces/Chat/ProductPCGInterface"
import type { SelectedInterface } from "@/Components/ECommerce/Tabs/ProductTab"
import { useProductPCG } from "@/Hooks/Ecommerce/tabs/useProductPCG"
import { useBranchesByProduct } from "@/Hooks/Ecommerce/tabs/useBranchesByProduct"
import { useCartPCGFlowCtx } from "@/Context/CartPCGFlowProvider"
import { useProductMessageComposer } from "@/Hooks/Ecommerce/tabs/useProductMessageComposer"
import { formatearDecimales } from "@/Utils/calcularIVA"
import ModifierAccordion from "@/Components/ECommerce/Tabs/ModifierAccordion"
import type { AddProductParams, SelectedModifierOption } from "@/Interfaces/Crm/CartPCGInterface"

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

  batchMode?: boolean
  onSaveBatchConfig?: (payload: AddProductParams) => void
  isSelected?: boolean
  onToggleSelect?: (product: ProductoPCGInterface) => void
}

type SelectedOptionsMap = Record<string, string[]>
type OptionQtyMap = Record<string, number>

type BranchPayload = Partial<
  Pick<
    AddProductParams,
    | "branch"
    | "branchName"
    | "wherehouse"
    | "wherehouseCode"
    | "serie"
    | "codPrecio"
  >
>

type IndexedOption = listaOpciones & {
  codModificador: string
}

const clampQty = (n: number) => {
  if (!Number.isFinite(n) || n <= 0) return 1
  if (n > 1000) return 1000
  return Math.floor(n)
}

const cleanText = (value: string | number | boolean | null | undefined) => {
  return String(value ?? "").trim()
}

const esSi = (value?: string | boolean | null) => {
  return value === true || value === "S"
}

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
  batchMode = false,
  onSaveBatchConfig,
  isSelected = false,
  onToggleSelect,
}: Props) => {
  const [cantidad, setCantidad] = useState(1)
  const [observacion, setObservacion] = useState("")
  const [total, setTotal] = useState(0)

  const [branchUiSelected, setBranchUiSelected] = useState<string | null>(null)
  const [branchNameUiSelected, setBranchNameUiSelected] = useState("")
  const [wherehouseUiSelected, setWherehouseUiSelected] = useState("")
  const [wherehouseCodeUiSelected, setWherehouseCodeUiSelected] = useState("")
  const [serieUiSelected, setSerieCodeUiSelected] = useState("")
  const [codPrecioUiSelected, setCodPrecioUiSelected] = useState("")
  const [branchSearch, setBranchSearch] = useState("")

  const [selectedOptions, setSelectedOptions] = useState<SelectedOptionsMap>({})
  const [optionQuantities, setOptionQuantities] = useState<OptionQtyMap>({})
  const [openImg, setOpenImg] = useState(false)
  const [processing, setProcessing] = useState(false)

  const sendLockRef = useRef(false)
  const addLockRef = useRef(false)
  const configLockRef = useRef(false)
  const bodyRef = useRef<HTMLElement | null>(null)

  const {
    conversationId,
    locked,
    codPrecioActivo,
    setCodPrecioActivo,
    addProduct,
  } = useCartPCGFlowCtx()

  const { sending, sendProductMessage } = useProductMessageComposer()
  const { productModifiers, getProductModifiers } = useProductPCG()

  const { rows: branchRows, loading: loadingBranches } = useBranchesByProduct(
    detail.codProducto
  )

  const imageSrc = useMemo(() => detail.imagen || vacio, [detail.imagen])

  const filteredBranchRows = useMemo(() => {
    const term = branchSearch.trim().toLowerCase()

    if (!term) return branchRows

    return branchRows.filter((b) => {
      return (
        String(b.codsucursal ?? "").toLowerCase().includes(term) ||
        String(b.sucursal ?? "").toLowerCase().includes(term) ||
        String(b.nombodega ?? "").toLowerCase().includes(term) ||
        String(b.codbodega ?? "").toLowerCase().includes(term) ||
        String(b.serie ?? "").toLowerCase().includes(term) ||
        String(b.precio ?? "").toLowerCase().includes(term)
      )
    })
  }, [branchRows, branchSearch])

  const optionIndex = useMemo(() => {
    const map = new Map<string, IndexedOption>()

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
    setCodPrecioUiSelected(codPrecioActivo)
    setBranchSearch("")

    requestAnimationFrame(() => {
      bodyRef.current?.scrollTo({ top: 0 })
    })
  }, [detail.codProducto])

  useEffect(() => {
    if (!detail.tieneOpcion) {
      getProductModifiers("", "")
      setSelectedOptions({})
      setOptionQuantities({})
      return
    }

    const codPrecioFinal =
      (codPrecioUiSelected || codPrecioActivo || "").trim() || "01"

    getProductModifiers(detail.codProducto, codPrecioFinal)
  }, [
    detail.codProducto,
    detail.tieneOpcion,
    codPrecioActivo,
    codPrecioUiSelected,
    getProductModifiers,
  ])

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
      const maxSel = getMaximoSeleccion(mod)
      const multiple = esSi(mod.esMultipleSeleccion)

      const defaults =
        mod.listOpciones
          ?.filter((op) => op.esOpcionDefecto === "S")
          .map((op) => String(op.codOpcion)) ?? []

      if (!defaults.length) return

      const limited = multiple
        ? maxSel > 0
          ? defaults.slice(0, maxSel)
          : defaults
        : defaults.slice(0, 1)

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
      const lockedCodPrecio = (locked.codPrecio ?? "").trim()

      setBranchUiSelected(locked.branch ?? null)
      setBranchNameUiSelected(locked.branchName ?? "")
      setWherehouseUiSelected(locked.wherehouse ?? "")
      setWherehouseCodeUiSelected((locked.wherehouseCode ?? "").trim())
      setSerieCodeUiSelected((locked.serie ?? "").trim())
      setCodPrecioUiSelected(lockedCodPrecio)
      setCodPrecioActivo(lockedCodPrecio)
      return
    }

    if (!branchRows.length) return

    const first = branchRows[0]
    const firstCodPrecio = (first.precio ?? "").trim()

    setBranchUiSelected(first.codsucursal)
    setBranchNameUiSelected(first.sucursal ?? "")
    setWherehouseUiSelected(first.nombodega ?? "")
    setWherehouseCodeUiSelected((first.codbodega ?? "").trim())
    setSerieCodeUiSelected((first.serie ?? "").trim())
    setCodPrecioUiSelected(firstCodPrecio)
    setCodPrecioActivo(firstCodPrecio)
  }, [branchRows, locked, setCodPrecioActivo])

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

  useEffect(() => {
    if (!detail.tieneOpcion || !productModifiers?.length) return

    const nextSelected: SelectedOptionsMap = {}
    const nextQuantities: OptionQtyMap = {}

    productModifiers.forEach((mod) => {
      const key = String(mod.codModificador)
      const selected = selectedOptions[key] ?? []

      if (!selected.length) return

      const multiple = esSi(mod.esMultipleSeleccion)
      const limiteReal = getLimiteRealModificador(mod, cantidad)
      const selectedAllowed = multiple ? selected : selected.slice(0, 1)

      let remaining = limiteReal > 0 ? limiteReal : 1000
      const finalSelected: string[] = []

      selectedAllowed.forEach((id) => {
        if (remaining <= 0) return

        const currentQty = clampQty(optionQuantities[id] ?? 1)
        const safeQty = Math.min(currentQty, remaining)

        finalSelected.push(id)
        nextQuantities[id] = safeQty
        remaining -= safeQty
      })

      if (finalSelected.length > 0) {
        nextSelected[key] = finalSelected
      }
    })

    const selectedChanged =
      JSON.stringify(nextSelected) !== JSON.stringify(selectedOptions)

    const quantitiesChanged =
      JSON.stringify(nextQuantities) !== JSON.stringify(optionQuantities)

    if (selectedChanged) setSelectedOptions(nextSelected)
    if (quantitiesChanged) setOptionQuantities(nextQuantities)
  }, [
    cantidad,
    detail.tieneOpcion,
    productModifiers,
    selectedOptions,
    optionQuantities,
  ])

  useEffect(() => {
    const base = clampQty(cantidad) * Number(detail.precio ?? 0)
    let optionsTotal = 0

    Object.entries(selectedOptions).forEach(([, ids]) => {
      ids.forEach((id) => {
        const op = optionIndex.get(String(id))
        const qty = clampQty(optionQuantities[String(id)] ?? 1)

        if (op) {
          optionsTotal += qty * Number(op.precioVenta ?? 0)
        }
      })
    })

    setTotal(base + optionsTotal)
  }, [cantidad, selectedOptions, optionQuantities, optionIndex, detail.precio])

  const handleToggleOption = useCallback(
    (modifier: ProductoModificadorPCGInterface, codOpcion: string) => {
      const key = String(modifier.codModificador)
      const optionId = String(codOpcion)
      const limiteReal = getLimiteRealModificador(modifier, cantidad)
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

        if (limiteReal > 0 && currentTotal + 1 > limiteReal) {
          toast.warning(
            `No puede seleccionar más de ${limiteReal} en "${modifier.descripcionMod}".`
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
    [cantidad, optionQuantities]
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

      const limiteReal = getLimiteRealModificador(modifier, cantidad)
      const otherTotal = getSelectedQtyByModifier(modifier, optionId)

      let safe = clampQty(value)

      if (limiteReal > 0) {
        const remaining = limiteReal - otherTotal

        if (remaining <= 0) {
          toast.warning(
            `Ya alcanzó el máximo de ${limiteReal} en "${modifier.descripcionMod}".`
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
    [cantidad, selectedOptions, getSelectedQtyByModifier]
  )

  const validateRequiredModifiers = useCallback(() => {
    if (!detail.tieneOpcion) return true
    if (!productModifiers?.length) return true

    for (const mod of productModifiers) {
      const key = String(mod.codModificador)
      const selected = selectedOptions[key] ?? []
      const multiple = esSi(mod.esMultipleSeleccion)
      const limiteReal = getLimiteRealModificador(mod, cantidad)

      const totalQty = selected.reduce((sum, id) => {
        return sum + clampQty(optionQuantities[id] ?? 1)
      }, 0)
      
      if (mod.esRequerido === "S" && selected.length === 0) {
        toast.warning(`Seleccione al menos una opción en "${mod.descripcionMod}".`)
        return false
      }

      if (!multiple && selected.length > 1) {
        toast.warning(`Solo puede seleccionar una opción en "${mod.descripcionMod}".`)
        return false
      }

      if (limiteReal > 0 && totalQty > limiteReal) {
        toast.warning(`No puede superar ${limiteReal} en "${mod.descripcionMod}".`)
        return false
      }

      if (mod.esRequerido === "S" && limiteReal > 0 && totalQty < limiteReal) {
        toast.warning(
          `Debe completar ${limiteReal} selección${
            limiteReal === 1 ? "" : "es"
          } en "${mod.descripcionMod}". Actualmente tiene ${totalQty}.`
        )
        return false
      }
    }

    return true
  }, [
    cantidad,
    detail.tieneOpcion,
    productModifiers,
    selectedOptions,
    optionQuantities,
  ])

  const resolveBranchPayload = useCallback((): BranchPayload => {
    if (branchUiSelected && wherehouseCodeUiSelected) {
      return {
        branch: branchUiSelected,
        branchName: branchNameUiSelected,
        wherehouse: wherehouseUiSelected,
        wherehouseCode: wherehouseCodeUiSelected,
        serie: serieUiSelected,
        codPrecio: codPrecioUiSelected,
      }
    }

    if (locked) {
      return {
        branch: locked.branch,
        branchName: locked.branchName,
        wherehouse: locked.wherehouse,
        wherehouseCode: locked.wherehouseCode,
        serie: locked.serie,
        codPrecio: locked.codPrecio,
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
    codPrecioUiSelected,
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

        result.push({
          codTipoModificador: cleanText(
            mod.codTipoModificador ?? op.codTipoModificador
          ),
          codModificador: String(mod.codModificador),
          descripcionMod: cleanText(mod.descripcionMod),
          codOpcion,
          descripcionOp: cleanText(op.descripcionOp),
          codPrecio:
            cleanText(op.codPrecio) || cleanText(codPrecioUiSelected) || "01",
          precioVenta: Number(op.precioVenta ?? 0),
          cantidad: quantity,
          codUm: cleanText(op.codUm),
          aplicaIva: cleanText(op.aplicaIva),
        })
      })
    })

    return result
  }, [
    detail.tieneOpcion,
    productModifiers,
    selectedOptions,
    optionQuantities,
    codPrecioUiSelected,
  ])

  const buildProductPayload = useCallback((): AddProductParams | null => {
    const qty = clampQty(cantidad)

    if (qty <= 0) {
      toast.warning("La cantidad debe ser al menos 1.")
      return null
    }

    if (!validateRequiredModifiers()) return null

    const branchPayload = resolveBranchPayload()

    return {
      product: detail,
      qty,
      observacion,
      modifierOptions: buildModifierOptionsPayload(),
      onDoneUiReset: !batchMode,
      branch: branchPayload.branch ?? "",
      branchName: branchPayload.branchName ?? "",
      wherehouse: branchPayload.wherehouse ?? "",
      wherehouseCode: branchPayload.wherehouseCode ?? "",
      serie: branchPayload.serie ?? "",
      codPrecio: branchPayload.codPrecio ?? "",
    }
  }, [
    cantidad,
    detail,
    observacion,
    batchMode,
    resolveBranchPayload,
    buildModifierOptionsPayload,
    validateRequiredModifiers,
  ])

  const handleAddToCart = useCallback(async () => {
    if (addLockRef.current) return
    if (isSelected) return

    addLockRef.current = true
    setProcessing(true)

    try {
      const payload = buildProductPayload()

      if (!payload) return

      await addProduct(payload)

      setCantidad(1)
      setselectedCategory(null)
      setDetailProduct(null)
    } finally {
      addLockRef.current = false
      setProcessing(false)
    }
  }, [
    addProduct,
    buildProductPayload,
    isSelected,
    setDetailProduct,
    setselectedCategory,
  ])

  const handleSaveBatchConfig = useCallback(() => {
    if (configLockRef.current) return

    configLockRef.current = true
    setProcessing(true)

    try {
      const payload = buildProductPayload()

      if (!payload) return

      if (!onSaveBatchConfig) return

      onSaveBatchConfig(payload)
      toast.success("Configuración guardada.")
      setDetailProduct(null)
    } finally {
      configLockRef.current = false
      setProcessing(false)
    }
  }, [buildProductPayload, onSaveBatchConfig, setDetailProduct])

  const handleSendMessage = useCallback(
    async (includeModifiers: boolean) => {
      if (sendLockRef.current) return

      if (!includeModifiers && detail.tieneOpcion && !validateRequiredModifiers()) {
        return
      }

      sendLockRef.current = true

      try {
        const quoteOptions = includeModifiers
          ? undefined
          : buildModifierOptionsPayload().map((option) => ({
              group: option.descripcionMod,
              name: option.descripcionOp,
              qty: option.cantidad,
              price: option.precioVenta,
            }))

        await sendProductMessage({
          product: detail,
          conversationId,
          observation: observacion,
          includeModifiers,
          codPrecio: codPrecioActivo || "01",
          quantity: clampQty(cantidad),
          quoteOptions,
        })
      } finally {
        sendLockRef.current = false
      }
    },
    [
      buildModifierOptionsPayload,
      cantidad,
      codPrecioActivo,
      conversationId,
      detail,
      observacion,
      sendProductMessage,
      validateRequiredModifiers,
    ]
  )

  const handleToggleSelection = useCallback(() => {
    onToggleSelect?.(detail)
  }, [onToggleSelect, detail])

  const handleSelectBranch = useCallback(
    (b: (typeof branchRows)[number]) => {
      if (locked) return

      const whCode = (b.codbodega ?? "").trim()
      const codPrecio = (b.precio ?? "").trim()

      setBranchUiSelected(b.codsucursal)
      setBranchNameUiSelected(b.sucursal ?? "")
      setWherehouseUiSelected(b.nombodega ?? "")
      setWherehouseCodeUiSelected(whCode)
      setSerieCodeUiSelected((b.serie ?? "").trim())
      setCodPrecioUiSelected(codPrecio)
      setCodPrecioActivo(codPrecio)
    },
    [locked, setCodPrecioActivo]
  )

  const actionsDisabled = sending || processing
  const canPickBranch = !locked
  const canSaveBatchConfig =
    batchMode && !!onSaveBatchConfig && isSelected && detail.tieneOpcion
  const addCartDisabled = actionsDisabled || isSelected

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

      <section ref={bodyRef} className="detail-product__scrollBody">
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

            <p className="detail-product__price">
              C$ {formatearDecimales(detail.precio)}
            </p>

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
                {productModifiers.map((mod) => (
                  <ModifierAccordion
                    key={String(mod.codModificador)}
                    modifier={mod}
                    selectedOptions={selectedOptions}
                    optionQuantities={optionQuantities}
                    cantidadProducto={cantidad}
                    onToggleOption={handleToggleOption}
                    onQuantityChange={handleOptionQuantityChange}
                  />
                ))}
              </div>
            )}

            {!loadingBranches && branchRows.length > 0 && (
              <input
                type="text"
                className="detail-product__branchSearch"
                placeholder="Buscar sucursal, bodega, serie o precio..."
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
              />
            )}

            {!loadingBranches && (
              <div className="detail-product__branchList">
                {filteredBranchRows.map((b) => {
                  const whCode = (b.codbodega ?? "").trim()

                  const isActive =
                    branchUiSelected === b.codsucursal &&
                    wherehouseCodeUiSelected === whCode

                  const isDisabled = !!locked && !isActive

                  return (
                    <button
                      key={`${b.codsucursal}-${b.codbodega}-${b.serie}`}
                      className={`detail-product__branchItem ${
                        isActive ? "detail-product__branchItem--active" : ""
                      } ${
                        isDisabled
                          ? "detail-product__branchItem--disabled"
                          : ""
                      }`}
                      type="button"
                      disabled={!canPickBranch && !isActive}
                      onClick={() => handleSelectBranch(b)}
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

                {branchRows.length > 0 && filteredBranchRows.length === 0 && (
                  <div className="detail-product__branchListEmpty">
                    No se encontraron sucursales con ese filtro.
                  </div>
                )}
              </div>
            )}

            {loadingBranches && (
              <ListSkeleton variant="list" count={4} />
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
                    C$ {formatearDecimales(total)}
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

          {batchMode && onToggleSelect && (
            <Button
              type="button"
              variant="secondary"
              className={`productTab-simpleAddBar__btn simpleAddBar-select ${
                isSelected ? "simpleAddBar-select--active" : ""
              }`}
              onClick={handleToggleSelection}
              disabled={actionsDisabled}
              title={isSelected ? "Deseleccionar producto" : "Agregar a selección"}
            >
              {isSelected ? (
                <CircleMinus size={18} strokeWidth={2.2} />
              ) : (
                <CirclePlus size={18} strokeWidth={2.2} />
              )}
            </Button>
          )}

          {canSaveBatchConfig && (
            <Button
              type="button"
              variant="secondary"
              className="productTab-simpleAddBar__btn simpleAddBar-secondary"
              onClick={handleSaveBatchConfig}
              disabled={actionsDisabled}
              title="Marcas como listo"
            >
              {actionsDisabled ? (
                <AiOutlineLoading3Quarters fontSize={20} />
              ) : (
                <Check size={18} strokeWidth={2} />
              )}
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            className="productTab-simpleAddBar__btn simpleAddBar-cart"
            onClick={handleAddToCart}
            disabled={addCartDisabled}
            title={
              isSelected
                ? "Este producto ya está en la selección"
                : "Agregar al carrito"
            }
          >
            {actionsDisabled ? (
              <AiOutlineLoading3Quarters fontSize={20} />
            ) : (
              <FaShoppingCart fontSize={20} />
            )}
          </Button>

          <Tooltip title="Enviar cotización">
            <span>
              <Button
                type="button"
                variant="secondary"
                className="productTab-simpleAddBar__btn simpleAddBar-quote"
                disabled={actionsDisabled}
                onClick={() => void handleSendMessage(false)}
              >
                {actionsDisabled ? (
                  <AiOutlineLoading3Quarters fontSize={20} />
                ) : (
                  <FaFileInvoiceDollar fontSize={18} />
                )}
              </Button>
            </span>
          </Tooltip>

          {detail.tieneOpcion && (
            <Tooltip title="Enviar resumen del producto">
              <span>
                <Button
                  type="button"
                  variant="secondary"
                  className="productTab-simpleAddBar__btn simpleAddBar-options"
                  disabled={actionsDisabled}
                  onClick={() => void handleSendMessage(true)}
                >
                  {actionsDisabled ? (
                    <AiOutlineLoading3Quarters fontSize={20} />
                  ) : (
                    <ClipboardList size={18} strokeWidth={2.2} />
                  )}
                </Button>
              </span>
            </Tooltip>
          )}
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
