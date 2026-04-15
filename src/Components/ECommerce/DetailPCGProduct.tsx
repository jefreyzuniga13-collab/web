/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { FaShoppingCart } from "react-icons/fa"
import { IoMdSend } from "react-icons/io"
import { MdInventory } from "react-icons/md"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import Button from "@/Components/Common/Button"
import aguamarina from "@/assets/img/aguamarina.png"
import "@/Styles/Ecommerce/DetailProduct.css"
import type { listaOpciones, ProductoPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface"
import type { SelectedInterface } from "./ProductTab"
import { useProductPCG } from "@/Hooks/Ecommerce/useProductPCG"
import { useBranchesByProduct } from "@/Hooks/Ecommerce/useBranchesByProduct"
import { useCartPCGFlowCtx } from "@/Context/CartPCGFlowProvider"
import { useProductMessageComposer } from "@/Hooks/Ecommerce/useProductMessageComposer"
import { toast } from "react-toastify"
import type { AddProductParams } from "@/Hooks/Ecommerce/useCartPCGFlow"
import { MdOutlineArrowBackIos, MdOutlineArrowForwardIos } from "react-icons/md"


interface Props {
  detail: ProductoPCGInterface
  setDetailProduct: (detailP: ProductoPCGInterface | null) => void
  setselectedCategory: (category: SelectedInterface | null) => void

  currentIndex: number
  totalCount: number

  // carrusel
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void

  // volver (ProductTab restaura scroll)
  onBack: () => void
}

type SelectedOptionsMap = Record<string, string[]>
type OptionQtyMap = Record<string, number>

const clampQty = (n: number) => {
  if (!Number.isFinite(n) || n <= 0) return 1
  if (n > 1000) return 1000
  return Math.floor(n)
}

const DetailPCGProduct = ({
  detail,
  setDetailProduct,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setselectedCategory,
  currentIndex,
  totalCount,
  canPrev,
  canNext,
  onPrev,
  onNext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBack,
}: Props) => {
  const [cantidad, setCantidad] = useState(1)
  const [observacion, setObservacion] = useState("")
  const [total, setTotal] = useState(0)

  const { conversationId, locked, addProduct } = useCartPCGFlowCtx()
  const { sending, sendProductMessage } = useProductMessageComposer()

  const { productModifiers, getProductModifiers } = useProductPCG();

  // const { rows: branchRows, loading: loadingBranches } = useBranchesByProduct(detail.codProducto, {
  //   enabled: !locked,
  // })

  const { rows: branchRows, loading: loadingBranches } = useBranchesByProduct(detail.codProducto)
  
  const [branchUiSelected, setBranchUiSelected] = useState<string | null>(null)
  const [branchNameUiSelected, setBranchNameUiSelected] = useState("")
  const [wherehouseUiSelected, setWherehouseUiSelected] = useState("")
  const [wherehouseCodeUiSelected, setWherehouseCodeUiSelected] = useState("")
  const [serieUiSelected, setSerieCodeUiSelected] = useState("")
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptionsMap>({})
  const [optionQuantities, setOptionQuantities] = useState<OptionQtyMap>({})
  const sendLockRef = useRef(false)
  const addLockRef = useRef(false)

  const [openImg, setOpenImg] = useState(false)

    const imageSrc = useMemo(() => detail.imagen || aguamarina, [detail.imagen])

    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpenImg(false)
      }
      if (openImg) window.addEventListener("keydown", onKey)
      return () => window.removeEventListener("keydown", onKey)
    }, [openImg])


  // referencia para scroll interno del detalle
  const bodyRef = useRef<HTMLElement | null>(null)

  // Reset UI cuando cambia de producto + subir scroll interno a top
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
    if (!detail.tieneOpcion) return
    getProductModifiers(detail.codProducto)
  }, [detail.codProducto, detail.tieneOpcion, getProductModifiers])

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
        map.set(String(op.codOpcion), { ...op, codModificador: String(mod.codModificador) })
      })
    })
    return map
  }, [productModifiers])

  // Calcular total (precio base + opciones)
  useEffect(() => {
    const base = clampQty(cantidad) * Number(detail.precio ?? 0)

    let optionsTotal = 0
    Object.entries(selectedOptions).forEach(([, ids]) => {
      ids.forEach((id) => {
        const op = optionIndex.get(String(id))
        const qty = clampQty(optionQuantities[String(id)] ?? 1)
        if (op) optionsTotal += qty * clampQty(cantidad) * Number(op.precioVenta ?? 0)
      })
    })

    setTotal(base + optionsTotal)
  }, [cantidad, selectedOptions, optionQuantities, optionIndex, detail.precio])

  const validateRequiredModifiers = useCallback(() => {
    if (!detail.tieneOpcion) return true
    if (!productModifiers?.length) return true

    for (const mod of productModifiers) {
      if (mod.esRequerido !== "S") continue
      const key = String(mod.codModificador)
      const sel = selectedOptions[key] ?? []
      if (!sel.length) {
        toast.warning(`Seleccione opción en "${mod.descripcionMod}".`)
        return false
      }
    }
    return true
  }, [detail.tieneOpcion, productModifiers, selectedOptions])

  // const canPickBranch = !locked

  // const resolveBranchPayload = useCallback(() => {
  //   if (locked) {
  //     return {
  //       branch: locked.branch,
  //       branchName: locked.branchName,
  //       wherehouse: locked.wherehouse,
  //       wherehouseCode: locked.wherehouseCode,
  //       serie: locked.serie,
  //     }
  //   }

  //   if (branchUiSelected && wherehouseCodeUiSelected) {
  //     return {
  //       branch: branchUiSelected,
  //       branchName: branchNameUiSelected,
  //       wherehouse: wherehouseUiSelected,
  //       wherehouseCode: wherehouseCodeUiSelected,
  //       serie: serieUiSelected,
  //     }
  //   }

  //   return {}
  // }, [
  //   locked,
  //   branchUiSelected,
  //   branchNameUiSelected,
  //   wherehouseUiSelected,
  //   wherehouseCodeUiSelected,
  //   serieUiSelected,
  // ])
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

  const buildOptionsPayload = useCallback(() => {
    return {
      selectedOptions,
      optionQuantities,
    }
  }, [selectedOptions, optionQuantities])

  const handleAddToCart = useCallback(async () => {
    if (addLockRef.current) return
    addLockRef.current = true

    try {
      const qty = clampQty(cantidad)
      if (qty <= 0) return
      if (!validateRequiredModifiers()) return

      const payload: AddProductParams & any = {
        product: detail,
        qty,
        observacion,
        ...resolveBranchPayload(),
        ...buildOptionsPayload(),
      }

      await addProduct(payload)

      setCantidad(1)
      setDetailProduct(null) // vuelve a ProductTab (y el ProductTab restaura scroll)
    } finally {
      addLockRef.current = false
    }
  }, [
    addProduct,
    cantidad,
    observacion,
    detail,
    resolveBranchPayload,
    buildOptionsPayload,
    validateRequiredModifiers,
    setDetailProduct,
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
      {/* Header: volver + carrusel */}
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

      {/* Body con scroll interno */}
      <section ref={bodyRef as any} className="detail-product__scrollBody">
        
        <section className="detail-product__section">
          <div className="detail-product__image">
            {/* <img src={detail.imagen || aguamarina} className="detail-image" aria-label="product-image" /> */}
            <button
                type="button"
                className="detail-product__imageBtn"
                onClick={() => setOpenImg(true)}
                aria-label="Ver imagen en pantalla completa"
              >
                <img src={imageSrc} className="detail-image" aria-label="product-image" />
              </button>
          </div>

          <div className="detail-product__content">
            <p className="detail-product__descriptions">
              {detail.codProducto} {detail.descripcion}
            </p>
            <p className="detail-product__price">C$ {detail.precio}</p>

            <p className="detail-product__descriptions-marca">{detail.marca ?? ""}</p>

            {Number(detail.existencia ?? 0) > 0 && (
              <p className="detail-product__existencia">
                <MdInventory fontSize={12} /> {detail.existencia}
              </p>
            )}

           {!loadingBranches && (
  <div className="detail-product__branchList">
    {branchRows.map((b) => {
      const whCode = (b.codbodega ?? "").trim()
      const isActive = branchUiSelected === b.codsucursal && wherehouseCodeUiSelected === whCode
      const isDisabled = !!locked && !isActive

      return (
        <button
          key={`${b.codsucursal}-${b.codbodega}`}
          className={`detail-product__branchItem 
            ${isActive ? "detail-product__branchItem--active" : ""} 
            ${isDisabled ? "detail-product__branchItem--disabled" : ""}`}
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
            <span className="detail-product__branchCode">{b.codsucursal}</span>
            <span className="detail-product__branchName">{b.sucursal}</span>
            <span className="detail-product__branchSerie">{b.nombodega}</span>
          </div>

          <div className="detail-product__branchItemMeta">
            <span className="detail-product__branchStock">
              {b.existencia} {b.medida}
            </span>

            <span className={`detail-product__branchCheck ${isActive ? "isActive" : ""}`}>
              {isActive ? "✓" : ""}
            </span>
          </div>
        </button>
      )
    })}
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
                  Total: <span className="productDetail-total__value">C$ {total.toFixed(2)}</span>
                </p>
              )}
            </div>
          </div>
        </section>
      </section>

      {/* Footer sticky */}
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

          <button type="button" className="productTab-buyButton" onClick={handleAddToCart} disabled={actionsDisabled}>
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