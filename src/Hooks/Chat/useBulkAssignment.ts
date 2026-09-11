import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import type { RootState } from "@/Context";

import { BulkAssignmentService } from "@/Services/chat/BulkAssignmentService";

import type {
  BulkAssignmentJob,
  BulkAssignmentRequest,
} from "@/Interfaces/Chat/BulkAssignmentInterface";

const POLLING_INTERVAL = 1500;

const bulkAssignmentKeys = {
  all: ["bulk-assignment"] as const,

  company: (companyId: number) =>
    [...bulkAssignmentKeys.all, companyId] as const,

  job: (
    companyId: number,
    jobKey: string,
  ) =>
    [
      ...bulkAssignmentKeys.company(companyId),
      "job",
      jobKey,
    ] as const,
};

const normalizeStatus = (
  status?: string | null,
): string => {
  return status?.trim().toLowerCase() ?? "";
};

const isCompletedJob = (
  job?: BulkAssignmentJob | null,
): boolean => {
  const status = normalizeStatus(job?.status);

  return status === "completed" || status === "partial";
};

const isFailedJob = (
  job?: BulkAssignmentJob | null,
): boolean => {
  return normalizeStatus(job?.status) === "failed";
};

const isCancelledJob = (
  job?: BulkAssignmentJob | null,
): boolean => {
  return normalizeStatus(job?.status) === "cancelled";
};

const isTerminalJob = (
  job?: BulkAssignmentJob | null,
): boolean => {
  return (
    isCompletedJob(job) ||
    isFailedJob(job) ||
    isCancelledJob(job)
  );
};

const getStorageKey = (
  companyId: number,
): string => {
  return `bulkAssignmentJob:${companyId}`;
};

const readStoredJobKey = (
  companyId: number,
): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const storedJobKey = window.localStorage
    .getItem(getStorageKey(companyId))
    ?.trim();

  return storedJobKey || null;
};

const saveStoredJobKey = (
  companyId: number,
  jobKey: string,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getStorageKey(companyId),
    jobKey,
  );
};

const removeStoredJobKey = (
  companyId: number,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(
    getStorageKey(companyId),
  );
};

const getErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (
    error &&
    typeof error === "object" &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
            detail?: string;
            error?: string;
          };
        };
      }
    ).response;

    const payload = response?.data as
      | {
          message?: string
          detail?: string
          error?: string
          errors?: string[]
        }
      | undefined

    return (
      payload?.errors?.[0] ??
      payload?.message ??
      payload?.detail ??
      payload?.error ??
      fallback
    )
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};

const calculateProgress = (
  job?: BulkAssignmentJob | null,
): number => {
  if (!job) {
    return 0;
  }

  if (isCompletedJob(job)) {
    return 100;
  }

  if (
    typeof job.progressPercentage === "number" &&
    Number.isFinite(job.progressPercentage)
  ) {
    return Math.min(
      100,
      Math.max(
        0,
        Math.round(job.progressPercentage),
      ),
    );
  }

  const total = Number(job.totalRequested ?? 0);
  const processed = Number(job.totalProcessed ?? 0);

  if (total <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round((processed / total) * 100),
    ),
  );
};

export const useBulkAssignment = () => {
  const queryClient = useQueryClient();

  const activeCompanyId = useSelector(
    (state: RootState) =>
      Number(state.company.activeCompanyId ?? 0),
  );

  /**
   * Para usuarios no Root el CompanyId puede no estar
   * almacenado en company.activeCompanyId. El valor 0
   * funciona como ámbito de la empresa autenticada.
   */
  const companyScope =
    Number.isFinite(activeCompanyId) &&
    activeCompanyId > 0
      ? activeCompanyId
      : 0;

  const [jobKey, setJobKey] =
    useState<string | null>(() =>
      readStoredJobKey(companyScope),
    );

  const [
    localErrorMessage,
    setLocalErrorMessage,
  ] = useState<string | null>(null);

  /**
   * Recupera el job activo correspondiente cuando
   * Root cambia de empresa.
   */
  useEffect(() => {
    setJobKey(readStoredJobKey(companyScope));
    setLocalErrorMessage(null);
  }, [companyScope]);

  const createMutation = useMutation<
    BulkAssignmentJob,
    Error,
    BulkAssignmentRequest
  >({
    mutationFn: (request) =>
      BulkAssignmentService.createAssignmentAsync(
        request,
      ),

    onSuccess: (response) => {
      const responseJobKey =
        response.jobKey?.trim();

      if (!responseJobKey) {
        const message =
          "El servidor no retornó el identificador del proceso.";

        setLocalErrorMessage(message);
        toast.error(message);

        return;
      }

      setLocalErrorMessage(null);

      saveStoredJobKey(
        companyScope,
        responseJobKey,
      );

      queryClient.setQueryData(
        bulkAssignmentKeys.job(
          companyScope,
          responseJobKey,
        ),
        response,
      );

      setJobKey(responseJobKey);

      toast.success(
        response.message ??
          "La asignación masiva fue iniciada.",
      );
    },

    onError: (error) => {
      const message = getErrorMessage(
        error,
        "No fue posible iniciar la asignación masiva.",
      );

      setJobKey(null);
      removeStoredJobKey(companyScope);
      setLocalErrorMessage(message);
      toast.error(message);
    },
  });

  const {
    data: job,
    isLoading: isLoadingJob,
    isFetching: isFetchingJob,
    isError: isJobError,
    error: jobError,
    refetch: refetchJobQuery,
  } = useQuery<BulkAssignmentJob, Error>({
    queryKey: bulkAssignmentKeys.job(
      companyScope,
      jobKey ?? "",
    ),

    queryFn: ({ signal }) =>
      BulkAssignmentService.getJobAsync(
        jobKey as string,
        signal,
      ),

    enabled: Boolean(jobKey),

    refetchInterval: (query) => {
      const currentJob = query.state.data;

      if (isTerminalJob(currentJob)) {
        return false;
      }

      return POLLING_INTERVAL;
    },

    refetchIntervalInBackground: true,
    retry: 3,
    staleTime: 0,
  });

  const isCompleted = isCompletedJob(job);
  const isFailed = isFailedJob(job);
  const isCancelled = isCancelledJob(job);

  /**
   * Un error temporal de red no significa que el job
   * haya finalizado. El polling continúa activo.
   */
  const createFailed = createMutation.isError;

  const isPolling =
    Boolean(jobKey) &&
    !isCompleted &&
    !isFailed &&
    !isCancelled &&
    !createFailed;

  const progressPercentage = useMemo(
    () => calculateProgress(job),
    [job],
  );

  const errorMessage = useMemo(() => {
    if (job?.errorMessage) {
      return job.errorMessage;
    }

    if (isJobError) {
      return getErrorMessage(
        jobError,
        "No fue posible consultar el proceso.",
      );
    }

    return localErrorMessage;
  }, [
    isJobError,
    job,
    jobError,
    localErrorMessage,
  ]);

  /**
   * El job ya no necesita persistirse cuando
   * alcanza un estado terminal.
   */
  useEffect(() => {
    if (
      !jobKey ||
      (!isCompleted && !isFailed && !isCancelled)
    ) {
      return;
    }

    removeStoredJobKey(companyScope);
  }, [
    companyScope,
    isCancelled,
    isCompleted,
    isFailed,
    jobKey,
  ]);

  const createAssignment = useCallback(
    async (
      request: BulkAssignmentRequest,
    ): Promise<BulkAssignmentJob> => {
      setLocalErrorMessage(null);

      return createMutation.mutateAsync(request);
    },
    [createMutation],
  );

  const cancelMutation = useMutation<
    BulkAssignmentJob,
    Error,
    void
  >({
    mutationFn: () => {
      if (!jobKey) {
        throw new Error(
          "No hay un proceso de asignación para cancelar.",
        );
      }

      return BulkAssignmentService.cancelAsync(jobKey);
    },

    onSuccess: (response) => {
      if (!jobKey) {
        return;
      }

      queryClient.setQueryData(
        bulkAssignmentKeys.job(
          companyScope,
          jobKey,
        ),
        response,
      );

      if (isCancelledJob(response)) {
        removeStoredJobKey(companyScope);
        toast.info(
          response.message ??
            "La asignación masiva fue cancelada.",
        );
        return;
      }

      toast.success(
        response.message ??
          "El proceso ya había finalizado.",
      );
    },

    onError: (error) => {
      const message = getErrorMessage(
        error,
        "No fue posible cancelar la asignación masiva.",
      );

      setLocalErrorMessage(message);
      toast.error(message);
    },
  });

  const cancelAssignment = useCallback(
    async (): Promise<BulkAssignmentJob | null> => {
      if (!jobKey) {
        return null;
      }

      return cancelMutation.mutateAsync();
    },
    [cancelMutation, jobKey],
  );

  const refetchJob = useCallback(
    async (): Promise<BulkAssignmentJob | null> => {
      if (!jobKey) {
        return null;
      }

      setLocalErrorMessage(null);

      const result = await refetchJobQuery();

      return result.data ?? null;
    },
    [
      jobKey,
      refetchJobQuery,
    ],
  );

  /**
   * Si el job todavía está procesándose, su JobKey
   * permanece en localStorage para recuperarlo al
   * volver a abrir el modal.
   */
  const reset = useCallback((): void => {
    const currentJobKey = jobKey;

    setJobKey(null);
    setLocalErrorMessage(null);

    createMutation.reset();
    cancelMutation.reset();

    if (!currentJobKey) {
      return;
    }

    if (isTerminalJob(job)) {
      removeStoredJobKey(companyScope);
    }

    void queryClient.cancelQueries({
      queryKey: bulkAssignmentKeys.job(
        companyScope,
        currentJobKey,
      ),
    });

    queryClient.removeQueries({
      queryKey: bulkAssignmentKeys.job(
        companyScope,
        currentJobKey,
      ),
    });
  }, [
    cancelMutation,
    companyScope,
    createMutation,
    job,
    jobKey,
    queryClient,
  ]);

  return {
    job: job ?? null,
    jobKey,

    createAssignment,
    cancelAssignment,
    refetchJob,
    reset,

    isSubmitting: createMutation.isPending,
    isCancelling: cancelMutation.isPending,

    isLoadingJob,
    isFetchingJob,
    isPolling,

    isCompleted,
    isCancelled,
    isFailed: isFailed || createFailed,

    hasPollingError: isJobError,

    progressPercentage,
    errorMessage,
  };
};

export default useBulkAssignment;