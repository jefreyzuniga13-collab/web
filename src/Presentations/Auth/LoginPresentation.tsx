
import { Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import Input from "@/Components/Common/Input";
import Button from "@/Components/Common/Button";
// import LanguageSwitcher from "@/Components/Common/LanguageSwitcher";
import "@/Styles/Auth/LoginPresentation.css";
import useLoginForm from "@/Hooks/Auth/useLoginForm";

export default function LoginPresentation() {
  const { t } = useTranslation();
  const {
    formik,
    loading,
    showPassword,
    toggleShowPassword,
    canSubmit,
    formError,
  } = useLoginForm();

  return (
    <div className={`login ${loading ? 'login--loading' : ''}`}>
      <div className="login__container">   
        <aside className="login__info-panel">
          <h1 className="login__title">{t("login.title")}</h1>
          <p className="login__description">{t("login.description")}</p>
          <ul className="login__features">
            <li className="login__features-item">{t("login.features.fastReplies")}</li>
            <li className="login__features-item">{t("login.features.centralInbox")}</li>
            <li className="login__features-item">{t("login.features.analytics")}</li>
            <li className="login__features-item">{t("login.features.customization")}</li>
          </ul>
          <img
            className="login__image"
            src="https://i.ibb.co/mrNrN3tv/login-illustration.png"
            alt={t("login.imageAlt")}
          />
        </aside>

        <section className={`login__form-section ${formError ? 'login__form-section--error' : ''}`}>
          <div className="login__form-header">
            <Link to="/forgot-password" className="login__help-link">
              {t("login.needHelp")}
            </Link>
            {/* <LanguageSwitcher /> */}
          </div>

          <p className="login__subtitle">{t("login.subtitle")}</p>
          {formError && <div className="login__error">{formError}</div>}

          <form onSubmit={formik.handleSubmit} noValidate>
            <label htmlFor="email" className="login__label">
              {t("login.emailLabel")}
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("login.emailPlaceholder")}
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email ? formik.errors.email : undefined}
            />

            <label htmlFor="password" className="login__label">
              {t("login.passwordLabel")}
            </label>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("login.passwordPlaceholder")}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.password ? formik.errors.password : undefined
              }
              rightIcon={showPassword ? <FaEyeSlash /> : <FaEye />}
              onIconClick={toggleShowPassword}
            />

            <div className="login__options">
              <label className="login__remember">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formik.values.remember}
                  onChange={formik.handleChange}
                />
                {t("login.rememberMe")}
              </label>
              <Link to="/forgot-password" replace className="login__forgot-link">
                {t("login.forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={!canSubmit || loading}
              className="login__submit-button"
            >
              {loading ? `${t("login.submit")}…` : t("login.submit")}
            </Button>

            <p className="login__signup-text">
              {t("login.noAccount")}{" "}
              <Link to="/signup" replace className="login__signup-link">
                {t("login.signUp")}
              </Link>
            </p>
          </form>
        </section>
      </div>
      <p className="login__footer">©<span className="derechos">2025 PC Group S.A. Todos los derechos reservados.</span></p>
    </div>
  );
}
