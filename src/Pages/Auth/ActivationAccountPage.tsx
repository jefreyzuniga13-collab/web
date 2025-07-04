import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import '@/Styles/Auth/ActivationAccountPresentation.css'
import useVerifyEmailFlow from '@/Hooks/Auth/useVerifyEmailFlow'

export default function ActivationAccountPresentation() {
  const { t } = useTranslation()
  const { loading, done } = useVerifyEmailFlow()

  return (
    <div className="activationAccount-container">
      <img
        src="https://i.imgur.com/2vPnva2.png"
        className="activationAccount-image"
        alt={t('activationAccount.title')}
      />
      <h1 className="activationAccount-title">
        {done
          ? t('activationAccount.titleSuccess')
          : loading
          ? t('activationAccount.titleLoading')
          : t('activationAccount.title')}
      </h1>
      <p className="activationAccount-description">
        {done
          ? t('activationAccount.descriptionSuccess')
          : loading
          ? t('activationAccount.descriptionLoading')
          : t('activationAccount.description')}
      </p>

      {done && (
        <Link to="/login" replace className="activationAccount-button">
          {t('activationAccount.button')}
        </Link>
      )}
    </div>
  )
}