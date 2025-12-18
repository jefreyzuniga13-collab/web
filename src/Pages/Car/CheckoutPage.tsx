/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { FaRegCreditCard } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import VisaLogo from "@/assets/visaLogo.png";
import MasterCardLogo from "@/assets/masterCardLogo.png";
import useInvoiceOrder from "@/Hooks/Fact/useInvoiceOrder";
import MapPicker from "@/Components/Common/MapPicker";
import { useClientLocation } from "@/Hooks/Fact/useClientLocation";
import type { ClientLocationDto } from "@/Interfaces/Fact/ClientLocationInterface";
import type {
  InvoiceOrderRequestDto,
  NearestBranchRequestDto,
  Currencyto,
  SendOrderMessage
} from "@/Interfaces/Fact/InvoiceOrderInterface";
import { CartService } from "@/Services/Cart/CartService";
import { toast } from "react-toastify";
import "@/Styles/Cart/CheckoutPage.css";
import * as turf from "@turf/turf";
import {
  selectCarPCG,
  getProductFromCarAsync,
} from "@/Context/Slices/Cart/cartSlice";
import {
  useDispatch,
  useSelector,
  type TypedUseSelectorHook,
} from "react-redux";
import type { AppDispatch, RootState } from "@/Context";
import { UserSessionService } from "@/Services/auth/UserSessionService";
import useLogCart from "@/Hooks/Crm/useLogCard";


export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

type CheckoutStep = "currency" | "location" | "paymentMethod";
type PaymentMethod = "card" | "cash";

interface BillingFormState {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  city: string;
  address: string;
  addressName: string;
}

interface CardFormState {
  cardNumber: string;
  expiry: string;
  cvc: string;
  nameOnCard: string;
}

interface Coords {
  latitud: number;
  longitud: number;
}

type LocationMode = "existing" | "new";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const from = turf.point([lon1, lat1]);
  const to = turf.point([lon2, lat2]);
  return turf.distance(from, to, { units: "kilometers" });
}

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const payload = location.state?.payload as {
    fullName: string;
    email: string;
    ecommerceUserId: number;
    expiresAtUtc: string;
    orderId: number;
    conversationId: number;
    contactId: number;
    userId: number;
  } | undefined;

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
    // setUserEmail(payload.email);
  }, [payload, navigate]);

  const [step, setStep] = useState<CheckoutStep>("currency");
  const [method, setMethod] = useState<PaymentMethod>("card");

  const [billingForm, setBillingForm] = useState<BillingFormState>({
    firstName: "",
    lastName: "",
    email: "",
    country: "NI",
    city: "",
    address: "",
    addressName: "",
  });

  const [cardForm, setCardForm] = useState<CardFormState>({
    cardNumber: "",
    expiry: "",
    cvc: "",
    nameOnCard: "",
  });

  const [selectedCoords, setSelectedCoords] = useState<Coords | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currencyto | null>(null);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [tip, setTip] = useState<number>(0);

  const [locationMode, setLocationMode] = useState<LocationMode>("new");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const dispatch = useAppDispatch();
  const carPCG = useAppSelector(selectCarPCG);

  const {
    CreateAsync: createInvoiceAsync,
    currency,
    GetCurrencyAsync,
    GetTransportationCostAsync,
    GetNearestBranchAsync,
    loading: invoiceLoading,
  } = useInvoiceOrder();


  const { fetchByContactId } = useLogCart()

    const {
      UpdatedStatus,
    } = useLogCart();

  const {
    CreateAsync: createLocationAsync,
    GetAsync,
    clientLocation,
    // loading: locationLoading,
  } = useClientLocation();

  useEffect(() => {
    const loadCart = async () => {
      await dispatch(getProductFromCarAsync({ codCliente: 0, noPedido: payload!.orderId! })).unwrap;
      GetCurrencyAsync();
      GetAsync(ecommerceUserId);
    };

    if (!orderId || !ecommerceUserId) return;

    loadCart();
  }, [orderId, ecommerceUserId, dispatch, GetCurrencyAsync, GetAsync, payload]);

  useEffect(() => {
    if (userFullName) {
      const parts = userFullName.split(" ");
      setBillingForm(prev => ({
        ...prev,
        firstName: parts[0] ?? "",
        lastName: parts.slice(1).join(" ") ?? "",
      }));
    }
  }, [userFullName]);

  const addressList = useMemo(
    () =>
      Array.isArray(clientLocation)
        ? clientLocation
        : clientLocation
        ? [clientLocation]
        : [],
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
        address: first.descripcion ?? prev.address,
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
        city:
          data.address?.city ??
          data.address?.town ??
          data.address?.village ??
          prev.city,
        address: data.display_name ?? prev.address,
      }));
    };

    fetchAddress();
  }, [selectedCoords, locationMode]);

  // const isSubmitting = invoiceLoading || locationLoading;

  const goToCart = () => navigate("/cart");

  const toastError = (msg: string) => {
    toast.error(msg)
    return false;
  };

  const validateBillingForm = () => {
    if (!billingForm.firstName.trim()) return toastError("El nombre es obligatorio.");
    if (!billingForm.lastName.trim()) return toastError("Los apellidos son obligatorios.");
    // if (!billingForm.email.trim()) return toastError("El correo es obligatorio.");
    // if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingForm.email.trim()))
    //   return toastError("Correo electrónico inválido.");
    if (!billingForm.city.trim()) return toastError("La ciudad es obligatoria.");
    if (!billingForm.address.trim()) return toastError("La dirección es obligatoria.");
    if (locationMode === "new" && !billingForm.addressName.trim())
      return toastError("El nombre de la dirección es obligatorio.");
    return true;
  };

  const validateCardForm = () => {
    if (!cardForm.cardNumber.trim()) return toastError("Número de tarjeta obligatorio.");
    if (!/^\d{13,19}$/.test(cardForm.cardNumber.replace(/\s+/g, "")))
      return toastError("Número de tarjeta inválido.");
    if (!/^\d{2}\/\d{2}$/.test(cardForm.expiry.trim()))
      return toastError("Formato expiración MM/AA inválido.");
    if (!/^\d{3,4}$/.test(cardForm.cvc.trim()))
      return toastError("CVC inválido.");
    if (!cardForm.nameOnCard.trim()) return toastError("Nombre en tarjeta obligatorio.");
    return true;
  };

  const validateLocation = () => {
    if (locationMode === "existing") {
      if (!selectedAddressId) return toastError("Selecciona una dirección de entrega.");
      return true;
    }
    if (!selectedCoords) return toastError("Debes seleccionar la ubicación.");
    return true;
  };

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setBillingForm(prev => ({ ...prev, [id]: value }));
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCardForm(prev => ({ ...prev, [id]: value }));
  };

  const handleCoordsChange = (coords: Coords) => setSelectedCoords(coords);

  const handleSelectCurrency = (item: Currencyto) => {
    setSelectedCurrency(item);
    const isCash =
      item.descripcion_Pago.toLowerCase().includes("efectivo") ||
      item.moneda_Fija.toLowerCase().includes("efectivo");
    setMethod(isCash ? "cash" : "card");
  };

  const handleGoToLocation = () => {
    if (!selectedCurrency) {
      toast.error("Seleccione método de pago.");
      return;
    }
    setStep("location");
  };

  const handleGoToPayment = () => {
    if (!validateLocation()) return;
    if (!validateBillingForm()) return;
    setStep("paymentMethod");
  };

  const handlePayNow = async () => {
    if (!carPCG || carPCG.length === 0) {
      toast.error("El carrito está vacío.");
      return;
    }
    if (!selectedCurrency) {
      toast.error("Debe seleccionar un método de pago.");
      return;
    }
    

    if (!validateBillingForm()) return;
    if (!validateLocation()) return;

    if (method === "card" && !validateCardForm()) return;
      const cart = carPCG[0];
      const total = cart.total ?? 0;

      if (method === "cash") {

        if (cashAmount <= 0) {
          return toastError("El monto en efectivo debe ser mayor a 0.");
        }

        if (tip > cashAmount) {
          return toastError("La propina no puede ser mayor al monto ingresado.");
        }

        const disponible = cashAmount - tip;

        if (disponible < total) {
          return toastError(
            `Monto insuficiente. Te quedan C$${disponible} disponibles y el total es C$${total}.`
          );
        }
      }


    let finalLocation: ClientLocationDto | null = null;
    let coords: Coords;

    if (locationMode === "existing") {
      const addr = selectedAddress ?? addressList[0];
      if (!addr) {
        toast.error("No hay dirección seleccionada.");
        return;
      }

      finalLocation = {
        idDireccion: addr.idDireccion,
        nombre: addr.nombre,
        referencia: addr.referencia,
        descripcion: addr.descripcion,
        latitud: addr.latitud,
        longitud: addr.longitud,
        idUsuario: ecommerceUserId,
      };

      coords = { latitud: addr.latitud, longitud: addr.longitud };
    } else {
      if (!selectedCoords) {
        toast.error("Debes seleccionar la ubicación.");
        return;
      }
      coords = selectedCoords;

      const locationPayload: ClientLocationDto = {
        idDireccion: 0,
        nombre: billingForm.addressName || billingForm.address,
        referencia: `${billingForm.city}, ${billingForm.country}`,
        descripcion: billingForm.address,
        latitud: coords.latitud,
        longitud: coords.longitud,
        idUsuario: ecommerceUserId,
      };

      const newLocation = await createLocationAsync(locationPayload);

      if (!newLocation) {
        toast.error("No fue posible guardar la nueva dirección.");
        return;
      }

      finalLocation = newLocation;
    }

    if (!finalLocation) {
      toast.error("No se pudo determinar la dirección final.");
      return;
    }

    const branchReq: NearestBranchRequestDto = {
      latitud: finalLocation.latitud,
      longitud: finalLocation.longitud,
    };

    const branchResp = await GetNearestBranchAsync(branchReq);

    const nearest =
      Array.isArray(branchResp) && branchResp.length > 0 ? branchResp[0] : branchResp;

    if (!nearest) {
      toast.error("No hay sucursal cercana disponible.");
      return;
    }

    const lat1 = Number(finalLocation.latitud);
    const lon1 = Number(finalLocation.longitud);
    const lat2 = Number(nearest.latitud);
    const lon2 = Number(nearest.longitud);

    if ([lat1, lon1, lat2, lon2].some(v => Number.isNaN(v))) {
      toast.error("Coordenadas inválidas para calcular la distancia.");
      return;
    }

    const km = calculateDistance(lat1, lon1, lat2, lon2);

    const transporte = await GetTransportationCostAsync(km);

    const change =
      method === "cash" ? Math.max(cashAmount - total - tip, 0) : 0;

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
            longitud: Number(finalLocation.longitud),
          },

          detPago: {
            codPago: Number(selectedCurrency.codPago),
            monto: Number(total),
            codBanco: String(selectedCurrency.codigo_Banco).trim(),
            montoC: Number(total),
            cambio: Number(change),
            valor_Pagar: Number(total),
            nomsol: String(selectedCurrency.descripcion_Pago).trim(),
            registro_maquina: `CRM ${ecommerceUserId}`,
            codPagoNew: Number(selectedCurrency.codExterno),
          },
        };


    try {
      const res = await createInvoiceAsync(invoiceReq);

      // Si crear orden factura, esta bien, se procede a revokar el token, y cambiar el estado de logcart
      if(res?.success){
      if (payload != null && payload.conversationId > 0 && payload.orderId > 0 && payload.contactId > 0) 
        {
          const orderMessage: SendOrderMessage = {
            conversationId: payload.conversationId,
            orderId: res.data,
            userId: payload.userId,
          };

          await CartService.sendOrderMessage(orderMessage);
          const existingLog = await fetchByContactId(payload.contactId)
        

          await UpdatedStatus(existingLog!.id, 3)

          // Al final, se revoca
          await UserSessionService.revokeCartTempLink(orderId);

          //Refrescar el carrito de ese pedida, en toda la app, para refrecar componente de carrito a los usuarios.
          await dispatch(
            getProductFromCarAsync({ codCliente: 0, noPedido: payload!.orderId! })
          ).unwrap()

        }
      }

      navigate("/successOrder", { replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Error procesando pago");
    }
  };

  return (
    <section className="checkout-page">
      <div className="checkout-shell">
        <h1 className="checkout-page__title">Checkout</h1>

        <div className="checkout-main">
          <div className="checkout-left">
            {step === "currency" && (
              <div className="checkout-section">
                <h2 className="checkout-section__title">
                  Selecciona cómo deseas pagar
                </h2>

                <div className="checkout-methods-list">
                  {currency.map(item => (
                    <button
                      key={item.codPago}
                      type="button"
                      className={
                        selectedCurrency?.codPago === item.codPago
                          ? "checkout-method checkout-method--active"
                          : "checkout-method"
                      }
                      onClick={() => handleSelectCurrency(item)}
                    >
                      <div className="checkout-method__left">
                        <span className="checkout-radio">
                          <span
                            className={
                              selectedCurrency?.codPago === item.codPago
                                ? "checkout-radio__dot checkout-radio__dot--active"
                                : "checkout-radio__dot"
                            }
                          />
                        </span>
                        <span className="checkout-method__label">
                          {item.descripcion_Pago}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {selectedCurrency && (
                  <div className="checkout-selected-currency">
                    <p>Método seleccionado:</p>
                    <strong>{selectedCurrency.descripcion_Pago}</strong>
                  </div>
                )}

                <div className="checkout-actionBtn">
                  <button
                    type="button"
                    className="checkout-paybtn__back"
                    onClick={goToCart}
                  >
                    Regresar
                  </button>
                  <button
                    type="button"
                    className="checkout-paybtn"
                    onClick={handleGoToLocation}
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {step === "location" && (
              <div className="checkout-section checkout-section__location">
                 <div className="checkout-location__container">
              <h2 className="checkout-section__title">
                  Selecciona la ubicación y tus datos
                </h2>

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
                          setSelectedCoords({
                            latitud: addr.latitud,
                            longitud: addr.longitud,
                          });
                          setBillingForm(prev => ({
                            ...prev,
                            address: addr.descripcion ?? prev.address,
                          }));
                        }}
                      >
                        <span className="checkout-address__name">{addr.nombre}</span>
                        <span className="checkout-address__description">
                          {addr.descripcion}
                        </span>
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
                    <MapPicker
                      value={selectedCoords}
                      onChange={handleCoordsChange}
                    />
                    <p className="checkout-location__hint">
                      Haz clic en el mapa para marcar el lugar de entrega.
                    </p>
                  </>
                )}
                </div>

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
                </div>

                <div className="checkout-actionBtn">
                  <button
                    type="button"
                    className="checkout-paybtn__back"
                    onClick={() => setStep("currency")}
                  >
                    Regresar
                  </button>
                  <button
                    type="button"
                    className="checkout-paybtn"
                    onClick={handleGoToPayment}
                  >
                    Continuar a pago
                  </button>
                </div>
              </div>
            )}

            {step === "paymentMethod" && (
              <div className="checkout-section">
                <h2 className="checkout-section__title">Método de pago</h2>

                {method === "card" && (
                  <>
                    <div className="checkout-methods">
                      <div className="checkout-method checkout-method--active">
                        <div className="checkout-method__left">
                          <span className="checkout-radio">
                            <span className="checkout-radio__dot checkout-radio__dot--active" />
                          </span>
                          <FaRegCreditCard className="checkout-method__icon" />
                          <span className="checkout-method__label">Tarjeta</span>
                        </div>

                        <div className="checkout-method__brands">
                          <img src={VisaLogo} className="checkout-card-brand" />
                          <img src={MasterCardLogo} className="checkout-card-brand" />
                        </div>
                      </div>
                    </div>

                    <form
                      className="checkout-cardform"
                      onSubmit={e => e.preventDefault()}
                    >
                      <div className="checkout-field checkout-field--full">
                        <label className="checkout-label" htmlFor="cardNumber">
                          Número de tarjeta
                        </label>
                        <input
                          id="cardNumber"
                          type="text"
                          inputMode="numeric"
                          className="checkout-input"
                          placeholder="1234 5678 9012 3456"
                          value={cardForm.cardNumber}
                          onChange={handleCardChange}
                        />
                      </div>

                      <div className="checkout-cardform__row">
                        <div className="checkout-field">
                          <label className="checkout-label" htmlFor="expiry">
                            Expiración
                          </label>
                          <input
                            id="expiry"
                            type="text"
                            inputMode="numeric"
                            className="checkout-input"
                            placeholder="MM/AA"
                            value={cardForm.expiry}
                            onChange={handleCardChange}
                          />
                        </div>

                        <div className="checkout-field">
                          <label className="checkout-label" htmlFor="cvc">
                            CVC
                          </label>
                          <input
                            id="cvc"
                            type="text"
                            inputMode="numeric"
                            className="checkout-input"
                            placeholder="CVC"
                            value={cardForm.cvc}
                            onChange={handleCardChange}
                          />
                        </div>
                      </div>

                      <div className="checkout-field checkout-field--full">
                        <label className="checkout-label" htmlFor="nameOnCard">
                          Nombre en tarjeta
                        </label>
                        <input
                          id="nameOnCard"
                          type="text"
                          className="checkout-input"
                          value={cardForm.nameOnCard}
                          onChange={handleCardChange}
                        />
                      </div>
                    </form>
                  </>
                )}

                {method === "cash" && (
                  <div className="checkout-cash">
                    <div className="checkout-field checkout-field--full">
                      <label className="checkout-label" htmlFor="cashAmount">
                        Monto con el que pagas
                      </label>
                      <input
                        id="cashAmount"
                        type="number"
                        className="checkout-input"
                        value={cashAmount}
                        onChange={e => setCashAmount(Number(e.target.value))}
                      />
                    </div>

                    <div className="checkout-field checkout-field--full">
                      <label className="checkout-label" htmlFor="tip">
                        Propina
                      </label>
                      <input
                        id="tip"
                        type="number"
                        className="checkout-input"
                        value={tip}
                        onChange={e => setTip(Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                {carPCG && carPCG.length > 0 && (
                  <aside className="checkout-summary">
                    <p className="checkout-summary__title">Resumen</p>
                    <div className="checkout-summary__Cost_cost">
                      <p className="checkout-summary__content">
                        Subtotal: <span>{carPCG[0].subTotal}</span>
                      </p>

                      {carPCG[0].descuento != null && carPCG[0].descuento > 0 && (
                        <p className="checkout-summary__content">
                          Descuento: <span>{carPCG[0].descuento}</span>
                        </p>
                      )}

                      <p className="checkout-summary__content">
                        IVA: <span>{carPCG[0].iva}</span>
                      </p>

                      <p className="checkout-summary__content">
                        Total:
                        <span className="checkout-summary__content__total">
                          C${carPCG[0].total}
                        </span>
                      </p>
                    </div>
                  </aside>
                )}

                <div className="checkout-actionBtn">
                  <button
                    type="button"
                    disabled={invoiceLoading}
                    className="checkout-paybtn__back"
                    onClick={() => setStep("location")}
                  >
                    Regresar
                  </button>

                  <button
                    type="button"
                    className="checkout-paybtn"
                    onClick={handlePayNow}
                    disabled={invoiceLoading}
                  >
                    {invoiceLoading ? "Procesando..." : "Pagar ahora"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CheckoutPage;