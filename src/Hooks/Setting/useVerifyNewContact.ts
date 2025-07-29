/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import type { ContactLogInterface } from "@/Interfaces/Contact/ContactInterface";
import { contactService } from "@/Services/Contact/ContactService";

type FormErrors = {
  waName?: string;
  waId?: string;
  waUserId?: string;
  phone?: string;
  idCard?: string;
  password?: string;
  residenceCard?: string;
  fullName?: string;
  companyId?: string;
};

export function useVerifyNewContact(phoneNumber: string) {
  const initialForm: ContactLogInterface = {
    id: 0,
    waName: "",
    waId: null,
    waUserId: "",
    phone: "",
    companyName: "",
    companyId: null,
    status: "New",
    fullName: "",
    isVerified: false,
    idCard: "",
    passport: "",
    idType: "NationalCard",
    residenceCard: "",
    createdAt: "",
    updatedAt: "",
  };

  const [form, setForm] = useState<ContactLogInterface>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<Error | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    getByPhoneAsync(phoneNumber);
  }, [phoneNumber]);

  const getByPhoneAsync = useCallback(async (phone: string) => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await contactService.getContactByPhoneAsync(phone);
      setForm(data);
    } catch (err: any) {
      setFetchError(err);
      toast.error("No se encontró el contacto.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChangeText = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((f) => ({ ...f, [name]: checked }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const { name, value } = e.target;
  setForm(prev => ({
    ...prev,
    [name]: value !== "" ? parseInt(value, 10) : null
  }));
};
  const handleSelectUser = (id: number) =>
    setForm(f => ({ ...f, assignedUserId: id }))


  const handleBack = () => {
    navigate('/chat');
  };

  const updateAsync = useCallback(async () => {
    setLoading(true);
    try {
      await contactService.updateContactAsync(form);
      await verifyNewContactAsync(form.id)
      toast.success("Contacto verificado con éxito.");
        navigate('/chat');
    } catch (err: any) {
        setErrors(err)
      toast.error("Error. No se pudo verificar al nuevo contacto.");
    } finally {
      setLoading(false);
    }
  }, [form, navigate]);
  
  const verifyNewContactAsync = async(id: number)=>{
    setLoading(true);
    try{
        await contactService.verifyContactAsync(id);
    }catch(err: any){
      setErrors(err);
    }finally{
      setLoading(false);
    }
  }


  const handleSubmit = async () => {
    const newErrors: FormErrors = {};

    if (!form.waName!.trim()) {
      newErrors.waName = "El nombre de usuario es obligatorio.";
    }

    if (!form.fullName!.trim()) {
      newErrors.fullName = "El nombre completo es obligatorio.";
    }
    // phone: debe comenzar con 505 y tener 8 dígitos más
    if (!form.phone.trim()) {
      newErrors.phone = "El número de teléfono es obligatorio.";
    } else if (!/^505\d{8}$/.test(form.phone)) {
      newErrors.phone = "Formato de número inválido.";
    }

    if (form.idType === "NationalCard" && !form.idCard?.trim()) {
      newErrors.idCard = "La cédula es obligatoria.";
    } else if (
      form.idType === "NationalCard" &&
      !/^(?:\d{3}-\d{6}-\d{4}[A-Z]|\d{13}[A-Z])$/.test(form.idCard!)
    ) {
      newErrors.idCard = "Formato de cédula inválido.";
    }


    //passport nicaraguense: 2 letras y 7 números
    if(form.idType === "Passport" && !form.passport!.trim()) {
      newErrors.password = "El pasaporte es obligatorio.";
    } else if (form.idType === "Passport" && !/^[A-Z]{1,2}\d{7}$/.test(form.passport!)) {
      newErrors.password = "Formato de pasaporte inválido.";
    }

    if(form.idType === "ResidenceCard" && !form.residenceCard!.trim()) {
      newErrors.residenceCard = "La tarjeta de residencia es obligatoria.";
    } else if (form.idType === "ResidenceCard" && !/^(?:[A-Z]{1, 2}\d{7}|\d{1,12}$)$/.test(form.residenceCard!)) {
      newErrors.residenceCard = "Formato de tarjeta de residencia inválido.";
    }

    if (form.companyId == null || form.companyId <= 0) {
      newErrors.companyId = "La empresa es obligatoria.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }


    setErrors({});
    await updateAsync();
  };

  return {
    form,
    errors,
    loading,
    fetchError,
    handleChangeText,
    handleCheckbox,
    handleBack,
    handleSubmit,
    handleSelectChange,
    handleSelectUser
  };
}