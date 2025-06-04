import { useTranslation } from "react-i18next";
import Input from "@/Components/Common/Input";
import Button from "@/Components/Common/Button";
import "@/Styles/Auth/ForgotPasswordPresentation.css";
import {Link} from 'react-router-dom'
import useForgotPasswordForm from "@/Hooks/Auth/useForgotPasswordForm";

export default function ForgotPasswordPresentation() {
  const { t } = useTranslation();
  const { formik, loading, canSubmit, formError } = useForgotPasswordForm();

  return (
    <div className={`forgot-password ${loading ? 'forgot-password--loading' : ''}`}>
      <div className="forgot-password__container">
        <aside className="forgot-password__info-panel">
          <h1 className="forgot-password__title">
            {t("forgotPassword.title")}
          </h1>
          <p className="forgot-password__description">
            {t("forgotPassword.description")}
          </p>
          <ul className="forgot-password__steps">
            {Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="forgot-password__steps-item">
                {t(`forgotPassword.steps.${i + 1}`)}
              </li>
            ))}
          </ul>
          <img
            className="forgot-password__image"
            src="https://i.ibb.co/qLpn7cCK/forgot-password-email.png"
            alt={t("forgotPassword.imageAlt")}
          />
        </aside>

        <section className={`forgot-password__form-section ${formError ? 'forgot-password__form-section--error' : ''}`}>
          <p className="forgot-password__subtitle">
            {t("forgotPassword.subtitle")}
          </p>
          {formError && (
            <div className="forgot-password__error">{formError}</div>
          )}

          <form onSubmit={formik.handleSubmit} noValidate>
            <label
              htmlFor="email"
              className="forgot-password__label"
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
              className="forgot-password__submit-button"
            >
              {loading
                ? `${t("forgotPassword.submitting")}…`
                : t("forgotPassword.handleSubmit")}
            </Button>
            <p className="forgot-password__back-link">
              <Link to="/login" className="forgot-password__link">
                {t("forgotPassword.backToLogin")}
              </Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}