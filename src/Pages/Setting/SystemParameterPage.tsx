import { useMemo } from 'react'
import CustomTable from '@/Components/Common/CustomTable'
import Button from '@/Components/Common/Button'
import IconButton from '@mui/material/IconButton'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import ToggleOnIcon from '@mui/icons-material/ToggleOn'
import ToggleOffIcon from '@mui/icons-material/ToggleOff'
import SystemParamForm from '@/Components/Setting/SystemParamForm'
import { useSystemParams } from '@/Hooks/Setting/useSystemParams'
import type { SystemParamResponseDto } from '@/Interfaces/Auth/AuthInterface'
import type { Column } from '@/Interfaces/Common/CustomTable'
import '@/Styles/Setting/SystemParamsPage.css'
import type { NameTranslation, TypeTranslation } from '@/Interfaces/Setting/OpeningHour'

const typeTranslations: Record<TypeTranslation, string> = {
  Prompts: "Mensaje",
  Temp: "Tiempo",
  Keyworks: "Palabra clave"
}
const nameTranslations: Record<NameTranslation, string> = {
  WelcomeBot: "Bienvenida ChatBot",
  AskFullName: "Pregunta Nombre",
  AskIdCard: "Pregunta Cédula",
  InvalidIdFormat: "Cédula Invalida",
  DataComplete: "Datos Completos",
  InactivityWarning: "Advertencia Inactividad",
  InactivityClosed: "Inactividad Cerrada",
  SupportRequestReceived: "Solicitud Soporte Recibida",
  WaitWarningCloseTime: "Advertencia Cierre Espera",
  InactivityWarningThresholdMesssage: "Mensaje Umbral Inactividad",
  WaitWarningCloseMesssage: "Mensaje Advertencia Cierre",
  BotGreetings: "Saludo Bot",
  AskCompanyName: "Pregunta Nombre Empresa",
  InvalidPasswordFormat: "Formato Contraseña Invalido",
  InvalidResidenceCardFormat: "Formato Cédula Residencia Invalido",
  RequestIdType: "Solicitud Tipo Identificación",
  ContactComplete: "Contacto Completo",
  OutOfBotContext: "Fuera Contexto Bot",
  RequestUnderReviewMessage: "Mensaje Solicitud En Revisión",
  RequestUnderReviewTime: "Tiempo Solicitud En Revisión",
  UnclosedConversationMessage: "Mensaje Conversación No Cerrada",
  UnclosedConversationTime: "Tiempo Conversación No Cerrada",
  UseMultimediaContext: "Uso contenido multimedia en el contexto",
  ClientCriticalStateTime: "Tiempo critico de espera de cliente"
};

export default function SystemParamsPage() {
  const {
    systemParams,
    selectedParam,
    page,
    pageSize,
    totalCount,
    setPage,
    setPageSize,
    modalMode,
    isModalOpen,
    openCreate,
    openEdit,
    openView,
    closeModal,
    handleSubmit,
    toggleSystemParam,
  } = useSystemParams()

  const columns: Column<SystemParamResponseDto>[] = useMemo(() => [
     {
        id: "name",
        label: "Nombre",
        minWidth: 100,
        render: (row) => nameTranslations[row.name as NameTranslation],
      },
    { id: 'type', label: 'Tipo', minWidth: 100,
      render: (row) => typeTranslations[row.type as TypeTranslation]
     },
    {
      id: 'value',
      label: 'Valor',
      minWidth: 200,
      render: row => (
        <span title={row.value} className={row.value == "true" ? 'status status--active' : ''}>
          {row.value.length > 50 ? `${row.value.slice(0, 50)}...` : row.value}
        </span>
      ),
    },
    {
      id: 'isActive',
      label: 'Estado',
      minWidth: 100,
      render: row => (
        <span className={row.isActive ? 'status status--active' : 'status status--inactive'}>
          {row.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      id: 'actions',
      label: 'Acciones',
      minWidth: 130,
      align: 'center',
      render: row => (
        <>
          <IconButton size="small" onClick={() => openView(row.id)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => openEdit(row.id)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => toggleSystemParam(row.id)}>
            {row.isActive
              ? <ToggleOnIcon fontSize="small" color="success" />
              : <ToggleOffIcon fontSize="small" />
            }
          </IconButton>
        </>
      ),
    },
  ], [openView, openEdit, toggleSystemParam])

  return (
    <div className="sp-page__container">
      <div className="sp-page__header">
        <div className="sp-page__header-content">
          <h1 className="sp-page__title">Parámetros del Sistema</h1>
          <p className="sp-page__subtitle">Administra tus parámetros del sistema</p>
        </div>
        <div className="sp-page__btnContainer">
          <Button variant="primary" onClick={openCreate}>
            Nuevo Parámetro
          </Button>
        </div>
      </div>

      {/* {error && <p className="sp-page__error">Error: {error. || error}</p>} */}

      <CustomTable<SystemParamResponseDto>
        columns={columns}
        rows={systemParams}
        count={totalCount}
        page={page - 1}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[5, 10, 20, 50]}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={e => setPageSize(parseInt(e.target.value, 10))}
      />

      <SystemParamForm
        mode={modalMode}
        isOpen={isModalOpen}
        data={selectedParam}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  )
}