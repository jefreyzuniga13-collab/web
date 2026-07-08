import {
  CART_AGENT_STEP,
  type CartAgentStep
} from "@/Interfaces/Ecommerce/CartAgentCheckoutInterface"

import { LuMapPin, LuShoppingCart } from "react-icons/lu"
import { MdOutlinePayment } from "react-icons/md"

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
  return (
    <div className="carPCPanel-steps">
      <button
        type="button"
        className={`carPCPanel-step ${
          activeStep === CART_AGENT_STEP.carrito
            ? "carPCPanel-step--active"
            : "carPCPanel-step--inactive"
        }`}
        onClick={() => setActiveStep(CART_AGENT_STEP.carrito)}
      >
        <LuShoppingCart fontSize={16} />
      </button>

      <div className="carPCPanel-stepLine" />

      <button
        type="button"
        className={`carPCPanel-step ${
          activeStep === CART_AGENT_STEP.entrega
            ? "carPCPanel-step--active"
            : "carPCPanel-step--inactive"
        }`}
        onClick={() => setActiveStep(CART_AGENT_STEP.entrega)}
      >
        <LuMapPin fontSize={16} />
      </button>

      <div className="carPCPanel-stepLine" />

      <button
        type="button"
        className={`carPCPanel-step ${
          activeStep === CART_AGENT_STEP.pago
            ? "carPCPanel-step--active"
            : "carPCPanel-step--inactive"
        }`}
        onClick={() => setActiveStep(CART_AGENT_STEP.pago)}
      >
        <MdOutlinePayment fontSize={16} />
      </button>
    </div>
  )
}