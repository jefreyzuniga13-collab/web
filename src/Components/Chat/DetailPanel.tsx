import { useDetailPanel } from "@/Hooks/Chat/useDetailPanel";
import DetailPanelHeaderTabs from "@/Components/Chat/DetailPanel/DetailPanelHeaderTabs";
import DetailPanelCurrentConversationTab from "@/Components/Chat/DetailPanel/DetailPanelCurrentConversationTab";
import DetailPanelOptionsContact from "@/Components/Chat/DetailPanelOptionsContact";
import DetailPanelMensajesRapidos from "@/Components/Chat/DetailPanelMensajesRapidos";
import {ProductTab} from '@/Components/ECommerce/Tabs/ProductTab'
import CarPCPanelTab from "@/Components/ECommerce/Tabs/CarPCPanelTab";
import "@/Styles/Chat/DetailPanel.css";
import { setContactCartBadge } from "@/Context/Slices/Ecommerce/cartBadgeSlice";
import { getProductFromCarAsync } from "@/Context/Slices/Ecommerce/cartSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/Context";
import { CartPCGFlowProvider } from "@/Context/CartPCGFlowProvider";

type Props = {
  contactId?: number;
  conversationId?: number;
  selectedParam?: unknown;
  isAdmin?: boolean;
  onSendNow?: (txt: string) => void | Promise<void>;
};

const DetailPanel: React.FC<Props> = ({
  contactId,
  conversationId,
  selectedParam,
  onSendNow,
  isAdmin
}) => {
  const {
    optionMenu,
    setOptionMenu,
    selectedData,
    qQuick,
    setQQuick,
    filteredQuick,
    handleSendQuick,
    formatNiPhone,
    displayOrDash,
    formatDate,
  } = useDetailPanel(contactId, selectedParam);

     const dispatch = useDispatch<AppDispatch>();
   
   useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onReload = async (e: any) => {
      const { contactId: cid, orderId } = e.detail ?? {};
      if (!cid || !orderId) return;

      const updated = await dispatch(
        getProductFromCarAsync({ codCliente: contactId ?? 0, noPedido: orderId })
      ).unwrap();

      const arr = Array.isArray(updated) ? updated : [];
      const count =
        arr[0]?.listDetalle?.reduce(
          (sum, d) => sum + Number(d.cantidad ?? 0),
          0
        ) ?? 0;

      dispatch(setContactCartBadge({
        contactId: cid,
        hasCart: count > 0,
        count
      }));
    };

    window.addEventListener("CartReloadForActiveContact", onReload);
    return () =>
      window.removeEventListener("CartReloadForActiveContact", onReload);
  }, [contactId, dispatch]);
  
  return (
    <div
      key={`${contactId ?? "c"}-${conversationId ?? "v"}-${
        selectedParam ?? ""
      }`}
      className="detailPanel-container"
    >
      <DetailPanelHeaderTabs
        optionMenu={optionMenu}
        onSelectTab={setOptionMenu}
        contactId={contactId ?? 0}
      />

      <section className="detailPanel-content detailPanel-content--padded">

        <CartPCGFlowProvider
            conversationId={Number(conversationId)}
            contactId={Number(contactId)}
          >
            {optionMenu === 1 && (
              <ProductTab
                conversationId={Number(conversationId)}
                contactId={Number(contactId)}
              />
            )}

            {optionMenu === 2 && (
              <CarPCPanelTab
                conversationId={Number(conversationId)}
                contactId={Number(contactId)}
              />
            )}
          </CartPCGFlowProvider>

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

        {optionMenu === 4 && (
          <DetailPanelCurrentConversationTab
            conversationId={(Number(conversationId))}
            formatDate={formatDate}
            isAdmin={isAdmin}
          />
        )}

        {optionMenu === 5 && (
          <DetailPanelMensajesRapidos
            filteredQuick={filteredQuick}
            handleSendQuick={txt => handleSendQuick(txt, onSendNow)}
            qQuick={qQuick}
            setQQuick={setQQuick}
            onSendNow={onSendNow}
          />
        )}
        
      </section>
    </div>
  );
};

export default DetailPanel;