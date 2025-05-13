import { Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import useLoginContainer from "@/Containers/Auth/useLoginContainer";
import Input from "@/Components/Common/Input";
import Button from "@/Components/Common/Button";
import LanguageSwitcher from "@/Components/Common/LanguageSwitcher";
import "@/Styles/Auth/LoginPresentation.css";

export default function LoginPresentation() {
  const { t } = useTranslation();
  const {
    formik,
    loading,
    showPassword,
    toggleShowPassword,
    canSubmit,
    formError,
  } = useLoginContainer();

  return (
    <div className="login-page">
      <div className="login-content">   
        <aside className="login-info">
          <h1 className="login-title">{t("login.title")}</h1>
          <p className="login-description">{t("login.description")}</p>
          <ul className="login-features">
            <li>{t("login.features.fastReplies")}</li>
            <li>{t("login.features.centralInbox")}</li>
            <li>{t("login.features.analytics")}</li>
            <li>{t("login.features.customization")}</li>
          </ul>
          <img
            className="login-image"
            src="https://i.ibb.co/mrNrN3tv/login-illustration.png"
            alt={t("login.imageAlt")}
          />
        </aside>

        <section className="login-form-section">
        <div className="login-form-header">
        <Link to="/forgot-password" className="login-help">
          {t("login.needHelp")}
        </Link>
        <LanguageSwitcher />
      </div>

          <p className="login-subtitle">{t("login.subtitle")}</p>
          {formError && <div className="login-error">{formError}</div>}

          <form onSubmit={formik.handleSubmit} noValidate>
            <label htmlFor="email" className="login-label">
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

            <label htmlFor="password" className="login-label">
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

            <div className="login-options">
              <label className="login-remember">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formik.values.remember}
                  onChange={formik.handleChange}
                />
                {t("login.rememberMe")}
              </label>
              <Link to="/forgot-password" replace className="login-forgot">
                {t("login.forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={!canSubmit || loading}
              className="login-submit"
            >
              {loading ? `${t("login.submit")}…` : t("login.submit")}
            </Button>

            <p className="login-signup">
              {t("login.noAccount")}{" "}
              <Link to="/signup" replace className="login-signup-link">
                {t("login.signUp")}
              </Link>
            </p>
          </form>
        </section>
      </div>
      <p className="derechos-container">©<span  className="derechos">2025 PC Group S.A. Todos los derechos reservados.</span></p>
    </div>
  );
}