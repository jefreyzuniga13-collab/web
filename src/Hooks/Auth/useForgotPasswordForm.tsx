import { useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/Hooks/Auth/useAuth";
import type { ForgotPasswordRequest } from "@/Interfaces/Auth/AuthInterface";

export default function useResetPasswordForm() {
  const { t } = useTranslation();
  const { forgotPasswordAsync, loading } = useAuth();

  const validationSchema = useMemo(
    () =>
      Yup.object<ForgotPasswordRequest>({
        email: Yup.string()
          .trim()
          .email(t("forgotPassword.invalidEmail"))
          .required(
            t("forgotPassword.requiredEmail", {
              field: t("forgotPassword.emailLabel"),
            })
          ),
      }),
    [t]
  );

  const formik = useFormik<ForgotPasswordRequest>({
    initialValues: { email: "" },
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setStatus(undefined);
      try {
        await forgotPasswordAsync({ email: values.email });
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : t("forgotPassword.errors");
        setStatus(msg);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return {
    formik,
    loading,
    canSubmit: formik.isValid && formik.dirty && !loading,
    formError: formik.status as string | undefined,
  };
}