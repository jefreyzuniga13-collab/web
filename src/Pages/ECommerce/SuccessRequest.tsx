import "@/styles/Ecommerce/SuccessRequest.css";

export default function SuccessRequest() {
  return (
    <div className="success-container">
      <img
        src="https://i.ibb.co/GQXXZ7Mc/undraw-success-288d.png"
        alt="order-success"
        className="success-image"
      />

      <h1 className="success-title">Pedido creada con éxito</h1>

      <p className="success-description">
        Tu pedido ha sido registrado correctamente. Gracias por tu preferencia.
      </p>
    </div>
  );
}