import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "@/styles/NotFound.css";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="notfound-container">
      <img
        src="https://i.ibb.co/s9cYbRrZ/404-error.webp"
        alt={t("notFound.title")}
        className="notfound-image"
      />
      <h1 className="notfound-title">{t("notFound.title")}</h1>
      <p className="notfound-description">{t("notFound.description")}</p>
      <Link to="/login" replace className="notfound-button">
        {t("notFound.button")}
      </Link>
    </div>
  );
}