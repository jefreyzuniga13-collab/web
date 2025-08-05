import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
} from '@mui/material'
import { useState, useMemo } from 'react'
import type { Props } from '@/Interfaces/Common/CustomTable'
import '@/Styles/Common/CustomTable.css'

export default function CustomTable<T>({
  columns,
  rows,
  count,
  page,
  rowsPerPage,
  rowsPerPageOptions = [5, 10, 15, 20],
  onPageChange,
  onRowsPerPageChange,
}: Props<T>) {
  const [filter, setFilter] = useState('')

  const visibleRows = useMemo(() => {
    if (!filter.trim()) return rows

    return rows.filter(row =>
      columns.some(col => {
        const value = col.render
          ? String(col.render(row))
          : String(row[col.id as keyof T] ?? '')
        return value.toLowerCase().includes(filter.toLowerCase())
      })
    )
  }, [filter, rows, columns])

  return (
    <Paper className="table__container">

      <div className='table-contaner__search-filter__container'>
        <TextField
          label="Filtrar"
          variant="outlined"
          size="small"
          fullWidth
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className='table-contaner__search-filter'
        />
      </div>

      <TableContainer className="table__scroll-container">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map(col => (
                <TableCell
                  key={col.id}
                  align={col.align}
                  className="table__cell--header"
                  style={{ minWidth: col.minWidth }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.map((row, rowIndex) => (
              <TableRow hover key={rowIndex}>
                {columns.map(col => {
                  if (col.render) {
                    return (
                      <TableCell
                        key={col.id}
                        align={col.align}
                        className="table__cell--body"
                      >
                        {col.render(row)}
                      </TableCell>
                    )
                  }
                  const value = row[col.id as keyof T]
                  return (
                    <TableCell
                      key={col.id}
                      align={col.align}
                      className="table__cell--body"
                    >
                      {typeof value === 'boolean' ? (
                        <span
                          className={
                            value
                              ? 'status status--active'
                              : 'status status--inactive'
                          }
                        >
                          {value ? 'Sí' : 'No'}
                        </span>
                      ) : col.format && typeof value === 'number' ? (
                        col.format(value)
                      ) : (
                        String(value ?? '')
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        className="table__pagination"
        component="div"
        count={count}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={rowsPerPageOptions}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
      />
    </Paper>
  )
}