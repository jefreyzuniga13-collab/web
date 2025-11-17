/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { FaRegBuilding } from "react-icons/fa";
import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { RiTimelineView } from "react-icons/ri";
import { AiOutlineWechatWork } from "react-icons/ai";
import { LuContact } from "react-icons/lu";
import type { OptionMenu } from "@/Hooks/Chat/DetailPanel/useDetailTabs";

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
    </ul>
  );
};

export default DetailPanelHeaderTabs;