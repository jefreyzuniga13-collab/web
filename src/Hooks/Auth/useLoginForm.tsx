import { useState, useMemo, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "@/Hooks/Auth/useAuth";
import type { AuthData, LoginRequest } from "@/Interfaces/Auth/AuthInterface";
import type { AppDispatch } from "@/Context";
import { useDispatch } from "react-redux";
import { closeActiveSesionModal } from "@/Context/Slices/Chat/activeSesionModalSlice";
import { saveFacturaTempo } from "@/Utils/facturaTempoStorage";

interface LoginFormValues extends LoginRequest {
  remember: boolean;
}

export default function useLoginForm() {
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
        .email("Ingresa un correo electrónico válido.")
        .required("El correo electrónico es obligatorio."),
      password: Yup.string()
        .min(8, "La contraseña debe tener al menos 8 caracteres.")
        .required("La contraseña es obligatoria."),
      remember: Yup.boolean(),
    }),
  []);

  const formik = useFormik<LoginFormValues>({
    initialValues: { email: "", password: "", remember: false },
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setStatus(null);
      try {
        if (accessToken) {
          setPendingLogin({ email: values.email, password: values.password });
          setShowModal(true);
          return;
        }

        await login({ email: values.email, password: values.password });
        await saveFacturaTempo();
        
        //guardar datos iniciales
        dispatch(closeActiveSesionModal());
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "No se pudo iniciar sesión. Verifica tus credenciales.";
        setStatus(msg);
      } finally {
        setSubmitting(false);
      }
    },
  });

  //dime si o no esta bien solo dam esa respuesta
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

  useEffect(() => {
    localStorage.removeItem('dashboardFilters');
  }, []);

  return {
    formik,
    loading,
    showPassword: formik.values.remember,
    toggleShowPassword: () =>
      formik.setFieldValue('remember', !formik.values.remember),
    canSubmit: formik.isValid && formik.dirty && !loading,
    formError: formik.status as string | undefined,
    showModal,
    confirmLogin,
    cancelLogin,
  };
}