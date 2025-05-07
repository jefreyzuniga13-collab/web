import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useForgotPasswordContainer from "@/Containers/Auth/useForgotPasswordContainer";
import Input from "@/Components/Common/Input";
import Button from "@/Components/Common/Button";
import "@/Styles/Auth/ForgotPasswordPresentation.css";

const ForgotPasswordPresentation = () => {
  const { t } = useTranslation();
  const { formik, loading, canSubmit, formError } =
    useForgotPasswordContainer();

  return (
    <div className="forgotPassword-page">
      <div className="forgotPassword-content">
        <aside className="forgotPassword-info">
          <h1 className="forgotPassword-title">{t("forgotPassword.title")}</h1>
          <p className="forgotPassword-description">
            {t("forgotPassword.description")}
          </p>
          <ul className="forgotPassword-steps">
            <li>{t("forgotPassword.steps.1")}</li>
            <li>{t("forgotPassword.steps.2")}</li>
            <li>{t("forgotPassword.steps.3")}</li>
            <li>{t("forgotPassword.steps.4")}</li>
            <li>{t("forgotPassword.steps.5")}</li>
          </ul>
          <img
            src="https://i.ibb.co/qLpn7cCK/forgot-password-email.png"
            alt={t("forgotPassword.title")}
            className="forgotPassword-image"
          />
        </aside>
        <section className="forgotPassword-form-section">
          <p className="forgotPassword-subtitle">
            {t("forgotPassword.subtitle")}
          </p>
          {formError && <div className="forgotPassword-error">{formError}</div>}

          <form onSubmit={formik.handleSubmit} noValidate>
            <label htmlFor="email" className="forgotPasswordLabel">
              {t("forgotPassword.emailLabel")}
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
            ></Input>
            <Button
              type="submit"
              variant="primary"
              disabled={!canSubmit || loading}
              className="login-submit"
            >
              {loading
                ? `${t("forgotPassword.submitting")}`
                : t("forgotPassword.handleSubmit")}
            </Button>
            <Link to="./login" className="forgotPassword-link">
              {t("forgotPassword.backToLogin")}
            </Link>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ForgotPasswordPresentation;