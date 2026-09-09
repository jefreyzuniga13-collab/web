/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TextField, IconButton, Menu, MenuItem, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, FormGroup, FormControlLabel, Checkbox
} from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { useEffect, useMemo, useState } from 'react'
import type { ColumnBreakpoint, Props } from '@/Interfaces/Common/CustomTable'
import '@/Styles/Common/CustomTable.css'


type Order = 'asc' | 'desc'

const BREAKPOINTS: Record<ColumnBreakpoint, number> = {
  sm: 768,
  md: 1024,
  lg: 1280,
}

const useViewportWidth = () => {
  const [width, setWidth] = useState(() =>
    typeof window === 'undefined' ? 1440 : window.innerWidth
  )

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return width
}

export default function CustomTable<T>({
  columns,
  rows,
  count,
  page,
  rowsPerPage,
  rowsPerPageOptions = [20, 30, 50],
  loading = false,
  onPageChange,
  onRowsPerPageChange,
}: Props<T>) {

  const [orderBy, setOrderBy] = useState<string | null>(null)
  const [order, setOrder] = useState<Order>('asc')
  const [colFilters, setColFilters] = useState<Record<string, string>>({})
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(
    () => Object.fromEntries(columns.map(c => [c.id as string, true]))
  )
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [menuColId, setMenuColId] = useState<string | null>(null)
  const [openManage, setOpenManage] = useState(false)
  const viewportWidth = useViewportWidth()

  const responsiveColumns = useMemo(() => {
    return columns.filter((col, index) => {
      const id = String(col.id)

      if (id === 'actions') return true
      if (col.hideBelow && viewportWidth < BREAKPOINTS[col.hideBelow]) {
        return false
      }

      if (!col.hideBelow) {
        if (viewportWidth < BREAKPOINTS.sm && index >= 3) return false
        if (viewportWidth < BREAKPOINTS.md && index >= 5) return false
      }

      return true
    })
  }, [columns, viewportWidth])

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
      // if (!globalFilter.trim()) return true
      return columns.some(col => {
        const value = col.render ? String(col.render(row)) : String((row as any)[col.id] ?? '')
        return value.toLowerCase();
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
  }, [rows, columns, colFilters, orderBy, order])

  const visibleResponsiveColumns = useMemo(
    () => responsiveColumns.filter(col => visibleCols[String(col.id)]),
    [responsiveColumns, visibleCols]
  )

  const skeletonRowCount = Math.min(Math.max(rowsPerPage, 8), 12)

  return (
    <Paper className="table__container">

      <TableContainer className="table__scroll-container">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {responsiveColumns.map(col => {
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
            {loading
              ? Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
                  <TableRow key={`skeleton-${rowIndex}`} className="table__row--skeleton">
                    {visibleResponsiveColumns.map((col, colIndex) => (
                      <TableCell
                        key={String(col.id)}
                        align={col.align}
                        className="table__cell--body table__cell--skeleton"
                      >
                        <span
                          className={`table__skeleton-bar table__skeleton-bar--${(colIndex % 3) + 1}`}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : filteredAndSortedRows.map((row, rowIndex) => (
              <TableRow hover key={rowIndex}>
                {responsiveColumns.map(col => {
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
        showFirstButton
        showLastButton
        labelRowsPerPage="Filas por página"
        labelDisplayedRows={({ from, to, count: total }) =>
          `${from}–${to} de ${total !== -1 ? total : `más de ${to}`}`
        }
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
          Ordenar ASC
        </MenuItem>
        <MenuItem onClick={() => { setOrderBy(menuColId); setOrder('desc'); closeMenu() }}>
          Ordenar DESC
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
                bgcolor: 'white',
                padding: 0,
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
          Ocultar Columna
        </MenuItem>

        <MenuItem onClick={() => { setOpenManage(true); closeMenu() }}>
          Mostrar Columna
        </MenuItem>
      </Menu>

      <Dialog open={openManage} onClose={() => setOpenManage(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Administrar Columnas</DialogTitle>
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
          <Button onClick={() => setOpenManage(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}