import { Link } from 'react-router-dom'
import '@/Styles/Auth/ActivationAccountPresentation.css'
import useVerifyEmailFlow from '@/Hooks/Auth/useVerifyEmailFlow'

export default function ActivationAccountPresentation() {
  const { loading, done } = useVerifyEmailFlow()

  return (
    <div className="activationAccount-container">
      <img
        src="https://i.ibb.co/KjdZCt31/verify.png"
        className="activationAccount-image"
        alt="Verificación de cuenta"
      />

      <h1 className="activationAccount-title">
        {done
          ? 'Cuenta activada correctamente'
          : loading
          ? 'Activando cuenta'
          : 'Activación de cuenta'}
      </h1>

      <p className="activationAccount-description">
        {done
          ? 'Tu cuenta ha sido activada con éxito. Ya puedes iniciar sesión.'
          : loading
          ? 'Estamos verificando tu cuenta. Por favor espera un momento.'
          : 'Estamos validando la información de tu cuenta.'}
      </p>

      {done && (
        <Link to="/login" replace className="activationAccount-button">
          Ir al inicio de sesión
        </Link>
      )}
    </div>
  )
}