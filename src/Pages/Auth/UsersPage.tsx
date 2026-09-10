import { useMemo } from "react";

import { IconButton } from "@mui/material";
import SearchFilter from "@/Components/Common/SearchFilter";

import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";

import CustomTable from "@/Components/Common/CustomTable";
import Button from "@/Components/Common/Button";
import Modal from "@/Components/Auth/Modal";
import UserForm from "@/Components/Auth/UserForm";

import useClasicUser from "@/Hooks/Auth/useClasicUser";

import type { Column } from "@/Interfaces/Common/CustomTable";

import type {
  User,
  UpdateUserRequest,
} from "@/Interfaces/Auth/UserInterfaces";

import "@/Styles/Auth/UsersPage.css";

type UserFormData =
  | FormData
  | UpdateUserRequest;

export default function UsersPage() {
  const {
    users,
    selectedUser,
    companies,

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

    create,
    update,
    toggle,

    globalFilter,
    setGlobalFilter,

    loading,
    loadingList,
    loadingItem,

    error,
  } = useClasicUser();

  const columns = useMemo<
    Column<User>[]
  >(
    () => [
      {
        id: "fullName",
        label: "Nombre",
        minWidth: 110,
      },
      {
        id: "codReferenciaPCG",
        label:
          "Código referencia PCG",
        minWidth: 100,
      },
      {
        id: "email",
        label: "Correo",
        minWidth: 140,
      },
      {
        id: "roles",
        label: "Roles",
        minWidth: 100,

        render: (row) =>
          row.roles
            ?.map(
              (role) =>
                role.roleName,
            )
            .join(", ") || "Sin rol",
      },
      {
        id: "isActive",
        label: "Estado",
        minWidth: 90,

        render: (row) => (
          <span
            className={
              row.isActive
                ? "status status--active"
                : "status status--inactive"
            }
          >
            {row.isActive
              ? "Activo"
              : "Inactivo"}
          </span>
        ),
      },
      {
        id: "createdAt",
        label: "Creado",
        minWidth: 100,

        render: (row) =>
          row.createdAt
            ? new Date(
                row.createdAt,
              ).toLocaleDateString(
                "es-NI",
              )
            : "—",
      },
      {
        id: "actions",
        label: "Acciones",
        minWidth: 140,
        align: "center",

        render: (row) => (
          <>
            <IconButton
              type="button"
              size="medium"
              title="Ver usuario"
              aria-label={`Ver ${row.fullName}`}
              disabled={loadingItem}
              onClick={() =>
                openView(row)
              }
            >
              <VisibilityIcon fontSize="medium" />
            </IconButton>

            <IconButton
              type="button"
              size="medium"
              title="Editar usuario"
              aria-label={`Editar ${row.fullName}`}
              disabled={loadingItem}
              onClick={() =>
                openEdit(row)
              }
            >
              <EditIcon fontSize="medium" />
            </IconButton>

            <IconButton
              type="button"
              size="medium"
              title={
                row.isActive
                  ? "Desactivar usuario"
                  : "Activar usuario"
              }
              aria-label={
                row.isActive
                  ? `Desactivar ${row.fullName}`
                  : `Activar ${row.fullName}`
              }
              disabled={loadingItem}
              onClick={() => {
                void toggle(
                  row.userId,
                );
              }}
            >
              {row.isActive ? (
                <ToggleOnIcon
                  fontSize="medium"
                  color="success"
                />
              ) : (
                <ToggleOffIcon fontSize="medium" />
              )}
            </IconButton>
          </>
        ),
      },
    ],
    [
      loadingItem,
      openEdit,
      openView,
      toggle,
    ],
  );

  const handleSubmit = async (
    data: UserFormData,
  ): Promise<void> => {
    if (modalMode === "create") {
      await create(data as FormData);
      return;
    }

    if (modalMode === "edit") {
      await update(
        data as UpdateUserRequest,
      );
    }
  };

  return (
    <div className="users-page__container">
      <div className="users-page__header">
        <div className="users-page__header-content">
          <h1 className="users-page__title">
            Administración de Usuarios
          </h1>

          <p className="users-page__subtitle">
            Gestiona roles, accesos y
            estado de tu equipo.
          </p>
        </div>

        <div className="users-page__btnContainer">
          <Button
            variant="primary"
            onClick={openCreate}
            disabled={
              loading ||
              companies.length === 0
            }
          >
            Nuevo Usuario
          </Button>
        </div>
      </div>

      <div className="table-contaner__search-filter__container">
        <SearchFilter
          value={globalFilter}
          onApply={setGlobalFilter}
          disabled={loadingItem}
        />
      </div>

      {error && (
        <div
          className="users-page__error"
          role="alert"
        >
          {error.message ||
            "No se pudieron cargar los usuarios."}
        </div>
      )}

      <CustomTable<User>
        columns={columns}
        rows={users}
        loading={loadingList}
        count={totalCount}
        page={Math.max(page - 1, 0)}
        rowsPerPage={pageSize}
        rowsPerPageOptions={[
          20,
          30,
          50,
        ]}
        onPageChange={(
          _,
          newPage,
        ) => {
          setPage(newPage + 1);
        }}
        onRowsPerPageChange={(
          event,
        ) => {
          setPageSize(
            Number.parseInt(
              event.target.value,
              10,
            ),
          );
        }}
      />

     <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!loadingItem) {
            closeModal();
          }
        }}
        title={
          modalMode === "create"
            ? "Crear Usuario"
            : modalMode === "edit"
              ? "Editar Usuario"
              : "Detalle Usuario"
        }
        size="medium"
      >
        {modalMode === "create" && (
          <UserForm
            companies={companies}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        )}

        {(modalMode === "edit" ||
          modalMode === "view") &&
          selectedUser && (
            <UserForm
              key={
                selectedUser.userId
              }
              initialData={
                selectedUser
              }
              companies={companies}
              isEditing={
                modalMode === "edit"
              }
              isViewing={
                modalMode === "view"
              }
              onSubmit={
                handleSubmit
              }
              onCancel={closeModal}
            />
          )}
      </Modal>
    </div>
  );
}