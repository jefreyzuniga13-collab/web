import { useEffect, useMemo, useState } from "react"
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, Typography,
} from "@mui/material"
import { MdDevices, MdLocationOn, MdOutlineAccessTime, MdOutlinePublic, MdSecurity,} from "react-icons/md"
import type {
  LoginApprovalRequestedDto,
} from "@/Interfaces/Auth/AuthInterface"
interface LoginApprovalModalProps {
  open: boolean
  request: LoginApprovalRequestedDto | null
  processing?: boolean
  error?: string | null
  onApprove(): void | Promise<void>
  onReject(): void | Promise<void>
}

/**
 * Modal mostrado únicamente en el dispositivo con sesión activa.
 */
export function LoginApprovalModal({
  open,
  request,
  processing = false,
  error = null,
  onApprove,
  onReject,
}: LoginApprovalModalProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!open) {
      return
    }

    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [open])

  const secondsRemaining = useMemo(() => {
    if (!request?.expiresAt) {
      return 0
    }

    return Math.max(
      0,
      Math.ceil(
        (new Date(request.expiresAt).getTime() - now) /
          1000
      )
    )
  }, [request?.expiresAt, now])

  const expired =
    Boolean(request) && secondsRemaining <= 0

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      aria-labelledby="login-approval-title"
    >
      <DialogTitle id="login-approval-title">
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
        >
          <MdSecurity size={26} />
          <Box>
            <Typography
              component="span"
              variant="h6"
              fontWeight={700}
            >
              Nuevo intento de acceso
            </Typography>

            <Typography
              display="block"
              variant="body2"
              color="text.secondary"
            >
              Confirma si reconoces este dispositivo.
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {!request ? (
          <Box
            display="flex"
            justifyContent="center"
            py={4}
          >
            <CircularProgress size={30} />
          </Box>
        ) : (
          <Stack spacing={2}>
            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            {expired && (
              <Alert severity="warning">
                La solicitud ya expiró.
              </Alert>
            )}

            <InfoRow
              icon={<MdDevices size={21} />}
              label="Dispositivo"
              value={request.device || "No disponible"}
            />

            <InfoRow
              icon={<MdOutlinePublic size={21} />}
              label="Dirección IP"
              value={request.publicIp || "No disponible"}
            />

            <InfoRow
              icon={<MdLocationOn size={21} />}
              label="Ubicación"
              value={request.location || "No disponible"}
            />

            <InfoRow
              icon={<MdOutlineAccessTime size={21} />}
              label="Tiempo restante"
              value={`${secondsRemaining} segundos`}
            />

            <Alert severity="info">
              Al permitir el acceso, esta sesión será
              reemplazada cuando el otro dispositivo complete
              el inicio de sesión.
            </Alert>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          variant="outlined"
          color="error"
          disabled={
            !request ||
            processing ||
            expired
          }
          onClick={() => void onReject()}
        >
          Rechazar
        </Button>

        <Button
          variant="contained"
          disabled={
            !request ||
            processing ||
            expired
          }
          onClick={() => void onApprove()}
          startIcon={
            processing ? (
              <CircularProgress
                size={16}
                color="inherit"
              />
            ) : undefined
          }
        >
          Permitir acceso
        </Button>
      </DialogActions>
    </Dialog>
  )
}

interface InfoRowProps {
  icon: React.ReactNode
  label: string
  value: string
}

function InfoRow({
  icon,
  label,
  value,
}: InfoRowProps) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="flex-start"
    >
      <Box
        color="text.secondary"
        pt={0.25}
      >
        {icon}
      </Box>

      <Box minWidth={0}>
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {label}
        </Typography>

        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ overflowWrap: "anywhere" }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  )
}