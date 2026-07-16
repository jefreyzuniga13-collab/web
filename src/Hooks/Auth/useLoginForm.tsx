import { useEffect,  useMemo, useState} from "react"
import { useFormik} from "formik"
import * as Yup from "yup"
import { useDispatch, useSelector,} from "react-redux"
import { useNavigate} from "react-router-dom"
import {toast} from "react-toastify"
import type { AppDispatch, RootState} from "@/Context"
import type { ApiResponse, AuthData, LoginRequest,} from "@/Interfaces/Auth/AuthInterface"
import { setCredentials} from "@/Context/Slices/Auth/authSlice"
import {  clearLoginAccessState, startLoginAccessWaiting} from "@/Context/Slices/Auth/loginAccessSlice"
import { closeActiveSesionModal,} from "@/Context/Slices/Chat/activeSesionModalSlice"
import { useAuth,} from "@/Hooks/Auth/useAuth"
import {  ActiveSessionConflictError} from "@/Services/auth/AuthService"
import { saveFacturaTempo,} from "@/Utils/facturaTempoStorage"
import { formatErrorMessage} from "@/Utils/Https/formatErrorMessage"

interface LoginFormValues
  extends LoginRequest {
  remember: boolean
}

export default function useLoginForm() {
  const {
    login,
    loading,
  } = useAuth()

  const dispatch =
    useDispatch<AppDispatch>()

  const navigate =
    useNavigate()

  const loginAccess =
    useSelector(
      (state: RootState) =>
        state.loginAccess
    )

  const [
    pendingLogin,
    setPendingLogin,
  ] =
    useState<LoginRequest | null>(
      null
    )

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false)

  /**
   * Las credenciales pendientes solo viven en memoria.
   */
  const validationSchema =
    useMemo(
      () =>
        Yup.object<LoginFormValues>({
          email:
            Yup.string()
              .trim()
              .email(
                "Ingresa un correo electrónico válido."
              )
              .required(
                "El correo electrónico es obligatorio."
              ),

          password:
            Yup.string()
              .min(
                8,
                "La contraseña debe tener al menos 8 caracteres."
              )
              .required(
                "La contraseña es obligatoria."
              ),

          remember:
            Yup.boolean(),
        }),
      []
    )

  const formik =
    useFormik<LoginFormValues>({
      initialValues: {
        email: "",
        password: "",
        remember: false,
      },

      validationSchema,

      validateOnBlur: true,
      validateOnChange: true,

      onSubmit: async (
        values,
        {
          setStatus,
          setSubmitting,
        }
      ) => {
        setStatus(null)

        const credentials: LoginRequest = {
          email:
            values.email.trim(),

          password:
            values.password,
        }

        try {
          /*
           * Se conservan temporalmente para completar
           * el login después de la aprobación.
           */
          setPendingLogin(
            credentials
          )

          await login(
            credentials
          )

          await saveFacturaTempo()

          dispatch(
            closeActiveSesionModal()
          )

          setPendingLogin(
            null
          )
        } catch (error) {
          if (
            error instanceof
            ActiveSessionConflictError
          ) {
            /*
             * Se recibió HTTP 409.
             * Se oculta el formulario y comienza la espera.
             */
            dispatch(
              startLoginAccessWaiting(
                error.conflict
              )
            )

            setStatus(null)
            return
          }

          setPendingLogin(null)

          setStatus(
            formatErrorMessage(
              error
            )
          )
        } finally {
          setSubmitting(false)
        }
      },
    })

  /**
   * Se ejecuta cuando LoginAccessWaiting completa
   * correctamente el acceso aprobado.
   */
  const handleWaitingCompleted =
    async (
      response:
        ApiResponse<AuthData>
    ) => {
      dispatch(
        setCredentials(
          response.data
        )
      )

      dispatch(
        clearLoginAccessState()
      )

      dispatch(
        closeActiveSesionModal()
      )

      await saveFacturaTempo()

      setPendingLogin(null)

      toast.success(
        response.message
      )

      navigate(
        "/chat",
        {
          replace: true,
        }
      )
    }

  /**
   * Vuelve al formulario después de rechazar,
   * cancelar o expirar la solicitud.
   */
  const handleReturnToLogin =
    () => {
      dispatch(
        clearLoginAccessState()
      )

      setPendingLogin(null)

      formik.setStatus(null)

      /*
       * La contraseña se elimina al regresar.
       */
      void formik.setFieldValue(
        "password",
        ""
      )
    }

  useEffect(() => {
    localStorage.removeItem(
      "dashboardFilters"
    )
  }, [])

  return {
    formik,
    loading,

    showPassword,

    toggleShowPassword: () =>
      setShowPassword(
        (current) =>
          !current
      ),

    canSubmit:
      formik.isValid &&
      formik.dirty &&
      !loading,

    formError:
      formik.status as
        | string
        | undefined,

    waitingForApproval:
      loginAccess.waiting &&
      Boolean(
        loginAccess.requestKey
      ) &&
      Boolean(
        pendingLogin
      ),

    pendingLogin,

    handleWaitingCompleted,
    handleReturnToLogin,
  }
}