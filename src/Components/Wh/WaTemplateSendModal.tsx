/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import Button from '@/Components/Common/Button'
import { Label } from '@/Components/Common/Label'
import Input from '@/Components/Common/Input'
import type { WaTemplateResponseDto } from '@/Interfaces/Wh/TemplateInterface'
import { Paper, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Checkbox, TablePagination, Box, Typography, Divider } from '@mui/material'
import { useWaTemplateSendModal } from '@/Hooks/Wh/useWaTemplateSendModal'

type Props = {
  isOpen: boolean
  template: WaTemplateResponseDto
  onClose: () => void
}

export default function WaTemplateSendModal({ isOpen, template, onClose }: Props) {
  const {
    schema,
    source,
    verifiedContact,
    bodyParams,
    setBodyParams,
    setSource,
    setExcelFile,
    selectedIds,
    setSelectedIds,
    handleSend,
  } = useWaTemplateSendModal({ isOpen, template, onClose }) || {}

  const [searchClient, setSearchClient] = useState('')
  const [searchClientContact, setSearchClientContact] = useState('')
  const [searchPhone, setSearchPhone] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [summaryPage, setSummaryPage] = useState(0)
  const [rowsPerSummaryPage, setRowsPerSummaryPage] = useState(10)
  const [excelPreview, setExcelPreview] = useState<Array<{ fullName: string; phone: string }>>([])

  useEffect(() => {
    setSearchClient('')
    setSearchClientContact('')
    setSearchPhone('')
    setSelectedIds && setSelectedIds([])
    setExcelPreview([])
    setPage(0)
    setSummaryPage(0)
  }, [source, setSelectedIds])

  const rows = useMemo(() => Array.isArray(verifiedContact) ? verifiedContact : [], [verifiedContact])

  const filtered = useMemo(() => {
  const sc  = searchClient.trim().toLowerCase();
  const sp  = searchPhone.trim().toLowerCase();
  const scc = searchClientContact.trim().toLowerCase();

  return rows.filter((r: any) => {
    const c  = String(r.clienteNombre ?? '').toLowerCase();
    const p  = String(r.phone ?? '').toLowerCase();
    const cc = String(r.fullName ?? '').toLowerCase();

    const phoneOk   = !sp  || p.includes(sp);
    const clientOk  = !sc  || c.includes(sc);
    const contactOk = !scc || cc.includes(scc);

    // Si se proporcionó al menos uno (cliente o contacto), basta con que uno coincida (OR).
    // Si no se proporcionó ninguno, no restringe.
    const nameBlockOk = (sc || scc) ? (clientOk || contactOk) : true;

    return phoneOk && nameBlockOk;
  });
}, [rows, searchClient, searchPhone, searchClientContact]);


  const paged = useMemo(() => {
    const start = page * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [filtered, page, rowsPerPage])

  const selectedRows = useMemo(() => {
    const ids = new Set<number>((selectedIds ?? []) as number[])
    return rows.filter((r: any) => ids.has(Number(r.id)))
  }, [rows, selectedIds])

  const summaryPaged = useMemo(() => {
    const start = summaryPage * rowsPerSummaryPage
    return selectedRows.slice(start, start + rowsPerSummaryPage)
  }, [selectedRows, summaryPage, rowsPerSummaryPage])

  const allOnPageSelected = useMemo(() => {
    const ids = new Set<number>((selectedIds ?? []) as number[])
    return paged.length > 0 && paged.every((r: any) => ids.has(Number(r.id)))
  }, [paged, selectedIds])

  const toggleRow = (id: number) => {
    if (!setSelectedIds) return
    const current = new Set<number>((selectedIds ?? []) as number[])
    if (current.has(id)) current.delete(id)
    else current.add(id)
    setSelectedIds(Array.from(current))
  }

  const toggleAllOnPage = () => {
    if (!setSelectedIds) return
    const current = new Set<number>((selectedIds ?? []) as number[])
    if (allOnPageSelected) {
      paged.forEach((r: any) => current.delete(Number(r.id)))
    } else {
      paged.forEach((r: any) => current.add(Number(r.id)))
    }
    setSelectedIds(Array.from(current))
  }

  const onChangeFile = async (file: File | null) => {
    setExcelFile && setExcelFile(file)
    if (!file) {
      setExcelPreview([])
      return
    }
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const list = XLSX.utils.sheet_to_json<any>(ws, { defval: '', raw: false })
      .map((r: any) => {
        const fullName = String(r.fullName ?? r.FullName ?? r.name ?? r.Name ?? '').trim()
        const rawPhone = String(r.phone ?? r.Phone ?? '').trim()
        const phone = rawPhone.replace(/[^\d+]/g, '')
        return { fullName: fullName || phone, phone }
      })
      .filter((x: any) => !!x.phone)
    setExcelPreview(list)
  }

  const onConfirmSend = () => {
    setConfirmOpen(false)
    handleSend && handleSend()
  }

  if (!isOpen) return null

  return (
    <div className="sp-modal__overlay max">
      <div className="sp-modal__container max-modal">
        <header className="sp-modal__header">
          <h2 className="sp-modal__title">Enviar plantilla: <span className='wat-title__data'>{template?.name}</span></h2>
         
        </header>

        <div className='wat-content-container'>
            <div className="sp-modal__body max-body" style={{ display: 'grid', gap: 12 }}>
          <div className={source == "excel" ? 'wat-header-container' : ''}>
            <div className='contact'>
            <Label>Fuente de destinatarios</Label>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant={source === 'contacts' ? 'primary' : 'secondary'} onClick={() => setSource && setSource('contacts')}>Contactos</Button>
              <Button variant={source === 'excel' ? 'primary' : 'secondary'} onClick={() => setSource && setSource('excel')}>Excel</Button>
            </div>
            </div>

            {source === 'excel' && (
              <div>
                <Label>Acciones</Label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                            <Button
                              variant="primary"
                              onClick={() => setConfirmOpen(true)}
                            >
                              Enviar
                            </Button>
                          </div>
              </div>
              )}
          </div>

          {source === 'contacts' && (
            <Box>
              <Box sx={{ display: 'grid', gap: 1 }}>
                <Label>Selecciona contactos</Label>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Input placeholder="Buscar por cliente o contacto" value={searchClient} onChange={e => {
                    setSearchClient(e.target.value)
                    setSearchClientContact(e.target.value)
                  }} />
                  <Input placeholder="Buscar por teléfono" value={searchPhone} onChange={e => setSearchPhone(e.target.value)} />
                </Box>

                <Paper sx={{ width: '100%' }}>
                  <TableContainer sx={{ maxHeight: 500 }}>
                    <Table stickyHeader size="small" aria-label="contacts-table">
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox">
                            <Checkbox
                              indeterminate={!allOnPageSelected && (selectedIds?.length ?? 0) > 0}
                              checked={allOnPageSelected}
                              onChange={toggleAllOnPage}
                            />
                          </TableCell>
                          <TableCell>Cliente</TableCell>
                          <TableCell>Contacto</TableCell>
                          <TableCell>Teléfono</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paged.map((r: any) => {
                          const id = Number(r.id)
                          const checked = Boolean((selectedIds ?? []).includes(id as never))
                          return (
                            <TableRow hover key={id}>
                              <TableCell padding="checkbox">
                                <Checkbox checked={checked} onChange={() => toggleRow(id)} />
                              </TableCell>
                              <TableCell>{r.clienteNombre ?? ''}</TableCell>
                              <TableCell>{r.fullName ?? r.waName ?? ''}</TableCell>
                              <TableCell>{r.phone ?? ''}</TableCell>
                            </TableRow>
                          )
                        })}
                        {paged.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4}><Typography variant="body2">Sin resultados</Typography></TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={filtered.length}
                    page={page}
                    onPageChange={(_, p) => setPage(p)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
                    rowsPerPageOptions={[5, 10, 25]}
                  />
                </Paper>
              </Box>
            </Box>
          )}

          {source === 'excel' && (
            <Box sx={{ display: 'grid', gap: 1 }}>
              <Label>Sube Excel con columnas "fullName" y "phone" (o al menos "phone")</Label>
              <Input type="file" accept=".xlsx" onChange={e => onChangeFile(e.target.files?.[0] || null)} />
              <Divider sx={{ my: 1 }} />
              <Label>Resumen (solo lectura)</Label>
              <Paper sx={{ width: '100%' }}>
                <TableContainer sx={{ maxHeight: 420 }}>
                  <Table stickyHeader size="small" aria-label="excel-summary">
                    <TableHead>
                      <TableRow>
                        <TableCell>Contacto</TableCell>
                        <TableCell>Teléfono</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {excelPreview.slice(0, 200).map((r, i) => (
                        <TableRow key={i}>
                          <TableCell>{r.fullName}</TableCell>
                          <TableCell>{r.phone}</TableCell>
                        </TableRow>
                      ))}
                      {excelPreview.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2}><Typography variant="body2">Sin datos</Typography></TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          )}

          {schema && schema.bodyVars > 0 && (
            <div>
              <Label>Cuerpo — completa las variables</Label>
              <div style={{ display: 'grid', gap: 8 }}>
                {Array.from({ length: schema.bodyVars }, (_, i) => (
                  <div key={i} style={{ display: 'grid', gap: 4 }}>
                    <span className="sp-modal__label">{`Valor para {{${i + 1}}}`}</span>
                    <Input
                      value={bodyParams?.[i] ?? ''}
                      onChange={e => {
                        const next = [...(bodyParams || [])]
                        next[i] = e.target.value
                        setBodyParams && setBodyParams(next)
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

         {source === 'contacts' && (


              <div className='sp-modal__body max-body'>
              <header style={{display: "flex", gap: 8, justifyContent: "flex-end"}}>
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button
                  variant="primary"
                  onClick={() => setConfirmOpen(true)}
                  disabled={
                    source === 'contacts'
                      ? !(selectedIds && selectedIds.length > 0)
                      : excelPreview.length === 0
                  }
                >
                  Enviar
                </Button>
              </header>
                  <Box sx={{ display: 'grid', gap: 1 }}>
                <Label>Resumen de selección</Label>
                <Paper sx={{ width: '100%' }}>
                  <TableContainer sx={{ maxHeight: 500 }}>
                    <Table stickyHeader size="small" aria-label="summary-table">
                      <TableHead>
                        <TableRow>
                          <TableCell>Cliente</TableCell>
                          <TableCell>Contacto</TableCell>
                          <TableCell>Teléfono</TableCell>
                          <TableCell align="right">Quitar</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {summaryPaged.map((r: any) => (
                          <TableRow key={r.id}>
                            <TableCell>{r.clienteNombre ?? ''}</TableCell>
                            <TableCell>{r.fullName ?? r.waName ?? ''}</TableCell>
                            <TableCell>{r.phone ?? ''}</TableCell>
                            <TableCell align="right">
                              <Button variant="destructive" onClick={() => toggleRow(Number(r.id))} className='wat_btn'>Quitar</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {summaryPaged.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4}><Typography variant="body2">Sin seleccionados</Typography></TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={selectedRows.length}
                    page={summaryPage}
                    onPageChange={(_, p) => setSummaryPage(p)}
                    rowsPerPage={rowsPerSummaryPage}
                    onRowsPerPageChange={(e) => { setRowsPerSummaryPage(parseInt(e.target.value, 10)); setSummaryPage(0) }}
                    rowsPerPageOptions={[5, 10, 25]}
                  />
                </Paper>
                <Typography variant="body2">Seleccionados: {selectedIds?.length ?? 0}</Typography>
              </Box>
              </div>
              
         )}
        </div>
      </div>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Confirmar envío</DialogTitle>
        <DialogContent dividers>
          <div style={{ display: 'grid', gap: 12 }}>
            <div><strong>Plantilla:</strong> {template?.name}</div>
            <div><strong>Destino:</strong> {source === 'contacts' ? 'Contactos seleccionados' : 'Archivo Excel'}</div>
            {source === 'contacts' && (
              <div>
                <strong>Total seleccionados:</strong> {selectedIds?.length || 0}
                <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                  {selectedRows.slice(0, 5).map((r: any) => (
                    <li key={r.id}>{`${r.clienteNombre ?? ''} — ${r.fullName ?? r.waName ?? ''} — ${r.phone ?? ''}`}</li>
                  ))}
                  {(selectedIds?.length || 0) > 5 && <li>...</li>}
                </ul>
              </div>
            )}
            {source === 'excel' && (
              <div>
                <strong>Total en Excel:</strong> {excelPreview.length}
                <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                  {excelPreview.slice(0, 5).map((r, i) => (
                    <li key={i}>{`${r.fullName} — ${r.phone}`}</li>
                  ))}
                  {excelPreview.length > 5 && <li>...</li>}
                </ul>
              </div>
            )}
            {schema && schema.bodyVars > 0 && (
              <div>
                <strong>Cuerpo:</strong>
                <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                  {Array.from({ length: schema.bodyVars }, (_, i) => (
                    <li key={i}>{`{{${i + 1}}} = ${bodyParams?.[i] ?? ''}`}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button variant="primary" onClick={onConfirmSend}>Confirmar y enviar</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
