import { useEffect, useMemo, useState, useCallback } from "react";
import Button from "@/Components/Common/Button";
import Input from "@/Components/Common/Input";
import { Label } from "@/Components/Common/Label";
import { Textarea } from "@/Components/Common/Textarea";
import Select from "@/Components/Common/Select";
import { useDynamicParamForm } from "@/Hooks/Setting/useDynamicParamForm";
import type {
  DynamicParamRequiestDto,
  DynamicParamResponseDto,
} from "@/Interfaces/Setting/DynamicParamInterface";
import "@/Styles/Setting/SystemParamForm.css";
import InputEmoji from "react-input-emoji";
import useClasicUser from "@/Hooks/User/useClasicUser";
import CustomMultiAutocomplete, {
  type Option as MultiOption,
} from "@/Components/Common/CustomMultiAutocomplete";

interface DynamicParamModalProps {
  mode: "create" | "edit" | "view";
  isOpen: boolean;
  data?: DynamicParamResponseDto | null;
  onClose: () => void;
  onSubmit: (values: DynamicParamRequiestDto) => void;
}

const typeOptions = [
  { value: "", label: "Seleccione un tipo" },
  { value: "Color", label: "Color" },
  { value: "Text", label: "Texto" },
  { value: "Emoji", label: "Emoji / Icono" },
  { value: "Date", label: "Tiempo" },
  { value: "Users", label: "Usuarios" },
];

export default function DynamicParamsForm({
  mode,
  isOpen,
  data,
  onClose,
  onSubmit,
}: DynamicParamModalProps) {
  const {
    form,
    errors,
    isView,
    isEdit,
    handleChange,
    handleSelect,
    handleSubmit,
    handleCheckbox,
    setForm,
  } = useDynamicParamForm({ mode, data: data || null, onSubmit });

  const {
    users,
    page,
    pageSize,
    totalCount,
    setPage,
    loading,
    fetchPage,
  } = useClasicUser();

  const [allUsers, setAllUsers] = useState<typeof users>([]);

  useEffect(() => {
    if (!isOpen) return;
    setAllUsers([]);
    setPage(1);
    fetchPage(1, pageSize);
  }, [isOpen, setPage, fetchPage, pageSize]);

  useEffect(() => {
    setAllUsers((prev) => {
      const map = new Map(prev.map((u) => [u.userId, u]));
      for (const u of users) {
        map.set(u.userId, u);
      }
      return Array.from(map.values());
    });
  }, [users]);

  const userOptions: MultiOption[] = useMemo(
    () =>
      allUsers.map((u) => ({
        label: u.fullName ?? String(u.userId),
        value: u.userId,
      })),
    [allUsers]
  );

  const selectedUserOptions: MultiOption[] = useMemo(
    () =>
      (form.userIds ?? []).length === 0
        ? []
        : userOptions.filter((opt) =>
            (form.userIds ?? []).includes(Number(opt.value))
          ),
    [form.userIds, userOptions]
  );

  const hasMoreUsers = useMemo(
    () => page * pageSize < totalCount,
    [page, pageSize, totalCount]
  );

  const handleLoadMoreUsers = useCallback(() => {
    if (!hasMoreUsers || loading) return;
    setPage(page + 1);
  }, [hasMoreUsers, loading, page, setPage]);

  if (!isOpen) return null;

  const isColorType = form.type === "Color";
  const isEmojiType = form.type === "Emoji";
  const isDateType = form.type === "Date";
  const isUserType = form.type === "Users";

  const handleEmojiChange = (val: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleChange({ target: { name: "value", value: val } } as any);
  };

  return (
    <div className="sp-modal__overlay">
      <div className="sp-modal__container">
        <header className="sp-modal__header">
          <h2 className="sp-modal__title">
            {mode === "create" && "Crear Parámetro Dinámico"}
            {mode === "edit" && "Editar Parámetro Dinámico"}
            {mode === "view" && "Detalle Parámetro Dinámico"}
          </h2>
          <button
            type="button"
            className="sp-modal__close"
            onClick={onClose}
          >
            x
          </button>
        </header>

        <form className="sp-modal__body" onSubmit={handleSubmit}>
          <div className="sp-modal__grid sp-modal__grid__dynamicParam">
            <div className="sp-modal__col">
              <Label htmlFor="name" className="sp-modal__label ">
                Nombre *
              </Label>
              <Input
                id="name"
                className="sp-modal__input-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={isView || isEdit}
              />
              {errors.name && (
                <div className="sp-modal__error">{errors.name}</div>
              )}
            </div>

            <div className="sp-modal__col sp-modal__col--full">
              <Label htmlFor="label" className="sp-modal__label">
                Etiqueta (Label)
              </Label>
              <Input
                id="label"
                name="label"
                value={form.label ?? ""}
                onChange={handleChange}
                disabled={isView || isEdit}
                className="sp-modal__input"
              />
              {errors.label && (
                <div className="sp-modal__error">{errors.label}</div>
              )}
            </div>

            <div className="sp-modal__col">
              <Label htmlFor="type" className="sp-modal__label">
                Tipo valor *
              </Label>
              <Select
                value={form.type}
                onChange={(e) => handleSelect(e.target.value)}
                options={typeOptions}
                disabled={isView}
                className="sp-modal__select"
              />
              {errors.type && (
                <div className="sp-modal__error">{errors.type}</div>
              )}
            </div>

            {!isUserType && (
              <>
                <div className="sp-modal__col">
                  <Label htmlFor="minValue" className="sp-modal__label">
                    Valor mínimo {isDateType && " - En días"} *
                  </Label>
                  <Input
                    id="minValue"
                    name="minValue"
                    type="number"
                    value={form.minValue}
                    onChange={handleChange}
                    disabled={isView}
                    className="sp-modal__input"
                  />
                  {errors.minValue && (
                    <div className="sp-modal__error">{errors.minValue}</div>
                  )}
                </div>

                <div className="sp-modal__col">
                  <Label htmlFor="maxValue" className="sp-modal__label">
                    Valor máximo {isDateType && " - En días"} *
                  </Label>
                  <Input
                    id="maxValue"
                    name="maxValue"
                    type="number"
                    value={form.maxValue}
                    onChange={handleChange}
                    disabled={isView}
                    className="sp-modal__input"
                  />
                  {errors.maxValue && (
                    <div className="sp-modal__error">{errors.maxValue}</div>
                  )}
                </div>
              </>
            )}

            {isUserType && (
              <div className="sp-modal__col sp-modal__col--full">
                <Label htmlFor="users" className="sp-modal__label">
                  Usuarios a los que aplica
                </Label>

                <CustomMultiAutocomplete
                  label="Usuarios"
                  placeholder="Seleccione usuarios"
                  value={selectedUserOptions}
                  onChange={(newOpts) => {
                    const ids = newOpts.map((opt) => Number(opt.value));
                    setForm((prev) => ({
                      ...prev,
                      userIds: ids,
                    }));
                  }}
                  options={userOptions}
                  hasMore={hasMoreUsers}
                  loading={loading}
                  onLoadMore={handleLoadMoreUsers}
                />
              </div>
            )}

            {!isDateType && !isUserType && (
              <div className="sp-modal__col sp-modal__col--full">
                <Label htmlFor="value" className="sp-modal__label">
                  Valor *
                </Label>

                {isColorType && (
                  <Input
                    id="value"
                    name="value"
                    type="color"
                    value={form.value}
                    onChange={handleChange}
                    disabled={isView}
                    className="sp-modal__input sp-modal__input--color"
                  />
                )}

                {isEmojiType && (
                  <div className="sp-modal__emoji-wrapper">
                    <InputEmoji
                      value={form.value}
                      onChange={handleEmojiChange}
                      shouldReturn={false}
                      shouldConvertEmojiToImage={false}
                    />
                  </div>
                )}

                {!isColorType && !isEmojiType && (
                  <Textarea
                    id="value"
                    name="value"
                    value={form.value}
                    onChange={handleChange}
                    rows={3}
                    disabled={isView}
                    className="sp-modal__input"
                  />
                )}

                {errors.value && (
                  <div className="sp-modal__error">{errors.value}</div>
                )}
              </div>
            )}

            <div className="sp-modal__col sp-modal__col__dynamicParam--full">
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

            <div className="sp-modal__col sp-modal__col--checkbox">
              <Label htmlFor="isActive" className="sp-modal__label">
                Activo
              </Label>
              <div className="sp-modal__checkbox-wrapper">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={handleCheckbox}
                  disabled={isView}
                />
              </div>
            </div>
          </div>

          <footer className="sp-modal__footer">
            <Button
              variant="secondary"
              onClick={onClose}
              type="button"
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
