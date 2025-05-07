import {Link} from 'react-router-dom'
import {useTranslation} from 'react-i18next'
import '@/Styles/Auth/ActivationAccountPresentation.css'

const ActivationAccountPresentation = () => {
    const {t} = useTranslation();

    return (
    <div className='activationAccount-container'>
        <img src="https://i.imgur.com/2vPnva2.png" 
        className='activationAccount-image'
        alt={t('activationAccount.title')} />
        <h1 className='activationAccount-title'>{t('activationAccount.title')}</h1>
        <p className='activationAccount-description'>{t('activationAccount.description')}</p>

        <Link to='/login' replace className='activationAccount-button'>
            {t('activationAccount.button')}
        </Link>

    </div>
  )
}

export default ActivationAccountPresentation