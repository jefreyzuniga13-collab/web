import { CircularProgress } from "@mui/material";
import CustomAutocomplete from "@/Components/Common/CustomAutocomplete";
import { useCompanySelector } from "@/Hooks/Auth/useCompanySelector";
import type { CompanySelectorItem } from "@/Interfaces/Auth/CompanyInterface";
import "@/Styles/Company/CompanySelector.css";

type CompanyOption = {
  label: string;
  value: number | string;
  company: CompanySelectorItem | null;
};

export default function CompanySelector() {
  const {
    isRoot,
    companies,
    selectedCompany,
    isGlobalMode,
    loading,
    changeCompany,
  } = useCompanySelector();

  if (!isRoot) {
    return null;
  }

  const options: CompanyOption[] = [
    {
      label: "Todas las empresas",
      value: "global",
      company: null,
    },
    ...companies.map((company) => ({
      label: company.name,
      value: company.companyId,
      company,
    })),
  ];

  const value: CompanyOption | null = isGlobalMode
    ? options[0]
    : selectedCompany
      ? {
          label: selectedCompany.name,
          value: selectedCompany.companyId,
          company: selectedCompany,
        }
      : options[0];

  const handleChange = (option: CompanyOption | null) => {
    changeCompany(option?.company ?? null);
  };

  return (
    <div className="company-selector">
      <div className="company-selector__label">Empresa activa</div>

      <div className="company-selector__control">
        <CustomAutocomplete<CompanyOption>
          placeholder="Seleccione empresa"
          options={options}
          value={value}
          onChange={handleChange}
          disabled={loading}
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