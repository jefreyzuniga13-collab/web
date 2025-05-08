import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useRegistrationContainer from "@/Containers/Auth/useRegistrationContainer";
import Input from "@/Components/Common/Input";
import Button from "@/Components/Common/Button";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "@/Styles/Auth/RegisterPresentation.css";

export default function RegisterPresentation() {
  const { t } = useTranslation();
  const {
    formik,
    loading,
    showPassword,
    toggleShowPassword,
    canSubmit,
    formError,
  } = useRegistrationContainer();

  return (
    <div className="register-page">
      <div className="register-content">
        <aside className="register-info">
          <h1 className="register-title">{t("register.title")}</h1>
          <p className="register-description">{t("register.description")}</p>
          <ul className="register-steps">
            {["1", "2", "3", "4"].map((step) => (
              <li key={step}>{t(`register.steps.${step}`)}</li>
            ))}
          </ul>
          <img
            src="https://i.imgur.com/NiH3jd3.png"
            alt={t("register.title")}
            className="register-image"
          />
        </aside>

        <section className="register-form-section wide">
          {formError && <div className="register-error">{formError}</div>}

          <p className="register-subtitle">{t("register.subtitle")}</p>

          <form onSubmit={formik.handleSubmit} noValidate>
            <div className="field-group">
              <div className="container-elements">
                <label htmlFor="fullName" className="register-label">
                  {t("register.fullNameLabel")}
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder={t("register.fullNameExample")}
                  value={formik.values.fullName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.fullName
                      ? formik.errors.fullName
                      : undefined
                  }
                />
              </div>

              <div className="container-elements">
                <label htmlFor="contactName" className="register-label">
                  {t("register.contactNameLabel")}
                </label>
                <Input
                  id="contactName"
                  name="contactName"
                  placeholder={t("register.contactNameExample")}
                  value={formik.values.contactName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.contactName
                      ? formik.errors.contactName
                      : undefined
                  }
                />
              </div>

              <div className="container-elements">
                <label htmlFor="email" className="register-label">
                  {t("register.emailLabel")}
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("register.emailExample")}
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.email ? formik.errors.email : undefined
                  }
                />
              </div>

              <div className="container-elements">
                <label htmlFor="phone" className="register-label">
                  {t("register.phoneLabel")}
                </label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder={t("register.phoneExample")}
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.phone ? formik.errors.phone : undefined
                  }
                />
              </div>
            </div>

            <div className="field-group">
              <div className="container-elements">
                <label htmlFor="companyName" className="register-label">
                  {t("register.companyNameLabel")}
                </label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder={t("register.companyNameExample")}
                  value={formik.values.companyName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.companyName
                      ? formik.errors.companyName
                      : undefined
                  }
                />
              </div>

              <div className="container-elements">
                <label htmlFor="country" className="register-label">
                  {t("register.countryLabel")}
                </label>
                <Input
                  id="country"
                  name="country"
                  placeholder={t("register.countryExample")}
                  value={formik.values.country}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.country
                      ? formik.errors.country
                      : undefined
                  }
                />
              </div>
            </div>

            <div className="field-group">
              <div className="container-elements">
                <label htmlFor="password" className="register-label">
                  {t("register.passwordLabel")}
                </label>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("register.passwordExample")}
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  rightIcon={showPassword ? <FaEyeSlash /> : <FaEye />}
                  onIconClick={toggleShowPassword}
                  error={
                    formik.touched.password
                      ? formik.errors.password
                      : undefined
                  }
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={!canSubmit || loading}
              className="register-submit"
            >
              {loading
                ? `${t("register.submitting")}…`
                : t("register.submit")}
            </Button>

            <p className="register-login-link">
              {t("register.alreadyHaveAccount")}{" "}
              <Link to="/login" className="register-link">
                {t("register.backToLogin")}
              </Link>
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}