import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import "@/Styles/Common/DateTimePicker.css";
import type { Dayjs } from "dayjs";

interface DatePickerFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
  className?: string;
  shouldDisableDate?: (date: Date) => boolean;
  error?: string;
  format?: string;
}

const pickerValueToDate = (value: Date | Dayjs | null): Date | null => {
  if (!value) return null;
  return value instanceof Date ? value : (value as Dayjs).toDate();
};

export default function DatePickerField({
  label,
  value,
  onChange,
  disabled = false,
  className = "",
  shouldDisableDate,
  error,
  format = "dd/MM/yyyy",
}: DatePickerFieldProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        label={label}
        value={value}
        disabled={disabled}
        onChange={(newValue) => {
          const asDate = pickerValueToDate(newValue as Date | Dayjs | null);
          onChange(asDate);
        }}
        format={format}
        shouldDisableDate={
          shouldDisableDate
            ? (day) => shouldDisableDate(pickerValueToDate(day as Date | Dayjs | null) ?? new Date())
            : undefined
        }
        slotProps={{
          textField: {
            className: `date-picker-field ${className}`,
            size: "small",
            fullWidth: true,
            error: Boolean(error),
            helperText: error,
          },
        }}
      />
    </LocalizationProvider>
  );
}