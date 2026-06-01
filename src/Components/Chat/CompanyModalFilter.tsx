import { IoClose } from "react-icons/io5";
import CompanySelector from "@/Components/Auth/CompanySelector";
import "@/Styles/Chat/FilterOrderModal.css";

interface FilterOrderModalProps {
  onClose: () => void;
}

const CompanyModalFilter: React.FC<FilterOrderModalProps> = ({
  onClose
}) => {
  
  return (
    <div className="modal-overlay">
      <div className="filter-modal">
        <button
          type="button"
          className="filter-modal__close"
          onClick={onClose}
          aria-label="Cerrar filtro"
          title="Cerrar"
        >
          <IoClose size={22} />
        </button>

        <div className="filter-modal__header">
          <h3 className="filter-modal__title">Cambiar Empresa</h3>
        </div>

        <section className="filter-modal__section">
          <div className="filter-modal__company">
            <CompanySelector />
          </div>
        </section>

      
      </div>
    </div>
  );
};

export default CompanyModalFilter;