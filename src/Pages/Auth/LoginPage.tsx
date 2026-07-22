import { Link } from "react-router-dom";
import {
  FaEye,
  FaEyeSlash,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaWhatsapp,
} from "react-icons/fa";
import { BiSolidContact, BiSupport } from "react-icons/bi";
import { MdPayment, MdSupportAgent } from "react-icons/md";
import { FiLogIn } from "react-icons/fi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

import Button from "@/Components/Common/Button";
import Input from "@/Components/Common/Input";
import { ReplaceSessionModal } from "@/Components/Auth/ReplaceSessionModal";

import useLoginForm from "@/Hooks/Auth/useLoginForm";

import logo from "@/assets/img/logoinicio2.png";

import "@/Styles/Auth/LoginPresentation.css";

/**
 * Pantalla principal de autenticación.
 *
 * Nuevo flujo:
 * - Si no hay sesión activa: login normal.
 * - Si existe una sesión activa: se muestra un modal local
 *   para decidir si se reemplaza la sesión anterior.
 */
export default function LoginPresentation() {
  const {
    formik,
    loading,
    replacingSession,

    showPassword,
    toggleShowPassword,

    canSubmit,
    formError,

    showReplaceSessionModal,
    replaceSessionConflict,

    handleConfirmReplaceSession,
    handleCancelReplaceSession,
  } = useLoginForm();

  const isSubmitting =
    formik.isSubmitting ||
    loading ||
    replacingSession;

  const formDisabled =
    isSubmitting ||
    showReplaceSessionModal;

  return (
    <section
      className={`login ${isSubmitting ? "login--loading" : ""}`}
      aria-busy={isSubmitting}
    >
      <div className="login__shell">
        <aside className="login__brand">
          <div className="login__brand-overlay" />

          <div className="login__brand-content">
            <img
              src={logo}
              alt="PC Group"
              className="login__brand-logo"
            />

            <span className="login__badge">
              Control total de ventas y atención en redes sociales
            </span>

            <h1 className="login__title">
              CONECTA, OPTIMIZA Y EXPANDE
            </h1>

            <p>
              Centralizá ventas y atención por WhatsApp, Instagram y Messenger
              en un solo lugar. Automatizá procesos con carritos de compra y
              links de pago integrados con pasarela, con reportes en tiempo real
              y máxima seguridad.
            </p>

            <div className="login__features">
              <span className="login_features_content">
                <BiSolidContact />
                Atención
              </span>

              <span className="login_features_content">
                <MdSupportAgent />
                Contactos
              </span>

              <span className="login_features_content">
                <BiSupport />
                Ventas
              </span>

              <span className="login_features_content">
                <MdPayment />
                Pagos en línea
              </span>
            </div>
          </div>

          <main className="login__form-panel">
            <div
              className={`login__card ${
                formError ? "login__card--error" : ""
              }`}
            >
              <div className="login__mobile-logo">
                <img src={logo} alt="PC Group" />
              </div>

              <div className="login__card-header">
                <h2>Iniciar sesión</h2>
                <p>Ingresá tus credenciales para continuar</p>
              </div>

              {formError && (
                <div
                  className="login__error"
                  role="alert"
                  aria-live="assertive"
                >
                  {formError}
                </div>
              )}

              <form
                onSubmit={formik.handleSubmit}
                className="login__form"
                noValidate
              >
                <div className="login__field">
                  <label htmlFor="email">Correo</label>

                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Ingresar correo"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    autoFocus
                    autoComplete="email"
                    disabled={formDisabled}
                    error={
                      formik.touched.email
                        ? formik.errors.email
                        : undefined
                    }
                  />
                </div>

                <div className="login__field">
                  <label htmlFor="password">Contraseña</label>

                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresar contraseña"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    autoComplete="current-password"
                    disabled={formDisabled}
                    error={
                      formik.touched.password
                        ? formik.errors.password
                        : undefined
                    }
                    rightIcon={showPassword ? <FaEyeSlash /> : <FaEye />}
                    onIconClick={toggleShowPassword}
                  />
                </div>

                <div className="login__options">
                  <label className="login__remember">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={formik.values.remember}
                      onChange={formik.handleChange}
                      disabled={formDisabled}
                    />

                    <span>Recordar</span>
                  </label>

                  <Link
                    to="/forgot-password"
                    className="login__forgot-link"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={!canSubmit || formDisabled}
                  className="login__submit-button"
                >
                  {isSubmitting ? (
                    <AiOutlineLoading3Quarters
                      aria-label="Iniciando sesión"
                      className="login__loading-icon"
                    />
                  ) : (
                    <>
                      Ingresar al sistema
                      <FiLogIn />
                    </>
                  )}
                </Button>
              </form>

              <div className="login__divider">
                <span>Seguinos en redes</span>
              </div>

              <div className="login__social">
                <a
                  href="https://www.facebook.com/61567499630347"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                >
                  <FaFacebookF />
                </a>

                <a
                  href="https://www.instagram.com/pcgroupsa/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                >
                  <FaInstagram />
                </a>

                <a
                  href="https://wa.me/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                >
                  <FaWhatsapp />
                </a>

                <a
                  href="https://ni.linkedin.com/company/pc-group-s-a"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                >
                  <FaLinkedinIn />
                </a>
              </div>

              <div className="login__copyright">
                <span>
                  © {new Date().getFullYear()} PC GROUP S.A. Todos los
                  derechos reservados.
                </span>

                <span>Versión 26071</span>
              </div>
            </div>
          </main>
        </aside>
      </div>

      <ReplaceSessionModal
        isOpen={showReplaceSessionModal}
        conflict={replaceSessionConflict}
        loading={replacingSession}
        onConfirm={handleConfirmReplaceSession}
        onCancel={handleCancelReplaceSession}
      />
    </section>
  );
}