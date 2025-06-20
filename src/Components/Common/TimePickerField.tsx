import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import '@/Styles/Common/TimePickerField.css';

interface TimePickerFieldProps {
  label: string;
  value: Date | null;
  onChange: (time: Date | null) => void;
  disabled?: boolean;
  className?: string;
}

export default function TimePickerField({
  label,
  value,
  onChange,
  disabled = false,
  className = '',
}: TimePickerFieldProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <TimePicker
        label={label}
        value={value}
        disabled={disabled}
        onChange={(newValue: Date | null) => onChange(newValue)}
        slotProps={{
          textField: {
            className: `time-picker-field ${className}`,
            fullWidth: true,
          },
        }}
      />
    </LocalizationProvider>
  );
}