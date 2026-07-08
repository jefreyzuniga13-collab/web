export const CART_AGENT_STEP = {
  carrito: 1,
  entrega: 2,
  pago: 3
} as const

export type CartAgentStep =
  (typeof CART_AGENT_STEP)[keyof typeof CART_AGENT_STEP]

export const CART_AGENT_STEP_LABEL: Record<CartAgentStep, string> = {
  [CART_AGENT_STEP.carrito]: "Carrito",
  [CART_AGENT_STEP.entrega]: "Entrega / dirección",
  [CART_AGENT_STEP.pago]: "Pago y confirmar venta"
}

export type CartAgentCheckoutStepInfo = {
  step: CartAgentStep
  label: string
}

export const CART_AGENT_STEPS: CartAgentCheckoutStepInfo[] = [
  {
    step: CART_AGENT_STEP.carrito,
    label: CART_AGENT_STEP_LABEL[CART_AGENT_STEP.carrito]
  },
  {
    step: CART_AGENT_STEP.entrega,
    label: CART_AGENT_STEP_LABEL[CART_AGENT_STEP.entrega]
  },
  {
    step: CART_AGENT_STEP.pago,
    label: CART_AGENT_STEP_LABEL[CART_AGENT_STEP.pago]
  }
]