import React, { useState } from "react";
import { FaFilter } from "react-icons/fa";
import { Search, FileDown, FileClock } from "lucide-react";
import { Trunc } from "@/Components/Chat/DetailPanel/DetailPanelCommon";
import "@/Styles/Chat/DetailPanel/DetailPanelHistoryTab.css";
export interface ConversationRow {
  id: number;
  createdAt: string | Date;
  contactName?: string | null;
  agent?: string | null;
  status?: string | null;
  contactId: number;
}

interface DetailPanelHistoryTabProps {
  convRows: ConversationRow[];
  convFrom: string;
  convTo: string;
  convQuery: string;
  onChangeFrom: (value: string) => void;
  onChangeTo: (value: string) => void;
  onChangeQuery: (value: string) => void;
  onSubmitFilters: () => void;
  handleConvScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  totalCount: number;
  convPage: number;
  totalPages: number;
  loadingPdf: boolean;
  formatDate: (v?: string | number | Date | null) => string;
  exportConversationHistoryToPDFAsync: (args: {
    contactId: number;
    conversationId?: number | null;
    from: string | null;
    to: string | null;
    title: string;
    subtitle: string;
  }) => Promise<void>;
  onOpenHistoryModal: (row: ConversationRow) => void;
}

const DetailPanelHistoryTab: React.FC<DetailPanelHistoryTabProps> = ({
  convRows,
  convFrom,
  convTo,
  convQuery,
  onChangeFrom,
  onChangeTo,
  onChangeQuery,
  onSubmitFilters,
  handleConvScroll,
  totalCount,
  convPage,
  totalPages,
  loadingPdf,
  formatDate,
  exportConversationHistoryToPDFAsync,
  onOpenHistoryModal,
}) => {
  const [showConvFilters, setShowConvFilters] = useState(false);
  const [hoverId, setHoverId] = useState<number | null>(null);

  const hasResults = convRows.length > 0;

  return (
    <div className="detailPanel-container detailPanel-history">
      <header className="detailPanel-content-header detailPanel-history__header">
        <h5 className="detailPanel-history__title">Historial de conversaciones</h5>

        <div className="detailPanel-history__header-actions">
          <button
            className="btn btn--ghost detailPanel-history__filter-btn"
            onClick={() => setShowConvFilters((s) => !s)}
            title="Filtros"
            aria-expanded={showConvFilters}
            aria-controls="convFilterPanel"
            type="button"
          >
            <FaFilter size={14} />
          </button>
        </div>

        {showConvFilters && (
          <div
            id="convFilterPanel"
            className="detailPanel-history__filters"
          >
            <div className="detailPanel-history__filters-row">
              <div className="detailPanel-history__filters-field">
                <label className="detailPanel-clientGroup__title detailPanel-history__filters-label">
                  Desde
                </label>
                <input
                  type="date"
                  className="input detailPanel-history__filters-input"
                  value={convFrom}
                  onChange={(e) => onChangeFrom(e.target.value)}
                />
              </div>
              <div className="detailPanel-history__filters-field">
                <label className="detailPanel-clientGroup__title detailPanel-history__filters-label">
                  Hasta
                </label>
                <input
                  type="date"
                  className="input detailPanel-history__filters-input"
                  value={convTo}
                  onChange={(e) => onChangeTo(e.target.value)}
                />
              </div>
            </div>

            <div className="detailPanel-history__search">
              <input
                className="input detailPanel-history__search-input"
                placeholder="Buscar por texto…"
                value={convQuery}
                onChange={(e) => onChangeQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSubmitFilters();
                    setShowConvFilters(false);
                  }
                }}
              />
              <Search
                size={16}
                className="detailPanel-history__search-icon"
              />
            </div>
          </div>
        )}
      </header>

      <div className="detailPanel-convesaionHistory__container">
        <div className="detailPanel-history__list-header">
          <span className="detailPanel-history__list-header-cell">Creado</span>
          <span className="detailPanel-history__list-header-cell">Contacto</span>
          <span className="detailPanel-history__list-header-cell">Agente</span>
          <span className="detailPanel-history__list-header-cell">Ticket</span>
        </div>

        <div
          className="detailPanel-history__list"
          onScroll={handleConvScroll}
        >
          {convRows.map((r) => (
            <div
              key={r.id}
              className={
                "detailPanel-history__row" +
                (hoverId === r.id ? " detailPanel-history__row--hovered" : "")
              }
              onMouseEnter={() => setHoverId(r.id)}
              onMouseLeave={() => setHoverId(null)}
            >
              <div
                title={formatDate(r.createdAt)}
                className="detailPanel-clientGroup__cliente detailPanel-history__cell"
              >
                <Trunc>{formatDate(r.createdAt)}</Trunc>
              </div>

              <div
                title={r.contactName ?? undefined}
                className="detailPanel-clientGroup__cliente detailPanel-history__cell"
              >
                {r.contactName != null ? (
                  <Trunc>{r.contactName}</Trunc>
                ) : (
                  "------------------------"
                )}
              </div>

              <div
                title={r.agent ?? undefined}
                className="detailPanel-clientGroup__cliente detailPanel-history__cell"
              >
                {r.agent != null ? (
                  <Trunc>{r.agent}</Trunc>
                ) : (
                  "------------------------"
                )}
              </div>

              <div className="detailPanel-history__ticket-cell">
                <span
                  title={`#${r.id}`}
                  className="detailPanel-clientGroup__cliente detailPanel-history__cell detailPanel-history__ticket-text"
                >
                  <Trunc>{r.id}</Trunc>
                </span>
              </div>

              <div
                className={
                  "detailPanel-history__row-actions" +
                  (hoverId === r.id
                    ? " detailPanel-history__row-actions--visible"
                    : "")
                }
              >

                {onOpenHistoryModal && (
                  <button
                    className="btn btn--ghost detailPanel-history__row-actions-btn"
                    onClick={() => onOpenHistoryModal(r) }
                    title="Ver historial completo"
                    type="button"
                  >
                    <FileClock size={16} />
                  </button>
                )}

                <button
                  className="btn btn--ghost detailPanel-history__row-actions-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    exportConversationHistoryToPDFAsync({
                      contactId: r.contactId,
                      conversationId: r.id, 
                      from: convFrom || null,
                      to: convTo || null,
                      title: "Reporte de Conversaciones",
                      subtitle: "Historia de conversaciones",
                    });
                  }}
                  disabled={!!loadingPdf}
                  title="Descargar PDF"
                  type="button"
                >
                  <FileDown size={16} />
                </button>
              </div>
            </div>
          ))}

          {!hasResults && (
            <div className="detailPanel-history__empty">
              Sin resultados
            </div>
          )}
        </div>
      </div>

      <div className="detailPanel-history__footer">
        <div className="detailPanel-history__footer-text">
          {totalCount && totalCount > 0
            ? `Mostrando página ${convPage} de ${totalPages} (${totalCount} conversaciones)`
            : "Sin resultados"}
        </div>
        {loadingPdf ? (
          <span className="detailPanel-history__footer-pdf">
            Preparando PDF…
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default DetailPanelHistoryTab;