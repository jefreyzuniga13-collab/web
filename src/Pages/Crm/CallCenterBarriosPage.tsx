import { useCallback, useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import EditIcon from "@mui/icons-material/Edit"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import Button from "@/Components/Common/Button"
import CustomTable from "@/Components/Common/CustomTable"
import SearchFilter from "@/Components/Common/SearchFilter"
import CallCenterGuard from "@/Components/Crm/CallCenterGuard"
import CallCenterBarrioModal, { type BarrioFormValues } from "@/Components/Crm/CallCenterBarrioModal"
import CallCenterConfirmModal from "@/Components/Crm/CallCenterConfirmModal"
import type { Column } from "@/Interfaces/Common/CustomTable"
import { selectUserFullName } from "@/Context/Slices/Auth/authSlice"
import callCenterService, {
  aBarrio,
  aPrecioTransporte,
  coincideTexto,
  type BarrioCall,
  type PrecioTransporte,
  type SucursalCall
} from "@/Services/Ecommerce/CallCenterService"
import "@/Styles/Crm/OpeningHourPage.css"
import "@/Styles/Crm/CallCenter.css"

function BarriosContent() {
  const usuario = (useSelector(selectUserFullName) || "CRM").slice(0, 10)
  const [barrios, setBarrios] = useState<BarrioCall[]>([])
  const [precios, setPrecios] = useState<PrecioTransporte[]>([])
  const [sucursales, setSucursales] = useState<SucursalCall[]>([])
  const [loading, setLoading] = useState(false)
  const [filtro, setFiltro] = useState("")
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<BarrioCall | null>(null)
  const [porBaja, setPorBaja] = useState<BarrioCall | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [barrioCat, precioCat, sucursalLista] = await Promise.all([
        callCenterService.catalogo("CAT_CALL_BARRIO"),
        callCenterService.catalogo("CAT_CALL_PRECIO_TRANSPORTE"),
        callCenterService.sucursales()
      ])
      setBarrios(barrioCat.filas.map(aBarrio))
      setPrecios(precioCat.filas.map(aPrecioTransporte))
      setSucursales(sucursalLista ?? [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los barrios")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const darDeBaja = useCallback(async (row: BarrioCall) => {
    try {
      await callCenterService.guardarZona({
        codEmpresa: row.codEmpresa || "01",
        codSucursal: row.codSucursal,
        codBarrio: row.codBarrio,
        codPrecioTrans: row.codPrecioTrans,
        descripcion: row.descripcion,
        atender: row.atender,
        horaMaxima: row.horaMaxima || "18:00",
        regUsuario: usuario,
        opt: "D"
      })
      toast.success("Barrio dado de baja")
      setPorBaja(null)
      await cargar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo dar de baja")
    }
  }, [cargar, usuario])

  const guardar = async (values: BarrioFormValues) => {
    try {
      let codBarrio = editando?.codBarrio ?? ""
      if (!editando) {
        const siguiente = await callCenterService.siguienteCodigo("CAT_CALL_BARRIO", "CODBARRIO", 6)
        codBarrio = siguiente?.codigo ?? ""
        if (!codBarrio) throw new Error("No se obtuvo el código del barrio")
      }

      await callCenterService.guardarZona({
        codEmpresa: values.codEmpresa || "01",
        codSucursal: values.codSucursal,
        codBarrio,
        codPrecioTrans: values.codPrecioTrans,
        descripcion: values.descripcion,
        atender: values.atender,
        horaMaxima: values.horaMaxima || "18:00",
        regUsuario: usuario,
        opt: editando ? "U" : "I"
      })
      toast.success(editando ? "Barrio actualizado" : "Barrio creado")
      setModalOpen(false)
      await cargar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el barrio")
    }
  }

  const filtrados = useMemo(
    () => barrios.filter((row) =>
      coincideTexto(filtro, row.codBarrio, row.descripcion, row.sucursal, row.descPrecio)
    ),
    [barrios, filtro]
  )

  const visibles = useMemo(
    () => filtrados.slice(page * pageSize, page * pageSize + pageSize),
    [filtrados, page, pageSize]
  )

  const columns: Column<BarrioCall>[] = useMemo(() => [
    { id: "codBarrio", label: "Código", minWidth: 80 },
    { id: "descripcion", label: "Barrio", minWidth: 180 },
    { id: "sucursal", label: "Sucursal", minWidth: 150 },
    { id: "descPrecio", label: "Lista de precio", minWidth: 140, hideBelow: "md" },
    {
      id: "precio",
      label: "Transporte",
      minWidth: 100,
      align: "right",
      render: (row) => `NIO ${row.precio.toFixed(2)}`
    },
    {
      id: "atender",
      label: "Atiende",
      minWidth: 80,
      render: (row) => (
        <span className={row.atender === "S" ? "status status--active" : "status status--inactive"}>
          {row.atender === "S" ? "Sí" : "No"}
        </span>
      )
    },
    { id: "horaMaxima", label: "Hora máxima", minWidth: 100, hideBelow: "md" },
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
          <h1 className="oh-page__title">Barrios</h1>
          <p className="oh-page__subtitle">
            Zonas de entrega por sucursal con su costo de transporte
          </p>
        </div>
        <div className="oh-page__btnContainer">
          <Button
            variant="primary"
            disabled={loading}
            onClick={() => {
              if (precios.length === 0) {
                toast.info("Primero crea un precio de transporte")
                return
              }
              setEditando(null)
              setModalOpen(true)
            }}
          >
            Nuevo barrio
          </Button>
        </div>
      </div>

      <div className="table-contaner__search-filter__container">
        <SearchFilter value={filtro} onApply={(value) => { setFiltro(value); setPage(0) }} />
      </div>

      <CustomTable<BarrioCall>
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

      <CallCenterBarrioModal
        isOpen={modalOpen}
        data={editando}
        sucursales={sucursales}
        precios={precios}
        onClose={() => setModalOpen(false)}
        onSubmit={guardar}
      />

      <CallCenterConfirmModal
        isOpen={porBaja != null}
        title="Dar de baja barrio"
        message="Los agentes ya no podrán usar este barrio en direcciones nuevas."
        detalles={[
          { label: "Código", value: porBaja?.codBarrio ?? "" },
          { label: "Barrio", value: porBaja?.descripcion ?? "" },
          { label: "Sucursal", value: porBaja?.sucursal ?? "" },
          { label: "Transporte", value: porBaja ? `NIO ${porBaja.precio.toFixed(2)}` : "" }
        ]}
        onClose={() => setPorBaja(null)}
        onConfirm={async () => { if (porBaja) await darDeBaja(porBaja) }}
      />
    </div>
  )
}

export default function CallCenterBarriosPage() {
  return (
    <CallCenterGuard title="Barrios">
      <BarriosContent />
    </CallCenterGuard>
  )
}
