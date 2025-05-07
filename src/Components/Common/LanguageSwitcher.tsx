import React from 'react'
import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const changeLang = (lng: 'en' | 'es') => {
    i18n.changeLanguage(lng)
    localStorage.setItem('i18nextLng', lng)
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button onClick={() => changeLang('es')}>ES</button>
      <button onClick={() => changeLang('en')}>EN</button>
    </div>
  )
}