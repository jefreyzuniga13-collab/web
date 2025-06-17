import { useState, useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/Hooks/Auth/useAuth";
import type { AuthData, LoginRequest } from "@/Interfaces/Auth/AuthInterface";
import type { AppDispatch } from "@/Context";
import { useDispatch } from "react-redux";
import { closeActiveSesionModal } from "@/Context/Slices/activeSesionModalSlice";

interface LoginFormValues extends LoginRequest {
  remember: boolean;
}

export default function useLoginForm() {
  const { t } = useTranslation();
  const { login, loading } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const authRaw = localStorage.getItem('auth') ?? '{}';
  const { accessToken } = JSON.parse(authRaw) as AuthData;

  const [showModal, setShowModal] = useState(false);
  const [pendingLogin, setPendingLogin] = useState<LoginRequest | null>(null);

  const validationSchema = useMemo(() =>
    Yup.object<LoginFormValues>({
      email: Yup.string()
        .trim()
        .email(t("login.errors.invalidEmail"))
        .required(t("login.errors.required", { field: t("login.emailLabel") })),
      password: Yup.string()
        .min(8, t("login.errors.passwordMin", { min: 8 }))
        .required(t("login.errors.required", { field: t("login.passwordLabel") })),
      remember: Yup.boolean(),
    }),
  [t]);

  const formik = useFormik<LoginFormValues>({
    initialValues: { email: "", password: "", remember: false },
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setStatus(undefined);
      try {
        if (accessToken) {
          setPendingLogin({ email: values.email, password: values.password });
          setShowModal(true);
          return;
        }

        await login({ email: values.email, password: values.password });
        
        dispatch(closeActiveSesionModal());
      } catch (err) {
        const msg = err instanceof Error ? err.message : t("login.errors.loginFailed");
        setStatus(msg);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const confirmLogin = async () => {
    if (pendingLogin) {
      await login(pendingLogin);
      dispatch(closeActiveSesionModal());
      setShowModal(false);
    }
  };

  const cancelLogin = () => {
    setShowModal(false);
    setPendingLogin(null);
  };

  return {
    formik,
    loading,
    showPassword: formik.values.remember,
    toggleShowPassword: () => formik.setFieldValue('remember', !formik.values.remember),
    canSubmit: formik.isValid && formik.dirty && !loading,
    formError: formik.status as string | undefined,
    showModal,
    confirmLogin,
    cancelLogin,
  };
}
