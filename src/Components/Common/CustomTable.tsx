import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material'
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
  return (
    <Paper className="table__container">
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
            {rows.map((row, rowIndex) => (
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