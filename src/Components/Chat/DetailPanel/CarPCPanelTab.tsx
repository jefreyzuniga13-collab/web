import { useEffect, useMemo, useState } from "react";
import Input from "@/Components/Common/Input";
import { useCarPCG } from "@/Hooks/useCarPCG";
import type { CarDto, ListDetalleCarrito } from "@/Interfaces/Crm/CartPCGInterface";
import EmptyCard from "@/assets/emptycard.webp";
import { toast } from "react-toastify";
import "@/Styles/Crm/cardPCGTab.css";
import Button from "@/Components/Common/Button";
import {useCart} from '@/Hooks/Cart/useCart'
import noimageavailable from '@/assets/noimageavailable.webp'

interface Props{
  conversationId: number;
}
const CarPCPanelTab = (
  { 
    // codClient
    conversationId
   }: Props
) => {
  const [search, setSearch] = useState<string>("");
  const { loading, carPCG, 
    getProductFromCarAsync, 
    updateCarAsync, error } = useCarPCG();


    const {
      SendMessageLink,
      // cart,
      error: errorCart,
      loading: loadingCart
    }
    = useCart()

  useEffect(() => {
    getProductFromCarAsync(800);
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error.message);
    }
  }, [error]);


  const handleRemoveItem = async (idUsuario: number, noPedido?: number | null) => {
    if (!noPedido) return;
    await updateCarAsync(idUsuario, noPedido);
    await getProductFromCarAsync(800);
  };

  const hasItems = useMemo(() => carPCG != null && carPCG.length > 0, [carPCG]);

  const filteredDetails: { cart: CarDto; detail: ListDetalleCarrito }[] = useMemo(() => {
    if (!hasItems) return [];
    const term = search.trim().toLowerCase();
    const result: { cart: CarDto; detail: ListDetalleCarrito }[] = [];
    carPCG.forEach((cart) => {
      cart.listDetalle.forEach((detail) => {
        if (!term || detail.descripcion.toLowerCase().includes(term)) {
          result.push({ cart, detail });
        }
      });
    });
    return result;
  }, [carPCG, hasItems, search]);

  if (loading) return <span>Cargando...</span>;
 
  if(loadingCart) return <div className="cartPanel-loadingCartContiner"><p className="cartPanel-loadingCartText">Cargando</p></div>
  if(errorCart) return <div className="cartPanel-errorContiner"><p className="cartPanel-errorText">{errorCart.message}</p></div>

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
    );
  }

  const totalCarrito = carPCG[0]?.total ?? 0;

  return (
    <div className="carPCPanel-container">
      <header className="carPCPanel-header">
        <h5 className="productTab-content-header__title">
          Carrito
        </h5>
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
                  // alt="product"
                  aria-label="product image"
                  className="carPCPanel-content__list-image"
                />
                <p className="carPCPanel-content__list-flootingQuantity">{detail.cantidad}</p>
               </div>
                
                <div className="carPCPanel-content__list-info">
                  <p className="carPCPanel-content__list-text">{detail.descripcion}</p>
                  <p className="carPCPanel-content__list-price">
                    C$ {detail.totalMenu.toFixed(2)}
                  </p>
                </div>

               <div className="carPCPanel-listaOpciones">
                 {detail.listOpciones?.map((e, index)=> (
                  <p key={index} className="carPCPanel-content__item">{e.descripcionOp}</p>
                ))}
               </div>
              </div>
            ))}


             {totalCarrito > 0 && (
              <>
                <div className="productTab-content-footer">
                  <p className="productTab-content-footer__total"> Total:
                 <span className="productTab-content-footer__value">C$ {totalCarrito.toFixed(2)}</span>
              </p>
                </div>
                <div className="productTab-footer__payment">
                 <Button className="payment-btn" 
                onClick={()=>{
                  SendMessageLink(conversationId)
                }}
                 >
                  Procesar pago
                 </Button>
                </div>
              </>
              )}
        </section>
    </div>
  );
};

export default CarPCPanelTab;