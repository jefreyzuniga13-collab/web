import { useEffect, useState } from "react";
import "@/Styles/Ecommerce/CartPage.css";
import noimageavailable from "@/assets/img/noimageavailable.webp";
import { useNavigate } from "react-router-dom";
import type { TempLinkResolveResponseDto } from "@/Interfaces/Common/GlobalPCGInterface";
import CustomLoader from '@/Components/Common/CustomLoader'
import Lottie from "lottie-react";
import EmptyCartPlayer from '@/assets/lottie/Empty.json'
import {
  selectCarPCG,
  selectCartError,
  selectCartLoading,
  getProductFromCarAsync
} from "@/Context/Slices/Ecommerce/cartSlice";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "@/Context";
import type { LogCartResponseDto } from "@/Interfaces/Crm/LogCartInterface";
import useLogCart from "@/Hooks/Crm/useLogCard";

interface CarPageProps {
  payload: TempLinkResolveResponseDto;
}

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

const CarPage: React.FC<CarPageProps> = ({ payload }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const carPCG = useAppSelector(selectCarPCG);
  const loading = useAppSelector(selectCartLoading);
  const error = useAppSelector(selectCartError);
  const [existingLog, setExistingLog] = useState<LogCartResponseDto | null>(null);

  const { fetchByContactId } = useLogCart();

  useEffect(() => {
    if (!payload?.contactId || !payload?.orderId) return;

    const run = async () => {

      dispatch(
        getProductFromCarAsync({
          codCliente: payload.contactId,
          noPedido: payload.orderId,
        })
      );

      const existingLog = await fetchByContactId(payload.contactId);
      setExistingLog(existingLog);

    //   if(existingLog != null){
    // }
  };

    run();
  }, [dispatch, fetchByContactId, payload]);


  const hasItems =
    carPCG &&
    carPCG.some(
      (c) => c.listDetalle && c.listDetalle.length > 0
    );

    //Se navega, solo si el carrito tiene productos
  const goToCheckout = () => {
    if(hasItems) navigate("/checkout", { state: { payload } });
  };

  if (loading) {
    return (
      <main className="cart-page cart-page--centered">
        <CustomLoader/>
      </main>
    );
  }

  if (error) {
    return (
      <main className="cart-page cart-page--centered">
        <div className="cart-page__error">
          <span className="cart-page__error-text">{error}</span>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <header className="cart-page__header">
        <h1 className="cart-page__title">Carrito de compra</h1>
      </header>

      {hasItems ? (
        <>
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
                      Contenido
                    </th>
                  </tr>
                </thead>
                <tbody className="cart-table__body">
                  {carPCG?.flatMap((group) =>
                    group.listDetalle?.map((item) => {
                      const options = item.listOpciones ?? [];

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
                                {item.cantidad}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    }) ?? []
                  )}
                </tbody>
              </table>
            </>
          ) : (
            <div className="cart-page__empty">
              <p className="cart-page__empty-text">
                Tu carrito esta vacio
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
            
            <div className="cart-totals__row cart-totals__row--total">
              <span className="cart-totals__label">Subtotal</span>
              <span className="cart-totals__value cart-totals__value--strong">
                {existingLog?.subTotal}
              </span>
              </div>

              {existingLog != null && 
              existingLog != undefined && 
              Number(existingLog.transCost) > 0 && (
              <div className="cart-totals__row cart-totals__row--total">
              <span className="cart-totals__label">Transporte</span>
              <span className="cart-totals__value cart-totals__value--strong">
                {existingLog?.transCost}
              </span>
              </div>
              )}

            {existingLog != null  &&
            existingLog !=  undefined && 
            Number(existingLog.ivaPantalla ) > 0 && (
              <div className="cart-totals__row">
              <span className="cart-totals__label">Iva</span>
              <span className="cart-totals__value">
                {existingLog?.ivaPantalla}
              </span>
            </div>
            )

            }

            <div className="cart-totals__row cart-totals__row--total">
              <span className="cart-totals__label">Total</span>
              <span className="cart-totals__value cart-totals__value--strong">
                C$ {((existingLog?.totalEnPantalla ?? 0))}
              </span>

            </div>
            <button
              type="button"
              className="cart-totals__button"
              onClick={goToCheckout}

              // Si el carrito no tiene items, no se navega.
              disabled={!hasItems}
            >
              <p className="cart-totals_text">Procesar Pago</p>
            </button>
          </div>
        </aside>
      </section>
        </>
      ): (
        <section className="emptycart__container">
      
           <Lottie   loop={false} autoplay animationData={EmptyCartPlayer} width={200} height={200}/>
          <h2 className="emptycart__container-title">Parece que tu carrito está vacío</h2>
          <p className="emptycart__container-subtitle">Dale un vistazo a nuestras novedades y empieza a solicitar productos y llenar tu carrrito.</p>
        </section>
      )}
    </main>
  );
};

export default CarPage;