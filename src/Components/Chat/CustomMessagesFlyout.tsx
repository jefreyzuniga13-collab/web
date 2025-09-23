/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from "react";
import type {
  CustomMessageResponseDto,
  CustomMessageRequestDto,
} from "@/Interfaces/Setting/CustomMessageInterface";

import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import SendIcon from "@mui/icons-material/Send";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

type Mode = "list" | "create" | "edit";

interface Props {
  anchorRect: DOMRect | null;
  open: boolean;
  onClose: () => void;

  items: CustomMessageResponseDto[];
  loading?: boolean;
  error?: Error | null;

  onCreate: (values: CustomMessageRequestDto) => Promise<void> | void;
  onUpdate: (id: number, values: CustomMessageRequestDto) => Promise<void> | void;
  onToggle: (id: number) => Promise<void> | void; // si luego agregas el switch

  onInsertToComposer: (text: string) => void;
  onSendNow: (text: string) => void;
}

export const CustomMessagesFlyout: React.FC<Props> = ({
  anchorRect,
  open,
  onClose,
  items,
  loading,
  error,
  onCreate,
  onUpdate,
  // onToggle,
  onInsertToComposer,
  onSendNow,
}) => {
  const [mode, setMode] = useState<Mode>("list");
  const [editTarget, setEditTarget] = useState<CustomMessageResponseDto | null>(null);
  const [form, setForm] = useState<CustomMessageRequestDto>({ content: "", isActive: true });

  /**
   * Posiciona el flyout a la IZQUIERDA del botón:
   *  - anclamos en el borde izquierdo del botón
   *  - lo desplazamos todo el ancho (-100%) más un GAP, y centramos verticalmente (-50%)
   */
  const flyoutStyle = useMemo<React.CSSProperties>(() => {
    if (!anchorRect) {
      // Fallback: esquina inferior derecha (por si no hay anchorRect)
      return { right: 16, bottom: 84, transform: "none" };
    }

    const GAP = 10; // separación entre el flyout y el botón
    const ESTIMATED_WIDTH = 360; // aprox. coincide con clamp de CSS
    const MARGIN = 12;

    // centro vertical del botón (para alinear verticalmente)
    const top = anchorRect.top + anchorRect.height / 2;

    // borde izquierdo del botón (punto de anclaje)
    let left = anchorRect.left;

    // si el botón está muy pegado al borde izquierdo, evitamos que el flyout se salga
    // requerimos al menos el ancho estimado + margen
    const minLeft = MARGIN + ESTIMATED_WIDTH;
    if (left < minLeft) left = minLeft;

    return {
      top,
      left,
      transform: `translate(calc(-100% - ${GAP}px), -50%)`,
    };
  }, [anchorRect]);

  if (!open) return null;

  const startCreate = () => {
    setMode("create");
    setEditTarget(null);
    setForm({ content: "", isActive: true });
  };

  const startEdit = (item: CustomMessageResponseDto) => {
    setMode("edit");
    setEditTarget(item);
    setForm({ content: item.content, isActive: item.isActive });
  };

  const cancelForm = () => {
    setMode("list");
    setEditTarget(null);
    setForm({ content: "", isActive: true });
  };

  const submitForm = async () => {
    const content = form.content.trim();
    if (!content) return;
    if (mode === "create") {
      await onCreate(form);
    } else if (mode === "edit" && editTarget) {
      await onUpdate(editTarget.id, form);
    }
    setMode("list");
    setEditTarget(null);
  };

  return (
    <>

      {/* <div className="cmf-backdrop" onClick={onClose} /> */}

      <div
        className="cmf-flyout"
        style={flyoutStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Mensajes personalizados"
      >
        {/* flecha a la derecha, apuntando hacia el botón */}
        <div className="cmf-arrow cmf-arrow--right" />

        <div className="cmf-header">
          <div className="cmf-title">Mensajes personalizados</div>

          {mode === "list" ? (
            <button className="cmf-btn cmf-btn-primary" onClick={startCreate}>
              <AddIcon fontSize="small" style={{ marginRight: 6 }} />
              Nuevo
            </button>
          ) : (
            <button className="cmf-btn" onClick={cancelForm}>
              <ArrowBackIcon fontSize="small" style={{ marginRight: 6 }} />
              Volver
            </button>
          )}
        </div>

        {mode === "list" && (
          <div className="cmf-list">
            {items.map((it) => (
              <div key={it.id} className="cmf-item">
                <div className="cmf-item-text">
                  <div className="cmf-item-content">{it.content}</div>
                  {/* Toggle opcional:
                  <label className="cmf-switch">
                    <input type="checkbox" checked={it.isActive} onChange={() => onToggle(it.id)} />
                    <span>{it.isActive ? "Activo" : "Inactivo"}</span>
                  </label> */}
                </div>

                <div className="cmf-actions">
                  <button
                    className="cmf-icon-btn"
                    title="Insertar"
                    onClick={() => { onInsertToComposer(it.content); onClose(); }}
                  >
                    <ContentPasteIcon fontSize="small" />
                  </button>
                  <button
                    className="cmf-icon-btn"
                    title="Enviar ahora"
                    onClick={() => { onSendNow(it.content); onClose(); }}
                  >
                    <SendIcon fontSize="small" />
                  </button>
                  <button
                    className="cmf-icon-btn"
                    title="Editar"
                    onClick={() => startEdit(it)}
                  >
                    <EditIcon fontSize="small" />
                  </button>
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <div className="cmf-empty">No hay mensajes aún</div>
            )}
          </div>
        )}

        {mode !== "list" && (
          <div className="cmf-form">
            <label className="cmf-label">Contenido</label>
            <textarea
              className="cmf-textarea"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={4}
              placeholder="Escribe el texto del mensaje…"
            />

            <label className="cmf-switch" style={{ marginTop: 8 }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              <span>{form.isActive ? "Activo" : "Inactivo"}</span>
            </label>

            <div className="cmf-form-actions">
              <button
                className="cmf-btn"
                onClick={() => onInsertToComposer(form.content)}
                disabled={!form.content.trim()}
              >
                <ContentPasteIcon fontSize="small" style={{ marginRight: 6 }} />
                Insertar
              </button>

              <button
                className="cmf-btn"
                onClick={() => onSendNow(form.content)}
                disabled={!form.content.trim()}
              >
                <SendIcon fontSize="small" style={{ marginRight: 6 }} />
                Enviar
              </button>

              <div style={{ flex: 1 }} />

              <button className="cmf-btn" onClick={cancelForm}>Cancelar</button>

              <button
                className="cmf-btn cmf-btn-primary"
                onClick={submitForm}
                disabled={!form.content.trim() || loading}
              >
                {mode === "edit" ? "Actualizar" : "Crear"}
              </button>
            </div>

            {error && <div className="cmf-error">{String(error.message || error)}</div>}
          </div>
        )}
      </div>
    </>
  );
};