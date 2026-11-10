import { useCallback, useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import EditIcon from "@mui/icons-material/Edit"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import Button from "@/Components/Common/Button"
import CustomTable from "@/Components/Common/CustomTable"
import SearchFilter from "@/Components/Common/SearchFilter"
import CallCenterGuard from "@/Components/Crm/CallCenterGuard"
import CallCenterPrecioModal from "@/Components/Crm/CallCenterPrecioModal"
import CallCenterConfirmModal from "@/Components/Crm/CallCenterConfirmModal"
import type { Column } from "@/Interfaces/Common/CustomTable"
import { selectUserFullName } from "@/Context/Slices/Auth/authSlice"
import callCenterService, {
  aPrecioTransporte,
  coincideTexto,
  type PrecioTransporte
} from "@/Services/Ecommerce/CallCenterService"
import "@/Styles/Crm/OpeningHourPage.css"
import "@/Styles/Crm/CallCenter.css"

function PreciosContent() {
  const usuario = (useSelector(selectUserFullName) || "CRM").slice(0, 10)
  const [precios, setPrecios] = useState<PrecioTransporte[]>([])
  const [loading, setLoading] = useState(false)
  const [filtro, setFiltro] = useState("")
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<PrecioTransporte | null>(null)
  const [porBaja, setPorBaja] = useState<PrecioTransporte | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const catalogo = await callCenterService.catalogo("CAT_CALL_PRECIO_TRANSPORTE")
      setPrecios(catalogo.filas.map(aPrecioTransporte))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los precios")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const darDeBaja = useCallback(async (row: PrecioTransporte) => {
    try {
      await callCenterService.guardarPrecio({
        codEmpresa: "01",
        codPrecioTrans: row.codPrecioTrans,
        descripcion: row.descripcion,
        precio: row.precio,
        regUsuario: usuario,
        tipoMov: "E"
      })
      toast.success("Precio dado de baja")
      setPorBaja(null)
      await cargar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo dar de baja")
    }
  }, [cargar, usuario])

  const guardar = async (values: { descripcion: string; precio: number }) => {
    try {
      if (editando) {
        await callCenterService.guardarPrecio({
          codEmpresa: "01",
          codPrecioTrans: editando.codPrecioTrans,
          descripcion: values.descripcion,
          precio: values.precio,
          regUsuario: usuario,
          tipoMov: "M"
        })
      } else {
        const siguiente = await callCenterService.siguienteCodigo(
          "CAT_CALL_PRECIO_TRANSPORTE",
          "CODPRECIOTRANS",
          4
        )
        const codPrecioTrans = siguiente?.codigo ?? ""
        if (!codPrecioTrans) throw new Error("No se obtuvo el código del precio")
        await callCenterService.insertarPrecio({
          codEmpresa: "01",
          codPrecioTrans,
          descripcion: values.descripcion,
          precio: values.precio
        })
      }
      toast.success(editando ? "Precio actualizado" : "Precio creado")
      setModalOpen(false)
      await cargar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el precio")
    }
  }

  const filtrados = useMemo(
    () => precios.filter((row) => coincideTexto(filtro, row.codPrecioTrans, row.descripcion)),
    [filtro, precios]
  )

  const visibles = useMemo(
    () => filtrados.slice(page * pageSize, page * pageSize + pageSize),
    [filtrados, page, pageSize]
  )

  const columns: Column<PrecioTransporte>[] = useMemo(() => [
    { id: "codPrecioTrans", label: "Código", minWidth: 90 },
    { id: "descripcion", label: "Descripción", minWidth: 220 },
    {
      id: "precio",
      label: "Precio",
      minWidth: 100,
      align: "right",
      render: (row) => `C$ ${row.precio.toFixed(2)}`
    },
    {
      id: "actions",
      label: "Acciones",
      minWidth: 110,
      align: "center",
      render: (row) => (
        <>
          <button
            type="button"
            className="cc-icon-btn"
            title="Editar"
            onClick={() => { setEditando(row); setModalOpen(true) }}
          >
            <EditIcon fontSize="small" />
          </button>
          <button
            type="button"
            className="cc-icon-btn cc-icon-btn--danger"
            title="Dar de baja"
            onClick={() => setPorBaja(row)}
          >
            <DeleteOutlineIcon fontSize="small" />
          </button>
        </>
      )
    }
  ], [])

  return (
    <div className="oh-page__container">
      <div className="oh-page__header">
        <div className="oh-page__header-content">
          <h1 className="oh-page__title">Precios de transporte</h1>
          <p className="oh-page__subtitle">
            Listas de precio que se asignan a cada barrio para cobrar el envío
          </p>
        </div>
        <div className="oh-page__btnContainer">
          <Button variant="primary" onClick={() => { setEditando(null); setModalOpen(true) }}>
            Nuevo precio
          </Button>
        </div>
      </div>

      <div className="table-contaner__search-filter__container">
        <SearchFilter value={filtro} onApply={(value) => { setFiltro(value); setPage(0) }} />
      </div>

      <CustomTable<PrecioTransporte>
        columns={columns}
        rows={visibles}
        loading={loading}
        count={filtrados.length}
        page={page}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[20, 30, 50]}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => { setPageSize(parseInt(event.target.value, 10)); setPage(0) }}
      />

      <CallCenterPrecioModal
        isOpen={modalOpen}
        data={editando}
        onClose={() => setModalOpen(false)}
        onSubmit={guardar}
      />

      <CallCenterConfirmModal
        isOpen={porBaja != null}
        title="Dar de baja precio"
        message="Este precio ya no se podrá asignar a barrios nuevos."
        detalles={[
          { label: "Código", value: porBaja?.codPrecioTrans ?? "" },
          { label: "Descripción", value: porBaja?.descripcion ?? "" },
          { label: "Precio", value: porBaja ? `C$ ${porBaja.precio.toFixed(2)}` : "" }
        ]}
        onClose={() => setPorBaja(null)}
        onConfirm={async () => { if (porBaja) await darDeBaja(porBaja) }}
      />
    </div>
  )
}

export default function CallCenterPreciosPage() {
  return (
    <CallCenterGuard title="Precios de transporte">
      <PreciosContent />
    </CallCenterGuard>
  )
}
