import { useTranslation } from 'react-i18next'
import '@/Styles/Common/LanguageSwicher.css'
export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const changeLang = (lng: 'en' | 'es') => {
    i18n.changeLanguage(lng)
    localStorage.setItem('i18nextLng', lng)
  }

  return (
    <div className='languageSwitcher-container' style={{ display: 'flex', gap: '0.5rem' }}>
      <button className='languageSwitcher-btn' onClick={() => changeLang('es')}>ES</button>
      <button className='languageSwitcher-btn' onClick={() => changeLang('en')}>EN</button>
    </div>
  )
}