/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react"
import Input from "@/Components/Common/Input"
import type { CarDto, ListDetalleCarrito } from "@/Interfaces/Crm/CartPCGInterface"
import EmptyCart from "@/assets/emptycard.webp"
import { toast } from "react-toastify"
import "@/Styles/Ecommerce/cardPCGTab.css"
import Button from "@/Components/Common/Button"
import { useCart } from "@/Hooks/Ecommerce/useCart"
import noimageavailable from "@/assets/noimageavailable.webp"
import { useChatWindow } from "@/Hooks/Chat/useChatWindow"
import { MdDelete } from "react-icons/md"
import {
  selectCarPCG,
  selectCartError,
  selectCartLoading,
  getProductFromCarAsync,
  updateCarAsync,
  setActiveContactId
} from "@/Context/Slices/Ecommerce/cartSlice"
import { format } from 'date-fns';
import { FaFilePdf } from "react-icons/fa";
import { IoIosChatboxes } from "react-icons/io";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux"
import type { RootState, AppDispatch } from "@/Context"
import useContact from "@/Hooks/Auth/useContact"
import { useUserEcommerce } from "@/Hooks/Ecommerce/useUserEcommerce"
import type { UserEcommerceDto } from "@/Interfaces/Ecommerce/UserEcommerceInterface"
import type { SendLinkRequestDto } from "@/Interfaces/Ecommerce/SendLinkInterface"
import useLogCart from "@/Hooks/Crm/useLogCard"
import { UserSessionService } from '@/Services/auth/UserSessionService'
import type { ContactLogInterface } from "@/Interfaces/Auth/ContactInterface"
import { sendInterctiveMessage } from "@/Services/chat/MessageService"
import type { SendInteractiveMessajeRequestDto } from "@/Interfaces/Chat/ChatInterfaces"
import { MdOutlineCancelScheduleSend } from "react-icons/md";
import { IoSend } from "react-icons/io5";
import { selectCartBadgeByContactId, setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice"
import { generateCartPdfFile } from "@/Utils/Pdf/GenerateCartPdfFile"
import { AiOutlineLoading3Quarters } from "react-icons/ai"
import { generateRandomString } from "@/Utils/generateRandomString"
import { formatCurrencyNIO } from "@/Utils/formatCurrencyNIO"

// eslint-disable-next-line react-refresh/only-export-components
export const useAppDispatch: () => AppDispatch = useDispatch
// eslint-disable-next-line react-refresh/only-export-components
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

interface Props {
  conversationId: number
  contactId: number
}

const CarPCPanelTab = ({ conversationId, contactId }: Props) => {
  const [search, setSearch] = useState<string>("")
  const [orderId, setOrderId] = useState<number | null>(null)
  const [cancelLoading, setCancelLoading] = useState<boolean>(false)
  const [sendChatoading, setSendChatoading] = useState<boolean>(false)

  const dispatch = useAppDispatch()
  const carPCG = useAppSelector(selectCarPCG)
  const loading = useAppSelector(selectCartLoading)
  const error = useAppSelector(selectCartError)
  const badgeMap = useAppSelector(selectCartBadgeByContactId)
  const contactHasCart = badgeMap?.[contactId] ?? { hasCart: false, count: 0 }

  // Colócalo cerca de tus hooks dentro del componente:
  const ensureEcommerceRef = useRef<
    Promise<{ ecommerceUserId: number; contact: ContactLogInterface | null }> | null>(null);

  const {
    SendMessageLink,
    GetMessageLink,
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

  const {
    setFile,
    setText,
    handleSend,
    sending
  } = useChatWindow({ conversationId })

  useEffect(() => {
    if (!contactId) return;

    // Este panel representa ESTE contacto
    dispatch(setActiveContactId(contactId));

    return () => {
      // Cuando cambia de conversación o se desmonta
      dispatch(setActiveContactId(null));
    };
  }, [contactId, dispatch]);

  const reqRef = useRef(0);

  useEffect(() => {
    if (!contactId || !conversationId) return;

    const myReq = ++reqRef.current;

    const loadCart = async () => {
      //peticion se manda siempre el conactid bien
      const log = await fetchByContactId(contactId);

      // si ya hubo otra ejecución más nueva, ignorar esta
      if (myReq !== reqRef.current) return;

      const noPedido = log?.orderId && log.orderId > 0 ? log.orderId : 0;
      setOrderId(noPedido > 0 ? noPedido : null);

      console.log("El log es", log);
      console.log("No pedido es", noPedido);

      console.log("COntacto es", contactId)
      //varias veces se usa el getProductFromCarAsync, se envia el valor que es, y en otros no se enviar, solo 0
      const updated = await dispatch(
        getProductFromCarAsync({ codCliente: contactId, noPedido })
      ).unwrap();

      console.log("El carrito es")

      // Si ya hubo otra ejecución más nueva, ignorar esta
      if (myReq !== reqRef.current) return;

      // Determinar si el carrito está vacío
      const arr = Array.isArray(updated) ? updated : []

      const count =
        arr[0]?.listDetalle?.reduce((sum, d) => sum + Number(d.cantidad ?? 0), 0) ?? 0

      dispatch(
        setContactCartBadge({
          contactId,
          hasCart: count > 0,
          count,
        })
      )
    };

    void loadCart();
  }, [contactId]);

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

    const updated = await dispatch(getProductFromCarAsync({ codCliente: contactId ?? 0, noPedido })).unwrap()
    const arr = Array.isArray(updated) ? updated : []
    const count = arr[0]?.listDetalle?.length ?? 0
    const empty = count === 0

    dispatch(setContactCartBadge({
      contactId,
      hasCart: !empty,
      count
    }))

    if (empty) {
      const existingLog = await fetchByContactId(contactId)
      if (existingLog?.id) await UpdatedStatus(existingLog.id, 3)
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

  const cart = carPCG?.[0];
  const detailsCount = cart?.listDetalle?.length ?? 0;

  const showEmpty = !contactHasCart.hasCart || detailsCount === 0;

  if (showEmpty) {
    return (
      <div className="carPCPanel-container">
        <header className="carPCPanel-header">
          <h5 className="productTab-content-header__title">Carrito</h5>
        </header>
        <div className="carPCPanel-emptyContainer">
          <img src={EmptyCart} alt="empty" className="cardPanel-emptyImage" />
          <p className="cardPanel--emptyText">No hay productos en el carrito.</p>
        </div>
      </div>
    );
  }

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

  const buildCartChatMessage = (cart: CarDto, opts?: {
    orderId?: number | null;
    //  payLink?: string | null; 
    deliveryDate?: string | null
  }) => {
    const lines: string[] = []

    // Encabezado
    lines.push(`🛍️ Pedido No ${opts?.orderId ?? cart.noPedido ?? "N/D"}`)
    lines.push("")
    lines.push("🛒 Artículos:")
    lines.push("")

    // Detalles
    cart.listDetalle?.forEach((d) => {
      const qty = d.cantidad ?? 0
      const title = (d.descripcion ?? "").trim()
      if (!title) return

      lines.push(`*${title}* - ${qty}`)

      // opciones/modificadores debajo, estilo indentado
      const opciones = d.listOpciones?.map(o => (o.descripcionOp.trim() + " - " + o.cantidad.toString().trim()).trim()).filter(Boolean) ?? []
      opciones.forEach(op => lines.push(`   ${op}`))

      lines.push("") // espacio entre productos
    })

    // Totales
    const total = cart.total ?? 0
    lines.push(`*🪙 Total:* ${formatCurrencyNIO(total)} | *Más Envío*`)


    if (opts?.deliveryDate) {
      lines.push(`🗓️ Fecha de entrega: ${opts.deliveryDate}`)
    }

    // if (opts?.payLink) {
    //   lines.push(`🔗 Link de pago: ${opts.payLink}`)
    // }

    return lines.join("\n").trim()
  }

  const Cancel = async () => {
    if (cart == null) return

    setCancelLoading(true)
    const res = await UserSessionService.revokeCartTempLink(orderId!)

    if (res.success) toast.success(res.message)
    setCancelLoading(false)
  }

  const ensureEcommerceUser = async (): Promise<{
    ecommerceUserId: number;
    contact: ContactLogInterface | null;
  }> => {
    // Evita que se ejecute dos veces al mismo tiempo (doble click / render / race)
    if (ensureEcommerceRef.current) return ensureEcommerceRef.current;

    ensureEcommerceRef.current = (async () => {
      try {
        const contact = await getById(contactId);

        if (!contact) {
          toast.error("No se pudo obtener el contacto");
          return { ecommerceUserId: 0, contact: null };
        }

        const existingId = Number(contact.ecommerceUserId ?? 0);
        if (existingId > 0) {
          return { ecommerceUserId: existingId, contact };
        }

        // Crear usuario ecommerce
        const date = new Date();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear() - 20;

        const phone = (contact.phone ?? "").replace(/^505/, "").trim();

        const createUserEcommerce: UserEcommerceDto = {
          nombres: (contact.fullName ?? contact.waName ?? "").trim(),
          apellidos: (contact.fullName ?? contact.waName ?? "").trim(),
          codReferencia: "",
          idUsuario: 0,
          correo: (contact.email ?? "").trim(),
          telefono: phone,
          tokenReferencia: "",
          clave: generateRandomString(),
          fechaNacimiento: `${day}/${month}/${year}`,
        };

        const res = await CreateAsync(createUserEcommerce);
        const ecommerceUserId = Number(res);


        if (!ecommerceUserId || Number.isNaN(ecommerceUserId) || ecommerceUserId <= 0) {
          toast.error("No se pudo crear el usuario ecommerce");
          return { ecommerceUserId: 0, contact };
        }

        await UpdateEcommerceUserAsync(contactId, ecommerceUserId);

        // Devuelve el contacto actualizado sin re-consultar
        const updatedContact = { ...contact, ecommerceUserId };
        return { ecommerceUserId, contact: updatedContact };
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ??
          err?.message ??
          "Error inesperado al asegurar usuario ecommerce";

        toast.error(msg);
        return { ecommerceUserId: 0, contact: null };
      }
    })();

    try {
      return await ensureEcommerceRef.current;
    } finally {
      // Importante: liberar el lock aunque haya error
      ensureEcommerceRef.current = null;
    }
  };

  
  const handleSendLink = async (returnLink: boolean = false) => {
    setSendChatoading(true);

    const { ecommerceUserId, contact } = await ensureEcommerceUser();
    if (!ecommerceUserId || !contact) {
      setSendChatoading(false);
      return;
    }

    const existingLog = await fetchByContactId(contactId);
    const orderIdToSend = existingLog?.orderId ?? 0;

    if (!orderIdToSend) {
      toast.error("No hay pedido asociado a este contacto.");
      setSendChatoading(false);
      return;
    }

    const sendLinkRequest: SendLinkRequestDto = {
      conversationId,
      orderId: orderIdToSend,
      ecommerceUserId,
      email: contact.email ?? "",
      fullName: contact.fullName ?? "",
      contactId,
    };

    if (returnLink) {
      setSendChatoading(false);
      return GetMessageLink(sendLinkRequest);
    }

    await SendMessageLink(sendLinkRequest);
    setSendChatoading(false);
  };

  const handleSendCartChat = async () => {
    if (!cart || sending) return;

    const { ecommerceUserId } = await ensureEcommerceUser();
    if (!ecommerceUserId) return;

    const msg = buildCartChatMessage(cart, {
      orderId,
      deliveryDate: format(cart.fecha, "dd/MM/yyyy"),
    });

    if (!msg) return;

    const req: SendInteractiveMessajeRequestDto = {
      conversationId,
      contactId,
      body: msg,
    };

    await sendInterctiveMessage(req);
  };

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
              <p className="carPCPanel-content__list-price">C$ {detail.precioV.toFixed(2)}</p>
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

        {contactHasCart && (
          <>

          
            <div className="productTab-content-footer">



              <div className="productTab-content__inputContaner">
              <div className="productTab-content__inputs">
                <textarea rows={5} name="descripcion"  id="descripcion"  className="productTab-content__input" placeholder="dirección"/>
               <div className="transportationCost__input">
                 <input type="number" min={1} name="shipment"  id="shipment" placeholder="C$ transporte " className="productTab-content__input transportationCost"/>
               </div>
              </div>
            </div>

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
              <Button
                className="carPanel-btn"
                disabled={sending}
                onClick={handleSendCartPdf}>
                {
                  sending ? <p className="btn_text"> <AiOutlineLoading3Quarters fontSize={16} /></p> :
                    <p className="btn_text"><FaFilePdf fontSize={16} /></p>
                }
              </Button>

              <Button
                className="carPanel-btn"
                disabled={sendChatoading || sending}
                onClick={handleSendCartChat}>
                {
                  sendChatoading ?
                    <p className="btn_text"> <AiOutlineLoading3Quarters fontSize={16} /></p>
                    : <p className="btn_text"> <IoIosChatboxes fontSize={16} /></p>
                }
              </Button>

              <Button
                className="cancelPanel-btn"
                disabled={loadingCart || sending}
                onClick={Cancel}>
                {
                  cancelLoading ? <p className="btn_text"> <AiOutlineLoading3Quarters fontSize={16} /></p> : <p className="btn_text"> <MdOutlineCancelScheduleSend fontSize={16} /></p>
                }
              </Button>

              <Button
                className="payment-btn"
                disabled={loadingCart || sending}
                onClick={async () => {
                  await handleSendLink(false)
                }}>
                {
                  loadingCart ? <p className="btn_text"><AiOutlineLoading3Quarters fontSize={16} /></p> : <p className="btn_text"><IoSend fontSize={16} /></p>
                }
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default CarPCPanelTab;