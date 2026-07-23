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
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice";
import { getProductFromCarAsync } from "@/Context/Slices/Ecommerce/cartSlice";
import type { AppDispatch } from "@/Context";

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

  /*
   * El flujo de carrito emite este evento después de una modificación.
   * Solo se procesa cuando pertenece al contacto activo del panel.
   */
  useEffect(() => {
    const onReload = async (event: Event): Promise<void> => {
      const detail = (event as CustomEvent<CartReloadDetail>).detail;

      const eventContactId = Number(detail?.contactId ?? 0);
      const orderId = Number(detail?.orderId ?? 0);

      if (eventContactId <= 0 || orderId <= 0) return;
      if (eventContactId !== normalizedContactId) return;

      try {
        const updated = await dispatch(
          getProductFromCarAsync({
            codCliente: eventContactId,
            noPedido: orderId,
          })
        ).unwrap();

        const cart = Array.isArray(updated) ? updated : [];

        const count =
          cart[0]?.listDetalle?.reduce((sum, item) => {
            if (item.tipoComponente === "O") {
              return sum;
            }

            return sum + Number(item.cantidad ?? 0);
          }, 0) ?? 0;

        dispatch(
          setContactCartBadge({
            contactId: eventContactId,
            hasCart: count > 0,
            count,
          })
        );
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
  }, [dispatch, normalizedContactId]);

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