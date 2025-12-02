import { useEffect, useState } from "react"
import { FaRegCreditCard } from "react-icons/fa"
// import { FaPaypal } from "react-icons/fa6"
import VisaLogo from "@/assets/visaLogo.png"
import MasterCardLogo from "@/assets/masterCardLogo.png"
import "@/Styles/Cart/CheckoutPage.css"
import { useCarPCG } from "@/Hooks/useCarPCG"
// import { MdOutlinePayment } from "react-icons/md";
import {useNavigate} from 'react-router-dom'

const CheckoutPage = () => {
  const [method, setMethod] = useState<"card" | "paypal">("card")
  const [step, setStep] = useState<"generalData" | "paymentMethod" | "summary">("generalData")
  const navigate = useNavigate();

  const {
    carPCG,
    getProductFromCarAsync,
    error
  }
  = useCarPCG();

      const goToCart = ()=>{
      // Ir al cehcout
      navigate('/cart')
    }

  useEffect(() => {
    // el cliente hay que verlo aun, por que puede ser con el id del contact
    getProductFromCarAsync(800)
  }, [step === 'paymentMethod'])


    if (error) {
    return (
      <main className="cart-page cart-page--centered">
        <div className="cart-page__error">
          <span className="cart-page__error-text">{error.message}</span>
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
            {step === 'generalData' && (
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
                  />
                </div>

                <div className="checkout-field">
                  <label className="checkout-label" htmlFor="country">
                    País
                  </label>
                  <select id="country" className="checkout-input">
                    <option value="">Seleccionar país</option>
                    <option value="NI" selected>Nicaragua</option>
                    {/* <option value="CR">Costa Rica</option>
                    <option value="HN">Honduras</option>
                    <option value="SV">El Salvador</option>
                    <option value="GT">Guatemala</option>
                    <option value="PA">Panamá</option> */}
                  </select>
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
                  />
                </div>
              </div>

              <div className="checkout-actionBtn">
                <button type="button" className="checkout-paybtn__back" 
                onClick={
                    ()=> goToCart()
                    // ()=> setStep('generalData')
                }>
                    Regresar
                </button>
                <button type="button" className="checkout-paybtn" 
                    onClick={()=> setStep('paymentMethod')}>
                    <span className="checkout-tbn__text">Continuar</span>
                </button>
              </div>
            </div>
            )}

            {step === 'paymentMethod' && (
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

                {/* <button
                  type="button"
                  className={
                    method === "paypal"
                      ? "checkout-method checkout-method--active"
                      : "checkout-method"
                  }
                  onClick={() => setMethod("paypal")}
                >
                  <div className="checkout-method__left">
                    <span className="checkout-radio">
                      <span
                        className={
                          method === "paypal"
                            ? "checkout-radio__dot checkout-radio__dot--active"
                            : "checkout-radio__dot"
                        }
                      />
                    </span>
                    <FaPaypal className="checkout-method__icon" />
                    <span className="checkout-method__label">PayPal</span>
                  </div>
                </button> */}
              </div>

              {method === "card" && (
                <form className="checkout-cardform">
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
                      />
                    </div>
                  </div>

                  <div className="checkout-field checkout-field--full">
                    <label className="checkout-label" htmlFor="nameOnCard">
                      Nombre en la tarjeta
                    </label>
                    <input
                      id="nameOnCard"
                      type="text"
                      autoComplete="cc-name"
                      className="checkout-input"
                      placeholder="Como aparece en la tarjeta"
                    />
                  </div>

            {carPCG != null && carPCG.length > 0 && (
                <aside className="checkout-summary">
                    <p className="checkout-summary__title">Resumen de compra</p>
                    <div className="checkout-summary__Cost_cost">
                    <p className="checkout-summary__content" >Subtotal: <span>{carPCG[0].subTotal}</span></p>
                    {carPCG[0] != null  && carPCG[0].descuento != null
                    && carPCG[0].descuento > 0 && (
                        <p className="checkout-summary__content">Descuento: <span>{carPCG[0].descuento}</span></p>
                    )}
                    <p className="checkout-summary__content">IVA: <span>{carPCG[0].iva}</span></p>
                    <p className="checkout-summary__content">Total <span className="checkout-summary__content__total"> C${carPCG[0].total}</span></p>
                    </div>
                </aside>
                )}
                  {/* <div className="checkout-cardform__footer">
                    <label className="checkout-checkbox">
                      <input type="checkbox" />
                      <span>Guardar esta tarjeta para compras futuras</span>
                    </label>
                  </div> */}
                </form>
              )}

            <div className="checkout-actionBtn">
                <button type="button" className="checkout-paybtn__back" onClick={()=> setStep('generalData')}>
                    Regresar
                </button>

                <button type="button" className="checkout-paybtn">
                    {/* <MdOutlinePayment fontSize={18} className="checkout-btn__icon"/> */}
                    Pagar ahora
                </button>
            </div>

            </div>
            )}

          </div>
        </div>
      </div>
    </section>
  )
}

export default CheckoutPage