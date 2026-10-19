import { IoClose } from "react-icons/io5"
import CompanySelector from "@/Services/Components/Auth/CompanySelector"
import Button from "@/Services/Components/Common/Button"
import "@/Styles/Chat/FilterOrderModal.css"
import "@/Styles/Chat/CompanyModalFilter.css"

interface CompanyModalFilterProps {
  onClose: () => void
}

export default function CompanyModalFilter({
  onClose,
}: CompanyModalFilterProps) {
  return (
    <div className="modal-overlay">
      <div className="company-filter-modal" role="dialog" aria-labelledby="company-filter-title">
        <button
          type="button"
          className="company-filter-modal__close"
          onClick={onClose}
          aria-label="Cerrar"
          title="Cerrar"
        >
          <IoClose size={20} />
        </button>

        <header className="company-filter-modal__header">
          <h3 id="company-filter-title" className="company-filter-modal__title">
            Cambiar empresa
          </h3>
          <p className="company-filter-modal__subtitle">
            Seleccioná la empresa con la que querés trabajar.
          </p>
        </header>

        <div className="company-filter-modal__body">
          <CompanySelector />
        </div>

        <footer className="company-filter-modal__footer">
          <Button variant="primary" onClick={onClose}>
            Listo
          </Button>
        </footer>
      </div>
    </div>
  )
}
