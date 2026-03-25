import Input from "@/Components/Common/Input";
import Button from "@/Components/Common/Button";
import useForgotPasswordForm from "@/Hooks/Auth/useForgotPasswordForm";
import { Link } from "react-router-dom";

import "@/Styles/Auth/LoginPresentation.css";
import "@/Styles/Auth/ForgotPasswordPresentation.css";

import addGroup from "@/assets/img/Add_Group_2025.png";

export default function ForgotPasswordPresentation() {
  const { formik, loading, canSubmit, formError } = useForgotPasswordForm();

  return (
    <div className="login-GeneralContainer">
      {/* IZQUIERDA */}
      <aside className="login__banner" aria-label="Marketing banner">
        <div className="login__banner-shape" />
        <div className="login__banner-content">
          <header className="login__banner-top">
            <h2 className="login__banner-title">
              ¡Impulsa tus Ventas y Conquista Clientes con Nuestro CRM de ventas!
            </h2>
            <p className="login__banner-subtitle">
              Optimiza tu tiempo, organiza tus prioridades y convierte tu flujo de trabajo en una máquina de cerrar ventas.
            </p>
          </header>

          <div className="login__banner-card">
            <img
              src="https://i.ibb.co/9HBdj911/7015971.jpg"
              alt="Banner promocional"
              className="login__banner-image"
              loading="lazy"
            />
          </div>

          <p className="login__banner-text">
            Únete a las empresas que ya están escalando su éxito. Nuestro CRM no solo organiza datos,
            construye relaciones que cierran negocios. Comienza hoy mismo a transformar tu proceso comercial.
          </p>
        </div>
      </aside>

      {/* DERECHA */}
      <main className={`login ${loading ? "login--loading" : ""}`}>
        <div className="login__panel">
          <section className={`login__form-section ${formError ? "login__form-section--error" : ""}`}>
            {formError && <div className="login__error">{formError}</div>}

            <div className="login__brand">
              <img
                className="login__brand-image"
                src={addGroup}
                alt="Recuperar contraseña"
              />
            </div>

            <form onSubmit={formik.handleSubmit} noValidate>
              <p className="forgotPassword-subtitle">
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              <label htmlFor="email" className="login__label">
                Correo electrónico
              </label>

              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Ingresa tu correo electrónico"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                autoFocus
                error={formik.touched.email ? formik.errors.email : undefined}
              />

              <Button
                type="submit"
                variant="primary"
                disabled={!canSubmit || loading}
                className="login__submit-button"
              >
                <span className="login__submit-text">
                  {loading ? "Enviando…" : "Enviar enlace"}
                </span>
              </Button>

              <p className="forgotPassword-back">
                <Link to="/login" replace className="forgotPassword-link">
                  Volver a iniciar sesión
                </Link>
              </p>
            </form>
          </section>

          <footer className="login__footer-area">
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
          </footer>
        </div>
      </main>
    </div>
  );
}
