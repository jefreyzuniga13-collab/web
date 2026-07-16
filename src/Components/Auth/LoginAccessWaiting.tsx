import { useCallback, useEffect, useMemo, useRef, useState,} from "react"
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography} from "@mui/material"
import { MdDevices, MdHourglassTop, MdOutlineCancel,} from "react-icons/md"
import { useDispatch, useSelector } from "react-redux"
import type { ApiResponse, AuthData, LoginRequest, LoginRequestResolvedDto,} from "@/Interfaces/Auth/AuthInterface"
import type { AppDispatch, RootState,} from "@/Context"
import {clearLoginAccessState,markLoginAccessCompleted,resolveLoginAccessRequest,setLoginAccessError,setLoginAccessProcessing,setLoginAccessRequest,} from "@/Context/Slices/Auth/loginAccessSlice"
import { authService } from "@/Services/auth/AuthService"
import {onLoginRequestApproved,onLoginRequestCancelled,onLoginRequestRejected,startLoginAccessConnection,stopLoginAccessConnection,} from "@/Context/loginAccessSignalR"

interface LoginAccessWaitingProps {
  credentials: LoginRequest
  onCompleted(
    response: ApiResponse<AuthData>
  ): void | Promise<void>
  onReturnToLogin(): void
}

/**
 * Pantalla utilizada por el dispositivo nuevo mientras espera aprobación.
 *
 * Las credenciales permanecen únicamente en memoria mediante props.
 */
export function LoginAccessWaiting({
  credentials,
  onCompleted,
  onReturnToLogin,
}: LoginAccessWaitingProps) {
  const dispatch = useDispatch<AppDispatch>()

  const loginAccess = useSelector(
    (state: RootState) =>
      state.loginAccess
  )

  const [now, setNow] =
    useState(() => Date.now())

  const completingRef = useRef(false)

  const requestKey =
    loginAccess.requestKey

  const normalizedStatus =
    String(loginAccess.status ?? "")
      .toLowerCase()

  const secondsRemaining = useMemo(() => {
    if (!loginAccess.expiresAt) {
      return 0
    }

    return Math.max(
      0,
      Math.ceil(
        (
          new Date(
            loginAccess.expiresAt
          ).getTime() - now
        ) / 1000
      )
    )
  }, [
    loginAccess.expiresAt,
    now,
  ])

  const expired =
    Boolean(loginAccess.expiresAt) &&
    secondsRemaining <= 0 &&
    normalizedStatus === "pending"

  const finishApprovedLogin =
    useCallback(async () => {
      if (
        !requestKey ||
        completingRef.current
      ) {
        return
      }

      completingRef.current = true

      try {
        dispatch(
          setLoginAccessProcessing(true)
        )

        const response =
          await authService
            .completeApprovedLoginAsync(
              requestKey,
              credentials
            )

        dispatch(
          markLoginAccessCompleted()
        )

        await stopLoginAccessConnection()
        await onCompleted(response)
      } catch (currentError) {
        const message =
          currentError instanceof Error
            ? currentError.message
            : "No se pudo completar el inicio de sesión."

        dispatch(
          setLoginAccessError(message)
        )

        completingRef.current = false
      }
    }, [
      credentials,
      dispatch,
      onCompleted,
      requestKey,
    ])

  useEffect(() => {
    const timer =
      window.setInterval(() => {
        setNow(Date.now())
      }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (!requestKey) {
      return
    }

    let mounted = true

    const approvedHandler = (
      payload: LoginRequestResolvedDto
    ) => {
      if (!mounted) {
        return
      }

      dispatch(
        resolveLoginAccessRequest(payload)
      )

      void finishApprovedLogin()
    }

    const rejectedHandler = (
      payload: LoginRequestResolvedDto
    ) => {
      if (!mounted) {
        return
      }

      dispatch(
        resolveLoginAccessRequest(payload)
      )
    }

    const cancelledHandler = (
      payload: LoginRequestResolvedDto
    ) => {
      if (!mounted) {
        return
      }

      dispatch(
        resolveLoginAccessRequest(payload)
      )
    }

    const offApproved =
      onLoginRequestApproved(
        approvedHandler
      )

    const offRejected =
      onLoginRequestRejected(
        rejectedHandler
      )

    const offCancelled =
      onLoginRequestCancelled(
        cancelledHandler
      )

    void startLoginAccessConnection(
      requestKey
    ).catch((error: { message: unknown }) => {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo conectar con el servicio de aprobación."

      dispatch(
        setLoginAccessError(message)
      )
    })

    return () => {
      mounted = false

      offApproved()
      offRejected()
      offCancelled()

      void stopLoginAccessConnection()
    }
  }, [
    dispatch,
    finishApprovedLogin,
    requestKey,
  ])

  /*
   * Consulta HTTP de respaldo cada cinco segundos.
   */
  useEffect(() => {
    if (!requestKey) {
      return
    }

    let mounted = true

    const synchronize = async () => {
      try {
        const response =
          await authService
            .getLoginAccessRequestAsync(
              requestKey
            )

        if (!mounted) {
          return
        }

        dispatch(
          setLoginAccessRequest(
            response.data
          )
        )

        const status =
          String(
            response.data.status
          ).toLowerCase()

        if (status === "approved") {
          await finishApprovedLogin()
        }
      } catch {
        /*
         * SignalR sigue siendo la vía principal.
         * Un fallo temporal de esta consulta no cancela la espera.
         */
      }
    }

    void synchronize()

    const timer =
      window.setInterval(
        () => void synchronize(),
        5000
      )

    return () => {
      mounted = false
      window.clearInterval(timer)
    }
  }, [
    dispatch,
    finishApprovedLogin,
    requestKey,
  ])

  const cancel = useCallback(async () => {
    if (
      !requestKey ||
      loginAccess.processing
    ) {
      return
    }

    try {
      dispatch(
        setLoginAccessProcessing(true)
      )

      await authService
        .cancelLoginAccessRequestAsync(
          requestKey
        )

      await stopLoginAccessConnection()

      dispatch(
        clearLoginAccessState()
      )

      onReturnToLogin()
    } catch (currentError) {
      const message =
        currentError instanceof Error
          ? currentError.message
          : "No se pudo cancelar la solicitud."

      dispatch(
        setLoginAccessError(message)
      )
    }
  }, [
    dispatch,
    loginAccess.processing,
    onReturnToLogin,
    requestKey,
  ])

  const returnToLogin =
    useCallback(async () => {
      await stopLoginAccessConnection()

      dispatch(
        clearLoginAccessState()
      )

      onReturnToLogin()
    }, [
      dispatch,
      onReturnToLogin,
    ])

  if (!requestKey) {
    return null
  }

  const rejected =
    normalizedStatus === "rejected"

  const cancelled =
    normalizedStatus === "cancelled"

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        maxWidth: 460,
        mx: "auto",
        p: 4,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack spacing={3}>
        <Box textAlign="center">
          <Box
            display="flex"
            justifyContent="center"
            mb={2}
          >
            {rejected ||
            cancelled ||
            expired ? (
              <MdOutlineCancel
                size={48}
              />
            ) : (
              <MdHourglassTop
                size={48}
              />
            )}
          </Box>

          <Typography
            variant="h5"
            fontWeight={700}
          >
            {rejected
              ? "Acceso rechazado"
              : cancelled
                ? "Solicitud cancelada"
                : expired
                  ? "Solicitud expirada"
                  : "Esperando aprobación"}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            mt={1}
          >
            {rejected
              ? "El dispositivo activo rechazó el acceso."
              : cancelled
                ? "La solicitud ya no está disponible."
                : expired
                  ? "El tiempo para responder finalizó."
                  : "Confirma el acceso desde el dispositivo que ya tiene la sesión activa."}
          </Typography>
        </Box>

        {!rejected &&
          !cancelled &&
          !expired && (
            <>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                justifyContent="center"
              >
                <CircularProgress
                  size={22}
                />

                <Typography
                  variant="body2"
                  fontWeight={600}
                >
                  {secondsRemaining} segundos restantes
                </Typography>
              </Stack>

              {loginAccess.currentDevice && (
                <Alert
                  severity="info"
                  icon={
                    <MdDevices size={20} />
                  }
                >
                  Sesión activa:
                  {" "}
                  {loginAccess.currentDevice}
                </Alert>
              )}
            </>
          )}

        {loginAccess.error && (
          <Alert severity="error">
            {loginAccess.error}
          </Alert>
        )}

        {rejected ||
        cancelled ||
        expired ? (
          <Button
            variant="contained"
            onClick={() =>
              void returnToLogin()
            }
          >
            Volver al inicio de sesión
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="inherit"
            disabled={
              loginAccess.processing
            }
            onClick={() =>
              void cancel()
            }
          >
            Cancelar solicitud
          </Button>
        )}
      </Stack>
      </Paper>
  )
}