import React, { useMemo, useEffect } from 'react';
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
  TablePagination
} from '@mui/material';
import type { ConversationDto } from '@/Interfaces/Chat/ChatInterfaces';
import "@/Styles/Dashboard/ListComponent.css"

interface Props {
  conversation: ConversationDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

const getDuration = (c: ConversationDto): string => {
  const start = new Date(c.createdAt);
  const end = c.closedAt
    ? new Date(c.closedAt)
    : c.IncompletedAt
      ? new Date(c.IncompletedAt)
      : new Date();
  const diffMs = end.getTime() - start.getTime();
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
};

export const ListComponent: React.FC<Props> = ({
  conversation,
  page,
  pageSize,
  totalCount,
  setPage,
  setPageSize,
}) => {
  const [clientFilter, setClientFilter] = React.useState<string | null>(null);

  const clientOptions = useMemo(
    () => Array.from(new Set(conversation.map(c => c.clientContactName ?? '-'))),
    [conversation]
  );

  const filtered = useMemo(() => {
    if (!clientFilter) return conversation;
    return conversation.filter(c => (c.clientContactName ?? '-') === clientFilter);
  }, [conversation, clientFilter]);

  useEffect(() => {
    setPage(1);
  }, [clientFilter, pageSize, setPage]);

  return (
    <Box sx={{ p: 2 }}>
      <h3 className='dashboard__list-title'>Resumen global de conversaciones</h3>
      <p style={{ marginTop: 0 }} className='dashboard__list-subtitle'>
        Todos los tiempos que están marcados en el ciclo de vida de la conversación
        por cliente definidas por un rango de fecha.
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

      <TableContainer component={Paper} sx={{ maxHeight: 500, borderRadius: 2, boxShadow: 3 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {[
                'Contacto',
                'Teléfono',
                'Creado',
                'Solicitud agente',
                'Asignación agente',
                'Agente primer mensaje',
                'Cierre conversación',
                'Incompleta a',
                'Duración'
              ].map(title => (
                <TableCell key={title}>
                  <strong>{title}</strong>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((c, idx) => (
                <TableRow
                  key={idx}
                  hover
                  sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}
                >
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
                    {c.closedAt ? new Date(c.closedAt).toLocaleString('es-NI') : '-'}
                  </TableCell>
                  <TableCell>
                    {c.IncompletedAt
                      ? new Date(c.IncompletedAt).toLocaleString('es-NI')
                      : '-'}
                  </TableCell>
                  <TableCell>{getDuration(c)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No hay conversaciones para mostrar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalCount}
        page={page - 1}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={e => {
          setPageSize(parseInt(e.target.value, 10));
          setPage(1);
        }}
        rowsPerPageOptions={[3, 5, 10, 20, 50]}
        labelRowsPerPage="Filas"
        sx={{ mt: 2 }}
      />
    </Box>
  );
};