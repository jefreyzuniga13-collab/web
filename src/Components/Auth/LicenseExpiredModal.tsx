import '@/Styles/Auth/LicenseExpiredModal.css'

interface LicenseExpiredModalProps {
  licenseExpireAt: string | null | undefined;
  onClose: () => void;
}

export function LicenseExpiredModal({
  licenseExpireAt,
  onClose,
}: LicenseExpiredModalProps) {
  return (
    <div className="license-modal-backdrop">
      <div className="license-modal">
        <h2>Licencia vencida</h2>

        <p>
          La licencia de la empresa se encuentra vencida.
          {licenseExpireAt && (
            <>
              <br />
              Fecha de vencimiento: <strong>{licenseExpireAt}</strong>
            </>
          )}
        </p>

        <p>
          Algunas funcionalidades podrían estar limitadas hasta renovar la licencia.
        </p>

        <button type="button" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}