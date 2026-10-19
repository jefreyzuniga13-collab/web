/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import { ImWhatsapp } from "react-icons/im";
import { RiMessengerLine } from "react-icons/ri";
import { FaInstagram } from "react-icons/fa6";
import type { ConversationDto } from "@/Interfaces/Chat/ChatInterfaces";
import "@/Styles/Dashboard/PerformanceDashboard.css";

interface RecentConversationsTableProps {
  rows: ConversationDto[];
  loading?: boolean;
  page: number;
  pageSize: number;
  totalCount: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("es-NI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
};

const formatDuration = (row: ConversationDto) => {
  if (!row.createdAt) return "-";

  const start = new Date(row.createdAt);
  const end = row.closedAt
    ? new Date(row.closedAt)
    : row.incompletedAt
      ? new Date(row.incompletedAt)
      : new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "-";

  const diffMs = Math.max(0, end.getTime() - start.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(" ");
};

const renderChannel = (metaChannelId?: number | null) => {
  if (metaChannelId === 1) {
    return <ImWhatsapp className="dashboard-channel-icon dashboard-channel-icon--whatsapp" />;
  }

  if (metaChannelId === 2) {
    return <RiMessengerLine className="dashboard-channel-icon dashboard-channel-icon--messenger" />;
  }

  return <FaInstagram className="dashboard-channel-icon dashboard-channel-icon--instagram" />;
};

const safeText = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

const RecentConversationsTable: React.FC<RecentConversationsTableProps> = ({
  rows,
  loading = false,
  page,
  pageSize,
  totalCount,
  setPage,
  setPageSize,
}) => {
  const tableRows = useMemo(() => rows ?? [], [rows]);

  return (
    <section className="dashboard-panel dashboard-panel--table conversationList">
      <header className="dashboard-panel__header">
        <div>
          <h3>Conversaciones recientes de contactos</h3>
          <p>
            Lista de conversaciones recientes incluyendo el ciclo desde la creación
            hasta el cierre o incompleta.
          </p>
        </div>
      </header>

      <div className="dashboard-panel__body dashboard-panel__body--table">
        {loading ? (
          <div className="dashboard-table-empty">Cargando conversaciones...</div>
        ) : tableRows.length === 0 ? (
          <div className="dashboard-table-empty">
            No hay conversaciones recientes para mostrar.
          </div>
        ) : (
          <Box className="dashboard-mui-table">
            <TableContainer
              component={Paper}
              className="dashboard-mui-table__container"
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Canal</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Creado</TableCell>
                    {/* <TableCell>Solicitud agente del contacto al admin</TableCell> */}
                    {/* <TableCell>Solicitud enviada de admin al agente</TableCell> */}
                    <TableCell>Últ. mensaje contacto</TableCell>
                    {/* <TableCell>Aceptación solicitud asignación por el agente</TableCell> */}
                    <TableCell>Agente asignado</TableCell>
                    <TableCell>Últ. mensaje agente</TableCell>
                    <TableCell>Cierre conversación</TableCell>
                    <TableCell>Incompleta a</TableCell>
                    <TableCell align="right">Duración</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {tableRows.map((row, index) => (
                    <TableRow
                      key={`${row.conversationId ?? index}-${index}`}
                      hover
                    >
                      <TableCell align="center">
                        {renderChannel(row.metaChannelId)}
                      </TableCell>

                      <TableCell>{safeText(row.clientContactName)}</TableCell>
                      <TableCell>{safeText(row.contactNumber)}</TableCell>

                      <TableCell>{formatDateTime(row.createdAt)}</TableCell>

                      {/* <TableCell>{formatDateTime(row.agentRequestAt)}</TableCell> */}

                      {/* <TableCell>{formatDateTime(row.requestedAgentAt)}</TableCell> */}

                      <TableCell>{formatDateTime(row.clientLastMessageAt)}</TableCell>

                      {/* <TableCell>{formatDateTime(row.assignedAt)}</TableCell> */}

                      <TableCell>{safeText(row.assignedAgentName)}</TableCell>

                      <TableCell>{formatDateTime(row.agentLastMessageAt)}</TableCell>

                      <TableCell>{formatDateTime(row.closedAt)}</TableCell>

                      <TableCell>{formatDateTime(row.incompletedAt)}</TableCell>

                      <TableCell align="right">
                        <span className="dashboard-duration-badge">
                          {formatDuration(row)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalCount}
              page={Math.max(page - 1, 0)}
              onPageChange={(_, newPage) => setPage(newPage + 1)}
              rowsPerPage={pageSize}
              onRowsPerPageChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              rowsPerPageOptions={[10, 20, 30, 50]}
              labelRowsPerPage="Filas por página"
              showFirstButton
              showLastButton
              labelDisplayedRows={({ from, to, count }) =>
                `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
              className="dashboard-mui-table__pagination"
            />
          </Box>
        )}
      </div>
    </section>
  );
};

export default RecentConversationsTable;