import { useEffect, type FC } from "react";
import { useDispatch } from "react-redux";

import { useDetailPanel } from "@/Hooks/Chat/useDetailPanel";
import DetailPanelHeaderTabs from "@/Components/Chat/DetailPanel/DetailPanelHeaderTabs";
import DetailPanelCurrentConversationTab from "@/Components/Chat/DetailPanel/DetailPanelCurrentConversationTab";
import DetailPanelOptionsContact from "@/Components/Chat/DetailPanelOptionsContact";
import { ProductTab } from "@/Components/ECommerce/Tabs/ProductTab";
import CarPCPanelTab from "@/Components/ECommerce/Tabs/CarPCPanelTab";
import { CartPCGFlowProvider } from "@/Context/CartPCGFlowProvider";
import { CartFlowSignalCleaner } from "@/Hooks/Ecommerce/tabs/CartFlowSignalCleaner";
import useLogCart from "@/Hooks/Crm/useLogCard";
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice";
import { getProductFromCarAsync } from "@/Context/Slices/Ecommerce/cartSlice";
import { CartService } from "@/Services/Ecommerce/CarPCGService";
import { countMainProducts } from "@/Utils/ECommerce/utils";
import type { AppDispatch } from "@/Context";
import type { CarDto } from "@/Interfaces/Crm/CartPCGInterface";

import "@/Styles/Chat/DetailPanel.css";

type Props = {
  contactId?: number;
  conversationId?: number;
  selectedParam?: unknown;
  metaChannel: string;
  isAdmin?: boolean;
  onSendNow?: (txt: string) => void | Promise<void>;
};

type CartReloadDetail = {
  contactId?: number;
  orderId?: number;
};

function applyCartBadge(
  dispatch: AppDispatch,
  contactId: number,
  cart: CarDto[] | null | undefined
): void {
  const count = countMainProducts(Array.isArray(cart) ? cart : []);

  dispatch(
    setContactCartBadge({
      contactId,
      hasCart: count > 0,
      count,
    })
  );
}

const DetailPanel: FC<Props> = ({
  contactId,
  conversationId,
  metaChannel,
  selectedParam,
  isAdmin,
}) => {
  const normalizedContactId = Number(contactId ?? 0);
  const normalizedConversationId = Number(conversationId ?? 0);

  const {
    optionMenu,
    setOptionMenu,
    selectedData,
    formatNiPhone,
    displayOrDash,
    formatDate,
  } = useDetailPanel(normalizedContactId, selectedParam);

  const dispatch = useDispatch<AppDispatch>();
  const { fetchByContactId } = useLogCart();

  /*
   * En categorías solo se consulta la cantidad del badge.
   * No se monta el carrito ni se escribe el listado en Redux.
   */
  useEffect(() => {
    if (normalizedContactId <= 0) return;
    if (optionMenu !== 1) return;

    let cancelled = false;

    const hydrateBadge = async (): Promise<void> => {
      try {
        const log = await fetchByContactId(normalizedContactId);

        if (cancelled) return;

        const noPedido = log?.orderId && log.orderId > 0 ? log.orderId : 0;
        const cart = await CartService.getProductFromCar(
          normalizedContactId,
          noPedido
        );

        if (cancelled) return;

        applyCartBadge(dispatch, normalizedContactId, cart);
      } catch {
        /*
         * El badge no debe tumbar el panel de categorías.
         */
      }
    };

    void hydrateBadge();

    return () => {
      cancelled = true;
    };
  }, [dispatch, fetchByContactId, normalizedContactId, optionMenu]);

  /*
   * Tras una modificación externa: en carrito se refresca el listado,
   * en categorías solo el badge.
   */
  useEffect(() => {
    const onReload = async (event: Event): Promise<void> => {
      const detail = (event as CustomEvent<CartReloadDetail>).detail;

      const eventContactId = Number(detail?.contactId ?? 0);
      const orderId = Number(detail?.orderId ?? 0);

      if (eventContactId <= 0 || orderId <= 0) return;
      if (eventContactId !== normalizedContactId) return;

      try {
        if (optionMenu === 2) {
          const updated = await dispatch(
            getProductFromCarAsync({
              codCliente: eventContactId,
              noPedido: orderId,
            })
          ).unwrap();

          applyCartBadge(dispatch, eventContactId, updated);
          return;
        }

        const cart = await CartService.getProductFromCar(
          eventContactId,
          orderId
        );

        applyCartBadge(dispatch, eventContactId, cart);
      } catch (error) {
        console.error(
          "No se pudo actualizar el indicador del carrito:",
          error
        );
      }
    };

    window.addEventListener("CartReloadForActiveContact", onReload);

    return () => {
      window.removeEventListener("CartReloadForActiveContact", onReload);
    };
  }, [dispatch, normalizedContactId, optionMenu]);

  const showCartFlow =
    normalizedContactId > 0 &&
    normalizedConversationId > 0 &&
    (optionMenu === 1 || optionMenu === 2);

  return (
    <div className="detailPanel-container">
      <DetailPanelHeaderTabs
        optionMenu={optionMenu}
        onSelectTab={setOptionMenu}
        contactId={normalizedContactId}
      />

      <section className="detailPanel-content detailPanel-content--padded">
        {showCartFlow && (
          <CartPCGFlowProvider
            conversationId={normalizedConversationId}
            contactId={normalizedContactId}
            metaChannel={String(metaChannel)}
          >
            <CartFlowSignalCleaner
              contactId={normalizedContactId}
              conversationId={normalizedConversationId}
            />

            {optionMenu === 1 && (
              <ProductTab
                conversationId={normalizedConversationId}
                contactId={normalizedContactId}
              />
            )}

            {optionMenu === 2 && (
              <CarPCPanelTab
                conversationId={normalizedConversationId}
                contactId={normalizedContactId}
              />
            )}
          </CartPCGFlowProvider>
        )}

        {optionMenu === 3 &&
          (selectedData ? (
            <DetailPanelOptionsContact
              displayOrDash={displayOrDash}
              formatDate={formatDate}
              formatNiPhone={formatNiPhone}
              selectedData={selectedData}
            />
          ) : (
            <div className="detailPanel-emptyState">
              No hay datos de contacto para esta conversación.
            </div>
          ))}

        {optionMenu === 4 && normalizedConversationId > 0 && (
          <DetailPanelCurrentConversationTab
            conversationId={normalizedConversationId}
            formatDate={formatDate}
            isAdmin={isAdmin}
          />
        )}
      </section>
    </div>
  );
};

export default DetailPanel;
