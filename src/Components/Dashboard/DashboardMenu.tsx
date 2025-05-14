
import React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';

interface DashboardMenuProps {
  from: Date;
  to: Date;
  onDateChange: (from: Date, to: Date) => void;
  onRefresh: () => void;
}

const DashboardMenu: React.FC<DashboardMenuProps> = ({ from, to, onDateChange, onRefresh }) => {
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFromDate = new Date(e.target.value);
    onDateChange(newFromDate, to);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToDate = new Date(e.target.value);
    onDateChange(from, newToDate);
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const setQuickDateRange = (days: number) => {
    const newTo = new Date();
    const newFrom = new Date();
    newFrom.setDate(newFrom.getDate() - days);
    onDateChange(newFrom, newTo);
  };

  return (
    <div className="dashboard-menu">
      <h3>Filtros</h3>
      
      <div className="date-range">
        <Calendar size={16} />
        <span className="date-range-label">Rango de Fechas</span>
      </div>
      
      <div className="form-group" style={{ marginBottom: '15px' }}>
        <label htmlFor="from-date" style={{ marginBottom: '5px', display: 'block' }}>Desde:</label>
        <input 
          type="date" 
          id="from-date" 
          className="date-picker" 
          style={{ width: '100%' }}
          value={formatDateForInput(from)} 
          onChange={handleFromChange} 
        />
      </div>
      
      <div className="form-group" style={{ marginBottom: '15px' }}>
        <label htmlFor="to-date" style={{ marginBottom: '5px', display: 'block' }}>Hasta:</label>
        <input 
          type="date" 
          id="to-date" 
          className="date-picker" 
          style={{ width: '100%' }}
          value={formatDateForInput(to)} 
          onChange={handleToChange} 
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ marginBottom: '10px', fontWeight: 500 }}>Períodos rápidos:</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          <button 
            onClick={() => setQuickDateRange(7)} 
            style={{ 
              padding: '5px 10px', 
              borderRadius: '4px', 
              border: '1px solid #ced4da',
              background: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Últimos 7 días
          </button>
          <button 
            onClick={() => setQuickDateRange(30)} 
            style={{ 
              padding: '5px 10px', 
              borderRadius: '4px', 
              border: '1px solid #ced4da',
              background: 'white',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Últimos 30 días
          </button>
        </div>
      </div>
      
      <button 
        onClick={onRefresh} 
        style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
          padding: '8px 15px', 
          borderRadius: '4px', 
          background: '#0d6efd',
          color: 'white',
          border: 'none',
          width: '100%',
          cursor: 'pointer'
        }}
      >
        <RefreshCw size={14} />
        Actualizar Datos
      </button>
    </div>
  );
};

export default DashboardMenu;