import "@/Styles/Auth/LicenseExpiredModal.css";
import { getLicenseMessage } from "@/Utils/ECommerce/formatters";

interface LicenseExpiredModalProps {
  licenseExpireAt: string | null | undefined;
  onClose: () => void;
}

function formatLicenseDate(value: string | null | undefined): string {
  if (!value) return "";

  const dateOnly = value.split("T")[0];

  const [year, month, day] = dateOnly.split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

export function LicenseExpiredModal({
  licenseExpireAt,
  onClose,
}: LicenseExpiredModalProps) {
  const formattedDate = formatLicenseDate(licenseExpireAt);

  return (
    <div className="license-modal-backdrop">
      <div className="license-modal">
        <h2>Información de licencia</h2>

        <p>{getLicenseMessage(licenseExpireAt ?? "")}</p>

        {formattedDate && (
          <p>
            Fecha de vencimiento: <strong>{formattedDate}</strong>
          </p>
        )}

        <p>
          Para evitar interrupciones en el servicio, se recomienda gestionar la
          renovación con anticipación.
        </p>

        <button type="button" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}