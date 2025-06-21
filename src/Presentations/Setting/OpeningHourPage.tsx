import { useMemo } from 'react'
import CustomTable from '@/Components/Common/CustomTable'
import Button from '@/Components/Common/Button'
import IconButton from '@mui/material/IconButton'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import ToggleOnIcon from '@mui/icons-material/ToggleOn'
import ToggleOffIcon from '@mui/icons-material/ToggleOff'
import OpeningHourModal from '@/Components/Setting/OpeningHourModal'
import { useOpeningHour } from '@/Hooks/Setting/useOpeningHour'
import type { Column, OpeningHourInterface } from '@/Interfaces/Setting/OpeningHour'

import '@/Styles/Setting/OpeningHourPage.css'

export default function OpeningHourPage() {
  const {
    openingHours,
    loading,
    error,
    modalMode,
    isModalOpen,
    selectedOpeningHour,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    toggleOpeningHourStatus,
  } = useOpeningHour()

  const columns: Column<OpeningHourInterface>[] = useMemo(() => [
    { id: 'name',       label: 'Nombre',         minWidth: 170 },
    { id: 'description',label: 'Descripción',    minWidth: 200 },
    { id: 'isHoliday',  label: 'Feriado',        minWidth: 100, align: 'right' },
    {
      id: 'holidayDate',
    label: 'Fecha Feriado',
    render: (row) => {
      return row.holidayDate
        ? `${row.holidayDate.day.toString().padStart(2, '0')}/${row.holidayDate.month.toString().padStart(2, '0')}`
        : '';
    }
    },
    { id: 'startTime',  label: 'Hora de inicio', minWidth: 120, align: 'right' },
    { id: 'endTime',    label: 'Hora de fin',    minWidth: 120, align: 'right' },
    { id: 'isActive',   label: 'Activo',         minWidth: 100, align: 'right' },
    {
      id: 'actions',
      label: 'Acciones',
      minWidth: 150,
      align: 'center',
      render: (row: OpeningHourInterface) => (
        <>
          <IconButton onClick={() => openView(row.id)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={() => openEdit(row.id)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={() => toggleOpeningHourStatus(row.id)}>
            {row.isActive ? <ToggleOffIcon fontSize="small" /> : <ToggleOnIcon fontSize="small" />}
          </IconButton>
        </>
      ),
    },
    
  ], [openView, openEdit, toggleOpeningHourStatus])

  return (
    <div className="openingHour-container">
      <div className="openingHour-top">

        <div className="OpeningHour-header">
          <h1 className="openingHour-title">Gestión de horario de atención</h1>
          <h3 className="openingHour-subtitle">
            Administración de horarios en días normales y feriados
          </h3>
        </div>
        <Button variant="primary" onClick={openCreate}>
          
          Crear Horario
        </Button>
      </div>

      {loading && <p>Cargando horarios...</p>}
      {error   && <p className="text-error">Error: {error.message}</p>}

      <CustomTable<OpeningHourInterface>
        columns={columns}
        rows={openingHours}
      />

      <OpeningHourModal
        mode={modalMode}
        isOpen={isModalOpen}
        data={selectedOpeningHour || undefined}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

    </div>
  )
}