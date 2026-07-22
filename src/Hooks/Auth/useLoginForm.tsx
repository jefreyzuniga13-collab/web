import { useCallback, useEffect, useMemo, useState } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"

import type { AppDispatch } from "@/Context"
import type {
  LoginConflictResponseDto,
  LoginRequest,
} from "@/Interfaces/Auth/AuthInterface"

import { setCredentials } from "@/Context/Slices/Auth/authSlice"
import { closeActiveSesionModal } from "@/Context/Slices/Chat/activeSesionModalSlice"

import { useAuth } from "@/Hooks/Auth/useAuth"
import {
  ActiveSessionConflictError,
  authService,
} from "@/Services/auth/AuthService"

import { saveFacturaTempo } from "@/Utils/facturaTempoStorage"
import { formatErrorMessage } from "@/Utils/Https/formatErrorMessage"

interface LoginFormValues extends LoginRequest {
  remember: boolean
}

/**
 * Administra el formulario de inicio de sesión.
 *
 * Nuevo flujo:
 * - Si no hay sesión activa: login normal.
 * - Si hay sesión activa: muestra modal local de reemplazo.
 * - Si el usuario confirma: revoca la sesión anterior e inicia aquí.
 */
export default function useLoginForm() {
  const { login, loading } = useAuth()

  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  /*
   * Las credenciales pendientes solo viven en memoria.
   * No se guardan en Redux, localStorage ni sessionStorage.
   */
  const [pendingLogin, setPendingLogin] =
    useState<LoginRequest | null>(null)

  const [replaceSessionConflict, setReplaceSessionConflict] =
    useState<LoginConflictResponseDto | null>(null)

  const [showReplaceSessionModal, setShowReplaceSessionModal] =
    useState(false)

  const [replacingSession, setReplacingSession] = useState(false)

  const [showPassword, setShowPassword] = useState(false)

  const validationSchema = useMemo(
    () =>
      Yup.object({
        email: Yup.string()
          .trim()
          .email("Ingresa un correo electrónico válido.")
          .required("El correo electrónico es obligatorio."),

        password: Yup.string()
          .min(
            8,
            "La contraseña debe tener al menos 8 caracteres."
          )
          .required("La contraseña es obligatoria."),

        remember: Yup.boolean().required(),
      }),
    []
  )

  const formik = useFormik<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
      remember: false,
    },

    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,

    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setStatus(undefined)

      const credentials: LoginRequest = {
        email: values.email.trim(),
        password: values.password,
      }

      setPendingLogin(credentials)

      try {
        await login(credentials)

        /*
         * Login normal.
         * useAuth se encarga de guardar credenciales,
         * mostrar toast y navegar.
         */
        await saveFacturaTempo()

        dispatch(closeActiveSesionModal())

        setPendingLogin(null)
        setReplaceSessionConflict(null)
        setShowReplaceSessionModal(false)
      } catch (currentError) {
        if (currentError instanceof ActiveSessionConflictError) {
          /*
           * La API detectó una sesión activa.
           *
           * Ya no se espera aprobación desde máquina 1.
           * Ahora máquina 2 decide si desea reemplazarla.
           */
          setReplaceSessionConflict(currentError.conflict)
          setShowReplaceSessionModal(true)

          setStatus(undefined)
          return
        }

        setPendingLogin(null)
        setReplaceSessionConflict(null)
        setShowReplaceSessionModal(false)

        setStatus(formatErrorMessage(currentError))
      } finally {
        setSubmitting(false)
      }
    },
  })

  /**
   * Confirma el reemplazo de la sesión anterior.
   *
   * La API:
   * - revoca la sesión activa anterior;
   * - crea una nueva sesión;
   * - envía ForceLogout a máquina 1;
   * - devuelve las cookies/tokens para máquina 2.
   */
  const handleConfirmReplaceSession = useCallback(async () => {
    if (!pendingLogin) {
      setShowReplaceSessionModal(false)
      setReplaceSessionConflict(null)
      formik.setStatus(
        "No se encontraron credenciales pendientes. Intenta iniciar sesión nuevamente."
      )

      return
    }

    setReplacingSession(true)
    formik.setStatus(undefined)

    try {
      const response =
        await authService.forceReplaceLoginAsync(pendingLogin)

      dispatch(setCredentials(response.data))
      dispatch(closeActiveSesionModal())

      await saveFacturaTempo()

      setPendingLogin(null)
      setReplaceSessionConflict(null)
      setShowReplaceSessionModal(false)

      toast.success(
        response.message || "Inicio de sesión exitoso."
      )

      navigate("/chat", {
        replace: true,
      })
    } catch (error) {
      setPendingLogin(null)
      setReplaceSessionConflict(null)
      setShowReplaceSessionModal(false)

      formik.setStatus(formatErrorMessage(error))
    } finally {
      setReplacingSession(false)
    }
  }, [dispatch, formik, navigate, pendingLogin])

  /**
   * Cancela el reemplazo.
   *
   * La sesión anterior queda intacta.
   * La máquina 2 vuelve al formulario de login.
   */
  const handleCancelReplaceSession = useCallback(() => {
    setPendingLogin(null)
    setReplaceSessionConflict(null)
    setShowReplaceSessionModal(false)

    formik.setStatus(undefined)

    /*
     * Se limpia la contraseña para obligar al usuario
     * a escribirla nuevamente si desea intentarlo otra vez.
     */
    void formik.setFieldValue("password", "", false)
    formik.setFieldTouched("password", false, false)
  }, [formik])

  const toggleShowPassword = useCallback(() => {
    setShowPassword((current) => !current)
  }, [])

  useEffect(() => {
    localStorage.removeItem("dashboardFilters")
  }, [])

  const isBusy =
    loading ||
    replacingSession ||
    formik.isSubmitting

  return {
    formik,

    loading: isBusy,
    replacingSession,

    showPassword,
    toggleShowPassword,

    canSubmit:
      formik.isValid &&
      formik.dirty &&
      !isBusy,

    formError:
      typeof formik.status === "string"
        ? formik.status
        : undefined,

    pendingLogin,

    showReplaceSessionModal,
    replaceSessionConflict,

    handleConfirmReplaceSession,
    handleCancelReplaceSession,
  }
}