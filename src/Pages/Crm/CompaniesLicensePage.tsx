import { useMemo } from "react";
import {CircularProgress,IconButton,Pagination,Tooltip,} from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import HourglassBottomRoundedIcon from "@mui/icons-material/HourglassBottomRounded";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import UpdateRoundedIcon from "@mui/icons-material/UpdateRounded";
import Button from "@/Components/Common/Button";
import { CatalogCard } from "@/Components/Crm/CatalogCard";
import CompaniesLicenseModalForm from "@/Components/Crm/CompaniesLicenseModalForm";
import type { CompaniesLicenseProj } from "@/Interfaces/Crm/LicenseInterfaz";
import useCompaniesLicenses from "@/Hooks/Crm/License/useCompaniesLicenses";
import { formatDate } from "@/Utils/formatters";
import "@/Styles/Crm/CompaniesLicensePage.css";
import "@/Styles/Crm/LicensePage.css";
import Input from "@/Components/Common/Input";

const normalizeStatus = (statusName?: string | null): string => {
  return statusName?.trim().toLowerCase() ?? "";
};

const getStatusLabel = (license: CompaniesLicenseProj): string => {
  if (license.isExpired) {
    return "Licencia vencida";
  }

  return license.statusName?.trim() || "Sin estado";
};

const isActiveLicense = (license: CompaniesLicenseProj): boolean => {
  if (license.isExpired) {
    return false;
  }

  const normalizedStatus = normalizeStatus(license.statusName);

  return (
    normalizedStatus.includes("activa") || normalizedStatus.includes("active")
  );
};

const safeFormatDate = (value?: string | null): string => {
  if (!value) {
    return "Sin registrar";
  }

  return formatDate(value);
};

const getRemainingDaysLabel = (license: CompaniesLicenseProj): string => {
  if (license.isExpired) {
    return "Licencia vencida";
  }

  const remainingDays = Number(license.remainingDays);

  if (!Number.isFinite(remainingDays)) {
    return "Sin calcular";
  }

  if (remainingDays < 0) {
    return "Licencia vencida";
  }

  if (remainingDays === 0) {
    return "Vence hoy";
  }

  if (remainingDays === 1) {
    return "1 día restante";
  }

  return `${remainingDays} días restantes`;
};

export default function CompaniesLicensePage() {
  const {
    openView,
    openCreate,
    openEdit,
    error,
    data,
    page,
    pageSize,
    totalCount,
    setPage,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setPageSize,
    modalMode,
    isModalOpen,
    selectedData,
    closeModal,
    handleSubmit,
    globalFilter,
    setGlobalFilter,
    loading,
    companyLicenseStatuses,
    changeStatus,
  } = useCompaniesLicenses();

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

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
    const active = data.filter(isActiveLicense).length;

    const expired = data.filter((license) => license.isExpired).length;

    const expiringSoon = data.filter((license) => {
      if (license.isExpired) {
        return false;
      }

      const remainingDays = Number(license.remainingDays);

      return (
        Number.isFinite(remainingDays) &&
        remainingDays >= 0 &&
        remainingDays <= 15
      );
    }).length;

    return {
      active,
      expired,
      expiringSoon,
    };
  }, [data]);

  return (
    <>
      <main className="companies-license-page">
        <header className="companies-license-page__header">
          <div className="companies-license-page__heading">
            <span className="companies-license-page__eyebrow">
              Administración comercial
            </span>

            <h1 className="companies-license-page__title">
              Licencias por empresa
            </h1>

            <p className="companies-license-page__subtitle">
              Administra las licencias asignadas, sus periodos de vigencia,
              estados y fechas de vencimiento.
            </p>
          </div>

          <div className="companies-license-page__header-actions">
            <Button
              variant="primary"
              onClick={openCreate}
              className="companies-license-page__create-button"
            >
              Asignar licencia
            </Button>
          </div>
        </header>

        <div className="companies-license-page__container">
          <section className="companies-license-page__toolbar">
            <Input
              // label="Buscar licencias"
              placeholder="Empresa, licencia, estado u observación..."
              value={globalFilter}
              onChange={(event) => {
                setGlobalFilter(event.target.value);
              }}
              className="companies-license-page__search"
            />
          </section>

          <section className="companies-license-page__summary">
            <div className="companies-license-page__summary-item">
              <div className="companies-license-page__summary-icon">
                <Inventory2OutlinedIcon />
              </div>

              <div className="companies-license-page__summary-content">
                <span className="companies-license-page__summary-label">
                  Licencias registradas
                </span>

                <strong className="companies-license-page__summary-value">
                  {totalCount}
                </strong>
              </div>
            </div>

            <div className="companies-license-page__summary-divider" />

            <div className="companies-license-page__summary-item">
              <div className="companies-license-page__summary-icon">
                <VerifiedUserOutlinedIcon />
              </div>

              <div className="companies-license-page__summary-content">
                <span className="companies-license-page__summary-label">
                  Activas en esta página
                </span>

                <strong className="companies-license-page__summary-value">
                  {pageSummary.active}
                </strong>
              </div>
            </div>

            <div className="companies-license-page__summary-divider" />

            <div className="companies-license-page__summary-item">
              <div className="companies-license-page__summary-icon">
                <HourglassBottomRoundedIcon />
              </div>

              <div className="companies-license-page__summary-content">
                <span className="companies-license-page__summary-label">
                  Por vencer en 15 días
                </span>

                <strong className="companies-license-page__summary-value">
                  {pageSummary.expiringSoon}
                </strong>
              </div>
            </div>

            <div className="companies-license-page__summary-divider" />

            <div className="companies-license-page__summary-item">
              <div className="companies-license-page__summary-icon">
                <ScheduleRoundedIcon />
              </div>

              <div className="companies-license-page__summary-content">
                <span className="companies-license-page__summary-label">
                  Vencidas en página
                </span>

                <strong className="companies-license-page__summary-value">
                  {pageSummary.expired}
                </strong>
              </div>
            </div>
          </section>
        </div>

        {error && (
          <div className="companies-license-page__error" role="alert">
            <strong>No fue posible cargar las licencias.</strong>

            <span>{error.message}</span>
          </div>
        )}

        {loading && data.length === 0 ? (
          <section className="companies-license-page__loading">
            <CircularProgress size={38} />

            <span>Cargando licencias empresariales...</span>
          </section>
        ) : data.length > 0 ? (
          <section
            className="companies-license-page__grid"
            aria-label="Licencias asignadas a empresas"
          >
            {data.map((license) => {
              const statusLabel = getStatusLabel(license);
              const remainingDaysLabel = getRemainingDaysLabel(license);

              return (
                <CatalogCard
                  key={license.id}
                  title={license.licenseName || "Licencia sin nombre"}
                  subtitle={license.companyName || "Empresa sin registrar"}
                  description={license.observation?.trim()}
                  statusLabel={statusLabel}
                  isActive={isActiveLicense(license)}
                  icon={<WorkspacePremiumOutlinedIcon />}
                  tags={[remainingDaysLabel]}
                  metadata={[
                    {
                      label: "Válida desde",
                      value: safeFormatDate(license.validFrom),
                      icon: <EventAvailableOutlinedIcon />,
                    },
                    {
                      label: "Válida hasta",
                      value: safeFormatDate(license.validTo),
                      icon: <CalendarMonthOutlinedIcon />,
                    },
                    {
                      label: "Días restantes",
                      value: remainingDaysLabel,
                      icon: <ScheduleRoundedIcon />,
                    },
                    {
                      label: "Actualizado por",
                      value: license.updatedByName || "Sin actualizaciones",
                      icon: <UpdateRoundedIcon />,
                    },
                  ]}
                  beneficios={false}
                  actions={
                    <>
                      <Tooltip title="Ver licencia" arrow>
                        <IconButton
                          className="companies-license-page__action-button"
                          aria-label={`Ver licencia ${license.licenseName}`}
                          onClick={() => openView(license)}
                        >
                          <VisibilityRoundedIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Editar licencia" arrow>
                        <IconButton
                          className="companies-license-page__action-button"
                          aria-label={`Editar licencia ${license.licenseName}`}
                          onClick={() => openEdit(license)}
                        >
                          <EditRoundedIcon />
                        </IconButton>
                      </Tooltip>

                      <label className="companies-license-page__status-field">
                        <span className="companies-license-page__visually-hidden">
                          Cambiar estado de {license.licenseName}
                        </span>

                        <select
                          value={license.statusId}
                          onChange={(event) => {
                            void changeStatus(
                              license.id,
                              Number(event.target.value),
                            );
                          }}
                          className="companies-license-page__status-select"
                          disabled={
                            loading || companyLicenseStatuses.length === 0
                          }
                          aria-label={`Cambiar estado de ${license.licenseName}`}
                        >
                          {companyLicenseStatuses.length === 0 && (
                            <option value={license.statusId}>
                              {statusLabel}
                            </option>
                          )}

                          {companyLicenseStatuses.map((status) => (
                            <option key={status.id} value={status.id}>
                              {status.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  }
                />
              );
            })}
          </section>
        ) : (
          <section className="companies-license-page__empty">
            <div className="companies-license-page__empty-icon">
              <WorkspacePremiumOutlinedIcon />
            </div>

            <h2>No se encontraron licencias</h2>

            <p>
              {globalFilter
                ? "No existen licencias que coincidan con la búsqueda ingresada."
                : "Todavía no se han asignado licencias a las empresas."}
            </p>

            {!globalFilter && (
              <Button
                variant="primary"
                onClick={openCreate}
                className="companies-license-page__empty-button"
              >
                Asignar primera licencia
              </Button>
            )}
          </section>
        )}

        {totalCount > 0 && (
          <footer className="companies-license-page__pagination-container">
            <p className="companies-license-page__pagination-information">
              Mostrando{" "}
              <strong>
                {paginationInformation.from}–{paginationInformation.to}
              </strong>{" "}
              de <strong>{totalCount}</strong> licencias
            </p>

            <Pagination
              count={totalPages}
              page={page}
              shape="rounded"
              color="primary"
              siblingCount={1}
              boundaryCount={1}
              disabled={loading}
              onChange={(_, selectedPage) => {
                setPage(selectedPage);
              }}
              className="companies-license-page__pagination"
            />
          </footer>
        )}
      </main>

      <CompaniesLicenseModalForm
        mode={modalMode}
        isOpen={isModalOpen}
        data={selectedData}
        onClose={closeModal}
        onSubmit={handleSubmit}
        loading={loading}
      />
    </>
  );
}