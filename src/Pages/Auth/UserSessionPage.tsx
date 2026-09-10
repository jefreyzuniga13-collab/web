// /* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { useUserSession } from "@/Hooks/Auth/useUserSession";
import type { UserSessionResponseDto } from "@/Interfaces/Auth/UserSession";
import type { Column } from "@/Interfaces/Common/CustomTable";
import CustomTable from "@/Components/Common/CustomTable";
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
// import ToggleOffIcon from "@mui/icons-material/ToggleOff";
// import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import SearchFilter from "@/Components/Common/SearchFilter";
import Button from '@/Components/Common/Button';

import { format, parseISO } from "date-fns";
import "@/Styles/Crm/WorkShiftPage.css";

function formatDate(value?: string | null) {
  if (!value) return "-";
  try {
    const d = parseISO(value);
    return format(d, "dd/MM/yyyy HH:mm");
  } catch {
    const d = new Date(value as string);
    if (isNaN(d.getTime())) return value as string;
    return d.toLocaleString();
  }
}

export default function UserSessionPage() {
  const {
    sessions,
    selectedSession,
    loadingList,
    page,
    pageSize,
    totalCount,
    setPage,
    setPageSize,
    isModalOpen,
    openView,
    closeModal,
    // toggleStatus,
    exportPdf,
    globalFilter,
    setGlobalFilter,
  } = useUserSession();

  const columns: Column<UserSessionResponseDto>[] = useMemo(
    () => [
      {
        id: "userName",
        label: "Usuario",
        minWidth: 150,
        render: row => row.userName ?? `#${row.userId}`,
      },
            {
        id: "publicIp",
        label: "IP Pública",
        minWidth: 140,
        render: row => row.publicIp ?? "—",
      },
      {
        id: "location",
        label: "Ubicación",
        minWidth: 140,
        render: row => row.location ?? "—",
      },
      {
        id: "device",
        label: "Equipo",
        minWidth: 140,
        render: row => row.device ?? "—",
      },
      {
        id: "loginAt",
        label: "Inicio sesión",
        minWidth: 160,
        render: row => formatDate(row.loginAt),
      },
      {
        id: "logOutAt",
        label: "Fin sesión",
        minWidth: 160,
        render: row => formatDate(row.logOutAt),
      },
      {
        id: "duration",
        label: "Duración (min)",
        minWidth: 120,
        render: row => (row.duration?.toLocaleString()),
      },
      {
        id: "actions",
        label: "Acciones",
        minWidth: 150,
        align: "center",
        render: row => (
          <>
            <IconButton size="small" onClick={() => openView(row.id)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => exportPdf(row.id, "Reporte de sesión", row.userName ?? `Usuario #${row.userId}`)}
            >
              <PictureAsPdfIcon fontSize="small" color="primary" />
            </IconButton>
            {/* <IconButton size="small" onClick={() => toggleStatus(row.id)}>
              {row.logOutAt ? (
                <ToggleOffIcon fontSize="small" />
              ) : (
                <ToggleOnIcon fontSize="small" color="success" />
              )}
            </IconButton> */}
          </>
        ),
      },
    ],
    [openView, exportPdf]
  );

  return (
    <div className="ws-page__container">
      <div className="ws-page__header">
        <div className="ws-page__header-content">
          <h1 className="ws-page__title">Sesiones de usuario</h1>
          <p className="ws-page__subtitle">
            Historial de sesiones, tiempos de conexión y actividad por usuario.
          </p>
        </div>
      </div>

      <div className="table-contaner__search-filter__container">
        <SearchFilter value={globalFilter} onApply={setGlobalFilter} />
      </div>

      {/* {loading && <p className="ws-page__loading">Cargando...</p>}
      {error && <p className="ws-page__error">Error: {error.message}</p>} */}

      <CustomTable<UserSessionResponseDto>
        columns={columns}
        rows={sessions}
        loading={loadingList}
        count={totalCount}
        page={page - 1}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[20, 30, 50]}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={e => setPageSize(parseInt(e.target.value, 10))}
      />

      <Dialog open={isModalOpen} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{fontSize:18}}>Detalle de sesión</DialogTitle>
        <DialogContent dividers>
          {selectedSession ? (
            <div style={{ display: "grid", gridTemplateColumns:'1fr 1fr', gap: 8 }}>
              <div>
                <strong>Usuario:</strong>{" "}
                {selectedSession.userName ?? `#${selectedSession.userId}`}
              </div>
              <div>
                <strong>Ubicación:</strong>{" "}
                {selectedSession.location ?? " "}
              </div>
              <div>
                <strong>Equipo:</strong>{" "}
                {selectedSession.device ?? ""}
              </div>
              <div>
                <strong>IP pública:</strong>{" "}
                {selectedSession.publicIp ?? "—"}
              </div>
              <div>
                <strong>Inicio:</strong> {formatDate(selectedSession.loginAt)}
              </div>
              <div>
                <strong>Fin:</strong> {formatDate(selectedSession.logOutAt)}
              </div>
              <div>
                <strong>Duración (min):</strong>{" "}
                {selectedSession.duration != null
                  ? selectedSession.duration
                  : "—"}
              </div>
            </div>
          ) : (
            <p>No hay datos de la sesión seleccionada.</p>
          )}
        </DialogContent>
        <DialogActions>
         <Button
                      variant="primary"
                      onClick={closeModal}
                      className="sp-modal__btn sp-modal__btn--cancel"
                    >
                      Cancelar
                    </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}