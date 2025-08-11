import type { FilterForm } from "@/Interfaces/Dashboard/DashboardInterfaces";
import { useState } from "react";
import { toZonedTime, format } from "date-fns-tz";

const initialForm: FilterForm = (() => {
  const zone         = "America/Managua";
  const nowInManagua = toZonedTime(new Date(), zone);
  const fmt          = format(nowInManagua, "yyyy-MM-dd", { timeZone: zone });

  return {
    from:           fmt,
    to:             fmt,
    startTime:      null,
    endTime:        null,
    agentId:        null,
    agentName:      null,
    adminUserId:    null,
    adminUserName:  null,
    clientId:     null,
    clientName:   null,
    contactId: null,
    contactName: null,
    today:          false,
    yesterday:      false,
    tomorrow:       false
  };
})();

const useDashboardFilterModal = () => {
  const [form, setForm] = useState<FilterForm>(() => {
    const saved = localStorage.getItem("dashboardFilters");
    if (!saved) return initialForm;

    const parsed = JSON.parse(saved) as Partial<FilterForm>;
    return { ...initialForm, ...parsed };
  });


  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm(f => ({ ...f, [name]: checked }));
  };

  // const handleSelectChange =
  //   (name: keyof FilterForm, label: keyof FilterForm) =>
  //   (e: React.ChangeEvent<HTMLSelectElement>) => {
  //     const val = e.target.value;

  //     const selectedIndex = e.target.selectedIndex;
  //     const selectedOption = e.target.options[selectedIndex]

  //     // Si viene cadena vacía => null, si no => número
  //     const parsed =
  //       val === ""
  //         ? null
  //         : Number(val);

  //     setForm(f => ({ ...f, [name]: parsed }));
  //     setForm(f => ({ ...f, [label]: selectedOption.textContent}));
  //   };

  const handleSelectChange =
  (name: keyof FilterForm, label: keyof FilterForm) =>
  (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const selectedIndex = e.target.selectedIndex;
    const selectedOption = e.target.options[selectedIndex];

    const isClientId = name === 'clientId';

    const parsed = val === ""
      ? null
      : isClientId
      ? val
      : Number(val);

    setForm(f => ({ ...f, [name]: parsed }));
    setForm(f => ({ ...f, [label]: selectedOption.textContent }));
  };


  const handleClear = () => {
    setForm(initialForm);
    localStorage.removeItem("dashboardFilters");
  };

  const handleTimeChange =
    (name: "startTime" | "endTime") =>

    (date: Date | null) => {
            const zone = "America/Managua";
            
      if (date === null) {
        setForm(f => ({ ...f, [name]: null }));
      } else {
        // Convertimos a la hora local en Managua, en formato HH:mm:ss
        const zonedDate = toZonedTime(date, zone);
        const timeStr = format(zonedDate, "HH:mm:ss", { timeZone: zone });
        setForm(f => ({ ...f, [name]: timeStr }));
      }
    };

  return {
    form,
    setForm,
    handleCheckbox,
    handleSelectChange,
    handleClear,
    handleTimeChange
  };
};

export default useDashboardFilterModal;