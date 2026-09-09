import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import '@/Styles/Common/DateTimePicker.css';
import type { Dayjs } from 'dayjs';

interface TimePickerFieldProps {
  label: string;
  value: Date | null;
  onChange: (time: Date | null) => void;
  disabled?: boolean;
  className?: string;
  error?: string;
}

// Helper: convierte Dayjs o Date a Date
const pickerValueToDate = (value: Date | Dayjs | null): Date | null => {
  if (!value) return null;
  return value instanceof Date ? value : (value as Dayjs).toDate();
};

export default function TimePickerField({
  label,
  value,
  onChange,
  disabled = false,
  className = '',
  error,
}: TimePickerFieldProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <TimePicker
        label={label}
        sx={{ width: '100%' }}
        value={value}
        disabled={disabled}
        onChange={(newValue) => {
          const asDate = pickerValueToDate(newValue as Date | Dayjs | null);
          onChange(asDate);
        }}
        slotProps={{
          textField: {
            className: `time-picker-field ${className}`,
            size: 'small',
            fullWidth: true,
            error: Boolean(error),
            helperText: error,
          },
        }}
      />
    </LocalizationProvider>
  );
}