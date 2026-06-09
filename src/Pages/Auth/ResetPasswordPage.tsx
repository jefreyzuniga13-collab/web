import { FaEye, FaEyeSlash, FaLock, FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";
import Input from "@/Components/Common/Input";
import Button from "@/Components/Common/Button";
import useResetPasswordForm from "@/Hooks/Auth/useResetPasswordForm";
import logo from "@/assets/img/logoinicio2.png";
import "@/Styles/Auth/ResetPasswordPresentation.css";

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
    <section className={`reset-password ${loading ? "reset-password--loading" : ""}`}>
      <div className="reset-password__shell">
        <aside className="reset-password__brand">
          <div className="reset-password__brand-overlay" />

          <div className="reset-password__brand-content">
            <img src={logo} alt="Logo" className="reset-password__brand-logo" />

            <span className="reset-password__badge">
              Seguridad de acceso CRM
            </span>

            <h1 className="reset-password__title">CREA UNA NUEVA CONTRASEÑA SEGURA</h1>

            <p>
              Definí una nueva credencial para proteger tu cuenta y continuar
              usando la plataforma de forma segura.
            </p>

            <div className="reset-password__features">
              <span>Protección</span>
              <span>Verificación</span>
              <span>Acceso seguro</span>
              <span>CRM</span>
            </div>
          </div>

          <main className="reset-password__form-panel">
            <section
              className={`reset-password__card ${
                formError ? "reset-password__card--error" : ""
              }`}
            >
              <div className="reset-password__mobile-logo">
                <img src={logo} alt="Logo" />
              </div>

              <div className="reset-password__icon">
                <FaLock />
              </div>

              <div className="reset-password__card-header">
                <h2>Restablecer contraseña</h2>
                <p>Ingresá una nueva credencial. Mínimo 8 caracteres.</p>
              </div>

              {formError && (
                <div className="reset-password__error">{formError}</div>
              )}

              <form
                onSubmit={formik.handleSubmit}
                className="reset-password__form"
                noValidate
              >
                <div className="reset-password__field">
                  <label htmlFor="newPassword">Nueva contraseña</label>

                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresá tu nueva contraseña"
                    value={formik.values.newPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    rightIcon={showPassword ? <FaEyeSlash /> : <FaEye />}
                    onIconClick={toggleShowPassword}
                    autoFocus
                    autoComplete="new-password"
                    error={
                      formik.touched.newPassword
                        ? formik.errors.newPassword
                        : undefined
                    }
                  />
                </div>

                <div className="reset-password__field">
                  <label htmlFor="confirmNewPassword">
                    Confirmar contraseña
                  </label>

                  <Input
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirmá tu nueva contraseña"
                    value={formik.values.confirmNewPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    rightIcon={showConfirm ? <FaEyeSlash /> : <FaEye />}
                    onIconClick={toggleShowConfirm}
                    autoComplete="new-password"
                    error={
                      formik.touched.confirmNewPassword
                        ? formik.errors.confirmNewPassword
                        : ""
                    }
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={!canSubmit || loading}
                  className="reset-password__submit-button"
                >
                  {loading
                    ? 'Guardando...'
                    :"Guardar contraseña"}
                </Button>

                <Link to="/login" className="reset-password__back-link">
                  <FaArrowLeft />
                  <span>Volver al inicio de sesión</span>
                </Link>
              </form>

              <div className="login__copyright">
                <span>© {new Date().getFullYear()} PC GROUP S.A. Todos los derechos reservados.</span>
                <span>Versión 26061</span>
              </div>
            </section>
          </main>

          {/* <svg
            className="reset-password__wave"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path d="M0,192L80,181.3C160,171,320,149,480,165.3C640,181,800,235,960,229.3C1120,224,1280,160,1360,128L1440,96L1440,320L0,320Z" />
          </svg> */}
        </aside>
      </div>
    </section>
  );
}