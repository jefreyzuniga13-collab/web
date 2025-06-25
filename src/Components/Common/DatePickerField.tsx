import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import '@/Styles/Common/DateTimePicker.css';

interface DatePickerFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
  className?: string;
}

export default function DatePickerField({
  label,
  value,
  onChange,
  disabled = false,
  className = '',
}: DatePickerFieldProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        label={label}
        value={value}
        disabled={disabled}
        onChange={(newValue: Date | null) => onChange(newValue)}
        format='dd/MM/yyyy'
        slotProps={{
          textField: {
            className: `date-picker-field ${className}`,
            fullWidth: true,
          },
        }}
      />
    </LocalizationProvider>
  );
}