import { useEffect, useMemo, useState, useCallback } from "react"
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
  const { rows: branchRows, loading: loadingBranches } = useBranchesByProduct(detail.codProducto, { enabled: !locked })

  const [branchUiSelected, setBranchUiSelected] = useState<string | null>(null)
  const [branchNameUiSelected, setBranchNameUiSelected] = useState("")
  const [wherehouseUiSelected, setWherehouseUiSelected] = useState("")
  const [wherehouseCodeUiSelected, setWherehouseCodeUiSelected] = useState("")

  const [selectedOptions] = useState<Record<string, string[]>>({})
  const [optionQuantities] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!detail.tieneOpcion) return
    getProductModifiers(detail.codProducto)
  }, [detail.codProducto, detail.tieneOpcion, getProductModifiers])

  useEffect(() => {
    if (!branchRows.length || locked) return
    const first = branchRows[0]
    setBranchUiSelected(first.codsucursal)
    setBranchNameUiSelected(first.sucursal ?? "")
    setWherehouseUiSelected(first.nombodega ?? "")
    setWherehouseCodeUiSelected((first.codbodega ?? "").trim())
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

  const handleAddToCart = async () => {
    if (cantidad <= 0) return
    if (!validateRequiredModifiers()) return

    await addProduct({
      product: detail,
      qty: cantidad,
      observacion,
      branch: locked?.branch ?? branchUiSelected ?? undefined,
      branchName: locked?.branchName ?? branchNameUiSelected ?? undefined,
      wherehouse: locked?.wherehouse ?? wherehouseUiSelected ?? undefined,
      wherehouseCode: locked?.wherehouseCode ?? wherehouseCodeUiSelected ?? undefined,
    })

    setCantidad(1)
    setDetailProduct(null)
    setselectedCategory(null)
  }

  const handleSendMessage = async () => {
    await sendProductMessage({
      product: detail,
      conversationId,
      observation: observacion
    })
  }

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

          {!locked && !loadingBranches && (
            <div className="detail-product__branchList">
              {branchRows.map((b) => (
                <button
                  key={b.codsucursal}
                  className={`detail-product__branchItem ${
                    branchUiSelected === b.codsucursal ? "detail-product__branchItem--active" : ""
                  }`}
                  type="button"
                  onClick={() => {
                    setBranchUiSelected(b.codsucursal)
                    setBranchNameUiSelected(b.sucursal)
                    setWherehouseUiSelected(b.nombodega)
                    setWherehouseCodeUiSelected((b.codbodega ?? "").trim())
                  }}
                >
                  <span>{b.codsucursal}</span>
                  <span>{b.sucursal}</span>
                  <span>
                    {b.existencia} {b.medida}
                  </span>
                </button>
              ))}
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

      <footer className="detail-product__actions">
        {total > 0 && (
          <p className="productDetail-total">
            Total: <span>C$ {total.toFixed(2)}</span>
          </p>
        )}

        <input
          type="number"
          min={1}
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value) || 1)}
          className="detail-product__inputNumber"
        />

        <button type="button" className="productTab-buyButton" onClick={handleAddToCart}>
          <FaShoppingCart />
        </button>

        <Button disabled={sending} onClick={handleSendMessage}>
          {sending ? <AiOutlineLoading3Quarters /> : <IoMdSend />}
        </Button>
      </footer>
    </section>
  )
}

export default DetailPCGProduct