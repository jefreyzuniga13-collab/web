import { Tooltip } from "@mui/material"

import Button from "@/Components/Common/Button"

import { tooltipSlotProps } from "@/Utils/ECommerce/utils"

import {
  CART_AGENT_STEP,
  type CartAgentStep
} from "@/Interfaces/Ecommerce/CartAgentCheckoutInterface"

import { FaFilePdf, FaMapMarkerAlt } from "react-icons/fa"
import { IoIosChatboxes } from "react-icons/io"
import { IoSend } from "react-icons/io5"
import { MdOutlineCancelScheduleSend } from "react-icons/md"
import { AiOutlineLoading3Quarters } from "react-icons/ai"

interface Props {
  /**
   * Paso activo del panel.
   */
  activeStep: CartAgentStep

  /**
   * Cambia el paso activo.
   */
  setActiveStep: (step: CartAgentStep) => void

  /**
   * Indica si debe mostrarse el botón de direcciones.
   */
  showAddressButton: boolean

  /**
   * Indica si las acciones están bloqueadas por carga o proceso.
   */
  actionsDisabled: boolean

  /**
   * Indica si se está enviando archivo por chat.
   */
  sending: boolean

  /**
   * Indica si se está enviando mensaje/link/chat.
   */
  sendChatLoading: boolean

  /**
   * Indica si se está cancelando link.
   */
  cancelLoading: boolean

  /**
   * Carga direcciones guardadas del cliente.
   */
  loadAddresses: () => Promise<void>

  /**
   * Abre o cierra el modal/lista de direcciones.
   */
  setShowAddressModal: (value: boolean) => void

  /**
   * Envía PDF del carrito al chat.
   */
  handleSendCartPdf: () => Promise<void>

  /**
   * Envía confirmación/resumen del carrito al chat.
   */
  handleSendCartChat: () => Promise<void>

  /**
   * Cancela o revoca links existentes.
   */
  Cancel: () => Promise<void>

  /**
   * Envía link de pago al cliente.
   */
  handleSendLink: (returnLink?: boolean) => Promise<unknown>
}

export default function CartPanelActions({
  activeStep,
  setActiveStep,
  showAddressButton,
  actionsDisabled,
  sending,
  sendChatLoading,
  cancelLoading,
  loadAddresses,
  setShowAddressModal,
  handleSendCartPdf,
  handleSendCartChat,
  Cancel,
  handleSendLink
}: Props) {
  /**
   * En el paso de pago directo del agente no se muestran estas acciones.
   * Ahí solo debe quedar el botón de Procesar venta.
   */
  if (activeStep === CART_AGENT_STEP.pago) {
    return null
  }

  return (
    <div className="productTab-footer__payment">
      {showAddressButton && (
        <Tooltip title="Listar direcciones" slotProps={tooltipSlotProps}>
          <Button
            className="carPanel-btn"
            disabled={actionsDisabled}
            onClick={async () => {
              await loadAddresses()
              setShowAddressModal(true)
              setActiveStep(CART_AGENT_STEP.entrega)
            }}
          >
            <FaMapMarkerAlt size={12} />
          </Button>
        </Tooltip>
      )}

      <Tooltip title="Enviar PDF" slotProps={tooltipSlotProps}>
        <Button
          className="carPanel-btn"
          disabled={actionsDisabled}
          onClick={handleSendCartPdf}
        >
          {sending || sendChatLoading ? (
            <AiOutlineLoading3Quarters fontSize={18} />
          ) : (
            <FaFilePdf fontSize={18} />
          )}
        </Button>
      </Tooltip>

      <Tooltip title="Confirmar carrito" slotProps={tooltipSlotProps}>
        <Button
          className="carPanel-btn"
          disabled={actionsDisabled}
          onClick={handleSendCartChat}
        >
          {sendChatLoading ? (
            <AiOutlineLoading3Quarters fontSize={18} />
          ) : (
            <IoIosChatboxes fontSize={18} />
          )}
        </Button>
      </Tooltip>

      <Tooltip title="Cancelar links" slotProps={tooltipSlotProps}>
        <Button
          className="cancelPanel-btn"
          disabled={actionsDisabled}
          onClick={Cancel}
        >
          {cancelLoading ? (
            <AiOutlineLoading3Quarters fontSize={18} />
          ) : (
            <MdOutlineCancelScheduleSend fontSize={18} />
          )}
        </Button>
      </Tooltip>

      <Tooltip title="Enviar link" slotProps={tooltipSlotProps}>
        <Button
          className="payment-btn"
          disabled={actionsDisabled}
          onClick={async () => await handleSendLink(false)}
        >
          {sendChatLoading ? (
            <AiOutlineLoading3Quarters fontSize={18} />
          ) : (
            <IoSend fontSize={16} />
          )}
        </Button>
      </Tooltip>
    </div>
  )
}