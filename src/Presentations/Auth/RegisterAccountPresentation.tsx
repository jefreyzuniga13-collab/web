import { Link } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import useRegistrationContainer from '@/Containers/Auth/useRegistrationContainer'
import Input from '@/Components/Common/Input'
import Select from '@/Components/Common/Select'
import Button from '@/Components/Common/Button'
import '@/Styles/Auth/RegisterPresentation.css'

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
  } = useRegistrationContainer()

  return (
    <div className="register-page">
      <div className="register-content">
        <aside className="register-info">
          <h1 className="register-title">{t('register.title')}</h1>
          <p className="register-description">{t('register.description')}</p>
          <ul className="register-steps">
            {['1', '2', '3', '4'].map(step => (
              <li key={step}>{t(`register.steps.${step}`)}</li>
            ))}
          </ul>
          <img src="https://i.ibb.co/F26HCTK/singup.png" alt="singup" className='register-image'></img>
        </aside>

        <section className="register-form-section">
          {(formError || fetchError) && (
            <div className="register-error">{formError || fetchError}</div>
          )}

          <form onSubmit={formik.handleSubmit} className="register-form-grid" noValidate>
            {/* Columna 1 */}
            <div className="field-group">
              <label htmlFor="fullName">{t('register.fullNameLabel')}</label>
              <Input
                id="fullName"
                name="fullName"
                placeholder={t('register.fullNameExample')}
                value={formik.values.fullName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.fullName ? formik.errors.fullName : undefined}
              />

              <label htmlFor="email">{t('register.emailLabel')}</label>
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

              <label htmlFor="companyId">{t('register.companyNameLabel')}</label>
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

              <label htmlFor="phone">{t('register.phoneLabel')}</label>
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

            {/* Columna 2 */}
            <div className="field-group">
              <label htmlFor="identifier">{t('register.identifierLabel')}</label>
              <Input
                id="identifier"
                name="identifier"
                placeholder={t('register.identifierPlaceholder')}
                value={formik.values.identifier}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.identifier ? formik.errors.identifier : undefined}
              />

              <label htmlFor="password">{t('register.passwordLabel')}</label>
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

            {/* Botón y enlace */}
            <div className="full-width">
              <Button
                type="submit"
                variant="primary"
                disabled={!canSubmit || loading}
                className="register-submit"
              >
                {loading
                  ? `${t('register.submitting')}…`
                  : t('register.submit')}
              </Button>

              <p className="register-login-link">
                {t('register.alreadyHaveAccount')}{' '}
                <Link to="/login" className="register-link">
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