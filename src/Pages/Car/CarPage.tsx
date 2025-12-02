import { useEffect } from "react";
import { ThreeDot } from "react-loading-indicators";
import { useCarPCG } from "@/Hooks/useCarPCG";
import '@/Styles/Cart/CartPage.css'
const USER_ID = 800;
import noimageavailable from '@/assets/noimageavailable.webp'
import {useNavigate} from 'react-router-dom'

const CarPage: React.FC = () => {
  const { getProductFromCarAsync , carPCG, error, loading } =
    useCarPCG();
    const navigate = useNavigate();

  useEffect(() => {
    getProductFromCarAsync(USER_ID);
  }, [getProductFromCarAsync]);

  const firstSummaryItem =
    carPCG && carPCG.length > 0 ? carPCG[0] : null;

  const hasItems =
    carPCG &&
    carPCG.some(
      (c) => c.listDetalle && c.listDetalle.length > 0
    );


    const goToCheckout = ()=>{
      // Falta mucha logica
      navigate('/checkout')
    }

  if (loading) {
    return (
      <main className="cart-page cart-page--centered">
        <div className="cart-page__loader">
          <ThreeDot color="#0070B4" size="medium" />
        </div>
      </main>
    );
  }

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
    <main className="cart-page">
      <header className="cart-page__header">
        <h1 className="cart-page__title">Carrito de compra</h1>
      </header>

      <section className="cart-page__content">
        <section className="cart-page__table-section" aria-label="Carrito">
          {hasItems ? (
            <>
              <table className="cart-table">
                <thead className="cart-table__head">
                  <tr className="cart-table__row cart-table__row--head">
                    <th className="cart-table__cell cart-table__cell--product">
                      Producto
                    </th>
                    <th className="cart-table__cell cart-table__cell--price">
                      Precio
                    </th>
                    <th className="cart-table__cell cart-table__cell--qty">
                      Cantidad
                    </th>
                    <th className="cart-table__cell cart-table__cell--total">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="cart-table__body">
                  {carPCG?.map((group) =>
                    group.listDetalle?.map((item) => {
                      const options = item.listOpciones ?? [];
                      const quantity =
                        options.length > 0
                          ? options.reduce(
                              (sum, opt) => sum + (opt.cantidad ?? 0),
                              0
                            )
                          : 1;
                      const rowTotal =
                        options.length > 0
                          ? options.reduce(
                              (sum, opt) => sum + (opt.totalMenu ?? 0),
                              0
                            )
                          : item.precioV ?? 0;

                      return (
                        <tr
                          className="cart-table__row"
                          key={item.noPedido}
                        >
                          <td className="cart-table__cell cart-table__cell--product">
                            <div className="cart-item">
                              <div className="cart-item__image-wrapper">
                                <img
                                  src={item.imagen != null ? item.imagen : noimageavailable}
                                  // alt={item.descripcion}
                                  className="cart-item__image"
                                />
                              </div>
                              <div className="cart-item__info">
                                <p className="cart-item__name">
                                  {item.descripcion}
                                </p>
                                {options.length > 0 && (
                                  <ul className="cart-item__options">
                                    {options.map((opt) => (
                                      <li
                                        className="cart-item__option"
                                        key={opt.descripcionOp}
                                      >
                                        <span className="cart-item__option-name">
                                          {opt.descripcionOp}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="cart-table__cell cart-table__cell--price">
                            {item.precioV?.toLocaleString("es-NI", {
                              style: "currency",
                              currency: "NIO",
                              maximumFractionDigits: 2,
                            }) ?? item.precioV}
                          </td>

                          <td className="cart-table__cell cart-table__cell--qty">
                            <div className="cart-qty">

                              <span className="cart-qty__value">
                                {quantity}
                              </span>
                            </div>
                          </td>

                          <td className="cart-table__cell cart-table__cell--total">
                            {rowTotal.toLocaleString("es-NI", {
                              style: "currency",
                              currency: "NIO",
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </>
          ) : (
            <div className="cart-page__empty">
              <p className="cart-page__empty-text">
                Your cart is currently empty.
              </p>
            </div>
          )}
        </section>

        <aside
          className="cart-page__totals"
          aria-label="Cart totals"
        >
          <h2 className="cart-totals__title">Total Carrito</h2>
          <div className="cart-totals__card">
            <div className="cart-totals__row">
              <span className="cart-totals__label">Subtotal</span>
              <span className="cart-totals__value">
                {firstSummaryItem
                  ? firstSummaryItem.subTotal?.toLocaleString(
                      "es-NI",
                      {
                        style: "currency",
                        currency: "NIO",
                        maximumFractionDigits: 2,
                      }
                    ) ?? firstSummaryItem.subTotal
                  : "--"}
              </span>
            </div>
            <div className="cart-totals__row cart-totals__row--total">
              <span className="cart-totals__label">Total</span>
              <span className="cart-totals__value cart-totals__value--strong">
                {firstSummaryItem
                  ? firstSummaryItem.total?.toLocaleString(
                      "es-NI",
                      {
                        style: "currency",
                        currency: "NIO",
                        maximumFractionDigits: 2,
                      }
                    ) ?? firstSummaryItem.total
                  : "--"}
              </span>
            </div>
            <button
              type="button"
              className="cart-totals__button"
              onClick={()=> goToCheckout()}
            >
              <p className="cart-totals_text">Procesar Pago</p>
            </button>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default CarPage;