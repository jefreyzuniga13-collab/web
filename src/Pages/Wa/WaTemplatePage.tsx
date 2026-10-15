import { useMemo, useState } from 'react'
import CustomTable from '@/Components/Common/CustomTable'
import Button from '@/Components/Common/Button'
import SearchFilter from '@/Components/Common/SearchFilter'
import IconButton from '@mui/material/IconButton'
import VisibilityIcon from '@mui/icons-material/Visibility'
import SendIcon from '@mui/icons-material/Send'
import WaTemplateForm from '@/Components/Wh/WaTemplateForm'
import WaTemplateSendModal from '@/Components/Wh/WaTemplateSendModal'
import { useWaTemplate } from '@/Hooks/Wh/useWaTemplate'
import type { WaTemplateResponseDto } from '@/Interfaces/Wh/TemplateInterface'
import type { Column } from '@/Interfaces/Common/CustomTable'
import type { TemplateCategoryTranslation } from '@/Interfaces/Common/GlobalInterface'
import { templateCategoryTranslations } from '@/Utils/Translation/categoryTemplateTranslation'
import '@/Styles/Crm/SystemParamsPage.css'

export default function WaTemplatesPage() {
  const {
    waTemplates,
    selectedWaTemplate,
    page,
    pageSize,
    totalCount,
    setPage,
    setPageSize,
    modalMode,
    isModalOpen,
    openCreate,
    openView,
    closeModal,
    handleSubmit,
    globalFilter,
    setGlobalFilter
  } = useWaTemplate()

  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [templateToSend, setTemplateToSend] = useState<WaTemplateResponseDto | null>(null)

  const openSend = (row: WaTemplateResponseDto) => {
    setTemplateToSend(row)
    setSendModalOpen(true)
  }

  const closeSend = () => {
    setSendModalOpen(false)
    setTemplateToSend(null)
  }

  const columns: Column<WaTemplateResponseDto>[] = useMemo(() => [
    { id: 'name', label: 'Nombre', minWidth: 80 },
    {
      id: 'templateCategoryName',
      label: 'Categoría',
      minWidth: 100,
      render: row => (
        <span>
          {templateCategoryTranslations[row.templateCategoryName as TemplateCategoryTranslation] ?? row.templateCategoryName}
        </span>
      )
    },
    {
      id: 'status',
      label: 'Estado Meta',
      minWidth: 80,
      render: row => {
        const bgColor = row.status === 'Pending'
          ? '#f39c12'
          : row.status === 'Approved'
            ? '#27ae60'
            : '#e74c3c'

        return (
          <span
            style={{
              display: 'inline-block',
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: bgColor,
              color: '#fff',
              fontWeight: 'bold',
              textAlign: 'center',
              minWidth: '70px'
            }}
          >
            {row.status}
          </span>
        )
      }
    },
    { id: 'createdByName', label: 'Creado por', minWidth: 100 },
    {
      id: 'createdAt',
      label: 'Creado',
      minWidth: 110,
      render: row => new Date(row.createdAt!).toLocaleString('es-NI')
    },
    {
      id: 'actions',
      label: 'Acciones',
      minWidth: 100,
      align: 'center',
      render: row => (
        <>
          <IconButton size="small" onClick={() => openView(row.id)} aria-label="Ver plantilla">
            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => openSend(row)} aria-label="Enviar plantilla">
            <SendIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ], [openView])

  return (
    <div className="sp-page__container">
      <div className="sp-page__header">
        <div className="sp-page__header-content">
          <h1 className="sp-page__title">Plantillas de WhatsApp</h1>
          <p className="sp-page__subtitle">Crea plantillas de texto y envíalas a contactos de la empresa</p>
        </div>
        <div className="sp-page__btnContainer">
          <Button variant="primary" onClick={openCreate}>
            Nueva plantilla
          </Button>
        </div>
      </div>

      <div className="table-contaner__search-filter__container">
        <SearchFilter value={globalFilter} onApply={setGlobalFilter} />
      </div>

      <CustomTable<WaTemplateResponseDto>
        columns={columns}
        rows={waTemplates}
        count={totalCount}
        page={page - 1}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[20, 30, 50]}
        onPageChange={(_, newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={e => setPageSize(parseInt(e.target.value, 10))}
      />

      <WaTemplateForm
        mode={modalMode}
        isOpen={isModalOpen}
        data={selectedWaTemplate}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      {sendModalOpen && templateToSend && (
        <WaTemplateSendModal
          isOpen={sendModalOpen}
          template={templateToSend}
          onClose={closeSend}
        />
      )}
    </div>
  )
}
