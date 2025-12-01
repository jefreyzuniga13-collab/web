// src/Hooks/Setting/useDynamicParamForm.ts
import { useState, useEffect, useRef, useCallback, type ChangeEvent } from "react";
import type {
  DynamicParamRequiestDto,
  DynamicParamResponseDto
} from "@/Interfaces/Setting/DynamicParamInterface";

interface useDynamicParamFormParams {
  mode: "create" | "edit" | "view";
  data?: DynamicParamResponseDto | null;
  onSubmit: (values: DynamicParamRequiestDto) => void;
}

export function useDynamicParamForm({
  mode,
  data,
  onSubmit,
}: useDynamicParamFormParams) {
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const initialForm: DynamicParamRequiestDto = {
    publicId: data?.publicId || "",
    name: "",
    description: "",
    label: "",
    maxValue: 1,
    minValue: 1,
    type: "",
    value: "",
    isActive: true,
    userIds: []
  };

  const [form, setForm] = useState<DynamicParamRequiestDto>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ((mode === "edit" || isView) && data) {
      setForm({
        publicId: data.publicId,
        name: data.name,
        description: data.description || "",
        label: data.label,
        maxValue: data.maxValue,
        minValue: data.minValue,
        sortOrder: data.sortOrder,
        type: data.type,
        value: data.value,
        isActive: data.isActive,
        userIds: data.userIds ?? []
      });
    } else if (mode === "create") {
      setForm({
        publicId: "",
        name: "",
        description: "",
        label: "",
        maxValue: 1,
        minValue: 1,
        type: "",
        value: "",
        isActive: true,
        userIds: []
      });
    }
  }, [mode, data, isView]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    const isDateType = form.type === "Date";
    const isUserType = form.type === "Users";

    if (!form.name.trim()) newErrors.name = "El nombre es obligatorio";
    if (!form.type.trim()) newErrors.type = "El tipo es obligatorio";

    if (!isUserType) {
      if (form.minValue <= 0) newErrors.minValue = "El mínimo no puede ser 0";
      if (form.maxValue <= 0) newErrors.maxValue = "El máximo no puede ser 0";
    }

    if (!isDateType && !isUserType && !form.value.trim()) {
      newErrors.value = "El valor es obligatorio";
    }

    if (!form.description?.trim()) {
      newErrors.description = "La descripción es obligatoria";
    }

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
    setForm((f) => ({ ...f, [name]: checked }));
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
      if (mode === "create") {
        setForm({
          publicId: "",
          name: "",
          description: "",
          label: "",
          maxValue: 1,
          minValue: 1,
          type: "",
          value: "",
          isActive: true,
          userIds: []
        });
      }
      setErrors({});
    },
    [form, onSubmit, validate, mode]
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
    inputRef,
    setForm
  };
}