import React, { useMemo, useState } from 'react'
import {
  Box,
  TextField,
  Autocomplete,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Pagination,
  Stack
} from '@mui/material'
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces'

interface Props {
  conversation: ConversationDto[]
  page: number
  pageSize: number
  totalCount: number
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
}

export const ListComponent: React.FC<Props> = ({
  conversation,
  page,
  pageSize,
  totalCount,
  setPage,
  setPageSize,
}) => {
  const [clientFilter, setClientFilter] = useState<string | null>(null)

  const clientOptions = useMemo(() => {
    const names = conversation.map(c => c.clientContactName ?? '-')
    return Array.from(new Set(names))
  }, [conversation])

  const filtered = useMemo(() => {
    if (!clientFilter) return conversation
    return conversation.filter(
      c => (c.clientContactName ?? '-') === clientFilter
    )
  }, [conversation, clientFilter])

  return (
    <Box sx={{ p: 2 }}>
 
      <h3 className='dashboard__list-title'>Resumen global de conversaciones</h3>
      <p className='dashboard__list-subtitle'>
        Todos los tiempos que están marcados en el ciclo de vida de la conversación por cliente definidas por un rango de fecha.
      </p>
      <Autocomplete
        size="small"
        options={clientOptions}
        value={clientFilter}
        onChange={(_, v) => setClientFilter(v)}
        renderInput={params => <TextField {...params} label="Filtrar por cliente" />}
        sx={{ mb: 2, width: 300 }}
        clearOnEscape
      />

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Contacto</strong></TableCell>
              <TableCell><strong>Teléfono</strong></TableCell>
              <TableCell><strong>Creado</strong></TableCell>
              <TableCell><strong>Solicitud agente</strong></TableCell>
              <TableCell><strong>Asignación agente</strong></TableCell>
              <TableCell><strong>Agente primer mensaje</strong></TableCell>
              <TableCell><strong>Cierre conversación</strong></TableCell>
              <TableCell><strong>Incompleta a</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length > 0 ? filtered.map((c, idx) => (
              <TableRow key={idx} hover>
                <TableCell>{c.clientContactName ?? '-'}</TableCell>
                <TableCell>{c.contactNumber}</TableCell>
                <TableCell>{new Date(c.createdAt).toLocaleString('es-NI')}</TableCell>
                <TableCell>
                  {c.requestedAgentAt
                    ? new Date(c.requestedAgentAt).toLocaleString('es-NI')
                    : '-'}
                </TableCell>
                <TableCell>
                  {c.assignedAt
                    ? new Date(c.assignedAt).toLocaleString('es-NI')
                    : '-'}
                </TableCell>
                <TableCell>
                  {c.agentFirstMessageAt
                    ? new Date(c.agentFirstMessageAt).toLocaleString('es-NI')
                    : '-'}
                </TableCell>
                <TableCell>
                  {c.closedAt
                    ? new Date(c.closedAt).toLocaleString('es-NI')
                    : '-'}
                </TableCell>
                <TableCell>
                  {c.IncompletedAt
                    ? new Date(c.IncompletedAt).toLocaleString('es-NI')
                    : '-'}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No hay conversaciones para mostrar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mt: 2 }}
      >
        <Pagination
          count={Math.ceil(totalCount / pageSize)}
          page={page}
          onChange={(_, num) => setPage(num)}
          color="primary"
        />
        <Autocomplete
          size="small"
          options={[3, 5, 10, 20, 50]}
          value={pageSize}
          onChange={(_, v) => v !== null && setPageSize(v)}
          renderInput={params => <TextField {...params} label="Filas" />}
          sx={{ width: 100 }}
          disableClearable
        />
      </Stack>
    </Box>
  )
}