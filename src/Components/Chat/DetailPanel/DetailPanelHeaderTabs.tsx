import React from "react";
import { FaRegBuilding } from "react-icons/fa";
import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { RiTimelineView } from "react-icons/ri";
import { AiOutlineWechatWork } from "react-icons/ai";
import { LuContact } from "react-icons/lu";
import { TbShoppingCartSearch } from "react-icons/tb";
import { LuChartBarStacked } from "react-icons/lu";
import type { OptionMenu } from "@/Hooks/Chat/DetailPanel/useDetailTabs";
import type { RootState } from '@/Context/index'
import { selectCartItemsCount } from "@/Context/Slices/Cart/cartSlice";
import { useSelector, type TypedUseSelectorHook } from "react-redux";
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector


interface DetailPanelHeaderTabsProps {
  optionMenu: OptionMenu;
  onSelectTab: (tab: OptionMenu) => void;
  onSelectHistory?: () => void;
  onSelectCurrentConversation?: () => void;
}

const DetailPanelHeaderTabs: React.FC<DetailPanelHeaderTabsProps> = ({
  optionMenu,
  onSelectTab,
  onSelectHistory,
  onSelectCurrentConversation,
}) => {
  const cartItemsCount = useAppSelector(selectCartItemsCount);

  return (
    <ul className="detail-panel__header">
      <li className={`detailPanel-option ${optionMenu === 1 ? "is-active" : ""}`}>
        <button
          type="button"
          className="detailPanel-optionBtn"
          onClick={() => onSelectTab(1)}
          aria-label="Cliente"
        >
          <FaRegBuilding size={18} className="detailPanel-optionBtn__icon" />
        </button>
      </li>

      <li className={`detailPanel-option ${optionMenu === 2 ? "is-active" : ""}`}>
        <button
          type="button"
          className="detailPanel-optionBtn"
          onClick={() => onSelectTab(2)}
          aria-label="Contacto"
        >
          <LuContact size={18} className="detailPanel-optionBtn__icon" />
        </button>
      </li>

      <li className={`detailPanel-option ${optionMenu === 3 ? "is-active" : ""}`}>
        <button
          type="button"
          className="detailPanel-optionBtn"
          onClick={() => {
            onSelectTab(3);
            if (onSelectHistory) {
              onSelectHistory();
            }
          }}
          aria-label="Historial de conversaciones"
        >
          <RiTimelineView size={18} className="detailPanel-optionBtn__icon" />
        </button>
      </li>

      <li className={`detailPanel-option ${optionMenu === 4 ? "is-active" : ""}`}>
        <button
          type="button"
          className="detailPanel-optionBtn"
          onClick={() => {
            onSelectTab(4);
            if (onSelectCurrentConversation) {
              onSelectCurrentConversation();
            }
          }}
          aria-label="Conversación"
        >
          <AiOutlineWechatWork size={18} className="detailPanel-optionBtn__icon" />
        </button>
      </li>

      <li className={`detailPanel-option ${optionMenu === 5 ? "is-active" : ""}`}>
        <button
          type="button"
          className="detailPanel-optionBtn"
          onClick={() => onSelectTab(5)}
          aria-label="Mensajes rápidos"
        >
          <IoChatboxEllipsesOutline size={18} className="detailPanel-optionBtn__icon" />
        </button>
      </li>

      <li className={`detailPanel-option ${optionMenu === 6 ? "is-active" : ""}`}>
        <button
          type="button"
          className="detailPanel-optionBtn"
          onClick={() => onSelectTab(6)}
          aria-label="Venta productos"
        >
          <LuChartBarStacked size={18} className="detailPanel-optionBtn__icon" />
        </button>
      </li>

      <li className={`detailPanel-option ${optionMenu === 7 ? "is-active" : ""}`}>
        <button
          type="button"
          className="detailPanel-optionBtn detailPanel-optionBtn--cart"
          onClick={() => onSelectTab(7)}
          aria-label="Carrito de compra"
        >
          <TbShoppingCartSearch size={18} className="detailPanel-optionBtn__icon" />


          {cartItemsCount > 0 && (
            <span className="detailPanel__cartItemsCount">
              {cartItemsCount > 99 ? "99+" : cartItemsCount}
            </span>
          )}
        </button>
      </li>
    </ul>
  );
};

export default DetailPanelHeaderTabs;