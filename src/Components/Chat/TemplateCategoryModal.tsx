import Button from "@/Components/Common/Button";
import Input from "@/Components/Common/Input";
import { Label } from "@/Components/Common/Label";
import { Textarea } from "@/Components/Common/Textarea";
import { useTemplateCategoryForm } from "@/Hooks/Chat/useTemplateCategoryForm";
import type {
  TemplateCategoryRequestDto,
  TemplateCategoryResponseDto,
} from "@/Interfaces/Chat/TemplateCategoryInterfaces";
import "@/Styles/Crm/SystemParamForm.css";
import "@/Styles/Crm/WorkShiftModal.css";
import TextField from "@mui/material/TextField";

interface TemplateCategoryProps {
  mode: "create" | "edit" | "view";
  isOpen: boolean;
  data?: TemplateCategoryResponseDto | null;
  onClose: () => void;
  onSubmit: (values: TemplateCategoryRequestDto) => void;
}

export default function SystemParamModal({
  mode,
  isOpen,
  data,
  onClose,
  onSubmit,
}: TemplateCategoryProps) {
  const { form, errors, isView, handleChange, handleCheckbox, handleSubmit } =
    useTemplateCategoryForm({ mode, data: data || null, onSubmit });

  if (!isOpen) return null;

  return (
    <div className="sp-modal__overlay">
      <div className="sp-modal__container">
        <header className="sp-modal__header">
          <h2 className="sp-modal__title">
            {mode === "create" && "Crear Categoria"}
            {mode === "edit" && "Editar Categoria"}
            {mode === "view" && "Detalle Categoria de Plantilas"}
          </h2>
          <button type="button" className="sp-modal__close" onClick={onClose}>
            ×
          </button>
        </header>

        <form className="sp-modal__body" onSubmit={handleSubmit}>
          <div className="sp-modal__grid">
            <div className="sp-modal__col">
              <Label htmlFor="name" className="sp-modal__label">
                Nombre *
              </Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={isView}
              />
              {errors.name && (
                <div className="sp-modal__error">{errors.name}</div>
              )}
            </div>

            <div className="sp-modal__col sp-modal__col--full">
              <Label htmlFor="description" className="sp-modal__label">
                Descripción *
              </Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                disabled={isView}
                className="sp-modal__input"
              />
              {errors.description && (
                <div className="sp-modal__error">{errors.description}</div>
              )}
            </div>

            <div className="ws-modal__col">
              <label className="ws-modal__field--checkbox">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleCheckbox}
                  disabled={isView}
                />{" "}
                Activo
              </label>
            </div>

            {isView && data && (
              <div className="ws-modal__col ws-modal__col--full ws-modal__timestamps">
                <TextField
                  value={new Date(data.createdAt).toLocaleString()}
                  label="Fecha Creado"
                  disabled
                  fullWidth
                />
                {data.updatedAt && (
                  <TextField
                    value={new Date(data.updatedAt).toLocaleString()}
                    label=" Fecha Actualizado"
                    disabled
                    fullWidth
                  />
                )}
              </div>
            )}

             {isView && data && (
              <div className="ws-modal__col ws-modal__col--full ws-modal__timestamps">

                {data.createdByName && (
                  <TextField
                    value={new Date(data.createdByName).toLocaleString()}
                    label="Creado Por"
                    disabled
                    fullWidth
                  />
                )}

                {data.updatedByName && (
                  <TextField
                    value={new Date(data.updatedByName).toLocaleString()}
                    label="Actualizado Por"
                    disabled
                    fullWidth
                  />
                )}
              </div>
            )}
          </div>

          <footer className="sp-modal__footer">
            <Button
              variant="secondary"
              onClick={onClose}
              className="sp-modal__btn sp-modal__btn--cancel"
            >
              Cancelar
            </Button>
            {!isView && (
              <Button
                variant="primary"
                type="submit"
                className="sp-modal__btn sp-modal__btn--confirm"
              >
                {mode === "create" ? "Crear" : "Guardar"}
              </Button>
            )}
          </footer>
        </form>
      </div>
    </div>
  );
}