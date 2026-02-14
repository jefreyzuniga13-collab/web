import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import { FaShoppingCart } from "react-icons/fa"
import { IoMdSend } from "react-icons/io"
import { MdInventory } from "react-icons/md"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import Button from "@/Components/Common/Button"
import aguamarina from "@/assets/aguamarina.png"
import "@/Styles/Ecommerce/DetailProduct.css"

import type { listaOpciones, ProductoPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface"
import type { SelectedInterface } from "./ProductTab"

import { useProductPCG } from "@/Hooks/Ecommerce/useProductPCG"
import { useBranchesByProduct } from "@/Hooks/Ecommerce/useBranchesByProduct"
import { useCartPCGFlowCtx } from "@/Context/CartPCGFlowProvider"
import { useProductMessageComposer } from "@/Hooks/Ecommerce/useProductMessageComposer"
import { toast } from "react-toastify"
import type { AddProductParams } from "@/Hooks/Ecommerce/useCartPCGFlow"

interface Props {
  detail: ProductoPCGInterface
  setDetailProduct: (detailP: ProductoPCGInterface | null) => void
  setselectedCategory: (category: SelectedInterface | null) => void
}

const DetailPCGProduct = ({ detail, setDetailProduct, setselectedCategory }: Props) => {
  const [cantidad, setCantidad] = useState(1)
  const [observacion, setObservacion] = useState("")
  const [total, setTotal] = useState(0)

  const { conversationId, locked, addProduct } = useCartPCGFlowCtx()
  const { sending, sendProductMessage } = useProductMessageComposer()

  const { productModifiers, getProductModifiers } = useProductPCG()
  const { rows: branchRows, loading: loadingBranches } = useBranchesByProduct(detail.codProducto, {
    enabled: !locked,
  })

  const [branchUiSelected, setBranchUiSelected] = useState<string | null>(null)
  const [branchNameUiSelected, setBranchNameUiSelected] = useState("")
  const [wherehouseUiSelected, setWherehouseUiSelected] = useState("")
  const [wherehouseCodeUiSelected, setWherehouseCodeUiSelected] = useState("")
  const [serieUiSelected, setSerieCodeUiSelected] = useState("")

  // Nota: si aún no implementas opciones, esto evita estado "congelado" innecesario
  const selectedOptions = useMemo(() => ({} as Record<string, string[]>), [])
  const optionQuantities = useMemo(() => ({} as Record<string, number>), [])

  const sendLockRef = useRef(false)
  const addLockRef = useRef(false)

  useEffect(() => {
    if (!detail.tieneOpcion) return
    getProductModifiers(detail.codProducto)
  }, [detail.codProducto, detail.tieneOpcion, getProductModifiers])

  // Seleccionar automáticamente la primera sucursal disponible
  useEffect(() => {
    if (!branchRows.length || locked) return
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
      mod.listOpciones.forEach((op) => {
        map.set(op.codOpcion, { ...op, codModificador: mod.codModificador })
      })
    })
    return map
  }, [productModifiers])

  useEffect(() => {
    let optionsTotal = 0
    Object.values(selectedOptions).forEach((ids) =>
      ids.forEach((id) => {
        const op = optionIndex.get(id)
        const qty = optionQuantities[id] ?? 1
        if (op) optionsTotal += qty * cantidad * Number(op.precioVenta ?? 0)
      })
    )
    setTotal(cantidad * Number(detail.precio ?? 0) + optionsTotal)
  }, [cantidad, selectedOptions, optionQuantities, optionIndex, detail.precio])

  const validateRequiredModifiers = useCallback(() => {
    if (!productModifiers) return true
    for (const mod of productModifiers) {
      if (mod.esRequerido !== "S") continue
      const sel = selectedOptions[String(mod.codModificador)] ?? []
      if (!sel.length) {
        toast.warning(`Seleccione opción en "${mod.descripcionMod}".`)
        return false
      }
    }
    return true
  }, [productModifiers, selectedOptions])

  const handleAddToCart = useCallback(async () => {
    if (addLockRef.current) return
    addLockRef.current = true

    try {
      if (cantidad <= 0) return
      if (!validateRequiredModifiers()) return

          const payload: AddProductParams = {
            product: detail,
            qty: cantidad,
            observacion,
          }

          if (locked) {
            payload.branch = locked.branch
            payload.branchName = locked.branchName
            payload.wherehouse = locked.wherehouse
            payload.wherehouseCode = locked.wherehouseCode
            payload.serie = locked.serie
          } else if (branchUiSelected && wherehouseCodeUiSelected) {
            payload.branch = branchUiSelected
            payload.branchName = branchNameUiSelected
            payload.wherehouse = wherehouseUiSelected
            payload.wherehouseCode = wherehouseCodeUiSelected
            payload.serie =serieUiSelected
          }

          await addProduct(payload)

      setCantidad(1)
      setDetailProduct(null)
      setselectedCategory(null)
    } finally {
      addLockRef.current = false
    }
  }, [
    addProduct,
    cantidad,
    observacion,
    detail,
    locked,
    branchUiSelected,
    branchNameUiSelected,
    wherehouseUiSelected,
    wherehouseCodeUiSelected,
    serieUiSelected,
    setDetailProduct,
    setselectedCategory,
    validateRequiredModifiers,
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

  return (
    <section className="detail-product__container">
      <section className="detail-product__section">
        <div className="detail-product__image">
          <img src={detail.imagen || aguamarina} className="detail-image" aria-label="product-image" />
        </div>

        <div className="detail-product__content">
          <p className="detail-product__descriptions">
            {detail.codProducto} {detail.descripcion}
          </p>
          <p className="detail-product__price">C$ {detail.precio}</p>

          <p className="detail-product__descriptions-marca">{detail.marca ?? ""}</p>

          {detail.existencia > 0 && (
            <p className="detail-product__existencia">
              <MdInventory fontSize={12} /> {detail.existencia}
            </p>
          )}

          {/* Sucursales: siempre lista + check a la par */}
          {!locked && !loadingBranches && (
            <div className="detail-product__branchList">
              {branchRows.map((b) => {
                const whCode = (b.codbodega ?? "").trim()
                const isActive = branchUiSelected === b.codsucursal && wherehouseCodeUiSelected === whCode

                return (
                  <button
                    key={`${b.codsucursal}-${b.codbodega}`}
                    className={`detail-product__branchItem ${isActive ? "detail-product__branchItem--active" : ""}`}
                    type="button"
                    onClick={() => {
                      setBranchUiSelected(b.codsucursal)
                      setBranchNameUiSelected(b.sucursal ?? "")
                      setWherehouseUiSelected(b.nombodega ?? "")
                      setWherehouseCodeUiSelected(whCode)
                      setSerieCodeUiSelected(b.serie)
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
        </div>
      </section>

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
      <footer className="detail-product__actions">

       <div className="detail-product__footer">
         <input
          type="number"
          min={1}
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value) || 1)}
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
    </section>
  )
}

export default DetailPCGProduct