import React from 'react'
import { IoIosContact } from 'react-icons/io'
import { FaBuilding, FaRegComments } from 'react-icons/fa'
import { CustomMessagesFlyout } from '@/Components/Chat/CustomMessagesFlyout'
import { useDetailPanel } from '@/Hooks/Chat/useDetailPanel'
import { useCustomMessage } from '@/Hooks/Chat/useCustomMesssage'
import '@/Styles/Chat/DetailPanel.css'

interface Props {
  contactId?: number
  onInsertToComposer: (txt: string) => void
  onSendNow: (txt: string) => void | Promise<void>
}

export const DetailPanel: React.FC<Props> = ({
  contactId,
  onInsertToComposer,
  onSendNow,
}) => {
  const {
    selectedData,
    loading,
    error,
    client,
    optionMenu,
    setOptionMenu,
  } = useDetailPanel(contactId)

  const {
    customMessages,
    create,
    update,
    toggleSystemParam,
    loading: cmLoading,
    error: cmError,
  } = useCustomMessage()

  if (loading) return <div className="detailPanel-loading">Cargando…</div>
  if (error) return <div className="detailPanel-error">No se han podido cargar los detalles</div>

  return (
    <div className="detailPanel-container">
      <ul className="detail-panel__header">
        <li className={`detailPanel-option ${optionMenu === 1 ? 'is-active' : ''}`} title="Contacto">
          <IoIosContact onClick={() => setOptionMenu(1)} />
        </li>
        <li className={`detailPanel-option ${optionMenu === 2 ? 'is-active' : ''}`} title="Cliente">
          <FaBuilding onClick={() => setOptionMenu(2)} />
        </li>
        <li className={`detailPanel-option ${optionMenu === 3 ? 'is-active' : ''}`} title="Mensajes personalizados">
          <FaRegComments onClick={() => setOptionMenu(3)} />
        </li>
      </ul>

      <section className="detailPanel-content">
        {optionMenu === 1 && (
          <header className="detailPanel-contactGroup-__container">
            <h5>Detalles del contacto</h5>

            <div className="detailPanel-contactGroup">
              <p className="detailPanel-contactGroup__title">Nombre</p>
              <span className="detailsPanel-contactGroup__subtitle">
                {selectedData?.fullName || '—'}
              </span>
            </div>

            <div className="detailPanel-contactGroup">
              <p className="detailPanel-contactGroup__title">Teléfono</p>
              <span className="detailsPanel-contactGroup__subtitle">
                {selectedData?.phone || '—'}
              </span>
            </div>

            <div className="detailPanel-contactGroup">
              <p className="detailPanel-contactGroup__title">WhatsApp</p>
              <span className="detailsPanel-contactGroup__subtitle">
                {selectedData?.waName || '—'}
              </span>
            </div>

            <div className="detailPanel-contactGroup">
              <p className="detailPanel-contactGroup__title">Verificado</p>
              <span className="detailsPanel-contactGroup__subtitle">
                {selectedData?.isVerified ? 'Verificado' : 'No Verificado'}
              </span>
            </div>

            <div className="detailPanel-contactGroup">
              <p className="detailPanel-contactGroup__title">Activo</p>
              <span className="detailsPanel-contactGroup__subtitle">
                {selectedData?.isActive ? 'Activo' : 'No Activo'}
              </span>
            </div>

            <div className="detailPanel-contactGroup">
              <p className="detailPanel-contactGroup__title">Verificado por</p>
              <span className="detailsPanel-contactGroup__subtitle">
                {selectedData?.verifiedBy?.fullName || '—'}
              </span>
            </div>

            <div className="detailPanel-contactGroup">
              <p className="detailPanel-contactGroup__title">Creado</p>
              <span className="detailsPanel-contactGroup__subtitle">
                {selectedData?.createdAt || '—'}
              </span>
            </div>

            <div className="detailPanel-contactGroup">
              <p className="detailPanel-contactGroup__title">Actualizado</p>
              <span className="detailsPanel-contactGroup__subtitle">
                {selectedData?.updatedAt || '—'}
              </span>
            </div>

            <div className="detailPanel-contactGroup">
              <p className="detailPanel-contactGroup__title">verifiedAt</p>
              <span className="detailsPanel-contactGroup__subtitle">
                {selectedData?.verifiedAt || '—'}
              </span>
            </div>
          </header>
        )}

        {optionMenu === 2 && (
          <>
            <header><h5>Detalles del cliente</h5></header>
            <div>
              <div className="detailPanel-clientGroup">
                <p className="detailPanel-clientGroup__title">Código cliente</p>
                <span className="detailPanel-clientGroup__subtitle">{client?.codCliente || '—'}</span>
              </div>
              <div className="detailPanel-clientGroup">
                <p className="detailPanel-clientGroup__title">Nombre</p>
                <span className="detailPanel-clientGroup__subtitle">{client?.nombre || '—'}</span>
              </div>
              <div className="detailPanel-clientGroup">
                <p className="detailPanel-clientGroup__title">Teléfono</p>
                <span className="detailPanel-clientGroup__subtitle">{client?.telefono ?? '—'}</span>
              </div>
              <div className="detailPanel-clientGroup">
                <p className="detailPanel-clientGroup__title">Dirección</p>
                <span className="detailPanel-clientGroup__subtitle">{client?.direccion || '—'}</span>
              </div>
              <div className="detailPanel-clientGroup">
                <p className="detailPanel-clientGroup__title">Saldo Último Corte</p>
                <span className="detailPanel-clientGroup__subtitle">{client?.saldoUltimoCorte ?? '—'}</span>
              </div>
            </div>
          </>
        )}

        {optionMenu === 3 && (
          <CustomMessagesFlyout
                      anchorRect={null}
                      open
                      items={customMessages}
                      loading={cmLoading}
                      error={cmError}
                      onCreate={create}
                      onUpdate={update}
                      onToggle={toggleSystemParam}
                      onInsertToComposer={onInsertToComposer}
                      onSendNow={onSendNow} onClose={function (): void {
                          throw new Error('Function not implemented.')
                      } }          />
        )}
      </section>
    </div>
  )
}

export default DetailPanel