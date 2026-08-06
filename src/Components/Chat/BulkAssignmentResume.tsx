import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import type {
  BulkAssignmentJob,
  ModalStep,
} from "@/Interfaces/Chat/BulkAssignmentInterface";

import { getStatusLabel, normalizeStatus } from "@/Utils/Chat/Utils";

interface BulkAssignmentResumeProps {
  modalStep: ModalStep;

  progressPercentage: number;

  job: BulkAssignmentJob | null;

  errorMessage: string | null;

  hasPollingError: boolean;

  isRetryingPolling: boolean;

  handleClose: () => void;

  handleRetry: () => void;

  handlePollingRetry: () => void | Promise<void>;
}

const BulkAssignmentResume = ({
  modalStep,
  progressPercentage,
  job,
  errorMessage,
  hasPollingError,
  isRetryingPolling,
  handleClose,
  handleRetry,
  handlePollingRetry,
}: BulkAssignmentResumeProps) => {
  if (modalStep === "form") {
    return null;
  }

  const isPartial = normalizeStatus(job?.status) === "partial";

  const displayedProgress = Math.min(
    100,
    Math.max(0, Number.isFinite(progressPercentage) ? progressPercentage : 0),
  );

  return (
    <>
      {modalStep === "processing" && (
        <div
          className="bulkAssignmentProcessView"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="bulkAssignmentProcessIcon">
            <Loader2 className="bulkAssignmentSpin" />
          </div>

          <h3>Procesando asignación</h3>

          <p>
            Las conversaciones están siendo validadas y distribuidas entre los
            agentes disponibles.
          </p>

          <div className="bulkAssignmentProgress">
            <div className="bulkAssignmentProgress-header">
              <span>Progreso</span>

              <strong>
                {displayedProgress > 0 ? `${displayedProgress}%` : "En proceso"}
              </strong>
            </div>

            <div
              className="bulkAssignmentProgress-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={displayedProgress}
            >
              <div
                className="bulkAssignmentProgress-fill"
                style={{
                  width: displayedProgress > 0 ? `${displayedProgress}%` : "4%",
                }}
              />
            </div>
          </div>

          <div className="bulkAssignmentProcessStats">
            <div>
              <span>Total</span>

              <strong>{job?.totalRequested ?? 0}</strong>
            </div>

            <div>
              <span>Procesadas</span>

              <strong>{job?.totalProcessed ?? 0}</strong>
            </div>

            <div>
              <span>Asignadas</span>

              <strong>{job?.totalAssigned ?? 0}</strong>
            </div>

            <div>
              <span>Omitidas</span>

              <strong>{job?.totalSkipped ?? 0}</strong>
            </div>

            <div>
              <span>Fallidas</span>

              <strong>{job?.totalFailed ?? 0}</strong>
            </div>
          </div>

          <div className="bulkAssignmentProcessStatus">
            Estado: <strong>{getStatusLabel(job?.status)}</strong>
          </div>

          {job?.message && <p>{job.message}</p>}

          {hasPollingError && (
            <div className="bulkAssignmentErrorState" role="alert">
              <AlertCircle />

              <div>
                <strong>No fue posible actualizar el estado</strong>

                <p>
                  {errorMessage ||
                    "El proceso continúa en el servidor, pero no fue posible consultar su estado."}
                </p>
              </div>

              <button
                type="button"
                className="bulkAssignmentTextButton"
                disabled={isRetryingPolling}
                onClick={() => void handlePollingRetry()}
              >
                {isRetryingPolling ? (
                  <>
                    <Loader2 className="bulkAssignmentSpin" />
                    Consultando...
                  </>
                ) : (
                  "Reintentar consulta"
                )}
              </button>
            </div>
          )}

          <div className="bulkAssignmentResultFooter">
            <button
              type="button"
              className="bulkAssignmentButton bulkAssignmentButton--secondary"
              onClick={handleClose}
            >
              Cerrar y continuar en segundo plano
            </button>
          </div>
        </div>
      )}

      {modalStep === "completed" && (
        <div
          className="bulkAssignmentResultView"
          role="status"
          aria-live="polite"
        >
          <div className="bulkAssignmentResultIcon bulkAssignmentResultIcon--success">
            <CheckCircle2 />
          </div>

          <h3>
            {isPartial
              ? "Asignación completada parcialmente"
              : "Asignación completada"}
          </h3>

          <p>
            Se asignaron {job?.totalAssigned ?? 0} de {job?.totalRequested ?? 0}{" "}
            conversaciones.
          </p>

          <div className="bulkAssignmentProcessStats">
            <div>
              <span>Total</span>

              <strong>{job?.totalRequested ?? 0}</strong>
            </div>

            <div>
              <span>Procesadas</span>

              <strong>{job?.totalProcessed ?? 0}</strong>
            </div>

            <div>
              <span>Asignadas</span>

              <strong>{job?.totalAssigned ?? 0}</strong>
            </div>

            <div>
              <span>Omitidas</span>

              <strong>{job?.totalSkipped ?? 0}</strong>
            </div>

            <div>
              <span>Fallidas</span>

              <strong>{job?.totalFailed ?? 0}</strong>
            </div>
          </div>

          {job?.message && <p>{job.message}</p>}

          <div className="bulkAssignmentResultFooter">
            <button
              type="button"
              className="bulkAssignmentButton bulkAssignmentButton--primary"
              onClick={handleClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {modalStep === "failed" && (
        <div
          className="bulkAssignmentResultView"
          role="alert"
          aria-live="assertive"
        >
          <div className="bulkAssignmentResultIcon bulkAssignmentResultIcon--error">
            <AlertCircle />
          </div>

          <h3>No se completó la asignación</h3>

          <p>
            {errorMessage ||
              job?.errorMessage ||
              "El proceso finalizó con un error inesperado."}
          </p>

          <div className="bulkAssignmentProcessStats">
            <div>
              <span>Total</span>

              <strong>{job?.totalRequested ?? 0}</strong>
            </div>

            <div>
              <span>Procesadas</span>

              <strong>{job?.totalProcessed ?? 0}</strong>
            </div>

            <div>
              <span>Asignadas</span>

              <strong>{job?.totalAssigned ?? 0}</strong>
            </div>

            <div>
              <span>Omitidas</span>

              <strong>{job?.totalSkipped ?? 0}</strong>
            </div>

            <div>
              <span>Fallidas</span>

              <strong>{job?.totalFailed ?? 0}</strong>
            </div>
          </div>

          <div className="bulkAssignmentResultFooter">
            <button
              type="button"
              className="bulkAssignmentButton bulkAssignmentButton--secondary"
              onClick={handleClose}
            >
              Cerrar
            </button>

            <button
              type="button"
              className="bulkAssignmentButton bulkAssignmentButton--primary"
              onClick={handleRetry}
            >
              Intentar nuevamente
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkAssignmentResume;