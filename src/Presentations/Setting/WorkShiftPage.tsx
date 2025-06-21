import { useWorkShift } from "@/Hooks/Setting/useWorkShift";
import type { WorkShiftInterface } from "@/Interfaces/Setting/WorkShiftInterface";
import "@/Styles/Setting/OpeningHourPage.css"
import "@/Styles/Setting/WorkShiftPage.css"

import type {
  Column,
} from "@/Interfaces/Setting/OpeningHour";
import { useMemo } from "react";
import Button from "@/Components/Common/Button";
import CustomTable from "@/Components/Common/CustomTable";
import IconButton from '@mui/material/IconButton'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ToggleOffIcon from '@mui/icons-material/ToggleOff'
import ToggleOnIcon from '@mui/icons-material/ToggleOn'
import { EditIcon } from "lucide-react";

export const WorkShiftPage = () => {
  const {
    workShifts,
    // selectedWorkShift,
    error,
    loading,
    toggleAsync,
    openCreate,
    openEdit,
    openView,
    // closeModal,
    // handleSubmit,
    // isModalOpen,
    // modalMode,
  } = useWorkShift();

  const columns: Column<WorkShiftInterface>[] = useMemo(() => [
      { id: "openingHour", label: "Date", minWidth: 170 },
      { id: "assignedUser", label: "Assigned", minWidth: 170 },
      { id: "isActive", label: "Active", minWidth: 170 },
      { id: "createdAt", label: "CreatedAt", minWidth: 170 },
      { id: "updatedAt", label: "UpdateBy", minWidth: 170 },
      {
            id: 'actions',
            label: 'Acciones',
            minWidth: 150,
            align: 'center',
            render: (row: WorkShiftInterface) => (
              <>
                <IconButton onClick={() => openView(row.id)}>
                  <VisibilityIcon fontSize="small" />
                </IconButton>
                <IconButton onClick={() => openEdit(row.id)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton onClick={() => toggleAsync(row.id)}>
                  {row.isActive ? <ToggleOffIcon fontSize="small" /> : <ToggleOnIcon fontSize="small" />}
                </IconButton>
              </>
            ),
        }
    ], [openView, openEdit, toggleAsync]);

  return (
    <div className="workShift-container">
      <div className="workShift-top">
        <div className="OpeningHour-header">
          <h1 className="openingHour-title">Gestión de turnos</h1>
          <h3 className="openingHour-subtitle">
            Administración de turnos en días normales y feriados
          </h3>
        </div>
        <Button variant="primary" onClick={openCreate}>
            Crear turno
        </Button>
      </div>

      {loading && <p>Cargando turnos</p>}
      {error && <p className="text-error"></p>}

      <CustomTable 
        columns={columns}
        rows={workShifts}
      />

      {/* Modal */}
    </div>
  );
};

export default WorkShiftPage;