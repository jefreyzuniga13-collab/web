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
        format="dd/MM/yyyy"
        slotProps={{
          textField: {
            className: `date-picker-field ${className}`,
            fullWidth: true,
            sx: {
              "& .MuiInputBase-root": {
                height: 36,
                fontSize: "0.85rem",
                padding: "0 6px",
              },
              "& input": {
                padding: "0 8px",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderRadius: "6px",
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
}