import { useEffect, useState } from "react";
import "@/Styles/Common/SearchFilter.css";

interface SearchFilterProps {
  value: string;
  onApply: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

export default function SearchFilter({
  value,
  onApply,
  label = "Filtrar",
  disabled = false,
}: SearchFilterProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const apply = () => {
    if (draft === value) return;
    onApply(draft);
  };

  return (
    <label className="crm-search-filter">
      <span className="crm-search-filter__label">{label}</span>
      <input
        type="search"
        className="crm-search-filter__input"
        value={draft}
        disabled={disabled}
        placeholder={label}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={apply}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            apply();
          }
        }}
      />
    </label>
  );
}
