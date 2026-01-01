import { useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "@/Hooks/Auth/useAuth";
import type { ForgotPasswordRequest } from "@/Interfaces/Auth/AuthInterface";

export default function useResetPasswordForm() {
  const { forgotPasswordAsync, loading } = useAuth();

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const validationSchema = useMemo(
    () =>
      Yup.object<ForgotPasswordRequest>({
        email: Yup.string()
          .trim()
          .email("Ingresa un correo electrónico válido.")
          .matches(emailRegex, "Ingresa un correo electrónico válido.")
          .required("El correo electrónico es obligatorio."),
      }),
    []
  );

  const formik = useFormik<ForgotPasswordRequest>({
    initialValues: { email: "" },
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setStatus(null);
      try {
        await forgotPasswordAsync({ email: values.email });
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Ocurrió un error al solicitar el restablecimiento de contraseña.";
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