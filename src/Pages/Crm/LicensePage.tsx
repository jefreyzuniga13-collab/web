import { useMemo } from "react";
import { CircularProgress, IconButton, Pagination, Tooltip,} from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ToggleOnRoundedIcon from "@mui/icons-material/ToggleOnRounded";
import ToggleOffRoundedIcon from "@mui/icons-material/ToggleOffRounded";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import EventRepeatRoundedIcon from "@mui/icons-material/EventRepeatRounded";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import UpdateRoundedIcon from "@mui/icons-material/UpdateRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import Button from "@/Components/Common/Button";
import Input from "@/Components/Common/Input";
import LicenseModalForm from "@/Components/Crm/LicenseModalForm";
import { CatalogCard } from "@/Components/Crm/CatalogCard";
import type { LicenseProj } from "@/Interfaces/Crm/LicenseInterfaz";
import useLicenses from "@/Hooks/Crm/License/useLicenses";
import "@/Styles/Crm/LicensePage.css";

const normalizeBenefits = (benefits: unknown): string[] => {
  if (Array.isArray(benefits)) {
    return benefits.filter(
      (benefit): benefit is string =>
        typeof benefit === "string" &&
        benefit.trim().length > 0,
    );
  }

  if (typeof benefits === "string") {
    try {
      const parsed: unknown = JSON.parse(benefits);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(
        (benefit): benefit is string =>
          typeof benefit === "string" &&
          benefit.trim().length > 0,
      );
    } catch {
      return benefits.trim()
        ? [benefits.trim()]
        : [];
    }
  }

  return [];
};

const formatDate = (
  value?: string | null,
): string => {
  if (!value) {
    return "Sin registrar";
  }

  const normalizedValue =
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00`
      : value;

  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return "Sin registrar";
  }

  return new Intl.DateTimeFormat("es-NI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export default function LicensePage() {
  const {
    openView,
    openCreate,
    openEdit,
    toggle,
    error,
    data,
    page,
    pageSize,
    totalCount,
    setPage,
    modalMode,
    isModalOpen,
    selectedData,
    closeModal,
    handleSubmit,
    globalFilter,
    setGlobalFilter,
    loading,
    licensePeriods
  } = useLicenses();

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / pageSize),
  );

  const paginationInformation = useMemo(() => {
    if (totalCount === 0) {
      return {
        from: 0,
        to: 0,
      };
    }

    return {
      from: (page - 1) * pageSize + 1,
      to: Math.min(page * pageSize, totalCount),
    };
  }, [page, pageSize, totalCount]);

  const pageSummary = useMemo(() => {
    const active = data.filter(
      (license) => license.isActive,
    ).length;

    const recurrent = data.filter(
      (license) => license.isRecurrent,
    ).length;

    return {
      active,
      inactive: data.length - active,
      recurrent,
    };
  }, [data]);

  const renderActions = (
    license: LicenseProj,
  ) => (
    <>
      <Tooltip title="Ver licencia" arrow>
        <IconButton
          className="license-card__action-button"
          aria-label={`Ver licencia ${license.name}`}
          onClick={() => openView(license)}
        >
          <VisibilityRoundedIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Editar licencia" arrow>
        <IconButton
          className="license-card__action-button"
          aria-label={`Editar licencia ${license.name}`}
          onClick={() => openEdit(license)}
        >
          <EditRoundedIcon />
        </IconButton>
      </Tooltip>

      <Tooltip
        title={
          license.isActive
            ? "Desactivar licencia"
            : "Activar licencia"
        }
        arrow
      >
        <IconButton
          className={[
            "license-card__action-button",
            license.isActive
              ? "license-card__action-button--active"
              : "",
          ].join(" ")}
          aria-label={
            license.isActive
              ? `Desactivar licencia ${license.name}`
              : `Activar licencia ${license.name}`
          }
          onClick={() => toggle(license.id)}
        >
          {license.isActive ? (
            <ToggleOnRoundedIcon />
          ) : (
            <ToggleOffRoundedIcon />
          )}
        </IconButton>
      </Tooltip>
    </>
  );

  return (
    <>
      <main className="license-page">
        <header className="license-page__header">
          <div className="license-page__heading">
            <span className="license-page__eyebrow">
              Configuración comercial
            </span>

            <h1 className="license-page__title">
              Catálogo de licencias
            </h1>

            <p className="license-page__subtitle">
              Administra los planes, periodos,
              beneficios y disponibilidad de las
              licencias del sistema.
            </p>
          </div>

          <div className="license-page__header-actions">
            <Button
              variant="primary"
              onClick={openCreate}
              className="license-page__create-button"
            >
              Nueva licencia
            </Button>
          </div>
        </header>

        <div className="license-page__summary--container">
        <section className="license-page__toolbar">
          <Input
            placeholder="Nombre, descripción o beneficio..."
            value={globalFilter}
            onChange={(event) =>
              setGlobalFilter(event.target.value)
            }
            disabled={loading}
            className="license-page__search"
          />
        </section>

        <section className="license-page__summary">
          <article className="license-page__summary-item">
            <div className="license-page__summary-icon">
              <Inventory2OutlinedIcon />
            </div>

            <div className="license-page__summary-content">
              <span className="license-page__summary-label">
                Total de licencias
              </span>

              <strong className="license-page__summary-value">
                {totalCount}
              </strong>
            </div>
          </article>

          <div className="license-page__summary-divider" />

          <article className="license-page__summary-item">
            <div className="license-page__summary-icon">
              <VerifiedUserOutlinedIcon />
            </div>

            <div className="license-page__summary-content">
              <span className="license-page__summary-label">
                Activas en esta página
              </span>

              <strong className="license-page__summary-value">
                {pageSummary.active}
              </strong>
            </div>
          </article>

          <div className="license-page__summary-divider" />

          <article className="license-page__summary-item">
            <div className="license-page__summary-icon">
              <EventRepeatRoundedIcon />
            </div>

            <div className="license-page__summary-content">
              <span className="license-page__summary-label">
                Recurrentes en esta página
              </span>

              <strong className="license-page__summary-value">
                {pageSummary.recurrent}
              </strong>
            </div>
          </article>

          <div className="license-page__summary-divider" />

          <article className="license-page__summary-item">
            <div className="license-page__summary-icon">
              <BlockOutlinedIcon />
            </div>

            <div className="license-page__summary-content">
              <span className="license-page__summary-label">
                Inactivas en página
              </span>

              <strong className="license-page__summary-value">
                {pageSummary.inactive}
              </strong>
            </div>
          </article>
        </section>

        </div>
        {error && (
          <div
            className="license-page__error"
            role="alert"
          >
            <strong>
              No fue posible cargar las licencias.
            </strong>

            <span>{error.message}</span>
          </div>
        )}

        {loading && data.length === 0 ? (
          <section className="license-page__loading">
            <CircularProgress size={36} />

            <span>Cargando licencias...</span>
          </section>
        ) : data.length > 0 ? (
          <section
            className="license-page__grid"
            aria-label="Listado de licencias"
          >
            {data.map((license) => {
              const benefits = normalizeBenefits(
                license.benefits,
              );

              const periodDescription =
                license.isRecurrent
                  ? license.licensePeriodName ||
                    "Periodo recurrente"
                  : "Licencia no recurrente";

              const monthsDescription =
                license.isRecurrent
                  ? license.licensePeriodMonths
                    ? `${
                        license.licensePeriodMonths
                      } ${
                        license.licensePeriodMonths === 1
                          ? "mes"
                          : "meses"
                      }`
                    : "Sin duración definida"
                  : "Pago único";

              return (
                <CatalogCard
                  key={license.id}
                  title={
                    license.name ||
                    "Licencia sin nombre"
                  }
                  subtitle={periodDescription}
                  description={license.description}
                  statusLabel={
                    license.isActive
                      ? "Activa"
                      : "Inactiva"
                  }
                  isActive={license.isActive}
                  icon={
                    <WorkspacePremiumOutlinedIcon />
                  }
                  tags={benefits}
                  metadata={[
                    {
                      label: "Modalidad",
                      value: license.isRecurrent
                        ? "Suscripción recurrente"
                        : "Licencia única",
                      icon: <EventRepeatRoundedIcon />,
                    },
                    {
                      label: "Duración",
                      value: monthsDescription,
                      icon: (
                        <CalendarMonthOutlinedIcon />
                      ),
                    },
                    {
                      label: "Creado por",
                      value:
                        license.createdByName ||
                        "Sin registrar",
                      icon: (
                        <PersonOutlineRoundedIcon />
                      ),
                    },
                    {
                      label: "Última actualización",
                      value: formatDate(
                        license.updatedAt,
                      ),
                      icon: <UpdateRoundedIcon />,
                    },
                  ]}
                  beneficios
                  footer={
                    <>
                      <span>
                        Creada el{" "}
                        {formatDate(license.createdAt)}
                      </span>

                      {license.updatedByName && (
                        <span>
                          Actualizada por{" "}
                          {license.updatedByName}
                        </span>
                      )}
                    </>
                  }
                  actions={renderActions(license)}
                />
              );
            })}
          </section>
        ) : (
          <section className="license-page__empty">
            <div className="license-page__empty-icon">
              <WorkspacePremiumOutlinedIcon />
            </div>

            <h2>No se encontraron licencias</h2>

            <p>
              {globalFilter
                ? "No existen registros que coincidan con la búsqueda ingresada."
                : "Todavía no se han registrado licencias en el catálogo."}
            </p>

            {!globalFilter && (
              <Button
                variant="primary"
                onClick={openCreate}
                className="license-page__empty-button"
              >
                Crear primera licencia
              </Button>
            )}
          </section>
        )}

        {totalCount > 0 && (
          <footer className="license-page__pagination-container">
            <p className="license-page__pagination-information">
              Mostrando{" "}
              <strong>
                {paginationInformation.from}–
                {paginationInformation.to}
              </strong>{" "}
              de <strong>{totalCount}</strong>{" "}
              licencias
            </p>

            <Pagination
              count={totalPages}
              page={page}
              disabled={loading}
              shape="rounded"
              color="primary"
              siblingCount={1}
              boundaryCount={1}
              onChange={(_, selectedPage) =>
                setPage(selectedPage)
              }
              className="license-page__pagination"
            />
          </footer>
        )}
      </main>

      <LicenseModalForm
        mode={modalMode}
        isOpen={isModalOpen}
        data={selectedData}
        licensePeriods={licensePeriods}
        onClose={closeModal}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </>
  );
}