import { useState, useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/Hooks/useAuth";
import type { RegisterRequest } from "@/Interfaces/Auth/AuthInterface";

const useRegistrationContainer = () => {
  const { t } = useTranslation();
  const { registerAsync, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const validationSchema = useMemo(
    () =>
      Yup.object<RegisterRequest>({
        fullName: Yup.string().required(
          t("register.requiredFullName", {
            field: t("registration.fullNameLabel"),
          })
        ),
        companyName: Yup.string().required(
          t("requiredCompanyName", { field: t("register.companyNameRequired") })
        ),
        contactName: Yup.string().required(
          t("registration.requiredContactName", {
            field: t("contactNameLabel"),
          })
        ),
        email: Yup.string()
          .required()
          .email(
            t("register.invalidEmailFormat", {
              field: t("register.emailLabel"),
            })
          ),
        phone: Yup.string().required(
          t("requiredPhone", { field: t("register.phoneLabel") })
        ),
        country: Yup.string().required(
          t("registerEmail", { field: t("register.countryLabel") })
        ),
        password: Yup.string()
          .required(
            t("registration.requiredEmail", {
              field: t("register.passwordLabel"),
            })
          )
          .min(6, t("registration.minEmail", { min: 8 })),
      }),

    [t]
  );

  const formik = useFormik<RegisterRequest>({
    initialValues: {
      fullName: "",
      email: "",
      companyName: "",
      contactName: "",
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
        const {
          fullName,
          email,
          companyName,
          contactName,
          phone,
          country,
          password,
        } = values;
        await registerAsync({
          fullName,
          companyName,
          contactName,
          email,
          phone,
          country,
          password,
        });
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : t("registration.error.registrationFail");
        setStatus(msg);
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
};

export default useRegistrationContainer;