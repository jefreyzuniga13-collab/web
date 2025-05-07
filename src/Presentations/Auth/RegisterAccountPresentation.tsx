import {Link} from 'react-router-dom'
// import {FaEye, FaEyeSlash} from 'react-icons/fa'
import {useTranslation} from 'react-i18next'
import useRegistrationContainer from '@/Containers/Auth/useRegistrationContainer'
import Input from '@/Components/Common/Input'
import Button from '@/Components/Common/Button'
const RegisterAccountPresentation = () => {
    const {t} = useTranslation();
    const {formik,
        loading,
        showPassword,
        toggleShowPassword,
        canSubmit,
        formError,
    } = useRegistrationContainer();

  return (
    <div className='register-page'>
      <div className='register-content'>
        <aside className='register-info'>
            <h1 className='register'>{t('register.title')}</h1>
            <p className='register-description'>{t('register.description')}</p>
                <ul className='register-steps'>
                    <li>{t('register.steps.1')}</li>
                    <li>{t('register.steps.2')}</li>
                    <li>{t('register.steps.3')}</li>
                    <li>{t('register.steps.4')}</li>
                </ul>
            <img src="https://i.imgur.com/NiH3jd3.png" alt={t('register.title')} className='register-image' />
        </aside>

        <section className='register-form-section'>
            <p className='subtitle'>{t('subtitle')}</p>
            {formError && 
            <div className='register login'>{formError}</div>}\

            <form onSubmit={formik.handleSubmit} noValidate>
            <label htmlFor="fullname"
            className='register-label'>{t('register.fullNameLabel')}</label>
            <Input
                id='fullName'
                name='fullName'
                type='text'
                placeholder={t('register.fullNameExample')}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.fullName ? formik.errors.fullName : undefined}
            />

            <label htmlFor="email"
            className='register-label'>{t('register.emailLabel')}</label>
            <Input
                id='email'
                name='email'
                type='email'
                placeholder={t('register.emailExample')}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.email ? formik.errors.email : undefined}
            />

            <label htmlFor="companyName"
            className='register-label'>{t('register.companyNameLabel')}</label>
            <Input
                id='companyName'
                name='companyName'
                type='text'
                placeholder={t('register.companyNameExample')}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.companyName ? formik.errors.companyName : undefined}
            />

            <label htmlFor="contactName"
            className='register-label'>{t('register.contactLabel')}</label>
            <Input
                id='contactName'
                name='contactName'
                type='text'
                placeholder={t('register.contactNameExample')}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.contactName ? formik.errors.contactName : undefined}
            />

            <label htmlFor="password"
            className='register-label'>{t('register.passwordLabel')}</label>
            <Input
                id='password'
                name='password'
                type={showPassword ? "password": "text"}
                placeholder={t('register.passwordExample')}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                onIconClick={toggleShowPassword}
                error={formik.errors.password ? formik.errors.password : undefined}
            />
            <Button
            type='submit'
            disabled={!canSubmit || loading} 
            className='register-submit'>
                {loading ? `$(register.submitting)`: t('register.submit')}
                </Button>

                <div>
                <p>{t('register.alreadyAccoun')}</p>
                    <Link to='/login' replace className='register-link'>
                    {t('register.backLogin')}
                    </Link>  
                </div>      
            </form>
        </section>
      </div>
    </div>
  )
}

export default RegisterAccountPresentation
