import { useEffect, useMemo, useState } from "react";
import { FaRegCreditCard } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import VisaLogo from "@/assets/visaLogo.png";
import MasterCardLogo from "@/assets/masterCardLogo.png";
import { useCarPCG } from "@/Hooks/useCarPCG";
import useInvoiceOrder from "@/Hooks/Fact/useInvoiceOrder";
import MapPicker from '@/Components/Common/MapPicker'
import { useClientLocation } from "@/Hooks/Fact/useClientLocation";
import type { ClientLocationDto } from "@/Interfaces/Fact/ClientLocationInterface";
import type { InvoiceOrderRequestDto, NearestBranchRequestDto } from "@/Interfaces/Fact/InvoiceOrderInterface";
import { toast } from "react-toastify";
import "@/Styles/Cart/CheckoutPage.css";
import * as turf from '@turf/turf';

type CheckoutStep = "location" | "generalData" | "paymentMethod";
type PaymentMethod = "card" | "paypal";
interface BillingFormState {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  city: string;
  address: string;
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

// Temporal, debe obtenerse del usuario autenticado/contacto
const contactId = 8;


function calculateDistance(lat1: number, lon1: number, 
  lat2: number, lon2: number): number {
  const from = turf.point([lon1, lat1]);
  const to = turf.point([lon2, lat2]);
  const distance = turf.distance(from, to, { units: 'kilometers' });
  return distance;
}

const CheckoutPage: React.FC = () => {
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [step, setStep] = useState<CheckoutStep>("location");
  const navigate = useNavigate();

  const [billingForm, setBillingForm] = useState<BillingFormState>({
    firstName: "",
    lastName: "",
    email: "",
    country: "NI",
    city: "",
    address: "",
  });

  const [cardForm, setCardForm] = useState<CardFormState>({
    cardNumber: "",
    expiry: "",
    cvc: "",
    nameOnCard: "",
  });

  // Coordenadas seleccionadas en el mapa
  const [selectedCoords, setSelectedCoords] = useState<Coords | null>(null);

  const {
    carPCG,
    getProductFromCarAsync,
    error: cartError,
  } = useCarPCG();

  const {
    CreateAsync: createInvoiceAsync,
    currency,
    GetCurrencyAsync,
    transportationCost,
    GetTransportationCostAsync,
    nearestBranch,
    GetNearestBranchAsync,
    loading: invoiceLoading,
    error: invoiceError,
  } = useInvoiceOrder();

  const {
    CreateAsync: createLocationAsync,
    clientLocation,
    loading: locationLoading,
    error: locationError,
  } = useClientLocation();

  // Cargar productos del carrito al montar
  useEffect(() => {
    getProductFromCarAsync(contactId);
  }, [getProductFromCarAsync]);

  const globalError = useMemo(
    () => cartError ?? invoiceError ?? locationError,
    [cartError, invoiceError, locationError]
  );

  const isSubmitting = invoiceLoading || locationLoading;

  const goToCart = () => {
    navigate("/cart");
  };


  useEffect(() => {
  const fetchAddress = async () => {
    if (!selectedCoords) return;

    const { latitud, longitud } = selectedCoords;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitud}&lon=${longitud}&format=json&addressdetails=1`
    );
    const data = await res.json();

    setBillingForm((prev) => ({
      ...prev,
      country: data.address.country || prev.country,
      city:
        data.address.city ||
        data.address.town ||
        data.address.village ||
        prev.city,
      address: data.display_name || prev.address,
    }));
  };

  fetchAddress();
}, [selectedCoords]);


  const validateBillingForm = (): boolean => {
    if (!billingForm.firstName.trim()) {
      toast.error("El nombre es obligatorio.");
      return false;
    }
    if (!billingForm.lastName.trim()) {
      toast.error("Los apellidos son obligatorios.");
      return false;
    }
    if (!billingForm.email.trim()) {
      toast.error("El correo electrónico es obligatorio.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(billingForm.email.trim())) {
      toast.error("El correo electrónico no es válido.");
      return false;
    }
    if (!billingForm.city.trim()) {
      toast.error("La ciudad es obligatoria.");
      return false;
    }
    if (!billingForm.address.trim()) {
      toast.error("La dirección es obligatoria.");
      return false;
    }
    return true;
  };

  // const validateCardForm = (): boolean => {
  //   if (!cardForm.cardNumber.trim()) {
  //     toast.error("El número de tarjeta es obligatorio.");
  //     return false;
  //   }
  //   const cardDigits = cardForm.cardNumber.replace(/\s+/g, "");
  //   if (!/^\d{13,19}$/.test(cardDigits)) {
  //     toast.error("El número de tarjeta no es válido.");
  //     return false;
  //   }

  //   if (!cardForm.expiry.trim()) {
  //     toast.error("La fecha de expiración es obligatoria.");
  //     return false;
  //   }
  //   if (!/^\d{2}\/\d{2}$/.test(cardForm.expiry.trim())) {
  //     toast.error("La fecha de expiración debe tener el formato MM/AA.");
  //     return false;
  //   }

  //   if (!cardForm.cvc.trim()) {
  //     toast.error("El CVC/CVV es obligatorio.");
  //     return false;
  //   }
  //   if (!/^\d{3,4}$/.test(cardForm.cvc.trim())) {
  //     toast.error("El CVC/CVV no es válido.");
  //     return false;
  //   }

  //   if (!cardForm.nameOnCard.trim()) {
  //     toast.error("El nombre en la tarjeta es obligatorio.");
  //     return false;
  //   }
  //   return true;
  // };

  const validateLocation = (): boolean => {
    if (!selectedCoords) {
      toast.error("Debes seleccionar la ubicación en el mapa.");
      return false;
    }

    console.log("Cordenadas", JSON.stringify(selectedCoords));
    return true;
  };

  const handleBillingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;

    setBillingForm((prev) => ({
      ...prev,
      [id === "firstName"
        ? "firstName"
        : id === "lastName"
        ? "lastName"
        : id === "email"
        ? "email"
        : id === "city"
        ? "city"
        : id === "address"
        ? "address"
        : id === "country"
        ? "country"
        : id]: value,
    }));
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    setCardForm((prev) => ({
      ...prev,
      [id === "cardNumber"
        ? "cardNumber"
        : id === "expiry"
        ? "expiry"
        : id === "cvc"
        ? "cvc"
        : id === "nameOnCard"
        ? "nameOnCard"
        : id]: value,
    }));
  };

  const handleCoordsChange = (coords: Coords) => {
    setSelectedCoords(coords);
  };

  const handleGoToPayment = () => {
    if (!validateBillingForm()) return;
    if (!validateLocation()) {
      // la ubicación se seleccione antes, forzar step "location"
      setStep("location");
      return;
    }
    setStep("paymentMethod");
  };

  // const handleGoToLocation = () => {
  //   if (!validateBillingForm()) return;
  //   setStep("location");
  // };

    const handleGoGeneralData = () => {
    // if (!validateBillingForm()) return;
    setStep("generalData");
  };



  const handlePayNow = async () => {
    if (!carPCG || carPCG.length === 0) {
      toast.error("No hay productos en el carrito.");
      return;
    }

    // if (!validateBillingForm()) return;
    // if (!validateLocation()) return;
    // if (method === "card" && !validateCardForm()) return;

    const cart = carPCG[0];
    const total = cart.total ?? 0;

    // Crear/registrar la dirección del cliente
    const coords = selectedCoords;
    if (!coords) {
      toast.error("Debes seleccionar la ubicación en el mapa.");
      return;
    }

    const locationPayload: ClientLocationDto = {
      idDireccion: clientLocation?.idDireccion ?? 0,
      nombre: billingForm.address,
      referencia: `${billingForm.city}, ${billingForm.country}`,
      descripcion: billingForm.address,
      latitud: coords.latitud,
      longitud: coords.longitud,
      idUsuario: contactId,
    };

    try {
      const locationResponse = await createLocationAsync(locationPayload);

      const finalLocationId =
        (locationResponse && "idDireccion" in locationResponse
          ? (locationResponse as ClientLocationDto).idDireccion
          : clientLocation?.idDireccion) ?? 0;

      //  Crear la orden de factura
      const nombreCompleto = `${billingForm.firstName} ${billingForm.lastName}`.trim();

      //obetner informacion de divisa
      await GetCurrencyAsync();
      const nearestBranchLocal: NearestBranchRequestDto= {
        latitud:locationPayload.latitud,
        longitud: locationPayload.longitud
      }
      //Obtener la socursal. con esto tiene las cordenadas de la socursal, 
      // y cliente cuando el seleccione en el mapa, para mandar los kilometros
      await GetNearestBranchAsync(nearestBranchLocal);


      // transporte, se calcula en base a la ubicacion del cliente y sucursal mas cercana.
      // await transportationCost(km, se deve de sa la distancia en kilometros numericos
      //evitar exepciones
      console.log("Llamar al metodo de calcular distancia")
      console.log( " locationPayload.latitud " + locationPayload.latitud)
      console.log(" locationPayload.longitud " + locationPayload.longitud)
      console.log(" nearestBranch!.latitud " + nearestBranch!.latitud)
      console.log(" nearestBranch!.longitud " + nearestBranch!.longitud)
      
      const km = await calculateDistance(locationPayload.latitud, 
        locationPayload.longitud, nearestBranch!.latitud, 
        nearestBranch!.longitud);
      
      await GetTransportationCostAsync(km)

      const invoiceReq: InvoiceOrderRequestDto = {
        idUsuario: contactId,
        nombrede: nombreCompleto,
        registroMaquina: `CRM ${contactId}`, 
        noIdentificacion: "",
        observaciones: "",
        transporte: transportationCost,
        propina: 0,
        tipoServicio: 8,
        idEstado: 1,
        codSucursal: nearestBranch?.codSucursal,
        direcciones: [
          {
            idDireccion: finalLocationId,
            nombre: locationPayload.nombre,
            referencia: locationPayload.referencia,
            latitud: locationPayload.latitud,
            longitud: locationPayload.longitud,
          },
        ],
        detPago: [
          {
            codPago: currency[0].codPago,
            monto: total,
            codBanco: currency[0].codigo_Banco,
            montoC: total,
            cambio: 0,
            valor_Pagar: total,
            nomsol: currency[0].descripcion_Pago,
            registro_maquina: `CRM ${contactId}`,
            codPagoNew: Number(currency[0].codExterno),
          },
        ],
      };

      await createInvoiceAsync(invoiceReq);
      navigate("/login");
    } catch (e) {
      if (e instanceof Error) {
        toast.error(e.message);
      } else {
        toast.error("Ocurrió un error al procesar el pago.");
      }
    }
  };

  if (globalError) {
    return (
      <main className="cart-page cart-page--centered">
        <div className="cart-page__error">
          <span className="cart-page__error-text">{globalError.message}</span>
        </div>
      </main>
    );
  }

  return (
    <section className="checkout-page">
      <div className="checkout-shell">
        <h1 className="checkout-page__title">Checkout</h1>

        <div className="checkout-main">
          <div className="checkout-left">
            
            
            {/* Paso: Ubicación */}
            {step === "location" && (
              <div className="checkout-section">
                <h2 className="checkout-section__title">
                  Seleccione la ubicación del pedido
                </h2>
                <MapPicker
                  value={
                    selectedCoords ??
                    (clientLocation
                      ? {
                          latitud: clientLocation.latitud,
                          longitud: clientLocation.longitud,
                        }
                      : null)
                  }
                  onChange={handleCoordsChange}
                />

                <p className="checkout-location__hint">
                  Haz clic en el mapa para marcar el lugar de entrega.
                </p>

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
                    onClick={handleGoGeneralData}
                  >
                    Continuar a pago
                  </button>
                </div>
              </div>
            )}

            {/* Paso: Datos de facturación */}
            {step === "generalData" && (
              <div className="checkout-section">
                <h2 className="checkout-section__title">Datos de facturación</h2>
                <div className="checkout-grid">
                  <div className="checkout-field">
                    <label className="checkout-label" htmlFor="firstName">
                      Nombre
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      className="checkout-input"
                      placeholder="Ingresar nombre"
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
                      placeholder="Ingresar apellidos"
                      value={billingForm.lastName}
                      onChange={handleBillingChange}
                    />
                  </div>

                  <div className="checkout-field checkout-field--full">
                    <label className="checkout-label" htmlFor="email">
                      Correo electrónico
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="checkout-input"
                      placeholder="correo@ejemplo.com"
                      value={billingForm.email}
                      onChange={handleBillingChange}
                    />
                  </div>

                  {/* En base a la ubicacion seleccionada, 
                    se obtiene pais, ciudad, etc.
                    
                    si no se obtinen que los indique el cliente
                    
                    //un dev uso https://nominatim.openstreetmap.org/reverse?lat=${position.latitude}&lon=${position.longitude}&format=json&addressdetails=1,
                    //pero si se puede usar directamente el mapa, o similar mejor para no hacer peticion.
                  */}

                   <div className="checkout-field">
                    <label className="checkout-label" htmlFor="country">
                      País
                    </label>
                    <input
                      id="country"
                      type="text"
                      className="checkout-input"
                      placeholder="Ingresar país"
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
                      placeholder="Ingresar ciudad"
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
                      placeholder="Dirección completa"
                      value={billingForm.address}
                      onChange={handleBillingChange}
                    />
                  </div>
                </div>

                <div className="checkout-actionBtn">
                  <button
                    type="button"
                    className="checkout-paybtn__back"
                    onClick={() => setStep("location")}
                  >
                    Regresar
                  </button>
                  <button
                    type="button"
                    className="checkout-paybtn"
                    onClick={handleGoToPayment}
                  >
                    <span className="checkout-tbn__text">
                      Continuar a pago
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Paso: Método de pago */}
            {step === "paymentMethod" && (
              <div className="checkout-section">
                <h2 className="checkout-section__title">Método de pago</h2>

                <div className="checkout-methods">
                  <button
                    type="button"
                    className={
                      method === "card"
                        ? "checkout-method checkout-method--active"
                        : "checkout-method"
                    }
                    onClick={() => setMethod("card")}
                  >
                    <div className="checkout-method__left">
                      <span className="checkout-radio">
                        <span
                          className={
                            method === "card"
                              ? "checkout-radio__dot checkout-radio__dot--active"
                              : "checkout-radio__dot"
                          }
                        />
                      </span>
                      <FaRegCreditCard className="checkout-method__icon" />
                      <span className="checkout-method__label">Tarjeta</span>
                    </div>

                    <div className="checkout-method__brands">
                      <img
                        src={VisaLogo}
                        alt="Visa"
                        className="checkout-card-brand"
                      />
                      <img
                        src={MasterCardLogo}
                        alt="Mastercard"
                        className="checkout-card-brand"
                      />
                    </div>
                  </button>
                </div>

                {method === "card" && (
                  <form
                    className="checkout-cardform"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <div className="checkout-field checkout-field--full">
                      <label className="checkout-label" htmlFor="cardNumber">
                        Número de tarjeta
                      </label>
                      <input
                        id="cardNumber"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        className="checkout-input"
                        placeholder="1234 5678 9012 3456"
                        value={cardForm.cardNumber}
                        onChange={handleCardChange}
                      />
                    </div>

                    <div className="checkout-cardform__row">
                      <div className="checkout-field">
                        <label className="checkout-label" htmlFor="expiry">
                          Fecha de expiración
                        </label>
                        <input
                          id="expiry"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          className="checkout-input"
                          placeholder="MM/AA"
                          value={cardForm.expiry}
                          onChange={handleCardChange}
                        />
                      </div>

                      <div className="checkout-field">
                        <label className="checkout-label" htmlFor="cvc">
                          CVC/CVV
                        </label>
                        <input
                          id="cvc"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          className="checkout-input"
                          placeholder="CVC"
                          value={cardForm.cvc}
                          onChange={handleCardChange}
                        />
                      </div>
                    </div>

                    <div className="checkout-field checkout-field--full">
                      <label
                        className="checkout-label"
                        htmlFor="nameOnCard"
                      >
                        Nombre en la tarjeta
                      </label>
                      <input
                        id="nameOnCard"
                        type="text"
                        autoComplete="cc-name"
                        className="checkout-input"
                        placeholder="Como aparece en la tarjeta"
                        value={cardForm.nameOnCard}
                        onChange={handleCardChange}
                      />
                    </div>
                  </form>
                )}

                {/* Resumen de compra */}
                {carPCG !== null && carPCG.length > 0 && (
                  <aside className="checkout-summary">
                    <p className="checkout-summary__title">Resumen de compra</p>
                    <div className="checkout-summary__Cost_cost">
                      <p className="checkout-summary__content">
                        Subtotal: <span>{carPCG[0].subTotal}</span>
                      </p>
                      {carPCG[0].descuento !== null &&
                        carPCG[0].descuento !== undefined &&
                        carPCG[0].descuento > 0 && (
                          <p className="checkout-summary__content">
                            Descuento: <span>{carPCG[0].descuento}</span>
                          </p>
                        )}
                      <p className="checkout-summary__content">
                        IVA: <span>{carPCG[0].iva}</span>
                      </p>
                      <p className="checkout-summary__content">
                        Total{" "}
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
                    className="checkout-paybtn__back"
                    onClick={() => setStep("generalData")}
                    disabled={isSubmitting}
                  >
                    Regresar
                  </button>

                  <button
                    type="button"
                    className="checkout-paybtn"
                    onClick={handlePayNow}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Procesando..." : "Pagar ahora"}
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
// validor el calculo efectivo de kilometros, 
// llenar los datos en base a la ubicacion indicada por el cliente

// CheckoutPage, pagina completa, y correjida, por favor.
//agregar lo solicitado, el formulario deve de estar despues del mapa, ya sabes,
//por que desde ahi se recuperan datos