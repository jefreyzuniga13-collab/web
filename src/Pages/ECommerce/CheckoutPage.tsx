/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
// import { FaRegCreditCard } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
// import VisaLogo from "@/assets/visaLogo.png";
// import MasterCardLogo from "@/assets/masterCardLogo.png";
import useInvoiceOrder from "@/Hooks/Ecommerce/useInvoiceOrder";
import MapPicker from "@/Components/Common/MapPicker";
import { useClientLocation } from "@/Hooks/Ecommerce/useClientLocation";
import type { ClientLocationDto, Coords, LocationMode } from "@/Interfaces/Ecommerce/ClientLocationInterface";
import type {
  InvoiceOrderRequestDto,
  NearestBranchRequestDto,
  Currencyto,
  CheckoutStep,
  PaymentMethod,
  BillingFormState,
  CardFormState
} from "@/Interfaces/Ecommerce/InvoiceOrderInterface";
import { toast } from "react-toastify";
import "@/Styles/Ecommerce/CheckoutPage.css";
import * as turf from "@turf/turf";
import { selectCarPCG, getProductFromCarAsync } from "@/Context/Slices/Ecommerce/cartSlice";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { AppDispatch, RootState } from "@/Context";
import { UserSessionService } from "@/Services/auth/UserSessionService";
import useLogCart from "@/Hooks/Crm/useLogCard";
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice";
import { generateOrdeFacPDFFile } from "@/Utils/Pdf/PrintDetFac";
import { sendMediaEcommerce } from "@/Services/chat/MessageService";
import { formatCardNumber, formatCvc, formatExpiry, validateBillingForm, validateCardForm, validateLocation } from "@/Utils/validation";
import { PaymentMethodComponent } from "@/Components/ECommerce/PaymentMethod";
import { Currency } from "@/Components/ECommerce/Currency";

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;


function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const from = turf.point([lon1, lat1]);
  const to = turf.point([lon2, lat2]);
  return turf.distance(from, to, { units: "kilometers" });
}

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const payload = location.state?.payload as
    | {
        fullName: string;
        email: string;
        ecommerceUserId: number;
        expiresAtUtc: string;
        orderId: number;
        conversationId: number;
        contactId: number;
        userId: number;
      }
    | undefined;

  const [ecommerceUserId, setEcommerceUserId] = useState<number>(0);
  const [orderId, setOrderId] = useState<number>(0);
  const [userFullName, setUserFullName] = useState<string>("");

  useEffect(() => {
    if (!payload) {
      navigate("/unauthorized");
      return;
    }

    if (new Date(payload.expiresAtUtc).getTime() < Date.now()) {
      navigate("/unauthorized");
      return;
    }

    setEcommerceUserId(payload.ecommerceUserId);
    setOrderId(payload.orderId);
    setUserFullName(payload.fullName);
  }, [payload, navigate]);

  const [step, setStep] = useState<CheckoutStep>("location");
  const [method, setMethod] = useState<PaymentMethod>("card");

  const [billingForm, setBillingForm] = useState<BillingFormState>({
    firstName: "",
    lastName: "",
    email: "",
    country: "NI",
    city: "",
    address: "",
    addressName: ""
  });

  const [cardForm, setCardForm] = useState<CardFormState>({
    cardNumber: "",
    expiry: "",
    cvc: "",
    nameOnCard: ""
  });

  const [selectedCoords, setSelectedCoords] = useState<Coords | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currencyto | null>(null);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [tip, setTip] = useState<number>(0);
    const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transfer, setTransfer] = useState<number>(0);

  const [locationMode, setLocationMode] = useState<LocationMode>("new");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const [transpCost, setTranspCost] = useState<number>(0);
  const [nearestBranch, setNearestBranch] = useState<any | null>(null);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [lastCoordsKey, setLastCoordsKey] = useState<string>("");

  const [payNowLock, setPayNowLock] = useState<boolean>(false);
  const [payNowCooldown, setPayNowCooldown] = useState<number>(0);

  const dispatch = useAppDispatch();
  const carPCG = useAppSelector(selectCarPCG);

  const {
    CreateAsync: createInvoiceAsync,
    currency,
    GetCurrencyAsync,
    GetTransportationCostAsync,
    GetNearestBranchAsync,
    loading: invoiceLoading,
    PrintDetFacAsync
  } = useInvoiceOrder();

  const { fetchByContactId, UpdatedStatus } = useLogCart();

  const { CreateAsync: createLocationAsync, GetAsync, clientLocation } = useClientLocation();

  useEffect(() => {
    if (!orderId || !ecommerceUserId || !payload?.orderId) return;

    let cancelled = false;

    const loadCart = async () => {
      try {
        if (!payload?.orderId) return;

        await dispatch(getProductFromCarAsync({ codCliente: 0, noPedido: payload.orderId })).unwrap();
        if (cancelled) return;

        await GetCurrencyAsync();
        if (cancelled) return;

        await GetAsync(ecommerceUserId);
      } catch {
        //
      }
    };

    void loadCart();

    return () => {
      cancelled = true;
    };
  }, [orderId, ecommerceUserId, dispatch, GetCurrencyAsync, GetAsync, payload?.orderId]);

  useEffect(() => {
    if (userFullName) {
      const parts = userFullName.split(" ");
      setBillingForm(prev => ({
        ...prev,
        firstName: parts[0] ?? "",
        lastName: parts.slice(1).join(" ") ?? ""
      }));
    }
  }, [userFullName]);

  const addressList = useMemo(
    () => (Array.isArray(clientLocation) ? clientLocation : clientLocation ? [clientLocation] : []),
    [clientLocation]
  );

  const selectedAddress = useMemo(
    () =>
      selectedAddressId
        ? addressList.find(a => a.idDireccion === selectedAddressId) ?? null
        : null,
    [addressList, selectedAddressId]
  );

  useEffect(() => {
    if (addressList.length > 0 && !selectedAddressId && locationMode === "existing") {
      const first = addressList[0];
      setSelectedAddressId(first.idDireccion);
      setSelectedCoords({ latitud: first.latitud, longitud: first.longitud });
      setBillingForm(prev => ({
        ...prev,
        address: first.descripcion ?? prev.address
      }));
    } else if (addressList.length === 0 && locationMode === "existing") {
      setLocationMode("new");
      setSelectedAddressId(null);
    }
  }, [addressList, selectedAddressId, locationMode]);

  useEffect(() => {
    if (!selectedCoords || locationMode !== "new") return;

    const fetchAddress = async () => {
      const { latitud, longitud } = selectedCoords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitud}&lon=${longitud}&format=json&addressdetails=1`
      );
      const data = await res.json();

      setBillingForm(prev => ({
        ...prev,
        country: data.address?.country ?? prev.country,
        city: data.address?.city ?? data.address?.town ?? data.address?.village ?? prev.city,
        address: data.display_name ?? prev.address
      }));
    };

    void fetchAddress();
  }, [selectedCoords, locationMode]);

  useEffect(() => {
    if (locationMode === "new") {
      setSelectedAddressId(null);
      setNearestBranch(null);
      setDistanceKm(0);
      setTranspCost(0);
      setLastCoordsKey("");
    } else {
      setSelectedCoords(null);
      setNearestBranch(null);
      setDistanceKm(0);
      setTranspCost(0);
      setLastCoordsKey("");
    }
  }, [locationMode]);

  useEffect(() => {
    if (payNowCooldown <= 0) return;

    const t = window.setInterval(() => {
      setPayNowCooldown(s => (s <= 1 ? 0 : s - 1));
    }, 1000);

    return () => window.clearInterval(t);
  }, [payNowCooldown]);

  const toastError = (msg: string) => {
    toast.error(msg);
    return false;
  };

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setBillingForm(prev => ({ ...prev, [id]: value }));
  };

  const onCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardForm(p => ({ ...p, cardNumber: formatCardNumber(e.target.value) }));
  };

  const onExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardForm(p => ({ ...p, expiry: formatExpiry(e.target.value) }));
  };

  const onCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardForm(p => ({ ...p, cvc: formatCvc(e.target.value) }));
  };

  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardForm(p => ({ ...p, nameOnCard: e.target.value }));
  };

  const handleCoordsChange = (coords: Coords) => setSelectedCoords(coords);

  // //tres metodos de pago, transfer, cash, card
  // const handleSelectCurrency = (item: Currencyto) => {
  //   setSelectedCurrency(item);
  //   //efectivo, Transferencia. y PinPad Credomatic
  //   const isCash =
  //     item.descripcion_Pago.toLowerCase().includes("efectivo") ||
  //     item.moneda_Fija.toLowerCase().includes("efectivo");

  //   setMethod(isCash ? "cash" : "card");
  // };

  // tres métodos de pago: transfer, cash, card


  const normalize = (v: string) => v.toLowerCase().trim();

  const handleSelectCurrency = (item: Currencyto) => {
  setSelectedCurrency(item);

  const desc = normalize(item.descripcion_Pago);
  const moneda = normalize(item.moneda_Fija);

  let method: "cash" | "transfer" | "card" = "card";

  if (desc.includes("efectivo") || moneda.includes("efectivo")) {
    method = "cash";
  } else if (
    desc.includes("transfer") ||
    desc.includes("transferencia") ||
    moneda.includes("transfer")
  ) 
  {
    method = "transfer";
  }

  setMethod(method);
};


  const getCoordsForFlow = (): Coords | null => {
    if (locationMode === "existing") {
      const addr = selectedAddress ?? addressList[0];
      if (!addr) return null;
      return { latitud: Number(addr.latitud), longitud: Number(addr.longitud) };
    }
    if (!selectedCoords) return null;
    return { latitud: Number(selectedCoords.latitud), longitud: Number(selectedCoords.longitud) };
  };

  const coordsKey = (c: Coords) =>
    `${Number(c.latitud).toFixed(6)}|${Number(c.longitud).toFixed(6)}`;

  const computeTransportPreview = async (coords: Coords) => {
    const key = coordsKey(coords);

    if (key === lastCoordsKey && nearestBranch && transpCost >= 0) {
      return { nearest: nearestBranch, cost: transpCost, km: distanceKm };
    }

    const branchReq: NearestBranchRequestDto = {
      latitud: coords.latitud,
      longitud: coords.longitud
    };

    const branchResp = await GetNearestBranchAsync(branchReq);
    const nearest = Array.isArray(branchResp) && branchResp.length > 0 ? branchResp[0] : branchResp;

    if (!nearest) return null;

    const lat1 = Number(coords.latitud);
    const lon1 = Number(coords.longitud);
    const lat2 = Number(nearest.latitud);
    const lon2 = Number(nearest.longitud);

    if ([lat1, lon1, lat2, lon2].some(v => Number.isNaN(v))) return null;

    const km = calculateDistance(lat1, lon1, lat2, lon2);
    const cost = await GetTransportationCostAsync(km);

    setNearestBranch(nearest);
    setDistanceKm(km);
    setTranspCost(Number(cost ?? 0));
    setLastCoordsKey(key);

    return { nearest, cost: Number(cost ?? 0), km };
  };

  const handleGoToCurrency = async () => {
    if (!validateLocation(locationMode, selectedAddressId, selectedCoords)) return;
        if (!validateBillingForm(billingForm, locationMode)) return;

    const coords = getCoordsForFlow();
    if (!coords) return toastError("Debes seleccionar la ubicación.");

    try {
      const preview = await computeTransportPreview(coords);
      if (!preview) return toastError("No fue posible calcular el costo de transporte.");
      setStep("currency");
    } catch {
      toastError("No fue posible calcular el costo de transporte.");
    }
  };

  const handleGoToPayment = () => {
    if (!validateLocation(locationMode, selectedAddressId, selectedCoords)) return;
    if (!validateBillingForm(billingForm, locationMode)) return;
    setStep("paymentMethod");
  };

  const handlePayNow = async () => {
    if (payNowLock || payNowCooldown > 0) return;

    setPayNowLock(true);
    setPayNowCooldown(5);

    try {
      if (!carPCG || carPCG.length === 0) return void toastError("El carrito está vacío.");
      if (!selectedCurrency) return void toastError("Debe seleccionar un método de pago.");
      if (!validateBillingForm(billingForm, locationMode)) return;
      if (!validateLocation(locationMode, selectedAddressId, selectedCoords)) return;
      if (method === "card" && !validateCardForm(cardForm)) return;

      const cart = carPCG[0];
      const total = cart.total ?? 0;

      if (method === "cash") {
        if (cashAmount <= 0) return void toastError("El monto en efectivo debe ser mayor a 0.");
        if (tip > cashAmount) return void toastError("La propina no puede ser mayor al monto ingresado.");

        const disponible = cashAmount - tip;
        if (disponible < total) {
          return void toastError(
            `Monto insuficiente. Te quedan C$${disponible} disponibles y el total es C$${total}.`
          );
        }
      }


       if (method === "transfer") {
        if (transferAmount <= 0) return void toastError("El monto en efectivo debe ser mayor a 0.");
        //numero de referencia de la tarjeta
        if (transfer > cashAmount) return void toastError("La propina no puede ser mayor al monto ingresado.");

        const disponible = cashAmount - tip;
        if (disponible < total) {
          return void toastError(
            `Monto insuficiente. Te quedan C$${disponible} disponibles y el total es C$${total}.`
          );  
        }
      }

      const coords = getCoordsForFlow();
      if (!coords) return void toastError("Debes seleccionar la ubicación.");

      const preview = await computeTransportPreview(coords);
      if (!preview?.nearest) return void toastError("No hay sucursal cercana disponible.");

      const nearest = preview.nearest;
      const transporte = Number(preview.cost ?? 0);

      let finalLocation: ClientLocationDto | null = null;

      if (locationMode === "existing") {
        const addr = selectedAddress ?? addressList[0];
        if (!addr) return void toastError("No hay dirección seleccionada.");

        finalLocation = {
          idDireccion: addr.idDireccion,
          nombre: addr.nombre,
          referencia: addr.referencia,
          descripcion: addr.descripcion,
          latitud: addr.latitud,
          longitud: addr.longitud,
          idUsuario: ecommerceUserId
        };
      } else {
        const locationPayload: ClientLocationDto = {
          idDireccion: 0,
          nombre: billingForm.addressName || billingForm.address,
          referencia: `${billingForm.city}, ${billingForm.country}`,
          descripcion: billingForm.address,
          latitud: coords.latitud,
          longitud: coords.longitud,
          idUsuario: ecommerceUserId
        };

        const newLocation = await createLocationAsync(locationPayload);
        if (!newLocation) return void toastError("No fue posible guardar la nueva dirección.");
        finalLocation = newLocation;
      }

      if (!finalLocation) return void toastError("No se pudo determinar la dirección final.");

      const change = method === "cash" ? Math.max(cashAmount - total - tip, 0) : 0;

      const invoiceReq: InvoiceOrderRequestDto = {
        idUsuario: ecommerceUserId.toString(),
        nombrede: `${billingForm.firstName} ${billingForm.lastName}`,
        registroMaquina: `CRM ${ecommerceUserId}`,
        noIdentificacion: "",
        observaciones: "",
        noPedido: Number(orderId),

        transporte: Number(transporte ?? 0),
        propina: method === "cash" ? Number(tip) : 0,
        tipoServicio: 8,
        idEstado: 15,
        codSucursal: String(nearest.codSucursal),

        direcciones: {
          idDireccion: Number(finalLocation.idDireccion),
          nombre: String(finalLocation.nombre),
          referencia: String(finalLocation.referencia),
          descripcion: String(finalLocation.descripcion).trim(),
          latitud: Number(finalLocation.latitud),
          longitud: Number(finalLocation.longitud)
        },

        detPago: {
          monto: Number(total + transpCost + tip),
          codBanco: String(selectedCurrency.codigo_Banco).trim(),
          montoC: Number(total + transpCost + tip),
          cambio: Number(change),
          valor_Pagar: Number(total + transpCost + tip),
          nomsol: String(selectedCurrency.descripcion_Pago).trim(),
          registro_maquina: `CRM ${ecommerceUserId}`,
          codPago: Number(selectedCurrency.codExterno),
          codPagoNew: Number(selectedCurrency.codPago)
        }
      };

      const res = await createInvoiceAsync(invoiceReq);

      if (res?.success) {
        if (
          payload != null &&
          payload.conversationId > 0 &&
          payload.orderId > 0 &&
          payload.contactId > 0
        ) {
          const existingLog = await fetchByContactId(payload.contactId);

          await UpdatedStatus(existingLog!.id, 3);
          await UserSessionService.revokeCartTempLink(orderId);

          dispatch(setContactCartBadge({ contactId: payload.contactId, hasCart: false, count: 0 }));

          const resPrintPDF = await PrintDetFacAsync(res.data);

          if (resPrintPDF) {
            const pdfBlob = generateOrdeFacPDFFile(resPrintPDF);

            if (!(pdfBlob instanceof Blob) || pdfBlob.size < 100) {
              throw new Error("El PDF generado está vacío o inválido.");
            }

            const head = new Uint8Array(await pdfBlob.slice(0, 5).arrayBuffer());
            const magic = String.fromCharCode(...head);
            if (magic !== "%PDF-") {
              throw new Error(`El archivo no parece PDF válido (magic=${magic}).`);
            }

            const noFactura = String(resPrintPDF.DatosGenerales?.NoFactura ?? "").trim();
            const fileName = `Factura-${noFactura || "SN"}.pdf`;

            const mime = pdfBlob.type || "application/pdf";
            const file = new File([pdfBlob], fileName, { type: mime });

            await sendMediaEcommerce(payload.conversationId, file, "");
          }
        }

        navigate("/successOrder", { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Error procesando pago");
      await UserSessionService.revokeCartTempLink(orderId);
      navigate("/unauthorized", { replace: true });
    } finally {
      window.setTimeout(() => {
        setPayNowLock(false);
      }, 500);
    }
  };

  const payNowDisabled = payNowLock || payNowCooldown > 0;

  return (
    <section className="checkout-page">
      <div className="checkout-shell">
        <h1 className="checkout-page__title">Checkout</h1>

        <div className="checkout-main">
          <div className="checkout-left">
            {step === "location" && (
             
             <div className="checkout-section checkout-section__location">
                <div className="checkout-location__container">
                  <h2 className="checkout-section__title">Selecciona la ubicación y tus datos</h2>

                  <div className="checkout-location-mode">
                    {addressList.length > 0 ? (
                      <>
                        <label className="checkout-location-option">
                          <input
                            type="radio"
                            name="locationMode"
                            value="existing"
                            checked={locationMode === "existing"}
                            onChange={() => setLocationMode("existing")}
                          />
                          Usar una dirección guardada
                        </label>
                        <label className="checkout-location-option">
                          <input
                            type="radio"
                            name="locationMode"
                            value="new"
                            checked={locationMode === "new"}
                            onChange={() => {
                              setLocationMode("new");
                              setSelectedAddressId(null);
                            }}
                          />
                          Usar nueva dirección en el mapa
                        </label>
                      </>
                    ) : (
                      <p>No tienes direcciones guardadas. Selecciona una ubicación en el mapa.</p>
                    )}
                  </div>

                  {locationMode === "existing" && addressList.length > 0 && (
                    <div className="checkout-address-list">
                      {addressList.map(addr => (
                        <button
                          key={addr.idDireccion}
                          type="button"
                          className={
                            selectedAddressId === addr.idDireccion
                              ? "checkout-address checkout-address--active"
                              : "checkout-address"
                          }
                          onClick={() => {
                            setSelectedAddressId(addr.idDireccion);
                            setSelectedCoords({ latitud: addr.latitud, longitud: addr.longitud });
                            setBillingForm(prev => ({
                              ...prev,
                              address: addr.descripcion ?? prev.address
                            }));
                          }}
                        >
                          <span className="checkout-address__name">{addr.nombre}</span>
                          <span className="checkout-address__description">{addr.descripcion}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {locationMode === "existing" && selectedAddress && (
                    <div className="checkout-current-location">
                      <p>
                        <strong>Dirección seleccionada:</strong>
                      </p>
                      <p>{selectedAddress.descripcion}</p>
                    </div>
                  )}

                  {locationMode === "new" && (
                    <>
                      <MapPicker value={selectedCoords} onChange={handleCoordsChange} />
                    </>
                  )}
                  
                </div>

                <div className="checkout-grid__container">
                  {locationMode === "existing" && selectedAddress && (
                    <div className="checkout-current-location">
                      <p>
                        <strong>Dirección seleccionada:</strong>
                      </p>
                      <p>{selectedAddress.descripcion}</p>
                    </div>
                  )}

                  {locationMode === "new" && (
                      <div className="checkout-current-location">
                      <p className="checkout-location__hint">
                        Haz clic en el mapa para marcar el lugar de entrega.
                      </p>
                    </div>
                  )}

                <div className="checkout-grid">
                  <div className="checkout-field">
                    <label className="checkout-label" htmlFor="firstName">
                      Nombre
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      className="checkout-input"
                      value={billingForm.firstName}
                      onChange={handleBillingChange}
                    />
                  </div>

                  <div className="checkout-field">
                    <label className="checkout-label" htmlFor="lastName">
                      Apellidos
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      className="checkout-input"
                      value={billingForm.lastName}
                      onChange={handleBillingChange}
                    />
                  </div>

                  <div className="checkout-field">
                    <label className="checkout-label" htmlFor="country">
                      País
                    </label>
                    <input
                      id="country"
                      type="text"
                      className="checkout-input"
                      value={billingForm.country}
                      onChange={handleBillingChange}
                    />
                  </div>

                  <div className="checkout-field">
                    <label className="checkout-label" htmlFor="city">
                      Ciudad
                    </label>
                    <input
                      id="city"
                      type="text"
                      className="checkout-input"
                      value={billingForm.city}
                      onChange={handleBillingChange}
                    />
                  </div>

                  <div className="checkout-field checkout-field--full">
                    <label className="checkout-label" htmlFor="address">
                      Dirección
                    </label>
                    <input
                      id="address"
                      type="text"
                      className="checkout-input"
                      value={billingForm.address}
                      onChange={handleBillingChange}
                    />
                  </div>

                  {locationMode === "new" && (
                    <div className="checkout-field checkout-field--full">
                      <label className="checkout-label" htmlFor="addressName">
                        Nombre de la dirección
                      </label>
                      <input
                        id="addressName"
                        type="text"
                        className="checkout-input"
                        value={billingForm.addressName}
                        onChange={handleBillingChange}
                      />
                    </div>
                  )}

                                  {/* <div className="checkout-actionBtn"> */}
                  <button type="button" className="checkout-paybtn" onClick={handleGoToCurrency}>
                    Continuar a pago
                  </button>
                {/* </div> */}

                </div>
                </div>
              </div>
           
           )}

            {step === "currency" && (

              <Currency
                step={step}
                currency={currency}
                selectedCurrency={selectedCurrency}
                handleSelectCurrency={handleSelectCurrency}
                invoiceLoading={invoiceLoading}
                setStep={setStep}
                handleGoToPayment={handleGoToPayment}
              />
              // <div className="checkout-methods-list">
              //   <h2 className="checkout-section__title">Selecciona cómo deseas pagar</h2>

              //   <div className="checkout-methods-list">
              //     {currency.map(item => (
              //       <button
              //         key={item.codPago}
              //         type="button"
              //         className={
              //           selectedCurrency?.codPago === item.codPago
              //             ? "checkout-method checkout-method--active"
              //             : "checkout-method"
              //         }
              //         onClick={() => handleSelectCurrency(item)}
              //       >
              //         <div className="checkout-method__left">
              //           <span className="checkout-radio">
              //             <span
              //               className={
              //                 selectedCurrency?.codPago === item.codPago
              //                   ? "checkout-radio__dot checkout-radio__dot--active"
              //                   : "checkout-radio__dot"
              //               }
              //             />
              //           </span>
              //           <span className="checkout-method__label">{item.descripcion_Pago}</span>
              //         </div>
              //       </button>
              //     ))}
              //   </div>

              //   {selectedCurrency && (
              //     <div className="checkout-selected-currency">
              //       <p>Método seleccionado:</p>
              //       <strong>{selectedCurrency.descripcion_Pago}</strong>
              //     </div>
              //   )}

              //   <div className="checkout-actionBtn">
              //     <button
              //       type="button"
              //       className="checkout-paybtn__back"
              //       onClick={() => setStep("location")}
              //       disabled={invoiceLoading}
              //     >
              //       Regresar
              //     </button>
              //     <button
              //       type="button"
              //       className="checkout-paybtn"
              //       onClick={handleGoToPayment}
              //       disabled={invoiceLoading}
              //     >
              //       {invoiceLoading ? "Cargando" : " Continuar"}
              //     </button>
              //   </div>
              // </div>
            )}

            {step === "paymentMethod" && (

              <PaymentMethodComponent
                step={step} 
                setStep={setStep}
                method={method}
                distanceKm={distanceKm}
                transpCost={transpCost}
                cardForm={cardForm}
                tip={tip}
                setTip={setTip}
                onExpiryChange={onExpiryChange}
                onCardNumberChange={onCardNumberChange}
                onCvcChange={onCvcChange}
                onNameChange={onNameChange}
                cashAmount={cashAmount}
                setCashAmount={setCashAmount}
                carPCG={carPCG}
                payNowDisabled={payNowDisabled}
                payNowLock={payNowLock}
                handlePayNow={handlePayNow}
                transferAmount={transferAmount}
                setTransferAmount={setTransferAmount}
                transfer={transfer}
                setTransfer={setTransfer}
              />
              // <div className="checkout-section">
              //   <h2 className="checkout-section__title">Método de pago</h2>

              //   {method === "card" && (
              //     <>
              //       <div className="checkout-methods">
              //         <div className="checkout-method checkout-method--active">
              //           <div className="checkout-method__left">
              //             <span className="checkout-radio">
              //               <span className="checkout-radio__dot checkout-radio__dot--active" />
              //             </span>
              //             <FaRegCreditCard className="checkout-method__icon" />
              //             <span className="checkout-method__label">Tarjeta</span>
              //           </div>

              //           <div className="checkout-method__brands">
              //             <img src={VisaLogo} className="checkout-card-brand" />
              //             <img src={MasterCardLogo} className="checkout-card-brand" />
              //           </div>
              //         </div>
              //       </div>

              //       <form className="checkout-cardform" onSubmit={e => e.preventDefault()}>
              //         <p>
              //           Costo de transporte C$ {Number(transpCost ?? 0)}
              //           {distanceKm > 0 ? ` (${distanceKm.toFixed(2)} km)` : ""}
              //         </p>

              //         <div className="checkout-field checkout-field--full">
              //           <label className="checkout-label" htmlFor="cardNumber">
              //             Número de tarjeta
              //           </label>
              //           <input
              //             id="cardNumber"
              //             type="text"
              //             inputMode="numeric"
              //             autoComplete="cc-number"
              //             className="checkout-input"
              //             placeholder="1234 5678 9012 3456"
              //             value={cardForm.cardNumber}
              //             onChange={onCardNumberChange}
              //           />
              //         </div>

              //         <div className="checkout-cardform__row">
              //           <div className="checkout-field">
              //             <label className="checkout-label" htmlFor="expiry">
              //               Expiración
              //             </label>
              //             <input
              //               id="expiry"
              //               type="text"
              //               inputMode="numeric"
              //               autoComplete="cc-exp"
              //               className="checkout-input"
              //               placeholder="MM/AA"
              //               value={cardForm.expiry}
              //               onChange={onExpiryChange}
              //             />
              //           </div>

              //           <div className="checkout-field">
              //             <label className="checkout-label" htmlFor="cvc">
              //               CVC
              //             </label>
              //             <input
              //               id="cvc"
              //               type="text"
              //               inputMode="numeric"
              //               autoComplete="cc-csc"
              //               className="checkout-input"
              //               placeholder="CVC"
              //               value={cardForm.cvc}
              //               onChange={onCvcChange}
              //             />
              //           </div>
              //         </div>

              //         <div className="checkout-field checkout-field--full">
              //           <label className="checkout-label" htmlFor="nameOnCard">
              //             Nombre en tarjeta
              //           </label>
              //           <input
              //             id="nameOnCard"
              //             type="text"
              //             autoComplete="cc-name"
              //             className="checkout-input"
              //             value={cardForm.nameOnCard}
              //             onChange={onNameChange}
              //           />
              //         </div>
              //       </form>
              //     </>
              //   )}

              //   {method === "cash" && (
              //     <div className="checkout-cash">
              //       <div className="checkout-field checkout-field--full">
              //         <label className="checkout-label" htmlFor="cashAmount">
              //           Monto con el que pagas
              //         </label>
              //         <input
              //           id="cashAmount"
              //           type="number"
              //           className="checkout-input"
              //           value={cashAmount}
              //           onChange={e => setCashAmount(Number(e.target.value))}
              //         />
              //       </div>

              //       <div className="checkout-field checkout-field--full">
              //         <label className="checkout-label" htmlFor="tip">
              //           Propina
              //         </label>
              //         <input
              //           id="tip"
              //           type="number"
              //           className="checkout-input"
              //           value={tip}
              //           onChange={e => setTip(Number(e.target.value))}
              //         />
              //       </div>
              //     </div>
              //   )}

              //   {carPCG && carPCG.length > 0 && (
              //     <aside className="checkout-summary">
              //       <p className="checkout-summary__title">Resumen</p>
              //       <div className="checkout-summary__Cost_cost">
              //         <p className="checkout-summary__content">
              //           Subtotal: <span>{carPCG[0].subTotal}</span>
              //         </p>

              //         {carPCG[0].descuento != null && carPCG[0].descuento > 0 && (
              //           <p className="checkout-summary__content">
              //             Descuento: <span>{carPCG[0].descuento}</span>
              //           </p>
              //         )}

              //         <p className="checkout-summary__content">
              //           IVA: <span>{carPCG[0].iva}</span>
              //         </p>

              //         <p className="checkout-summary__content">
              //           Transporte: <span>{transpCost}</span>
              //         </p>
              //         <p className="checkout-summary__content">
              //           Total:
              //           <span className="checkout-summary__content__total">
              //             C$
              //             {(Number(carPCG[0].total ?? 0) + Number(transpCost ?? 0) + Number(tip ?? 0)).toFixed(2)}
              //           </span>
              //         </p>  
              //       </div>
              //     </aside>
              //   )}

              //   <div className="checkout-actionBtn">
              //     <button
              //       type="button"
              //       disabled={payNowDisabled || payNowLock}
              //       className="checkout-paybtn__back"
              //       onClick={() => setStep("currency")}
              //     >
              //       Regresar
              //     </button>

              //     <button
              //       type="button"
              //       className="checkout-paybtn"
              //       onClick={handlePayNow}
              //       disabled={payNowDisabled || payNowLock}
              //     >
              //       {/* {payNowLock ? "Procesando..." : payNowCooldown > 0 ? `Espera ${payNowCooldown}s` : "Pagar ahora"} */}
              //        {payNowDisabled ? "Procesando..."  : "Pagar ahora"}
              //     </button>
              //   </div>
              // </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CheckoutPage;