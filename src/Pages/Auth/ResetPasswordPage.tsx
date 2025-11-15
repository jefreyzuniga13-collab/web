import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import Input from '@/Components/Common/Input'
import Button from '@/Components/Common/Button'
import '@/Styles/Auth/ResetPasswordPresentation.css'
import useResetPasswordForm from '@/Hooks/Auth/useResetPasswordForm'
import logopcg from '@/assets/pcgroup.png'
import '@/Styles/Auth/LoginPresentation.css'
import addGroup from '@/assets/Add_Group_2025.png'



export default function ResetPasswordPresentation() {
  const { t } = useTranslation()
  const {
    formik,
    loading,
    canSubmit,
    showPassword,
    toggleShowPassword,
    showConfirm,
    toggleShowConfirm,
    formError,
  } = useResetPasswordForm()

  return (
    <div className="resetPassword-page">
      <div className="resetPassword-content">
        {/* <aside className="resetPassword-info">
          <h1 className="resetPassword-title">Restablecer contraseña</h1>
          <img
            className="login__image"
            src={`${logopcg}`}
            alt={t("login.imageAlt")}
          />
        </aside> */}

        <section className="resetPassword-form-section">
          {/* <p className="resetPassword-subtitle">
            Ingresar nueva credencial. Minimo de 8 caracteres
          </p> */}
          {formError && (
            <div className="resetPassword-error">{formError}</div>
          )}

           <div className="image__container">
            <img
            className="login__image"
            src={`${addGroup}`}
            alt={t("login.imageAlt")}
          />
          </div>

          <form onSubmit={formik.handleSubmit} noValidate>
             <p className="resetPassword-subtitle">
            Ingresar nueva credencial. Minimo de 8 caracteres
          </p>
            <label htmlFor="newPassword" className="resetPassword-label">
              Nueva contraseña
            </label>
            <Input
              id="newPassword"
              name="newPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('resetPassword.newPasswordPlaceholder')}
              value={formik.values.newPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              rightIcon={showPassword ? <FaEyeSlash /> : <FaEye />}
              onIconClick={toggleShowPassword}
              autoFocus
              error={
                formik.touched.newPassword ? formik.errors.newPassword : undefined
              }
            />

            <label htmlFor="confirmNewPassword" className="resetPassword-label">
              Confirmar contraseña
            </label>
            <Input
              id="confirmNewPassword"
              name="confirmNewPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder={t('resetPassword.confirmNewPasswordPlaceholder')}
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
                className="resetPassword-submit"
              >
                {loading
                  ? t('resetPassword.submitting')
                  : t('resetPassword.submit')}
              </Button>
            </form>
          </section>
        </div>

              <img
            className="login__image-footer"
            src={`${logopcg}`}
            alt={t("login.imageAlt")}
          />
      <p className="login__footer">©<span className="derechos">2025 PC Group S.A. Todos los derechos reservados.</span></p>
      <p className="login__footer"><span className="derechos">Add Group 2.0</span></p>

    </div>
  )
}