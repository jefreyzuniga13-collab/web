import Button from "@/Components/Common/Button";
import '@/Styles/Auth/ActivationSesionModal.css';

interface Props {
  onAccept: () => void;
  onCancel: () => void;
}

export const ActivationSesionModal: React.FC<Props> = ({ onAccept, onCancel }) => {
  return (
    <div className="activateModal__overlay">
      <section className="activateModal__container">
        <h3 className="activateModal__title">Sesión activa</h3>
        <p className="activateModal__subtitle">
          Actualmente ya tienes una sesión activa. Si deseas iniciar sesión desde otra cuenta, se cerrará la sesión actual.
        </p>

        <div className="activateModal__btnContainer">
          <Button
            variant="primary"
            type="button"
            className="activateModal__btn accept"
            children="Aceptar"
            onClick={onAccept}
          />

          <Button
            variant="secondary"
            type="button"
            className="activateModal__btn cancel"
            children="Cancelar"
            onClick={onCancel}
          />
        </div>
      </section>
    </div>
  );
};