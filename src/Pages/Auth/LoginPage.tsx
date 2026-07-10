import { Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaLinkedinIn,
} from "react-icons/fa";
import Input from "@/Components/Common/Input";
import Button from "@/Components/Common/Button";
import useLoginForm from "@/Hooks/Auth/useLoginForm";
import { ActivationSesionModal } from "@/Components/Auth/ActivationSesionModal";
import logo from "@/assets/img/logoinicio2.png"
import { BiSolidContact } from "react-icons/bi";
import { MdSupportAgent } from "react-icons/md";
import { BiSupport } from "react-icons/bi";
import { MdPayment } from "react-icons/md";
import "@/Styles/Auth/LoginPresentation.css";
import { FiLogIn } from "react-icons/fi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export default function LoginPresentation() {

  const {
    formik,
    loading,
    showPassword,
    toggleShowPassword,
    canSubmit,
    formError,
    showModal,
    confirmLogin,
    cancelLogin,
  } = useLoginForm();
  
  return (
    <section className={`login ${loading ? "login--loading" : ""}`}>
      <div className="login__shell">
        <aside className="login__brand">
          <div className="login__brand-overlay" />

          <div className="login__brand-content">
            <img src={logo} alt="Logo" className="login__brand-logo" />

            <span className="login__badge">
             Control total de ventas y atención en redes sociales
            </span>

            <h1 className="login__title">CONECTA, OPTIMIZA Y EXPANDE</h1>

            <p>
              Centralizá ventas y atención por WhatsApp, Instagram y Messenger en un solo lugar. Automatizá procesos con carritos de compra y links de pago integrados con pasarela, con reportes en tiempo real y máxima seguridad.
            </p>

            <div className="login__features">
              <span className="login_features_content"><BiSolidContact /> Atención</span>
              <span className="login_features_content"><MdSupportAgent /> Contactos</span>
              <span className="login_features_content"><BiSupport /> Ventas</span>
              <span className="login_features_content"><MdPayment /> Pagos en linea</span>
            </div>
          </div>

          <main className="login__form-panel">
            <div className={`login__card ${formError ? "login__card--error" : ""}`}>
              <div className="login__mobile-logo">
                <img src={logo} alt="Logo" />
              </div>

              <div className="login__card-header">
                <h2>Iniciar sesión</h2>
                <p>Ingresá tus credenciales para continuar</p>
              </div>

              {formError && <div className="login__error">{formError}</div>}

              <form onSubmit={formik.handleSubmit} className="login__form" noValidate>
                <div className="login__field">
                  <label htmlFor="email">
                    Usuario o correo
                  </label>

                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@empresa.com"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    autoFocus
                    autoComplete="username"
                    error={formik.touched.email ? formik.errors.email : undefined}
                  />
                </div>

                <div className="login__field">
                  <label htmlFor="password">
                    Contraseña
                  </label>

                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresá tu contraseña"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    autoComplete="current-password"
                    error={formik.touched.password ? formik.errors.password : undefined}
                    rightIcon={showPassword ? <FaEyeSlash /> : <FaEye />}
                    onIconClick={toggleShowPassword}
                  />
                </div>

                <div className="login__options">
                  <label className="login__remember">
                    <input type="checkbox" />
                    <span>Recordarme</span>
                  </label>

                  <Link to="/forgot-password" className="login__forgot-link">
                    
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={!canSubmit || loading}
                  className="login__submit-button"
                >
                  {loading
                    ? <>
                    <AiOutlineLoading3Quarters />
                    </>
                    : <>
                      Ingresar al sistema
                      <FiLogIn  />
                      </>}
                </Button>
              </form>

              <div className="login__divider">
                <span>Seguinos en redes</span>
              </div>

              <div className="login__social">
                <a href="https://www.facebook.com/61567499630347" target="_blank" rel="noreferrer" aria-label="Facebook">
                  <FaFacebookF />
                </a>

                <a href="https://www.instagram.com/pcgroupsa/" target="_blank" rel="noreferrer" aria-label="Instagram">
                  <FaInstagram />
                </a>

                <a href="https://wa.me/" target="_blank" rel="noreferrer" aria-label="WhatsApp">
                  <FaWhatsapp />
                </a>

                <a href="https://ni.linkedin.com/company/pc-group-s-a" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                  <FaLinkedinIn />
                </a>
              </div>

              <div className="login__copyright">
                <span>© {new Date().getFullYear()} PC GROUP S.A. Todos los derechos reservados.</span>
                <span>Versión 26071</span>
              </div>
            </div>
          </main>
        </aside>
      </div>

      {showModal && (
        <ActivationSesionModal onAccept={confirmLogin} onCancel={cancelLogin} />
      )}
    </section>
  );
}