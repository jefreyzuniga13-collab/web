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
import type { OpeningHourInterface } from '@/Interfaces/Setting/OpeningHour'
import type { Column } from '@/Interfaces/Common/CustomTable'
import '@/Styles/Setting/OpeningHourPage.css'
// import { ThreeDot } from 'react-loading-indicators'

export default function OpeningHourPage() {
  const {
    openingHours,
    // loading,
    error,
    page,
    pageSize,
    totalCount,
    setPage,
    setPageSize,
    modalMode,
    isModalOpen,
    selectedOpeningHour,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    toggleOpeningHourStatus,
  } = useOpeningHour();

  const columns: Column<OpeningHourInterface>[] = useMemo(
    () => [
      { id: 'name',       label: 'Nombre',       minWidth: 130 },
      { id: 'description',label: 'Descripción',  minWidth: 200 },
      { id: 'recurrence', label: 'Recurrencia',  minWidth: 130 },
      {
        id: 'daysOfWeek',
        label: 'Días',
        minWidth: 180,
        render: row => row.daysOfWeek?.join(', ') || '-',
      },
      { id: 'startTime',     label: 'Inicio',           minWidth: 100 },
      { id: 'endTime',       label: 'Fin',              minWidth: 100 },
      {
        id: 'holidayDate',
        label: 'Fecha Feriado',
        minWidth: 130,
        render: row =>
          row.holidayDate
            ? `${String(row.holidayDate.day).padStart(2, '0')}/${
                String(row.holidayDate.month).padStart(2, '0')
              }`
            : '-',
      },
      { id: 'effectiveFrom', label: 'Vigencia Desde',   minWidth: 130 },
      { id: 'effectiveTo',   label: 'Vigencia Hasta',   minWidth: 130 },
      {
        id: 'isActive',
        label: 'Activo',
        minWidth: 100,
        render: row => (row.isActive ? 'Sí' : 'No'),
      },
      {
        id: 'actions',
        label: 'Acciones',
        minWidth: 150,
        align: 'center',
        render: row => (
          <>
            <IconButton size="small" onClick={() => openView(row.id)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => openEdit(row.id)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => toggleOpeningHourStatus(row.id)}>
              {row.isActive ? (
                <ToggleOnIcon fontSize="small" color='success' />
              ) : (
                <ToggleOffIcon fontSize="small" />
              )}
            </IconButton>
          </>
        ),
      },
    ],
    [openView, openEdit, toggleOpeningHourStatus]
  )

  return (
    <div className="oh-page__container">
      <div className="oh-page__header">
        <div className="oh-page__header-content">
          <h1 className="oh-page__title">Gestión de Horarios de Atención</h1>
          <p className="oh-page__subtitle">
            Administra tus horarios regulares y feriados
          </p>
        </div>
        <div className='oh-page__btnContainer'>
          <Button variant="primary" onClick={openCreate} className='oh-page_btn'>
            Nuevo Horario
          </Button>
        </div>
      </div>

      {/* {loading &&  <div className="loader-container">
        <ThreeDot color="#3142cc" size="medium" /></div>} */}
      {error   && <p className="oh-page__error">Error: {error.message}</p>}

      <CustomTable<OpeningHourInterface>
        columns={columns}
        rows={openingHours}
        count={totalCount}
        page={page - 1}                     // Hook devuelve page 1-based
        rowsPerPage={pageSize}
        rowsPerPageOptions={[5, 10, 20, 50]}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={e => setPageSize(parseInt(e.target.value, 10))}
      />

      <OpeningHourModal
        mode={modalMode}
        isOpen={isModalOpen}
        data={selectedOpeningHour}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  )
}