/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TextField, IconButton, Menu, MenuItem, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, FormGroup, FormControlLabel, Checkbox
} from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { useMemo, useState } from 'react'
import type { Props } from '@/Interfaces/Common/CustomTable'
import '@/Styles/Common/CustomTable.css'

type Order = 'asc' | 'desc'

export default function CustomTable<T>({
  columns,
  rows,
  count,
  page,
  rowsPerPage,
  rowsPerPageOptions = [5, 10],
  onPageChange,
  onRowsPerPageChange,
}: Props<T>) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [orderBy, setOrderBy] = useState<string | null>(null)
  const [order, setOrder] = useState<Order>('asc')
  const [colFilters, setColFilters] = useState<Record<string, string>>({})
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(
    () => Object.fromEntries(columns.map(c => [c.id as string, true]))
  )
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [menuColId, setMenuColId] = useState<string | null>(null)
  const [openManage, setOpenManage] = useState(false)

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, colId: string) => {
    setMenuAnchor(e.currentTarget)
    setMenuColId(colId)
  }
  const closeMenu = () => {
    setMenuAnchor(null)
    setMenuColId(null)
  }

  const setFilterForCol = (colId: string, value: string) => {
    setColFilters(prev => ({ ...prev, [colId]: value }))
  }

  const toggleColVisibility = (colId: string, value?: boolean) => {
    setVisibleCols(prev => ({ ...prev, [colId]: value ?? !prev[colId] }))
  }

  const comparator = (a: T, b: T) => {
    if (!orderBy) return 0
    const col = columns.find(c => String(c.id) === orderBy)!
    const va = col.render ? String(col.render(a)) : (a as any)[orderBy]
    const vb = col.render ? String(col.render(b)) : (b as any)[orderBy]
    const A = va ?? ''
    const B = vb ?? ''
    if (A < B) return order === 'asc' ? -1 : 1
    if (A > B) return order === 'asc' ? 1 : -1
    return 0
  }

  const filteredAndSortedRows = useMemo(() => {
    let result = rows.filter(row => {
      if (!globalFilter.trim()) return true
      return columns.some(col => {
        const value = col.render ? String(col.render(row)) : String((row as any)[col.id] ?? '')
        return value.toLowerCase().includes(globalFilter.toLowerCase())
      })
    })

    result = result.filter(row =>
      Object.entries(colFilters).every(([colId, val]) => {
        if (!val?.trim()) return true
        const col = columns.find(c => String(c.id) === colId)!
        const raw = col.render ? String(col.render(row)) : String((row as any)[col.id] ?? '')
        return raw.toLowerCase().includes(val.toLowerCase())
      })
    )

    return orderBy ? [...result].sort(comparator) : result
  }, [rows, columns, globalFilter, colFilters, orderBy, order])

  return (
    <Paper className="table__container">
      <div className='table-contaner__search-filter__container'>
        <TextField
          label="Filtrar"
          variant="outlined"
          size="small"
          fullWidth
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className='table-contaner__search-filter'
        />
      </div>

      <TableContainer className="table__scroll-container">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map(col => {
                const id = String(col.id)
                if (!visibleCols[id]) return null
                return (
                  <TableCell
                    key={id}
                    align={col.align}
                    className="table__cell--header"
                    style={{ minWidth: col.minWidth }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{col.label}</span>
                      <IconButton
                        size="small"
                        onClick={(e) => openMenu(e, id)}
                        sx={{ color: 'common.white' }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </div>
                  </TableCell>
                )
              })}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredAndSortedRows.map((row, rowIndex) => (
              <TableRow hover key={rowIndex}>
                {columns.map(col => {
                  const id = String(col.id)
                  if (!visibleCols[id]) return null
                  if (col.render) {
                    return (
                      <TableCell key={id} align={col.align} className="table__cell--body">
                        {col.render(row)}
                      </TableCell>
                    )
                  }
                  const value = (row as any)[id]
                  return (
                    <TableCell key={id} align={col.align} className="table__cell--body">
                      {typeof value === 'boolean' ? (
                        <span className={value ? 'status status--active' : 'status status--inactive'}>
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

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            bgcolor: 'white',
            color: 'text.primary',
            fontSize: { xs: '0.95rem', sm: '1rem' },
            width: { xs: 260, sm: 320 },
            p: 1,
            borderRadius: 2
          }
        }}
      >
        <MenuItem onClick={() => { setOrderBy(menuColId); setOrder('asc'); closeMenu() }}>
          Sort by ASC
        </MenuItem>
        <MenuItem onClick={() => { setOrderBy(menuColId); setOrder('desc'); closeMenu() }}>
          Sort by DESC
        </MenuItem>

        <Divider />

        <div style={{ padding: '8px 16px', width: '100%' }}>
          <TextField
            label="Filtrar"
            size="small"
            fullWidth
            value={menuColId ? (colFilters[menuColId] ?? '') : ''}
            onChange={(e) => menuColId && setFilterForCol(menuColId, e.target.value)}
            sx={{
              '& .MuiInputBase-root': {
                fontSize: { xs: '0.95rem', sm: '1rem' },
                bgcolor: 'white'
              },
              '& .MuiFormLabel-root': { fontSize: { xs: '0.95rem', sm: '1rem' } }
            }}
          />
        </div>

        <Divider />

        <MenuItem
          onClick={() => {
            if (menuColId) toggleColVisibility(menuColId, false)
            closeMenu()
          }}
        >
          Hide column
        </MenuItem>

        <MenuItem onClick={() => { setOpenManage(true); closeMenu() }}>
          Manage columns
        </MenuItem>
      </Menu>

      <Dialog open={openManage} onClose={() => setOpenManage(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Manage columns</DialogTitle>
        <DialogContent dividers>
          <FormGroup>
            {columns.map(c => {
              const id = String(c.id)
              return (
                <FormControlLabel
                  key={id}
                  control={
                    <Checkbox
                      checked={!!visibleCols[id]}
                      onChange={(e) => toggleColVisibility(id, e.target.checked)}
                    />
                  }
                  label={String(c.label)}
                />
              )
            })}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenManage(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}