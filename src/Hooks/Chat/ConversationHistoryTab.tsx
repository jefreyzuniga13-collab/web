import React from 'react'
import { FaFilter, FaSearch, FaDownload } from 'react-icons/fa'
import useConversationHistoryTab from '@/Hooks/Chat/useConversationHistoryTab'
import '@/Styles/Chat/ConversationHistoryTab.css'

type Props = {
  contactId?: number
  formatDate: (v?: string | number | Date | null) => string
}

const ConversationHistoryTab: React.FC<Props> = ({ contactId, formatDate }) => {
  const {
    convFrom,
    setConvFrom,
    convTo,
    setConvTo,
    convQuery,
    setConvQuery,
    showConvFilters,
    setShowConvFilters,
    convRows,
    hoverId,
    setHoverId,
    sentinelRef,
    hasMore,
    isLoadingMore,
    loading,
    error,
    totalCount,
    showHistoryModal,
    selectedConversation,
    openHistory,
    closeHistory,
    exportConversationHistoryToPDFAsync,
  } = useConversationHistoryTab({ contactId })

  const handleChangeFrom = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setConvFrom(val ? new Date(`${val}T00:00:00`) : null)
  }

  const handleChangeTo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setConvTo(val ? new Date(`${val}T23:59:59`) : null)
  }

  const handleExportPdf = () => {
    if (!contactId) return
    exportConversationHistoryToPDFAsync({
      contactId,
      from: convFrom,
      to: convTo,
      subtitle: 'Historial de conversaciones',
      title:'Conversaciones del contacto',
    //   qu: convQuery || undefined,
    }).catch(() => {})
  }

  return (
    <section className="convHistory-container">
      <header className="convHistory-header">
        <div className="convHistory-header__left">
          <h5 className="convHistory-title">Historial de conversaciones</h5>
          <span className="convHistory-count">
            {totalCount ? `${totalCount} conversación(es)` : 'Sin conversaciones'}
          </span>
        </div>
        <div className="convHistory-header__actions">
          <button
            type="button"
            className="btn btn--secondary convHistory-btn"
            onClick={() => setShowConvFilters(v => !v)}
          >
            <FaFilter size={14} />
            <span>Filtros</span>
          </button>
          <button
            type="button"
            className="btn btn--primary convHistory-btn"
            onClick={handleExportPdf}
            disabled={!totalCount}
          >
            <FaDownload size={14} />
            <span>Exportar PDF</span>
          </button>
        </div>
      </header>

      {showConvFilters && (
        <div className="convHistory-filters">
          <div className="convHistory-filterGroup">
            <label className="convHistory-filterLabel">Desde</label>
            <input
              type="date"
              className="convHistory-filterInput"
              value={convFrom ? new Date(convFrom).toISOString().slice(0, 10) : ''}
              onChange={handleChangeFrom}
            />
          </div>
          <div className="convHistory-filterGroup">
            <label className="convHistory-filterLabel">Hasta</label>
            <input
              type="date"
              className="convHistory-filterInput"
              value={convTo ? new Date(convTo).toISOString().slice(0, 10) : ''}
              onChange={handleChangeTo}
            />
          </div>
          <div className="convHistory-filterGroup convHistory-filterGroup--search">
            <label className="convHistory-filterLabel">Buscar</label>
            <div className="convHistory-searchWrapper">
              <FaSearch size={14} className="convHistory-searchIcon" />
              <input
                className="convHistory-searchInput"
                placeholder="Buscar en historial..."
                value={convQuery}
                onChange={e => setConvQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {loading && !convRows.length && (
        <div className="convHistory-loading">
          Cargando historial…
        </div>
      )}

      {error && !loading && (
        <div className="convHistory-error">
          Ocurrió un error al cargar el historial.
        </div>
      )}

      {!loading && !convRows.length && !error && (
        <div className="convHistory-empty">
          No hay conversaciones para este contacto.
        </div>
      )}

      {convRows.length > 0 && (
        <div className="convHistory-list">
          {convRows.map(conv => (
            <button
              key={conv.conversationId}
              type="button"
              className={`convHistory-row ${hoverId === conv.conversationId ? 'is-hovered' : ''}`}
              onMouseEnter={() => setHoverId(conv.conversationId)}
              onMouseLeave={() => setHoverId(null)}
              onClick={() => openHistory(conv)}
            >
              <div className="convHistory-row__main">
                <div className="convHistory-row__title">
                  {conv.status || 'Sin estado'}
                </div>
                <div className="convHistory-row__meta">
                  <span className="convHistory-row__metaItem">
                    {formatDate(conv.createdAt)}
                  </span>
                  {conv.assignedAgentName && (
                    <span className="convHistory-row__metaItem">
                      Agente: {conv.assignedAgentName}
                    </span>
                  )}
                </div>
              </div>
              <div className="convHistory-row__preview">
                {conv.agentLastMessageAt || 'Sin vista previa'}
              </div>
              {hoverId === conv.conversationId && (
                <div className="convHistory-row__hoverActions">
                  <span className="convHistory-row__hoverText">
                    Ver detalle
                  </span>
                </div>
              )}
            </button>
          ))}

          <div ref={sentinelRef} className="convHistory-sentinel" />

          {isLoadingMore && (
            <div className="convHistory-loadingMore">
              Cargando más conversaciones…
            </div>
          )}

          {!hasMore && convRows.length > 0 && (
            <div className="convHistory-end">
              No hay más conversaciones.
            </div>
          )}
        </div>
      )}

      {showHistoryModal && selectedConversation && (
        <div className="convHistory-modal">
          <div className="convHistory-modal__backdrop" onClick={closeHistory} />
          <div className="convHistory-modal__content">
            <header className="convHistory-modal__header">
              <h5 className="convHistory-modal__title">
                Conversación #{selectedConversation.conversationId}
              </h5>
              <button
                type="button"
                className="btn btn--ghost convHistory-modal__close"
                onClick={closeHistory}
              >
                Cerrar
              </button>
            </header>
            <div className="convHistory-modal__body">
              <div className="convHistory-modal__row">
                <span className="convHistory-modal__label">Estado</span>
                <span className="convHistory-modal__value">
                  {selectedConversation.status || 'Sin estado'}
                </span>
              </div>
              <div className="convHistory-modal__row">
                <span className="convHistory-modal__label">Creado</span>
                <span className="convHistory-modal__value">
                  {formatDate(selectedConversation.createdAt)}
                </span>
              </div>
              <div className="convHistory-modal__row">
                <span className="convHistory-modal__label">Último mensaje del cliente</span>
                <span className="convHistory-modal__value">
                  {formatDate(selectedConversation.clientLastMessageAt)}
                </span>
              </div>
              <div className="convHistory-modal__row">
                <span className="convHistory-modal__label">Último mensaje del agente</span>
                <span className="convHistory-modal__value">
                  {formatDate(selectedConversation.agentLastMessageAt)}
                </span>
              </div>
              {selectedConversation.tags && selectedConversation.tags.length > 0 && (
                <div className="convHistory-modal__row">
                  <span className="convHistory-modal__label">Etiquetas</span>
                  <div className="convHistory-modal__tags">
                    {selectedConversation.tags.map(t => (
                      <span key={t} className="convHistory-modal__tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedConversation.clientLastMessageAt && (
                <div className="convHistory-modal__row convHistory-modal__row--full">
                  <span className="convHistory-modal__label">Último mensaje cliente</span>
                  <div className="convHistory-modal__snippet">
                    {selectedConversation.clientLastMessageAt}
                  </div>
                </div>
              )}
            </div>
            <footer className="convHistory-modal__footer">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={closeHistory}
              >
                Cerrar
              </button>
            </footer>
          </div>
        </div>
      )}
    </section>
  )
}

export default ConversationHistoryTab