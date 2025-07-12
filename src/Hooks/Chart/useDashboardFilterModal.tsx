import type { FilterForm } from "@/Interfaces/Dashboard/DashboardInterfaces";
import { useEffect, useState } from "react";
import { toZonedTime, format } from "date-fns-tz";
const initialForm: FilterForm = (() => {
  const zone        = "America/Managua";
   const nowInManagua = toZonedTime(new Date(), zone);
  const fmt          = format(nowInManagua, "yyyy-MM-dd", { timeZone: zone });

  return {
    from: fmt,
    to:   fmt,
    startTime: null,
    endTime:   null,
    agentId:      null,
    adminUserId:  null,
    customerId:   null,
    today:     false,
    yesterday: false,
    tomorrow:  false
  };
})();

const STORAGE_KEY = "dashboardFilters";
const useDashboardFilterModal = () => {
  const [form, setForm] = useState<FilterForm>(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) as FilterForm : initialForm;
});


useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
}, [form]);

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
      localStorage.removeItem(STORAGE_KEY);
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