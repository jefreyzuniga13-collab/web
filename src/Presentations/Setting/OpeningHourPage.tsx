/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react';
import CustomTable from '@/Components/Common/CustomTable';
import { useOpeningHour } from '@/Hooks/Setting/useOpeningHour';
import type { Column, OpeningHourInterface } from '@/Interfaces/Setting/OpeningHour';
import '@/Styles/Setting/OpeningHourPage.css'
import Button from "@/Components/Common/Button";

const columns: Column<OpeningHourInterface>[] = [
  // { id: 'id', label: 'ID', minWidth: 70 },
  { id: 'name', label: 'Nombre', minWidth: 170 },
  { id: 'description', label: 'Descripción', minWidth: 200 },
  { id: 'isHoliday', label: 'Feriado', minWidth: 100, align: 'right' },
  { id: 'startTime', label: 'Hora de inicio', minWidth: 120, align: 'right' },
  { id: 'endTime', label: 'Hora de fin', minWidth: 120, align: 'right' },
  { id: 'isActive', label: 'Activo', minWidth: 100, align: 'right' }
];

const OpeningHour = () => {
  const { openingHours, loading, error, getOpeningHours } = useOpeningHour();

  useEffect(() => {
    getOpeningHours();
  }, []);

  return (
    <div className='openingHour-container'>

      <div className="openingHour-top">
       <div className='OpeningHour-header'>
           <h1 className="openingHour-title">Gestión de horario de atención</h1>
            <h3 className="openingHour-subtitle">
              Administración de los horarios de atención en días normales y feriados de PC Group S.A.
            </h3>
       </div>
       
      <Button
          variant="primary"
          type="button"
          className="openingHour-btn"
          children="Crear Horario"
          />
      </div>

      {loading && <p>Cargando horarios...</p>}
      {error && <p className="text-red-600">Error: {error.message}</p>}

      {/* <CustomTable columns={columns} rows={openingHours} /> */}
      <CustomTable<OpeningHourInterface> columns={columns} rows={openingHours} />

    </div>
  );
};

export default OpeningHour;