import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import '@/Styles/Auth/SentEmail.css'
const VerifyEmailPresentation = () => {
  const { t } = useTranslation();

  return (
    <div className="verifyEmail-container">
      <img
        src="https://i.ibb.co/q3Y4q7mT/verify-email.webp"
        alt={t("verifyEmail.title")}
        className='verifyEmail-image'
      />

      <h1 className="verifyEmail-title">{t("verifyEmail.title")}</h1>
      <p className="verifyEmail-description">{t("verifyEmail.description")}</p>

      <Link to="/login" className="verifyEmail-button">
        {t("verifyEmail.button")}
      </Link>
    </div>
  );
};

export default VerifyEmailPresentation;