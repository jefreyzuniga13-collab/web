import React, { useEffect, useMemo, useState } from "react"
import { IoChatboxEllipsesOutline } from "react-icons/io5"
import { AiOutlineWechatWork } from "react-icons/ai"
import { TbShoppingCartSearch } from "react-icons/tb"
import { LuChartBarStacked } from "react-icons/lu"
import type { OptionMenu } from "@/Hooks/DetailPanel/useDetailTabs"
import type { RootState } from "@/Context"
import { useSelector, type TypedUseSelectorHook } from "react-redux"
import { selectCartBadgeByContactId } from "@/Context/Slices/Ecommerce/cartBadgeSlice"

const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

interface DetailPanelHeaderTabsProps {
  optionMenu: OptionMenu
  onSelectTab: (tab: OptionMenu) => void
  onSelectHistory?: () => void
  onSelectCurrentConversation?: () => void
  contactId: number
}


const DetailPanelHeaderTabs: React.FC<DetailPanelHeaderTabsProps> = ({
  optionMenu,
  onSelectTab,
  onSelectCurrentConversation,
  contactId
}) => {
const badgeMap = useAppSelector(selectCartBadgeByContactId);

const cartItemsCount = useMemo(() => {
  if (!contactId) return 0;
  return badgeMap?.[contactId]?.count ?? 0;
}, [badgeMap, contactId]);

  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (cartItemsCount > 0) {
      setAnimate(true)
      const t = setTimeout(() => setAnimate(false), 400)
      return () => clearTimeout(t)
    }
  }, [cartItemsCount])

  return (
    <ul className="detail-panel__header">
      <li className={`detailPanel-option ${optionMenu === 1 ? "is-active" : ""}`}>
        <button
          type="button"
          className="detailPanel-optionBtn"
          onClick={() => onSelectTab(1)}
          aria-label="Venta productos"
        >
          <LuChartBarStacked size={18} className="detailPanel-optionBtn__icon" />
        </button>
      </li>

      <li className={`detailPanel-option ${optionMenu === 2 ? "is-active" : ""}`}>
        <button
          type="button"
          className="detailPanel-optionBtn detailPanel-optionBtn--cart"
          onClick={() => onSelectTab(2)}
          aria-label="Carrito de compra"
        >
          <TbShoppingCartSearch
            size={18}
            className="detailPanel-optionBtn__icon"
          />

          {/* Muestra la cantidad que hay en el carrito
          se deve refrescar al crear la orden, etc. */}
          {cartItemsCount > 0 && (
            <span
              className={`detailPanel__cartItemsCount ${
                animate ? "explode" : ""
              }`}
            >
              {cartItemsCount > 99 ? "99+" : cartItemsCount}
            </span>
          )}
        </button>
      </li>

      <li className={`detailPanel-option ${optionMenu === 3 ? "is-active" : ""}`}>
        <button
          type="button"
          className="detailPanel-optionBtn"
          onClick={() => {
            onSelectTab(3)
            onSelectCurrentConversation?.()
          }}
          aria-label="Conversación"
        >
          <AiOutlineWechatWork
            size={18}
            className="detailPanel-optionBtn__icon"
          />
        </button>
      </li>

      <li className={`detailPanel-option ${optionMenu === 4 ? "is-active" : ""}`}>
        <button
          type="button"
          className="detailPanel-optionBtn"
          onClick={() => onSelectTab(4)}
          aria-label="Mensajes rápidos"
        >
          <IoChatboxEllipsesOutline
            size={18}
            className="detailPanel-optionBtn__icon"
          />
        </button>
      </li>
    </ul>
  )
}
export default DetailPanelHeaderTabs