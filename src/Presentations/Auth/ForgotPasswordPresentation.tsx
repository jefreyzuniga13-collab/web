import { useTranslation } from "react-i18next";
import useForgotPasswordContainer from "@/Containers/Auth/useForgotPasswordContainer";
import Input from "@/Components/Common/Input";
import Button from "@/Components/Common/Button";
import "@/Styles/Auth/ForgotPasswordPresentation.css";
import {Link} from 'react-router-dom'

export default function ForgotPasswordPresentation() {
  const { t } = useTranslation();
  const { formik, loading, canSubmit, formError } =
    useForgotPasswordContainer();

  return (
    <div className="forgotPassword-page">
      <div className="forgotPassword-content">
        <aside className="forgotPassword-info">
          <h1 className="forgotPassword-title">
            {t("forgotPassword.title")}
          </h1>
          <p className="forgotPassword-description">
            {t("forgotPassword.description")}
          </p>
          <ul className="forgotPassword-steps">
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i}>{t(`forgotPassword.steps.${i + 1}`)}</li>
            ))}
          </ul>
          <img
            className="forgotPassword-image"
            src="https://i.ibb.co/qLpn7cCK/forgot-password-email.png"
            alt={t("forgotPassword.imageAlt")}
          />
        </aside>

        <section className="forgotPassword-form-section">

          <p className="forgotPassword-subtitle">
            {t("forgotPassword.subtitle")}
          </p>
          {formError && (
            <div className="forgotPassword-error">{formError}</div>
          )}

          <form onSubmit={formik.handleSubmit} noValidate>
            <label
              htmlFor="email"
              className="forgotPassword-label"
            >
              {t("forgotPassword.emailLabel")}
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("forgotPassword.emailPlaceholder")}
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.email ? formik.errors.email : undefined
              }
            />

            <Button
              type="submit"
              variant="primary"
              disabled={!canSubmit || loading}
              className="forgotPassword-submit"
            >
              {loading
                ? `${t("forgotPassword.submitting")}…`
                : t("forgotPassword.handleSubmit")}
            </Button>
            <p className="forgotPassword-forgot-link">
              <Link to="/login" className="forgotPassword-forgot-link">
                {t("forgotPassword.backToLogin")}
              </Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}