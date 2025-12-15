/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react"
import Input from "@/Components/Common/Input"
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
import { MdDelete } from "react-icons/md"
import {
  selectCarPCG,
  selectCartError,
  selectCartLoading,
  getProductFromCarAsync,
  updateCarAsync,
  selectCartItemsCount
} from "@/Context/Slices/Cart/cartSlice"


import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux"
import type { RootState, AppDispatch } from "@/Context"
import useContact from "@/Hooks/Contact/useContact"
import { useUserEcommerce } from "@/Hooks/UserEcommerce/useUserEcommerce"
import type { UserEcommerceDto } from "@/Interfaces/Ecommerce/UserEcommerceInterface"
import type { SendLinkRequestDto } from "@/Interfaces/Cart/SendLinkInterface"
import useLogCart from "@/Hooks/Crm/useLogCard"
import { UserSessionService } from '@/Services/auth/UserSessionService'
import type { ContactLogInterface } from "@/Interfaces/Contact/ContactInterface"

// eslint-disable-next-line react-refresh/only-export-components
export const useAppDispatch: () => AppDispatch = useDispatch
// eslint-disable-next-line react-refresh/only-export-components
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

interface Props {
  conversationId: number
  contactId: number
}

const buildRowsFromCart = (cart: CarDto): any[][] => {
  const rows: any[][] = []
  cart.listDetalle.forEach((d: ListDetalleCarrito) => {
    const opciones = d.listOpciones?.map(o => o.descripcionOp).join(", ") ?? ""
    const descripcion = d.descripcion.trim() ?? ""
    // const imagenLine = d.imagen ? `Imagen: ${d.imagen}` : ""
    // const productoCell = [descripcion, imagenLine].filter(Boolean).join("\n")
    const productoCell = [descripcion].filter(Boolean).join("\n")

    rows.push([productoCell, d.cantidad, d.precioV.toFixed(2), d.totalMenu.toFixed(2), opciones])
  })
  return rows
}

const generateCartPdfFile = (cart: CarDto, contact: ContactLogInterface): File => {
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
  doc.text(`A nombre de: ${contact.fullName != null ? contact.waName : contact.fullName}`, marginX, marginY + 15)
  doc.setFont("helvetica", "normal")
  doc.text(`Fecha: ${time}`, marginX, marginY + 25)

  const body = buildRowsFromCart(cart)

  autoTable(doc, {
    startY: marginY + 30,
    head: [["Producto", "Cant.", "Precio", "Total", "Más detalles"]],
    body,
    margin: { left: marginX, right: marginX },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [49, 86, 168], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { halign: "left", cellWidth: 15 },
      2: { halign: "left", cellWidth: 22 },
      3: { halign: "left", cellWidth: 24 },
      4: { cellWidth: 80 }
    }
  })

  let y = (doc as any).lastAutoTable?.finalY ?? marginY + 40
  if (y < marginY + 30) y = marginY + 40
  y += 10

  const boxWidth = 80
  const boxHeight = 36
  const boxX = pageWidth - marginX - boxWidth

  doc.setDrawColor(209, 213, 219)
  doc.setFillColor(249, 250, 251)
    ; (doc as any).roundedRect(boxX, y - 6, boxWidth, boxHeight, 3, 3, "FD")

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

const generateRandomString = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numberChars = "0123456789"
  let result = ""
  let hasUppercase = false
  let hasNumber = false

  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    const char = characters[randomIndex]
    result += char
    if (uppercaseChars.includes(char)) hasUppercase = true
    if (numberChars.includes(char)) hasNumber = true
  }

  if (!hasUppercase) {
    result =
      result.substring(0, Math.floor(Math.random() * 6)) +
      uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)] +
      result.substring(Math.floor(Math.random() * 6) + 1)
  }
  if (!hasNumber) {
    result =
      result.substring(0, Math.floor(Math.random() * 6)) +
      numberChars[Math.floor(Math.random() * numberChars.length)] +
      result.substring(Math.floor(Math.random() * 6) + 1)
  }

  return result
}


const CarPCPanelTab = ({ conversationId, contactId }: Props) => {
  const [search, setSearch] = useState<string>("")
  const [orderId, setOrderId] = useState<number | null>(null)

  const dispatch = useAppDispatch()
  const carPCG = useAppSelector(selectCarPCG)
  const loading = useAppSelector(selectCartLoading)
  const error = useAppSelector(selectCartError)
  const cartItemsCount = useAppSelector(selectCartItemsCount)

  const { SendMessageLink,
    error: errorCart,
    loading: loadingCart } = useCart()

  const {
    UpdatedStatus,
    fetchByContactId
  } = useLogCart();

  const { 
    UpdateEcommerceUserAsync, 
    getById } = useContact()

  const { CreateAsync } = useUserEcommerce()

  const { setFile, setText, handleSend, sending } = useChatWindow({ conversationId })

  useEffect(() => {
    const loadCart = async () => {
      const log = await fetchByContactId(contactId)

      if (log) {
        setOrderId(log.orderId)
        await dispatch(
          getProductFromCarAsync({ codCliente: 0, noPedido: log.orderId! })
        ).unwrap()
      } else {
        setOrderId(null)
        await dispatch(
          getProductFromCarAsync({ codCliente: 0, noPedido: 0 })
        ).unwrap()
        // o un clearCart() si lo tienes
      }
    }

    if (contactId && conversationId) {
      void loadCart()
    }
  }, [contactId, conversationId, dispatch, fetchByContactId])

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])


  const handleRemoveItem = async (
    idUsuario: number,
    noPedido: number,
    codProducto: string,
    unico: string
  ) => {
    if (!noPedido) return

    // Actualizar item en el carrito
    await dispatch(
      updateCarAsync({
        idUsuario,
        noPedido,
        codProducto,
        unico
      })
    ).unwrap()

    const updatedCart = await dispatch(
      getProductFromCarAsync({ codCliente: 0, noPedido })
    ).unwrap()


    if (updatedCart == null) {
      const existingLog = await fetchByContactId(contactId)

      if (existingLog) {
        await UpdatedStatus(existingLog.id, 3)
      }
    }
  }

  const hasItems = useMemo(() => carPCG != null && carPCG.length > 0, [carPCG])

  const filteredDetails: { cart: CarDto; detail: ListDetalleCarrito }[] = useMemo(() => {
    if (!hasItems) return []
    const term = search.trim().toLowerCase()
    const result: { cart: CarDto; detail: ListDetalleCarrito }[] = []
    carPCG.forEach(cart => {
      cart.listDetalle.forEach(detail => {
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
        <p className="cartPanel-loadingCartText">Cargando...</p>
      </div>
    )

  if (errorCart)
    return (
      <div className="cartPanel-errorContiner">
        <p className="cartPanel-errorText">{errorCart.message}</p>
      </div>
    )

  if (!hasItems || !cartItemsCount) {
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

  const handleSendCartPdf = async () => {
    if (!cart || sending) return

    const contact = await getById(contactId)

    if (!contact) {
      toast.error("No se pudo obtener el contacto")
      return
    }

    const file = generateCartPdfFile(cart, contact)
    setFile(file)
    setText("Resumen de carrito")
    await handleSend()
  }

  const Cancel = async () => {
    if (cart == null) return

    const res = await UserSessionService.revokeCartTempLink(orderId!)

    if (res.success) toast.success(res.message)
  }

  const handleSendLink = async () => {
    const contact = await getById(contactId)

    if (!contact) {
      toast.error("No se pudo obtener el contacto")
      return
    }

    const date = new Date()
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear() - 20

    const createUserEcommerce: UserEcommerceDto = {
      nombres: contact.fullName ?? "",
      apellidos: contact.fullName ?? "",
      codReferencia: "",
      idUsuario: 0,
      correo: contact.email ?? "",
      telefono: (contact.phone ?? "").replace(/^505/, ""),
      tokenReferencia: "",
      clave: generateRandomString(),
      fechaNacimiento: `${day}/${month}/${year}`
    }

    let ecommerceUserId = contact.ecommerceUserId ?? 0

    if (!contact.ecommerceUserId) {
      const res = await CreateAsync(createUserEcommerce)
      ecommerceUserId = Number(res)
      await UpdateEcommerceUserAsync(contactId, ecommerceUserId)
    }

    const existingLog = await fetchByContactId(contactId)

    const sendLinkRequest: SendLinkRequestDto = {
      conversationId,
      orderId: existingLog!.orderId!,
      ecommerceUserId: ecommerceUserId,
      email: contact.email ?? "",
      fullName: contact.fullName ?? "",
      contactId: contactId
    }

    await SendMessageLink(sendLinkRequest)
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
          onChange={e => setSearch(e.target.value)}
        />
      </header>


      <section className="carPCPanel-content">
        {filteredDetails.map(({ detail }, index) => (
          <div key={index} className="carPCPanel-content__list">
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
              <p className="carPCPanel-content__list-price">C$ {detail.cantidad.toFixed(2)}</p>
            </div>

            <div className="carPCPanel-listaOpciones">
              {detail.listOpciones?.map((e, idx) => (
                <p key={idx} className="carPCPanel-content__item">
                  {e.descripcionOp}
                </p>
              ))}
            </div>

            <MdDelete
              fontSize={24}
              onClick={() =>
                handleRemoveItem(cart.idUsuario ?? 0, detail.noPedido,
                  detail.codProducto, detail.unico!)}
              className="carPCPanel-content__removeIcon"
            />
          </div>
        ))}

        {cart.total > 0 && (
          <>
            <div className="productTab-content-footer">
              {cart.subTotal != null && cart.subTotal > 0 && (
                <div className="productTab-content__container">
                  <p className="productTab-content-footer__title">Subtotal:</p>
                  <span className="productTab-content-footer__value">
                    C$ {cart.subTotal ?? ""}
                  </span>
                </div>
              )}

              {cart.descuento != null && cart.descuento > 0 && (
                <div className="productTab-content__container">
                  <p className="productTab-content-footer__title">Descuento:</p>
                  <span className="productTab-content-footer__value">
                    C$ {cart.descuento ?? ""}
                  </span>
                </div>
              )}

              {cart.iva != null && cart.iva > 0 && (
                <div className="productTab-content__container">
                  <p className="productTab-content-footer__title">IVA:</p>
                  <span className="productTab-content-footer__value">C$ {cart.iva ?? ""}</span>
                </div>
              )}

              {cart.total && cart.total > 0 && (
                <div className="productTab-content__container">
                  <p className="productTab-content-footer__title">Total:</p>
                  <span className="productTab-content-footer__totalValue">
                    C$ {cart.total.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="productTab-footer__payment">
              <Button className="carPanel-btn"
                disabled={sending}
                onClick={handleSendCartPdf}>
                {
                  sending ? <p className="btn_text">Cargando...</p> : <p className="btn_text">Enviar carrito (PDF)</p>
                }
              </Button>

              <Button className="payment-btn"
                disabled={loadingCart}
                onClick={handleSendLink}>
                {
                  loadingCart ? <p className="btn_text">Cargando...</p> : <p className="btn_text"> Procesar pago (Link)</p>
                }
              </Button>

              <Button className="cancelPanel-btn"
                onClick={Cancel}>
                Cancelar envio
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default CarPCPanelTab