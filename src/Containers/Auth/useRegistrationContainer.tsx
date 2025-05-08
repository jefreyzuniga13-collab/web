import { useState, useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/Hooks/useAuth";
import type { RegisterRequest } from "@/Interfaces/Auth/AuthInterface";

export default function useRegistrationContainer() {
  const { t } = useTranslation();
  const { registerAsync, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const validationSchema = useMemo(
    () =>
      Yup.object<RegisterRequest>({
        fullName: Yup.string()
          .trim()
          .required(
            t("register.errors.required", {
              field: t("register.fullNameLabel"),
            })
          ),
        companyName: Yup.string()
          .trim()
          .required(
            t("register.errors.required", {
              field: t("register.companyNameLabel"),
            })
          ),
        contactName: Yup.string()
          .trim()
          .required(
            t("register.errors.required", {
              field: t("register.contactNameLabel"),
            })
          ),
        email: Yup.string()
          .trim()
          .email(t("register.errors.invalidEmail"))
          .required(
            t("register.errors.required", { field: t("register.emailLabel") })
          ),
        phone: Yup.string()
          .trim()
          .required(
            t("register.errors.required", { field: t("register.phoneLabel") })
          ),
        country: Yup.string()
          .trim()
          .required(
            t("register.errors.required", { field: t("register.countryLabel") })
          ),
        password: Yup.string()
          .required(
            t("register.errors.required", {
              field: t("register.passwordLabel"),
            })
          )
          .min(8, t("register.errors.passwordMin", { min: 8 })),
      }),
    [t]
  );

  const formik = useFormik<RegisterRequest>({
    initialValues: {
      fullName: "",
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      country: "",
      password: "",
    },
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setStatus(undefined);
      try {
        await registerAsync(values);
      } catch (err: unknown) {
        setStatus(
          err instanceof Error ? err.message : t("register.errors.submitFail")
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  return {
    formik,
    loading,
    showPassword,
    toggleShowPassword: () => setShowPassword((v) => !v),
    canSubmit: formik.isValid && formik.dirty && !loading,
    formError: formik.status as string | undefined,
  };
}