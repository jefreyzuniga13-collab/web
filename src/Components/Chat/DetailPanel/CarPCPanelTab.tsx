/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react"
import Input from "@/Components/Common/Input"
import { useCarPCG } from "@/Hooks/useCarPCG"
import type { CarDto, ListDetalleCarrito } from "@/Interfaces/Crm/CartPCGInterface"
import EmptyCard from "@/assets/emptycard.webp"
import { toast } from "react-toastify"
import "@/Styles/Crm/cardPCGTab.css"
import Button from "@/Components/Common/Button"
import { useCart } from "@/Hooks/Cart/useCart"
import noimageavailable from "@/assets/noimageavailable.webp"
import { useChatWindow } from "@/Hooks/Chat/useChatWindow"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface Props {
  conversationId: number
}

const buildRowsFromCart = (cart: CarDto): any[][] => {
  const rows: any[][] = []
  cart.listDetalle.forEach((d: ListDetalleCarrito) => {
    const opciones = d.listOpciones?.map((o) => o.descripcionOp).join(", ") ?? ""
    const descripcion = d.descripcion ?? ""
    const imagenLine = d.imagen ? `Imagen: ${d.imagen}` : ""
    const productoCell = [descripcion, imagenLine].filter(Boolean).join("\n")

    rows.push([
      productoCell,
      d.cantidad,
      d.precioV.toFixed(2),
      d.totalMenu.toFixed(2),
      opciones
    ])
  })
  return rows
}

const generateCartPdfFile = (cart: CarDto): File => {
  const doc = new jsPDF()

  const date = new Date()
  const options: Intl.DateTimeFormatOptions = { timeZone: "America/Managua" }
  const time = date.toLocaleString("es-NI", options)

  const marginX = 20
  const marginY = 20
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("Resumen de carrito", marginX, marginY + 5)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Fecha: ${time}`, marginX, marginY + 14)

  const body = buildRowsFromCart(cart)

  autoTable(doc, {
    startY: marginY + 20,
    head: [["Producto", "Cant.", "Precio", "Total", "Más detalles"]],
    body,
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [49, 86, 168], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { halign: "center", cellWidth: 15 },
      2: { halign: "right", cellWidth: 22 },
      3: { halign: "right", cellWidth: 24 },
      4: { cellWidth: 40 }
    }
  })

  let y = (doc as any).lastAutoTable?.finalY ?? marginY + 30
  if (y < marginY + 30) y = marginY + 30
  y += 10

  const boxWidth = 80
  const boxHeight = 36
  const boxX = pageWidth - marginX - boxWidth

  doc.setDrawColor(209, 213, 219)
  doc.setFillColor(249, 250, 251)
  ;(doc as any).roundedRect(boxX, y - 6, boxWidth, boxHeight, 3, 3, "FD")

  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Resumen de montos", boxX + 4, y - 1)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")

  const lineGap = 6
  const labelX = boxX + 4
  const valueX = boxX + boxWidth - 4

  const subtotal = (cart.subTotal ?? 0).toFixed(2)
  const descuento = (cart.descuento ?? 0).toFixed(2)
  const iva = (cart.iva ?? 0).toFixed(2)
  const total = cart.total.toFixed(2)

  let lineY = y + 6
  doc.text("Subtotal:", labelX, lineY)
  doc.text(`C$ ${subtotal}`, valueX, lineY, { align: "right" })

  if (descuento != null && Number(descuento) > 0) {
    lineY += lineGap
    doc.text("Descuento:", labelX, lineY)
    doc.text(`C$ ${descuento}`, valueX, lineY, { align: "right" })
  }

  lineY += lineGap
  doc.text("IVA:", labelX, lineY)
  doc.text(`C$ ${iva}`, valueX, lineY, { align: "right" })

  doc.setFont("helvetica", "bold")
  lineY += lineGap
  doc.text("Total:", labelX, lineY)
  doc.text(`C$ ${total}`, valueX, lineY, { align: "right" })

  const blob = doc.output("blob")
  return new File([blob], `carrito.pdf`, { type: "application/pdf" })
}

const CarPCPanelTab = ({ conversationId }: Props) => {
  const [search, setSearch] = useState<string>("")
  const { loading, carPCG, getProductFromCarAsync, updateCarAsync, error } = useCarPCG()
  const { SendMessageLink, error: errorCart, loading: loadingCart } = useCart()
  const { setFile, setText, handleSend, sending } = useChatWindow({ conversationId })

  useEffect(() => {
    //test de id temporal
    getProductFromCarAsync(800)
  }, [])

  useEffect(() => {
    if (error) {
      toast.error(error.message)
    }
  }, [error])

  const handleRemoveItem = async (idUsuario: number, noPedido?: number | null) => {
    if (!noPedido) return
    await updateCarAsync(idUsuario, noPedido)
    await getProductFromCarAsync(800)
  }

  const hasItems = useMemo(() => carPCG != null && carPCG.length > 0, [carPCG])

  const filteredDetails: { cart: CarDto; detail: ListDetalleCarrito }[] = useMemo(() => {
    if (!hasItems) return []
    const term = search.trim().toLowerCase()
    const result: { cart: CarDto; detail: ListDetalleCarrito }[] = []
    carPCG.forEach((cart) => {
      cart.listDetalle.forEach((detail) => {
        if (!term || detail.descripcion.toLowerCase().includes(term)) {
          result.push({ cart, detail })
        }
      })
    })
    return result
  }, [carPCG, hasItems, search])

  if (loading) return <span>Cargando...</span>

  if (loadingCart)
    return (
      <div className="cartPanel-loadingCartContiner">
        <p className="cartPanel-loadingCartText">Cargando</p>
      </div>
    )

  if (errorCart)
    return (
      <div className="cartPanel-errorContiner">
        <p className="cartPanel-errorText">{errorCart.message}</p>
      </div>
    )

  if (!hasItems) {
    return (
      <div className="carPCPanel-container">
        <header className="carPCPanel-header">
          <h5 className="productTab-content-header__title">Carrito</h5>
        </header>
        <div className="carPCPanel-emptyContainer">
          <img src={EmptyCard} alt="empty" className="cardPanel-emptyImage" />
          <p className="cardPanel--emptyText">No hay productos en el carrito.</p>
        </div>
      </div>
    )
  }

  const cart = carPCG[0]
  // const totalCarrito = cart?.total ?? 0

  const handleSendCartPdf = async () => {
    if (!cart || sending) return
    const file = generateCartPdfFile(cart)
    setFile(file)
    setText("Resumen de carrito")
    await handleSend()
  }

  return (
    <div className="carPCPanel-container">
      <header className="carPCPanel-header">
        <h5 className="productTab-content-header__title">Carrito</h5>
        <Input
          id="searchProduct"
          name="searchProduct"
          value={search}
          placeholder="Buscar categoria o producto"
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      <section className="carPCPanel-content">
        {filteredDetails.map(({ cart, detail }, index) => (
          <div
            key={index}
            className="carPCPanel-content__list"
            onDoubleClick={() => handleRemoveItem(cart.idUsuario, detail.noPedido)}
          >
            <div className="carPCPanel-content__list-imgContainer">
              <img
                src={detail.imagen ?? noimageavailable}
                aria-label="product image"
                className="carPCPanel-content__list-image"
              />
              <p className="carPCPanel-content__list-flootingQuantity">{detail.cantidad}</p>
            </div>

            <div className="carPCPanel-content__list-info">
              <p className="carPCPanel-content__list-text">{detail.descripcion}</p>
              <p className="carPCPanel-content__list-price">C$ {detail.totalMenu.toFixed(2)}</p>
            </div>

            <div className="carPCPanel-listaOpciones">
              {detail.listOpciones?.map((e, idx) => (
                <p key={idx} className="carPCPanel-content__item">
                  {e.descripcionOp}
                </p>
              ))}
            </div>
          </div>
        ))}

        {cart.total > 0 && (
          <>
            <div className="productTab-content-footer">
              {cart.subTotal != null && cart.subTotal > 0 && (
                <div className="productTab-content__container">
                  <p className="productTab-content-footer__title">
                    Subtotal:
                  </p>
                  <span className="productTab-content-footer__value">
                    C$ {cart.subTotal ?? ""}
                  </span>
                </div>
              )}

              {cart.descuento != null && cart.descuento > 0 && (
                <div className="productTab-content__container">
                  <p className="productTab-content-footer__title">
                    Descuento:
                  </p>
                  <span className="productTab-content-footer__value">
                    C$ {cart.descuento ?? ""}
                  </span>
                </div>
              )}

              {cart.iva != null && cart.iva > 0 && (
                <div className="productTab-content__container">
                  <p className="productTab-content-footer__title">
                    IVA:
                  </p>
                  <span className="productTab-content-footer__value">
                    C$ {cart.iva ?? ""}
                  </span>
                </div>
              )}
              {cart.total && cart.total > 0 && (
                <div className="productTab-content__container">
                  <p className="productTab-content-footer__title">
                    Total:
                  </p>
                  <span className="productTab-content-footer__totalValue">
                    C$ {cart.total.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            <div className="productTab-footer__payment">
              <Button className="carPanel-btn" onClick={handleSendCartPdf}>
                Enviar carrito (PDF)
              </Button>
              <Button
                className="payment-btn"
                onClick={() => {
                  SendMessageLink(conversationId)
                }}
              >
                Procesar pago (Link)
              </Button>
            </div>
          </>
        )}

      </section>
    </div>
  )
}

export default CarPCPanelTab;