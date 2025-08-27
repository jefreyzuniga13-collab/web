import { useState, useEffect, useCallback, type ChangeEvent } from "react";
import type { ProductCatalogRequest, ProductCatalogResponse } from "@/Interfaces/Wh/ProductCatalogInterfaces";

interface Props {
  mode: "create" | "edit" | "view";
  data?: ProductCatalogResponse | null;
  onSubmit: (values: ProductCatalogRequest) => void;
}

export function useProductCatalogFormModal({
  mode,
  data,
  onSubmit,
}: Props) {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const initialForm: ProductCatalogRequest = {
    id: data?.id || 0,
    name: "",
    description: "",
    vertical: "commerce",
    isActive: true,
  };

  const [form, setForm] = useState<ProductCatalogRequest>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if ((mode === "edit" || isView) && data) {
      setForm({
        id: data.id,
        name: data.name,
        description: data.description || "",
        isActive: data.isActive!,
      });

    } else if (mode === "create") {
      setForm(initialForm);
    }
  }, [mode, data]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};


    if (form.name == null) newErrors.name = "El nombre es obligatorio";

    if (form.description == null)
        newErrors.description = "La descripción es obligatoria";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;

  }, [form]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    },
    [errors]
  );
  const handleCheckbox = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    const v = checked;

    setForm((f) => ({ ...f, [name]: v }));
  }, []);

//   const handleSelect = useCallback(
//     (value: string) => {
//       setForm((prev) => ({ ...prev, type: value }));
//       if (errors.type) {
//         setErrors((prev) => ({ ...prev, type: "" }));
//       }
//     },
//     [errors]
//   );

    const handleSelect = useCallback(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (field: keyof ProductCatalogRequest, value: any) => {
        setForm(f => {
          const next = { ...f, [field]: value }
          return next
        })
      },
      []
    )

  const handleSubmitForm = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;
      onSubmit(form);
      setForm(initialForm);
      setErrors({});
    },
    [form, onSubmit, validate]
  );

  return {
    form,
    errors,
    isView,
    isEdit,
    handleChange,
    handleSelect,
    handleSubmit: handleSubmitForm,
    handleCheckbox,
  };
}