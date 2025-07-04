import { useState } from "react";
import Button from "@/Components/Common/Button";

type FilterOption = { label: string; value: string; content: string };
interface FilterOrderModalProps {
  currentOrder: string[];
  options: FilterOption[];
  onSave: (newOrder: string[]) => void;
  onClose: () => void;
}

const FilterOrderModal: React.FC<FilterOrderModalProps> = ({
  currentOrder,
  options,
  onSave,
  onClose,
}) => {
  const [order, setOrder] = useState<string[]>(currentOrder);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    setDragIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (idx: number) => {
    if (dragIndex === null) return;
    const newOrder = [...order];
    const [moved] = newOrder.splice(dragIndex, 1);
    newOrder.splice(idx, 0, moved);
    setOrder(newOrder);
    setDragIndex(null);
  };

  return (
    <div className="modal-overlay">
      <div className="order-modal">
        <h3 className="order-modal-title">Ordenar filtros</h3>
        <ul className="order-list">
          {order.map((val, idx) => {
            const opt = options.find((o) => o.value === val);
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
        <div className="order-modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={() => onSave(order)}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterOrderModal;