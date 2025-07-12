/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useEffect } from 'react';
import {
  Box,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Autocomplete,
  TextField
} from '@mui/material';
import '@/Styles/Dashboard/ListComponent.css';

export interface Column<T> {
  field: keyof T;
  headerName: string;
  render?: (row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  filterField?: keyof T;
  filterLabel?: string;
  threshold?: number;
  onThresholdChange?: (value: number) => void;
  page: number;
  pageSize: number;
  totalCount: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  maxHeight?: number;
}

export function ListComponent<T extends Record<string, any>>({
  rows,
  columns,
  filterField,
  filterLabel = 'Filtrar',
  threshold,
  onThresholdChange,
  page,
  pageSize,
  totalCount,
  setPage,
  setPageSize,
  maxHeight = 500
}: DataTableProps<T>) {
  const [filterValue, setFilterValue] = React.useState<string | null>(null);

  const filterOptions = useMemo(() => {
    if (!filterField) return [];
    return Array.from(new Set(rows.map(r => `${r[filterField] ?? ''}`)));
  }, [rows, filterField]);

  const filtered = useMemo(() => {
    if (!filterField || !filterValue) return rows;
    return rows.filter(r => `${r[filterField]}` === filterValue);
  }, [rows, filterField, filterValue]);

  useEffect(() => {
    setPage(1);
  }, [filterValue, pageSize, setPage]);

  return (
    <Box sx={{ p: 2 }}>
      {filterField && (
        <Autocomplete
          size="small"
          options={filterOptions}
          value={filterValue}
          onChange={(_, v) => setFilterValue(v)}
          renderInput={params => (
            <TextField
              {...params}
              placeholder={filterLabel}
              InputProps={{
                ...params.InputProps,
                sx: { fontSize: '1.2rem' }
              }}
              sx={{
                mb: 2,
                width: 300,
                '& .MuiInputBase-input::placeholder': {
                  fontSize: '1.2rem'
                }
              }}
            />
          )}
          clearOnEscape
        />
      )}

      {threshold !== undefined && onThresholdChange && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <label style={{ fontSize: 12 }}>
            Minutos mínimos:{' '}
            <input
              type="number"
              value={threshold}
              min={1}
              onChange={e => onThresholdChange(Number(e.target.value))}
              style={{ width: 60, marginLeft: 8 }}
            />
          </label>
        </Box>
      )}

      <TableContainer component={Paper} sx={{ maxHeight, borderRadius: 2 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map(col => (
                <TableCell key={String(col.field)}>
                  <strong>{col.headerName}</strong>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((row, idx) => (
                <TableRow
                  key={idx}
                  hover
                  sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}
                >
                  {columns.map(col => (
                    <TableCell key={String(col.field)} sx={{ fontSize: 12, py: 1 }}>
                      {col.render
                        ? col.render(row)
                        : `${row[col.field] ?? '-'}`}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  No hay datos para mostrar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalCount}
        page={page - 1}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={e => {
          setPageSize(parseInt(e.target.value, 10));
          setPage(1);
        }}
        rowsPerPageOptions={[3, 5, 10]}
        labelRowsPerPage="Filas"
        sx={{ mt: 2, fontSize: 12 }}
      />
    </Box>
  );
}