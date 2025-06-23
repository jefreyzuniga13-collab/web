import { useMemo } from "react"
import { useWorkShift } from "@/Hooks/Setting/useWorkShift"
import type { WorkShiftInterface } from "@/Interfaces/Setting/WorkShiftInterface"
import type { Column } from "@/Interfaces/Common/CustomTable"
import Button from "@/Components/Common/Button"
import CustomTable from "@/Components/Common/CustomTable"
import IconButton from "@mui/material/IconButton"
import VisibilityIcon from "@mui/icons-material/Visibility"
import ToggleOffIcon from "@mui/icons-material/ToggleOff"
import ToggleOnIcon from "@mui/icons-material/ToggleOn"
import { EditIcon } from "lucide-react"
import "@/Styles/Setting/OpeningHourPage.css"
import "@/Styles/Setting/WorkShiftPage.css"
import WorkShiftModal from "@/Components/Setting/WorkShiftModal"
import Spinner from "@/Components/Common/Spinner"

export default function WorkShiftPage() {
  const {
    workShifts,
    loading,
    error,
    page,
    pageSize,
    totalCount,
    setPage,
    setPageSize,
    toggleStatus,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    isModalOpen,
    modalMode,
    selectedWorkShift
  } = useWorkShift()

  const columns = useMemo<Column<WorkShiftInterface>[]>(() => [
    {
      id: "openingHour",
      label: "Horario",
      minWidth: 170,
      render: row => row.openingHour.name,
    },
    {
      id: "assignedUser",
      label: "Asignado a",
      minWidth: 170,
      render: row => row.assignedUser.fullName,
    },
    {
      id: "isActive",
      label: "Activo",
      minWidth: 100,
      render: row => (row.isActive ? "Sí" : "No"),
    },
    {
      id: "validFrom",
      label: "Vigencia Desde",
      minWidth: 130,
    },
    {
      id: "validTo",
      label: "Vigencia Hasta",
      minWidth: 130,
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
          <IconButton size="small" onClick={() => openEdit(row.id)}>
            <EditIcon size={16} />
          </IconButton>
          <IconButton size="small" onClick={() => toggleStatus(row.id)}>
            {row.isActive ? (
              <ToggleOffIcon fontSize="small" />
            ) : (
              <ToggleOnIcon fontSize="small" />
            )}
          </IconButton>
        </>
      ),
    },
  ], [openView, openEdit, toggleStatus])

  return (
    <div className="ws-page__container">
      <div className="ws-page__header">
        <div className="ws-page__header-content">
          <h1 className="ws-page__title">Gestión de Turnos</h1>
          <p className="ws-page__subtitle">
            Administración de turnos según horarios y asignaciones
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          Nuevo Turno
        </Button>
      </div>

      {loading && <p className="ws-page__loading"><Spinner/></p>}
      {error && <p className="ws-page__error">Error: {error.message}</p>}

      <CustomTable<WorkShiftInterface>
        columns={columns}
        rows={workShifts}
        count={totalCount}
        page={page - 1}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[5, 10, 20, 50]}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={e => setPageSize(parseInt(e.target.value, 10))}
      />

        <WorkShiftModal
          mode={modalMode}
          isOpen={isModalOpen}
          data={selectedWorkShift}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      *
    </div>
  )
}