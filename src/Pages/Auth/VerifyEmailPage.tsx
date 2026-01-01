import '@/Styles/Auth/SentEmail.css'

const VerifyEmailPresentation = () => {
  return (
    <div className="verifyEmail-container">
      <img
        src="https://i.ibb.co/q3Y4q7mT/verify-email.webp"
        alt="Verificación de correo electrónico"
        className="verifyEmail-image"
      />

      <h1 className="verifyEmail-title">Verifica tu correo electrónico</h1>
      <p className="verifyEmail-description">
        Hemos enviado un enlace de verificación a tu correo electrónico.  
        Por favor revisa tu bandeja de entrada y sigue las instrucciones para activar tu cuenta.
      </p>
    </div>
  );
};

export default VerifyEmailPresentation;