import { CircularProgress } from "@mui/material";
import CustomAutocomplete from "@/Services/Components/Common/CustomAutocomplete";
import { useCompanySelector } from "@/Hooks/Auth/useCompanySelector";
import type { CompanySelectorItem } from "@/Interfaces/Auth/CompanyInterface";
import "@/Styles/Auth/CompanySelector.css";

type CompanyOption = {
  label: string;
  value: number;
  company: CompanySelectorItem;
};

/**
 * Selector de empresa activa para usuarios Root.
 *
 * Responsabilidades:
 * - Mostrar solo empresas reales.
 * - Evitar la opción global para SignalR.
 * - Cambiar la empresa activa mediante useCompanySelector.
 * - Permitir que SignalR reconecte usando companyId.
 */
export default function CompanySelector() {
  const {
    isRoot,
    companies,
    selectedCompany,
    loading,
    changeCompany,
  } = useCompanySelector();

  if (!isRoot) {
    return null;
  }

  const options: CompanyOption[] = companies.map((company) => ({
    label: company.name,
    value: Number(company.companyId),
    company,
  }));

  const value: CompanyOption | null = selectedCompany
    ? {
        label: selectedCompany.name,
        value: Number(selectedCompany.companyId),
        company: selectedCompany,
      }
    : null;

  const handleChange = (option: CompanyOption | null) => {
    if (!option?.company) {
      return;
    }

    changeCompany(option.company);
  };

  return (
    <div className="company-selector">
      <div className="company-selector__label">Empresa activa</div>

      <div className="company-selector__control">
        <CustomAutocomplete<CompanyOption>
          placeholder={
            loading
              ? "Cargando empresas..."
              : options.length > 0
                ? "Seleccione empresa"
                : "No hay empresas disponibles"
          }
          options={options}
          value={value}
          onChange={handleChange}
          disabled={loading || options.length === 0}
          loading={loading}
        />

        {loading && (
          <span className="company-selector__loading">
            <CircularProgress size={16} />
          </span>
        )}
      </div>
    </div>
  );
}