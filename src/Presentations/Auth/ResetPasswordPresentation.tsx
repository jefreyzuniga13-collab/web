import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import Input from '@/Components/Common/Input'
import Button from '@/Components/Common/Button'
import '@/Styles/Auth/ResetPasswordPresentation.css'
import useResetPasswordForm from '@/Hooks/Auth/useResetPasswordForm'

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
        <aside className="resetPassword-info">
          <h1 className="resetPassword-title">{t('resetPassword.title')}</h1>
          <p className="resetPassword-description">
            {t('resetPassword.description')}
          </p>
          <ul className="resetPassword-steps">
            <li>{t('resetPassword.steps.1')}</li>
            <li>{t('resetPassword.steps.2')}</li>
            <li>{t('resetPassword.steps.3')}</li>
          </ul>
          <img
            className="resetPassword-image"
            src="https://i.ibb.co/6R1Ym6LD/reset-password.png"
            alt={t('resetPassword.title')}
          />
        </aside>

        <section className="resetPassword-form-section">
          <p className="resetPassword-subtitle">
            {t('resetPassword.subtitle')}
          </p>
          {formError && (
            <div className="resetPassword-error">{formError}</div>
          )}

          <form onSubmit={formik.handleSubmit} noValidate>
            <label htmlFor="newPassword" className="resetPassword-label">
              {t('resetPassword.newPasswordLabel')}
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
              error={
                formik.touched.newPassword ? formik.errors.newPassword : undefined
              }
            />

            <label htmlFor="confirmNewPassword" className="resetPassword-label">
              {t('resetPassword.confirmNewPasswordLabel')}
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
    </div>
  )
}