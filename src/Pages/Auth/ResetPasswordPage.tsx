import { FaEye, FaEyeSlash } from "react-icons/fa";
import Input from "@/Components/Common/Input";
import Button from "@/Components/Common/Button";
import useResetPasswordForm from "@/Hooks/Auth/useResetPasswordForm";

import "@/Styles/Auth/LoginPresentation.css";
import "@/Styles/Auth/ResetPasswordPresentation.css";

import addGroup from "@/assets/Add_Group_2025.png";

export default function ResetPasswordPresentation() {
  const {
    formik,
    loading,
    canSubmit,
    showPassword,
    toggleShowPassword,
    showConfirm,
    toggleShowConfirm,
    formError,
  } = useResetPasswordForm();

  return (
    <div className="login-GeneralContainer">
      <div className={`login ${loading ? "login--loading" : ""}`}>
        <div className="login__container">
          <section className={`login__form-section ${formError ? "login__form-section--error" : ""}`}>
            {formError && <div className="login__error">{formError}</div>}

            <div className="login__brand">
              <img
                className="login__brand-image"
                src={addGroup}
                alt="Imagen de restablecer contraseña"
              />
            </div>

            <form onSubmit={formik.handleSubmit} noValidate>
              <p className="resetPassword-subtitle">
                Ingresa tu nueva contraseña. Mínimo 8 caracteres.
              </p>

              <label htmlFor="newPassword" className="login__label">
                Nueva contraseña
              </label>
              <Input
                id="newPassword"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Escribe tu nueva contraseña"
                value={formik.values.newPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                rightIcon={showPassword ? <FaEyeSlash /> : <FaEye />}
                onIconClick={toggleShowPassword}
                autoFocus
                error={formik.touched.newPassword ? formik.errors.newPassword : undefined}
              />

              <label htmlFor="confirmNewPassword" className="login__label">
                Confirmar contraseña
              </label>
              <Input
                id="confirmNewPassword"
                name="confirmNewPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Confirma tu nueva contraseña"
                value={formik.values.confirmNewPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                rightIcon={showConfirm ? <FaEyeSlash /> : <FaEye />}
                onIconClick={toggleShowConfirm}
                error={
                  formik.touched.confirmNewPassword
                    ? formik.errors.confirmNewPassword
                    : undefined
                }
              />

              <Button
                type="submit"
                variant="primary"
                disabled={!canSubmit || loading}
                className="login__submit-button"
              >
                <p className="login__submit-text">
                  {loading ? "Guardando…" : "Guardar contraseña"}
                </p>
              </Button>
            </form>
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
          <span className="login__footer-text">Add Group 2.0</span>
        </p>
      </div>

      {/* MISMO BANNER DEL LOGIN */}
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
    </div>
  );
}