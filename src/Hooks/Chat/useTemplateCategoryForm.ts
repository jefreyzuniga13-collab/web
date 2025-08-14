import { useState, useEffect, useCallback, type ChangeEvent } from "react";
import type {
  TemplateCategoryRequestDto,
  TemplateCategoryResponseDto,
} from "@/Interfaces/Chat/TemplateCategoryInterfaces";

interface UseTemplateCategoryFormParams {
  mode: "create" | "edit" | "view";
  data?: TemplateCategoryResponseDto | null;
  onSubmit: (values: TemplateCategoryRequestDto) => void;
}

export function useTemplateCategoryForm({
  mode,
  data,
  onSubmit,
}: UseTemplateCategoryFormParams) {
  const isView = mode === "view";

  const initialForm: TemplateCategoryRequestDto = {
    //id: data?.id || 0,
    name: "",
    description: "",
    isActive: false,
  };

  const [form, setForm] = useState<TemplateCategoryRequestDto>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if ((mode === "edit" || isView) && data) {
      setForm({
        name: data.name,
        description: data.description || "",
        isActive: data.isActive,
      });
    } else if (mode === "create") {
      setForm(initialForm);
    }
  }, [mode, data]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};


    if (!form.name.trim()) newErrors.name = "El nombre es obligatorio";

    if (!form.description.trim())
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

  const handleSelect = useCallback(
    (value: string) => {
      setForm((prev) => ({ ...prev, type: value }));
      if (errors.type) {
        setErrors((prev) => ({ ...prev, type: "" }));
      }
    },
    [errors]
  );

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
    handleChange,
    handleSelect,
    handleSubmit: handleSubmitForm,
    handleCheckbox,
  };
}