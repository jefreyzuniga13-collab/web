import type { FilterForm } from "@/Interfaces/Dashboard/DashboardInterfaces";
import { useState } from "react";

const initialForm: FilterForm = {
  from: new Date(),
  to: new Date(),
  startTime: null,
  endTime: null,
  agentId: null,
  adminUserId: null,
  customerId: null,
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
      const parsed = name === "agentId" || name === "adminUserId" || name === "customerId"
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