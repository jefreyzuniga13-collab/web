import React, { useState, useEffect, type FormEvent } from 'react';
import { parse, format } from 'date-fns';
import Button from '@/Components/Common/Button';
import Input from '@/Components/Common/Input';
import DatePickerField from '@/Components/Common/DatePickerField';
import TimePickerField from '@/Components/Common/TimePickerField';
import type { OpeningHourInterface } from '@/Interfaces/Setting/OpeningHour';

type OpeningHourFormValues = {
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  isHoliday: boolean;
  isActive: boolean;
};

interface OpeningHourModalProps {
  mode: 'create' | 'edit' | 'view';
  isOpen: boolean;
  data?: OpeningHourInterface;
  onClose: () => void;
  onSubmit: (values: OpeningHourFormValues) => void;
}

type FormState = {
  name: string;
  description: string;
  startTime: Date | null;
  endTime: Date | null;
  isHoliday: boolean;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export default function OpeningHourModal({
  mode,
  isOpen,
  data,
  onClose,
  onSubmit,
}: OpeningHourModalProps) {
  const isView = mode === 'view';
  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    startTime: null,
    endTime: null,
    isHoliday: false,
    isActive: true,
    createdAt: null,
    updatedAt: null,
  });

  useEffect(() => {
    if ((mode === 'edit' || isView) && data) {
      setForm({
        name: data.name,
        description: data.description,
        startTime: parse(data.startTime, 'HH:mm', new Date()),
        endTime: parse(data.endTime, 'HH:mm', new Date()),
        isHoliday: data.isHoliday,
        isActive: data.isActive,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      });
    } else if (mode === 'create') {
      setForm((f) => ({
        ...f,
        createdAt: null,
        updatedAt: null,
      }));
    }
  }, [mode, data, isView]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload: OpeningHourFormValues = {
      name: form.name,
      description: form.description,
      startTime: form.startTime ? format(form.startTime, 'HH:mm') : '',
      endTime: form.endTime ? format(form.endTime, 'HH:mm') : '',
      isHoliday: form.isHoliday,
      isActive: form.isActive,
    };
    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className={`modal modal--${mode}`}>
      <div className="modal__overlay" onClick={onClose} />
      <div className="modal__container">
        <header className="modal__header">
          <h2 className="modal__title">
            {mode === 'create' && 'Crear Horario'}
            {mode === 'edit' && 'Editar Horario'}
            {mode === 'view' && 'Detalle Horario'}
          </h2>
          <button type="button" className="modal__close" onClick={onClose}>
            ×
          </button>
        </header>

        <form className="modal__body" onSubmit={handleSubmit}>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Nombre del horario"
            value={form.name}
            onChange={handleChange}
            disabled={isView}
          />

          <Input
            id="description"
            name="description"
            type="text"
            placeholder="Descripción"
            value={form.description}
            onChange={handleChange}
            disabled={isView}
          />

          <div className="modal__field">
            <TimePickerField
              label="Hora de inicio"
              value={form.startTime}
              onChange={(d) => setForm((f) => ({ ...f, startTime: d }))}
              disabled={isView}
            />
          </div>

          <div className="modal__field">
            <TimePickerField
              label="Hora de fin"
              value={form.endTime}
              onChange={(d) => setForm((f) => ({ ...f, endTime: d }))}
              disabled={isView}
            />
          </div>

          <div className="modal__field modal__field--checkbox">
            <label>
              <input
                type="checkbox"
                name="isHoliday"
                checked={form.isHoliday}
                onChange={handleChange}
                disabled={isView}
              />
              Feriado
            </label>
          </div>

          <div className="modal__field modal__field--checkbox">
            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                disabled={isView}
              />
              Activo
            </label>
          </div>

          {isView && (
            <>
              <div className="modal__field">
                <DatePickerField
                  label="Creado en"
                  value={form.createdAt}
                  onChange={() => {}}
                  disabled
                />
              </div>
              <div className="modal__field">
                <DatePickerField
                  label="Actualizado en"
                  value={form.updatedAt}
                  onChange={() => {}}
                  disabled
                />
              </div>
            </>
          )}
        </form>

        <footer className="modal__footer">
          <Button
            variant="secondary"
            onClick={onClose}
            className="modal__btn modal__btn--cancel"
          >
            Cancelar
          </Button>

          {!isView && (
            <Button
              variant="primary"
              type="submit"
              onClick={handleSubmit}
              className="modal__btn modal__btn--confirm"
            >
              {mode === 'create' ? 'Crear' : 'Guardar'}
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}