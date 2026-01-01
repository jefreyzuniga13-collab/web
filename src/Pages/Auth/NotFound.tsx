import { Link } from "react-router-dom";
import "@/styles/Auth/NotFound.css";

export default function NotFound() {
  return (
    <div className="notfound-container">
      <img
        src="https://i.ibb.co/s9cYbRrZ/404-error.webp"
        alt="Página no encontrada"
        className="notfound-image"
      />
      <h1 className="notfound-title">Página no encontrada</h1>
      <p className="notfound-description">
        Lo sentimos, la página que estás buscando no existe o fue movida.
      </p>
      <Link to="/login" replace className="notfound-button">
        Volver al inicio de sesión
      </Link>
    </div>
  );
}