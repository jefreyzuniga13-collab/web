import Tooltip from "@mui/material/Tooltip"

import { LuMapPin, LuShoppingCart } from "react-icons/lu"
import { MdOutlinePayment } from "react-icons/md"

import {
  CART_AGENT_STEP,
  type CartAgentStep
} from "@/Interfaces/Ecommerce/CartAgentCheckoutInterface"

interface Props {
  /**
   * Paso actual del panel.
   */
  activeStep: CartAgentStep

  /**
   * Cambia el paso activo.
   */
  setActiveStep: (step: CartAgentStep) => void
}

export default function CartPanelStepNavigation({
  activeStep,
  setActiveStep
}: Props) {
  const getStepClassName = (step: CartAgentStep) =>
    `carPCPanel-step ${
      activeStep === step
        ? "carPCPanel-step--active"
        : "carPCPanel-step--inactive"
    }`

  return (
    <div className="carPCPanel-steps">
      <Tooltip title="Carrito">
        <button
          type="button"
          aria-label="Ir al paso Carrito"
          className={getStepClassName(CART_AGENT_STEP.carrito)}
          onClick={() => setActiveStep(CART_AGENT_STEP.carrito)}
        >
          <LuShoppingCart fontSize={16} />
        </button>
      </Tooltip>

      <div className="carPCPanel-stepLine" />

      <Tooltip title="Entrega">
        <button
          type="button"
          aria-label="Ir al paso Entrega"
          className={getStepClassName(CART_AGENT_STEP.entrega)}
          onClick={() => setActiveStep(CART_AGENT_STEP.entrega)}
        >
          <LuMapPin fontSize={16} />
        </button>
      </Tooltip>

      <div className="carPCPanel-stepLine" />

      <Tooltip title="Pago">
        <button
          type="button"
          aria-label="Ir al paso Pago"
          className={getStepClassName(CART_AGENT_STEP.pago)}
          onClick={() => setActiveStep(CART_AGENT_STEP.pago)}
        >
          <MdOutlinePayment fontSize={16} />
        </button>
      </Tooltip>
    </div>
  )
}