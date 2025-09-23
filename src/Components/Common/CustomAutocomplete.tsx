import { Autocomplete, TextField } from '@mui/material'
import React from 'react'

interface Option {
  label: string
  value: string | number
}

interface Props {
  label?: string
  placeholder?: string
  options: Option[]
  value: Option | null
  onChange: (value: Option | null) => void
  disabled?: boolean
  error?: boolean
  helperText?: string
}

const CustomAutocomplete: React.FC<Props> = ({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  error = false,
  helperText,
}) => {
  return (
    <Autocomplete
      disablePortal
      options={options}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, val) => option.value === val?.value}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          size="small"
        />
      )}
      fullWidth
    />
  )
}

export default CustomAutocomplete;