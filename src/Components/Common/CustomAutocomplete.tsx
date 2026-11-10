import { Autocomplete, TextField, CircularProgress } from "@mui/material";
import React, { useCallback } from "react";

export interface BaseAutocompleteOption {
  label: string;
  value: string | number;
}

interface Props<TOption extends BaseAutocompleteOption> {
  label?: string;
  placeholder?: string;
  options: TOption[];
  value: TOption | null;
  onChange: (value: TOption | null) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  hasMore?: boolean;
  loading?: boolean;
  onLoadMore?: () => void;
  disablePortal?: boolean;
}

function CustomAutocomplete<TOption extends BaseAutocompleteOption>({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  error = false,
  helperText,
  hasMore = false,
  loading = false,
  onLoadMore,
  disablePortal = true,
}: Props<TOption>) {
  const handleScroll = useCallback(
    (event: React.SyntheticEvent) => {
      if (!onLoadMore || !hasMore || loading) return;

      const listboxNode = event.currentTarget as HTMLElement;

      const nearBottom =
        listboxNode.scrollTop + listboxNode.clientHeight >=
        listboxNode.scrollHeight - 40;

      if (nearBottom) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, loading]
  );

  return (
    <Autocomplete<TOption, false, false, false>
      disablePortal={disablePortal}
      options={options}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, val) => option.value === val?.value}
      disabled={disabled}
      loading={loading}
      ListboxProps={{
        onScroll: handleScroll,
        style: { maxHeight: 250, overflow: "auto" },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          size="small"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}

                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      fullWidth
    />
  );
}

export default CustomAutocomplete;