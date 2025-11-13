import React, { useMemo, useState } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import SignaturePad from './SignaturePad'
import { useSignature } from '@/Hooks/Crm/useSignature'
import type { WorkOrderRequestDto } from '@/Interfaces/Crm/WorkOrderInterface'

type Props = {
  defaultValues?: Partial<WorkOrderRequestDto>
  onSubmit: (values: WorkOrderRequestDto) => Promise<void> | void
  onSendSignature?: (contactId: string) => Promise<void> | void
}

const WorkOrderForm: React.FC<Props> = ({ defaultValues, onSubmit, onSendSignature }) => {
  const [clientId, setClientId] = useState<number>(Number(defaultValues?.clientId ?? 0))
  const [addres, setAddres] = useState<string>(defaultValues?.addres ?? '')
  const [ServiceDescripcion, setServiceDescripcion] = useState<string>(defaultValues?.ServiceDescripcion ?? '')
  const [observation, setObservation] = useState<string>(defaultValues?.observation ?? '')
  const [signInSheet, setSignInSheet] = useState<Dayjs | null>(
    defaultValues?.signInSheet ? dayjs(defaultValues.signInSheet) : dayjs()
  )
  const [signOutSheet, setSignOutSheet] = useState<Dayjs | null>(
    defaultValues?.signOutSheet ? dayjs(defaultValues.signOutSheet) : dayjs()
  )
  const [contactId, setContactId] = useState<string>('')

  const canSubmit = useMemo(
    () => clientId > 0 && addres.trim().length > 0 && signInSheet && signOutSheet,
    [clientId, addres, signInSheet, signOutSheet]
  )

  const sig = useSignature()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !signInSheet || !signOutSheet) return

    const payload: WorkOrderRequestDto = {
      clientId,
      addres,
      signInSheet: signInSheet.toDate(),
      signOutSheet: signOutSheet.toDate(),
      ServiceDescripcion,
      observation,
    }

    await onSubmit(payload)
  }

  const handleSendSignature = async () => {
    if (!contactId) return
    await sig.send(contactId)
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            type="number"
            label="Cliente ID"
            value={clientId || ''}
            onChange={(e) => setClientId(Number(e.target.value))}
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 12, md: 9 }}>
          <TextField
            label="Dirección"
            value={addres}
            onChange={(e) => setAddres(e.target.value)}
            fullWidth
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Descripción del servicio"
            value={ServiceDescripcion}
            onChange={(e) => setServiceDescripcion(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Observación"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Grid>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid size={{ xs: 12, md: 6 }}>
            <DateTimePicker
              label="Entrada"
              value={signInSheet}
              onChange={(value) => {
                // value es PickerValue => Dayjs | null usando AdapterDayjs
                setSignInSheet((value ?? null) as Dayjs | null)
              }}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <DateTimePicker
              label="Salida"
              value={signOutSheet}
              onChange={(value) => {
                setSignOutSheet((value ?? null) as Dayjs | null)
              }}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
        </LocalizationProvider>

        <Grid size={12}>
          <SignaturePad innerRef={sig.ref} />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="ContactId para firma"
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            fullWidth
          />
        </Grid>

        <Grid
          size={{ xs: 12, md: 6 }}
          display="flex"
          gap={1}
          alignItems="center"
          justifyContent="flex-end"
        >
          <Button variant="outlined" onClick={sig.clear} disabled={sig.submitting}>
            Limpiar firma
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              await handleSendSignature()
              await onSendSignature?.(contactId)
            }}
            disabled={!contactId || sig.submitting}
          >
            Enviar firma
          </Button>
        </Grid>

        <Grid size={12} display="flex" justifyContent="flex-end">
          <Button type="submit" variant="contained" disabled={!canSubmit}>
            Guardar Hoja
          </Button>
        </Grid>
      </Grid>
    </Box>
  )
}

export default WorkOrderForm