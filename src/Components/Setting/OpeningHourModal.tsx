import React, { useState, useEffect, type FormEvent } from 'react';
import { parse, format } from 'date-fns';
import Button from '@/Components/Common/Button';
import Input from '@/Components/Common/Input';
import DatePickerField from '@/Components/Common/DatePickerField';
import TimePickerField from '@/Components/Common/TimePickerField';
import type { OpeningHourInterface } from '@/Interfaces/Setting/OpeningHour';
import "@/Styles/Setting/OpeningHourModal.css"

type OpeningHourFormValues = {
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  isHoliday: boolean;
  holidayDate: { day: number; month: number } | null;
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
  holidayDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
    holidayDate: new Date(),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  useEffect(() => {
    if ((mode === 'edit' || isView) && data) {
      setForm({
        name: data.name,
        description: data.description,
        startTime: parse(data.startTime!, 'HH:mm', new Date()),
        endTime: parse(data.endTime!, 'HH:mm', new Date()),
        isHoliday: data.isHoliday,
        isActive: data.isActive,
       holidayDate: data.holidayDate
        ? parse(
            `${String(data.holidayDate.day).padStart(2, '0')}/${String(data.holidayDate.month).padStart(2, '0')}`,
      'dd/MM',
      new Date()
    )
  : new Date(),

        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      });

    } else if (mode === 'create') {
      setForm((f) => ({
        ...f,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      startTime: form.startTime ? format(form.startTime, 'HH:mm'): '',
      endTime: form.endTime ? format(form.endTime, 'HH:mm') : '',
      isHoliday: form.isHoliday,
      holidayDate: form.holidayDate
        ? {
            day: form.holidayDate.getDate(),
            month: form.holidayDate.getMonth() + 1
          }
        : null,
        isActive: form.isActive,
      };
    
    const payloadToSend = { ...payload };
    onSubmit(payloadToSend);

    payload.name = '';
    payload.description = '';
    payload.isActive = true;
    payload.isHoliday = false;
    payload.holidayDate = null;
    payload.startTime = '';
    payload.endTime = '';
  };

  if (!isOpen) return null;

  return (
    <div className="modal__overlay" >
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
      <div className="modal__field">
            <Input
            id="name"
            name="name"
            type="text"
            placeholder="Nombre del horario"
            value={form.name}
            onChange={handleChange}
            disabled={isView}
          />
      </div>
      <div className="modal__field">

          <Input
            id="description"
            name="description"
            type="text"
            placeholder="Descripción"
            value={form.description}
            onChange={handleChange}
            disabled={isView}
          />
      </div>

       {!form.isHoliday && (
            <>
                   <div className="modal__field">
            <TimePickerField
              label="Hora de inicio"
              value={form.startTime}
              onChange={(d) => setForm((f) => ({ ...f, startTime: d }))}
               disabled={isView || form.isHoliday}
            />
          </div>

          <div className="modal__field">
            <TimePickerField
              label="Hora de fin"
              value={form.endTime}
              onChange={(d) => setForm((f) => ({ ...f, endTime: d }))}
              disabled={isView || form.isHoliday}
            />
          </div>
            </>
          )}

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

          {isView ||form.isHoliday && (
                      <>
                        <div className="modal__field">
                          <DatePickerField
                            label="Dia feriado"
                            value={form.holidayDate}
                            onChange={() => {}}
                            disabled={!form.isHoliday}
                          />
                        </div>
                      </>
                    )}

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
                  disabled={!form.isHoliday}
                />
              </div>

              <div className="modal__field">
                <DatePickerField
                  label="Actualizado en"
                  value={form.updatedAt}
                  onChange={() => {}}
                   disabled={!form.isHoliday}
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