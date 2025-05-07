import useResetPasswordContainer from "@/Containers/Auth/useResetPasswordContainer";
import { useTranslation } from "react-i18next";
import Button from "@/Components/Common/Button";
import Input from "@/Components/Common/Input";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import'@/Styles/Auth/ResetPasswordPresentation.css'

const ResetPasswordPresentation = () => {
  const { t } = useTranslation();
  const {
    formik,
    loading,
    canSubmit,
    showPassword,
    toggleShowPassword,
    showConfirmShowPassword,
    toggleShowConfirmPassword,
    formError
  } = useResetPasswordContainer();

  return (
    <div className="resetPassword-page">
      <div className="forgotPassword-content">
        <aside className="resetPassword-info">
          <h1 className="resetPassword-title">{t("resetPassword.title")}</h1>
          <p className="resetPassword-description">
            {t("resetPassword.description")}
          </p>
          <ul className="resetPassword-steps">
            <li>{t("resetPassword.steps.1")}</li>
            <li>{t("resetPassword.steps.2")}</li>
            <li>{t("resetPassword.steps.3")}</li>
          </ul>
          <img
            src="https://i.imgur.com/wo0Bxqp.png"
            alt={t("resetPassword.title")}
            className="resetPassword-image"
          />
        </aside>

        <section className="resetPassword-form-section">
          <p className="resetPassword-subtitle">
            {t("resetPassword.subtitle")}
          </p>
          {formError && <div className="resetPassword-error">{formError}</div>}

          <form onSubmit={formik.handleSubmit} noValidate>
            <label htmlFor="newPassword" className="newPasswordLabel">
              {t("resetPassword.newPasswordLabel")}
            </label>
            <Input
              id="newPassword"
              name="newPasword"
              type={showPassword ? "text" : "password"}
              placeholder={t("login.passwordPlaceholder")}
              value={formik.values.newPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              rightIcon={showPassword ? <FaEyeSlash /> : <FaEye />}
              onIconClick={toggleShowPassword}
              error={
                formik.touched.newPassword
                  ? formik.errors.newPassword
                  : undefined
              }
            />
            <label
              htmlFor="comfirmNewPassword"
              className="newPasswordLabel"
            >
              {t("resetPassword.confirmNewPasswordLabel")}
            </label>
            <Input
              id="comfirmNewPassword"
              name="confirmNewPassword"
              type={showConfirmShowPassword ? "text" : "password"}
              placeholder={t("login.passwordPlaceholder")}
              value={formik.values.confirmNewPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              rightIcon={showConfirmShowPassword ? <FaEyeSlash /> : <FaEye />}
              onIconClick={toggleShowConfirmPassword}
              error={
                formik.touched.confirmNewPassword
                  ? formik.errors.confirmNewPassword
                  : undefined
              }
            />

            <Button
              className="resetPassword-submit"
              type="submit"
              variant="primary"
              disabled={!canSubmit || loading}
            >
              {loading ? `${t("resetPassword.submitting")}...` : t("resetPassword.submit")}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ResetPasswordPresentation;