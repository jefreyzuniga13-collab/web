/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Pagination from '@mui/material/Pagination'
import Stack from '@mui/material/Stack'
import type { WorkOrderResponseDto } from '@/Interfaces/Crm/WorkOrderInterface'

type Props = {
  rows: WorkOrderResponseDto[]
  page: number
  pageSize: number
  total: number
  onPageChange: (p: number) => void
  onToggle: (id: number) => void
  onOpen: (id: number) => void
}

const WorkOrderTable: React.FC<Props> = ({ rows, page, pageSize, total, onPageChange, onToggle, onOpen }) => {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <Stack spacing={2}>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Dirección</TableCell>
              <TableCell>Entrada</TableCell>
              <TableCell>Salida</TableCell>
              <TableCell>Creado por</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id} hover>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.clientName}</TableCell>
                <TableCell>{r.address}</TableCell>
                <TableCell>{String(r.signInSheet)}</TableCell>
                <TableCell>{String((r as any).signOutsheet ?? r.signOutsheet ?? r.signOutsheet)}</TableCell>
                <TableCell>{r.createdByName}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => onOpen(r.id)}>Abrir</Button>
                  <Button size="small" onClick={() => onToggle(r.id)}>Estado</Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">Sin resultados</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Pagination count={pages} page={page} onChange={(_, p) => onPageChange(p)} />
    </Stack>
  )
}

export default WorkOrderTable
