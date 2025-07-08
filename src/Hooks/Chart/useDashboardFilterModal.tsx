// useDashboardFilterModal.ts
import { useState } from "react";

export interface FilterForm {
  from: Date | null;
  to: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  agentId: number | "";
  adminUser: number | "";
  customerId: number | "";
  today: boolean;
  yesterday: boolean;
  tomorrow: boolean;
}

const initialForm: FilterForm = {
  from: new Date(),
  to: new Date(),
  startTime: null,
  endTime: null,
  agentId: "",
  adminUser: "",
  customerId: "",
  today: false,
  yesterday: false,
  tomorrow: false,
};

const useDashboardFilterModal = () => {
  const [form, setForm] = useState<FilterForm>(initialForm);

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm(f => ({ ...f, [name]: checked }));
  };

  // Para selects que pasan valores numéricos o strings
  const handleSelectChange =
    (name: keyof FilterForm) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      // convertir a número si corresponde
      const parsed = name === "agentId" || name === "adminUser" || name === "customerId"
        ? (val === "" ? "" : Number(val))
        : val;
      setForm(f => ({ ...f, [name]: parsed }));
    };

    const handleClear =()=>{
      setForm(initialForm);
    }

  return {
    form,
    setForm,
    handleCheckbox,
    handleSelectChange,
    handleClear
  };
};

export default useDashboardFilterModal;