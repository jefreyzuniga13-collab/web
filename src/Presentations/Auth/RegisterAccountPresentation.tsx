import { Link } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import Input from '@/Components/Common/Input'
import Select from '@/Components/Common/Select'
import Button from '@/Components/Common/Button'
import '@/Styles/Auth/RegisterPresentation.css'
import useRegisterForm from '@/Hooks/Auth/useRegisterForm'
export default function RegisterPresentation() {
  const { t } = useTranslation()
  const {
    formik,
    companies,
    fetchError,
    loading,
    showPassword,
    toggleShowPassword,
    canSubmit,
    formError
  } = useRegisterForm()

  return (
    <div className={`register ${loading ? 'register--loading' : ''}`}>
      <div className="register__container">
        <aside className="register__info-panel">
          <h1 className="register__title">{t('register.title')}</h1>
          <p className="register__description">{t('register.description')}</p>
          <ul className="register__steps">
            {['1', '2', '3', '4'].map(step => (
              <li key={step} className="register__steps-item">{t(`register.steps.${step}`)}</li>
            ))}
          </ul>
          <img 
            src="https://i.ibb.co/F26HCTK/singup.png" 
            alt="singup" 
            className="register__image"
          />
        </aside>

        <section className={`register__form-section ${(formError || fetchError) ? 'register__form-section--error' : ''}`}>
          {(formError || fetchError) && (
            <div className="register__error">{formError || fetchError}</div>
          )}

          <form onSubmit={formik.handleSubmit} className="register__form-grid" noValidate>
            <div className="register__field-group">
              <label htmlFor="fullName" className="register__label">{t('register.fullNameLabel')}</label>
              <Input
                id="fullName"
                name="fullName"
                placeholder={t('register.fullNameExample')}
                value={formik.values.fullName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.fullName ? formik.errors.fullName : undefined}
              />

              <label htmlFor="email" className="register__label">{t('register.emailLabel')}</label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t('register.emailExample')}
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email ? formik.errors.email : undefined}
              />

              <label htmlFor="companyId" className="register__label">{t('register.companyNameLabel')}</label>
              <Select
                id="companyId"
                name="companyId"
                options={companies}
                value={formik.values.companyId}
                onChange={e => formik.setFieldValue('companyId', Number(e.target.value))}
                onBlur={() => formik.setFieldTouched('companyId', true)}
                error={formik.touched.companyId ? formik.errors.companyId : undefined}
                placeholder={t('register.companyNameExample')}
              />

              <label htmlFor="phone" className="register__label">{t('register.phoneLabel')}</label>
              <Input
                id="phone"
                name="phone"
                placeholder={t('register.phoneExample')}
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.phone ? formik.errors.phone : undefined}
              />
            </div>

            <div className="register__field-group">
              <label htmlFor="identifier" className="register__label">{t('register.identifierLabel')}</label>
              <Input
                id="identifier"
                name="identifier"
                placeholder={t('register.identifierPlaceholder')}
                value={formik.values.identifier}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.identifier ? formik.errors.identifier : undefined}
              />

              <label htmlFor="password" className="register__label">{t('register.passwordLabel')}</label>
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('register.passwordExample')}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                rightIcon={showPassword ? <FaEyeSlash /> : <FaEye />}
                onIconClick={toggleShowPassword}
                error={formik.touched.password ? formik.errors.password : undefined}
              />
            </div>

            <div className="register__actions">
              <Button
                type="submit"
                variant="primary"
                disabled={!canSubmit || loading}
                className="register__submit-button"
              >
                {loading
                  ? `${t('register.submitting')}…`
                  : t('register.submit')}
              </Button>

              <p className="register__login-text">
                {t('register.alreadyHaveAccount')}{' '}
                <Link to="/" className="register__login-link">
                  {t('register.backToLogin')}
                </Link>
              </p>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}