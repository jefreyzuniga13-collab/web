import { Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Input from "@/Components/Common/Input";
import Button from "@/Components/Common/Button";
import useLoginForm from "@/Hooks/Auth/useLoginForm";
import { ActivationSesionModal } from "@/Components/Auth/ActivationSesionModal";
import addGroup from "@/assets/Add_Group_2025.png";
import { FaFacebook } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa6";
import { FaInstagramSquare } from "react-icons/fa";
import { FaTiktok } from "react-icons/fa";
import "@/Styles/Auth/LoginPresentation.css";

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
    cancelLogin
  } = useLoginForm();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEnterKey = (event: any) => {
    if (event.key === "Enter") confirmLogin();
  };

  return (
    <div className="login-GeneralContainer">
      {/* Banner IZQUIERDA (desktop) / arriba (mobile) */}
      <aside className="login__banner" aria-label="Marketing banner">
        <div className="login__banner-shape" />
        <div className="login__banner-content">
          <div className="login__banner-top">
            <h2 className="login__banner-title">
              ¡Impulsa tus Ventas y Conquista Clientes con Nuestro CRM de ventas!
            </h2>
            <p className="login__banner-subtitle">
              Optimiza tu tiempo, organiza tus prioridades y convierte tu flujo de trabajo en una máquina de cerrar ventas.
            </p>
          </div>

          <div className="login__banner-card">
            <img
              src="https://i.ibb.co/9HBdj911/7015971.jpg"
              alt="Banner promocional"
              className="login__banner-image"
              loading="lazy"
            />
          </div>

          <p className="login__banner-text">
            Únete a las empresas que ya están escalando su éxito. Nuestro CRM no solo organiza datos, construye relaciones que cierran negocios.
            Comienza hoy mismo a transformar tu proceso comercial.
          </p>
        </div>
      </aside>

      {/* Form DERECHA (desktop) / abajo (mobile) */}
      <div className={`login ${loading ? "login--loading" : ""}`}>
        <div className="login__container">
          <section className={`login__form-section ${formError ? "login__form-section--error" : ""}`}>
            {formError && <div className="login__error">{formError}</div>}

            <div className="login__brand">
              <img
                className="login__brand-image"
                src={addGroup}
                alt="Imagen de inicio de sesión"
              />
            </div>

            <form onSubmit={formik.handleSubmit} noValidate>
              <label htmlFor="email" className="login__label">Correo electrónico</label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Ingresa tu correo electrónico"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                autoFocus
                onKeyDown={handleEnterKey}
                error={formik.touched.email ? formik.errors.email : undefined}
              />

              <label htmlFor="password" className="login__label">Contraseña</label>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password ? formik.errors.password : undefined}
                rightIcon={showPassword ? <FaEyeSlash /> : <FaEye />}
                onIconClick={toggleShowPassword}
                onKeyDown={handleEnterKey}
              />

              <div className="login__options">
                <Link to="/forgot-password" replace className="login__forgot-link">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={!canSubmit || loading}
                className="login__submit-button"
                onKeyDown={handleEnterKey}
              >
                <span className="login__submit-text">
                  {loading ? "Iniciando sesión…" : "Iniciar sesión"}
                </span>
              </Button>
            </form>

            <ul className="login__social">
              <li className="login__social-item">
                <a
                  href="https://www.facebook.com/61567499630347"
                  target="_blank"
                  rel="noreferrer"
                  className="login__social-link"
                  aria-label="Facebook"
                >
                  <FaFacebook className="login__social-icon" />
                </a>
              </li>

              <li className="login__social-item">
                <a
                  href="https://www.instagram.com/pcgroupsa/"
                  target="_blank"
                  rel="noreferrer"
                  className="login__social-link"
                  aria-label="Instagram"
                >
                  <FaInstagramSquare className="login__social-icon" />
                </a>
              </li>

              <li className="login__social-item">
                <a
                  href="https://www.tiktok.com/@pcgroupsa"
                  target="_blank"
                  rel="noreferrer"
                  className="login__social-link"
                  aria-label="TikTok"
                >
                  <FaTiktok className="login__social-icon" />
                </a>
              </li>

              <li className="login__social-item">
                <a
                  href="https://ni.linkedin.com/company/pc-group-s-a"
                  target="_blank"
                  rel="noreferrer"
                  className="login__social-link"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin className="login__social-icon" />
                </a>
              </li>
            </ul>
          </section>
        </div>

        <img
          className="login__image-footer"
          src="https://i.ibb.co/LXbMbMm2/logo.png"
          alt="Logo de la empresa"
        />

        <p className="login__footer">
          ©<span className="login__footer-text">2025 PC Group S.A. Todos los derechos reservados.</span>
        </p>

        <p className="login__footer">
          <span className="login__footer-text">Add Group 26.02.28.1</span>
        </p>

        {showModal && (
          <ActivationSesionModal
            onAccept={confirmLogin}
            onCancel={cancelLogin}
          />
        )}
      </div>
    </div>
  );
}
