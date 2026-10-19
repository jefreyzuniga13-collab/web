import type { ReactNode } from "react"
import { FiLock } from "react-icons/fi"
import "@/Styles/Ecommerce/Payment/PublicCheckoutShell.css"

export type PublicCheckoutStepId =
  | "cart"
  | "location"
  | "currency"
  | "paymentMethod"

type StepDef = {
  id: PublicCheckoutStepId
  label: string
}

const STEPS: StepDef[] = [
  { id: "cart", label: "Carrito" },
  { id: "location", label: "Dirección" },
  { id: "currency", label: "Forma de pago" },
  { id: "paymentMethod", label: "Pago" },
]

type Props = {
  /**
   * Paso activo del flujo público (link de pago).
   */
  activeStep: PublicCheckoutStepId

  /**
   * Contenido del paso.
   */
  children: ReactNode
}

const stepIndex = (id: PublicCheckoutStepId) =>
  STEPS.findIndex((step) => step.id === id)

/**
 * Shell visual del checkout público (link de pago).
 * Header + stepper + contenido viven dentro de una tarjeta blanca.
 */
export default function PublicCheckoutShell({
  activeStep,
  children,
}: Props) {
  const activeIndex = stepIndex(activeStep)

  return (
    <div className="public-checkout notranslate" translate="no" lang="es-NI">
      <div className="public-checkout__bg" aria-hidden="true" />

      <div className="public-checkout__scroll">
        <div className="public-checkout__frame">
          <div className="public-checkout__panel">
            <header className="public-checkout__header">
              <div className="public-checkout__brand" aria-label="Orbita CRM">
                <span className="public-checkout__brand-orbita">Orbita</span>
                <span className="public-checkout__brand-crm">CRM</span>
              </div>

              <div className="public-checkout__secure">
                <FiLock size={14} aria-hidden="true" />
                <span>Pago seguro</span>
              </div>
            </header>

            <nav
              className="public-checkout__stepper"
              aria-label="Progreso del pago"
            >
              <ol className="public-checkout__steps">
                {STEPS.map((step, index) => {
                  const done = index < activeIndex
                  const current = index === activeIndex

                  return (
                    <li
                      key={step.id}
                      className={[
                        "public-checkout__step",
                        done ? "public-checkout__step--done" : "",
                        current ? "public-checkout__step--current" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span
                        className="public-checkout__step-index"
                        aria-hidden="true"
                      >
                        {done ? "✓" : index + 1}
                      </span>
                      <span className="public-checkout__step-label">
                        {step.label}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </nav>

            <main className="public-checkout__body">{children}</main>
          </div>
        </div>
      </div>
    </div>
  )
}
