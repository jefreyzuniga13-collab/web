import { useState } from "react";
import Button from "@/Components/Common/Button";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// +++ NUEVO: tipos para recibir el estado del hook compartido por props +++
interface FormInterface {
  validFrom: Date | null
  validTo:   Date | null
}
type HandleDate = (field: keyof FormInterface, d: Date | null) => void;
// +++ FIN NUEVO

type FilterOption = { label: string; value: string; content: string };

interface FilterOrderModalProps {
  currentOrder: string[];
  options: FilterOption[];
  onSave: (newOrder: string[]) => void;
  onClose: () => void;

  form: FormInterface;
  handleDate: HandleDate;
  applyDateFilter: () => void;
  clearFilter: () => void;
}

const FilterOrderModal: React.FC<FilterOrderModalProps> = ({
  currentOrder,
  options,
  onSave,
  onClose,
  form,
  handleDate,
  applyDateFilter,
  clearFilter,
}) => {
  const [order, setOrder] = useState<string[]>(currentOrder);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver  = (e: React.DragEvent) => e.preventDefault();
  const handleDrop      = (idx: number) => {
    if (dragIndex === null) return;
    const newOrder = [...order];
    const [moved] = newOrder.splice(dragIndex, 1);
    newOrder.splice(idx, 0, moved);
    setOrder(newOrder);
    setDragIndex(null);
  };

  const handleSave = () => {
    onSave(order);

    // +++ NUEVO: aplica el filtro de fechas en la MISMA instancia del hook que usa la lista +++
    applyDateFilter();
    onClose();
  };

  const handleClearFilter = () => {
    clearFilter();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="order-modal">
        <h3 className="order-modal-title">Ordenar filtros</h3>
        <ul className="order-list">
          {order.map((val, idx) => {
            const opt = options.find(o => o.value === val);
            if (!opt) return null;
            return (
              <li
                key={val}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                className="order-item"
              >
                ☰ {opt.content}
              </li>
            );
          })}
        </ul>

        <div className="ws-modal-dateFilter">
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Válido desde"
              value={form.validFrom}
              onChange={d => handleDate("validFrom", d)}
              format="dd/MM/yyyy"
              slotProps={{
                textField: { className: "date-picker-field", fullWidth: true, size: "medium" },
              }}
            />
          </LocalizationProvider>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Válido hasta"
              value={form.validTo}
              onChange={d => handleDate("validTo", d)}
              format="dd/MM/yyyy"
              slotProps={{
                textField: { className: "date-picker-field", fullWidth: true, size: "medium" },
              }}
            />
          </LocalizationProvider>
        </div>

        <div className="order-modal-actions">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={handleClearFilter}>Limpiar Filtros</Button>
          <Button variant="primary" onClick={handleSave}>Aplicar Filtros</Button>
        </div>
      </div>
    </div>
  );
};

export default FilterOrderModal;