import "@/styles/SuccessRequest.css";

export default function SuccessRequest() {
  return (
    <div className="success-container">
      <img
        src="https://i.ibb.co/GQXXZ7Mc/undraw-success-288d.png"
        alt="order-success"
        className="success-image"
      />

      <h1 className="success-title">Orden creada con éxito</h1>

      <p className="success-description">
        Tu orden ha sido registrada correctamente. Gracias por tu preferencia.
      </p>
    </div>
  );
}