// import { Link } from 'react-router-dom'
import '@/Styles/Common/Unauthorized.css'

export default function Unauthorized() {
  return (
    <div className="unauthorized-container">
      <img
        src="https://i.ibb.co/ksPRdqdx/forbidden.png"
        alt="Acceso no autorizado"
        className="unauthorized-image"
      />

      <h1 className="unauthorized-title">
        Acceso no autorizado
      </h1>

      <p className="unauthorized-description">
        No tienes permisos para acceder a esta sección.
        Si crees que se trata de un error, contacta al administrador del sistema.
      </p>

      {/* <Link
        to="/dashboard"
        replace
        className="unauthorized-button"
      >
        Volver al inicio
      </Link> */}
    </div>
  )
}