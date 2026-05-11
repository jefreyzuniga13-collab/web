import { Link } from "react-router-dom";
import Input from "@/Components/Common/Input";
import Button from "@/Components/Common/Button";
import useForgotPasswordForm from "@/Hooks/Auth/useForgotPasswordForm";
import { FaArrowLeft, FaEnvelope } from "react-icons/fa";
import logo from "@/assets/img/pcgroup.png";
import "@/Styles/Auth/ForgotPasswordPresentation.css";

export default function ForgotPasswordPresentation() {
  const { formik, loading, canSubmit, formError } = useForgotPasswordForm();

  return (
    <section className={`forgot-password ${loading ? "forgot-password--loading" : ""}`}>
      <div className="forgot-password__shell">
        <aside className="forgot-password__brand">
          <div className="forgot-password__brand-overlay" />

          <div className="forgot-password__brand-content">
            <img src={logo} alt="Logo" className="forgot-password__brand-logo" />

            <span className="forgot-password__badge">
              Recuperación de acceso CRM
            </span>

            <h1>Recuperá el acceso</h1>

            <p>
              Ingresá tu correo electrónico y te enviaremos las instrucciones
              necesarias para restablecer tu contraseña.
            </p>

            <div className="forgot-password__features">
              <span>Seguro</span>
              <span>Rápido</span>
              <span>Verificado</span>
              <span>Confiable</span>
            </div>
          </div>

          <main className="forgot-password__form-panel">
            <section
              className={`forgot-password__card ${
                formError ? "forgot-password__card--error" : ""
              }`}
            >
              <div className="forgot-password__mobile-logo">
                <img src={logo} alt="Logo" />
              </div>

              <div className="forgot-password__icon">
                <FaEnvelope />
              </div>

              <div className="forgot-password__card-header">
                <h2>Recuperar contraseña</h2>
                <p>
                 Ingresá tu correo electrónico para continuar
                </p>
              </div>

              {formError && (
                <div className="forgot-password__error">{formError}</div>
              )}

              <form
                onSubmit={formik.handleSubmit}
                className="forgot-password__form"
                noValidate
              >
                <div className="forgot-password__field">
                  <label htmlFor="email">
                    Correo electrónico
                  </label>

                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Ej: admin@empresa.com"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    autoFocus
                    autoComplete="email"
                    error={formik.touched.email ? formik.errors.email : undefined}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={!canSubmit || loading}
                  className="forgot-password__submit-button"
                >
                  {loading
                    ?  "Enviando..."
                      :"Enviar instrucciones"}
                </Button>

                <Link to="/login" className="forgot-password__back-link">
                  <FaArrowLeft />
                  <span>
                    Volver al inicio de sesión
                  </span>
                </Link>
              </form>

              <p className="forgot-password__copyright">
                © 2026 PC GROUP S.A. Todos los derechos reservados.
              </p>
            </section>
          </main>

          <svg
            className="forgot-password__wave"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path d="M0,192L80,181.3C160,171,320,149,480,165.3C640,181,800,235,960,229.3C1120,224,1280,160,1360,128L1440,96L1440,320L0,320Z" />
          </svg>
        </aside>
      </div>
    </section>
  );
}