import { useCallback, useMemo, useState } from 'react'

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { toast } from 'react-toastify'

import { BulkAssignmentService } from '@/Services/chat/BulkAssignmentService'

import type {
  BulkAssignmentJob,
  BulkAssignmentRequest,
} from '@/Interfaces/Chat/BulkAssignmentInterface'

const bulkAssignmentKeys = {
  all: ['bulk-assignment'] as const,

  job: (jobKey: string) =>
    [
      ...bulkAssignmentKeys.all,
      'job',
      jobKey,
    ] as const,

  agents: (jobKey: string) =>
    [
      ...bulkAssignmentKeys.all,
      'agents',
      jobKey,
    ] as const,
}

const normalizeStatus = (
  status?: string | null
): string => {
  return status
    ?.trim()
    .toLowerCase() ?? ''
}

const completedStatuses = [
  'completed',
  'partial',
]

const failedStatuses = [
  'failed',
]

const isCompletedJob = (
  job?: BulkAssignmentJob | null
): boolean => {
  return completedStatuses.includes(
    normalizeStatus(job?.status)
  )
}

const isFailedJob = (
  job?: BulkAssignmentJob | null
): boolean => {
  return failedStatuses.includes(
    normalizeStatus(job?.status)
  )
}

const getErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string
            detail?: string
            error?: string
          }
        }
      }
    ).response

    return (
      response?.data?.message ??
      response?.data?.detail ??
      response?.data?.error ??
      fallback
    )
  }

  if (error instanceof Error) {
    return error.message || fallback
  }

  return fallback
}

const calculateProgress = (
  job?: BulkAssignmentJob | null
): number => {
  if (!job) {
    return 0
  }

  if (isCompletedJob(job)) {
    return 100
  }

  if (
    typeof job.progressPercentage ===
      'number' &&
    Number.isFinite(
      job.progressPercentage
    )
  ) {
    return Math.min(
      100,
      Math.max(
        0,
        Math.round(
          job.progressPercentage
        )
      )
    )
  }

  const total =
    job.totalRequested ?? 0

  const processed =
    job.totalProcessed ?? 0

  if (total <= 0) {
    return 0
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (processed / total) * 100
      )
    )
  )
}

export const useBulkAssignment = () => {
  const queryClient =
    useQueryClient()

  const [jobKey, setJobKey] =
    useState<string | null>(null)

  const [
    localErrorMessage,
    setLocalErrorMessage,
  ] = useState<string | null>(null)

  const createMutation = useMutation<
    BulkAssignmentJob,
    Error,
    BulkAssignmentRequest
  >({
    mutationFn: request =>
      BulkAssignmentService
        .createAssignmentAsync(
          request
        ),

    onSuccess: response => {
      if (!response.jobKey) {
        const message =
          'El servidor no retornó el identificador del proceso.'

        setLocalErrorMessage(message)
        toast.error(message)

        return
      }

      setLocalErrorMessage(null)
      setJobKey(response.jobKey)

      // Conserva inmediatamente el Job creado.
      queryClient.setQueryData(
        bulkAssignmentKeys.job(
          response.jobKey
        ),
        response
      )

      toast.success(
        response.message ??
          'La asignación masiva fue iniciada.'
      )
    },

    onError: error => {
      const message =
        getErrorMessage(
          error,
          'No fue posible iniciar la asignación masiva.'
        )

      setLocalErrorMessage(message)
      toast.error(message)
    },
  })

  const {
    data: job,
    isLoading: isLoadingJob,
    isFetching: isFetchingJob,
    isError: isJobError,
    error: jobError,
    refetch: refetchJobQuery,
  } = useQuery<
    BulkAssignmentJob,
    Error
  >({
    queryKey:
      bulkAssignmentKeys.job(
        jobKey ?? ''
      ),

    queryFn: ({ signal }) =>
      BulkAssignmentService.getJobAsync(
        jobKey as string,
        signal
      ),

    enabled: Boolean(jobKey),

    refetchInterval: query => {
      const currentJob =
        query.state.data

      if (
        isCompletedJob(currentJob) ||
        isFailedJob(currentJob)
      ) {
        return false
      }

      return 1500
    },

    refetchIntervalInBackground: true,
    retry: 2,
    staleTime: 0,
  })

  const isCompleted =
    isCompletedJob(job)

  const isFailed =
    isFailedJob(job)

  const isPolling =
    Boolean(jobKey) &&
    !isCompleted &&
    !isFailed &&
    !isJobError

  const progressPercentage =
    useMemo(
      () =>
        calculateProgress(job),
      [job]
    )

  const errorMessage =
    useMemo(() => {
      if (job?.errorMessage) {
        return job.errorMessage
      }

      if (isJobError) {
        return getErrorMessage(
          jobError,
          'No fue posible consultar el proceso.'
        )
      }

      return localErrorMessage
    }, [
      isJobError,
      job,
      jobError,
      localErrorMessage,
    ])

  const createAssignment =
    useCallback(
      async (
        request:
          BulkAssignmentRequest
      ): Promise<BulkAssignmentJob> => {
        setLocalErrorMessage(null)

        return await createMutation
          .mutateAsync(request)
      },
      [createMutation]
    )

  const refetchJob =
    useCallback(async () => {
      if (!jobKey) {
        return null
      }

      const result =
        await refetchJobQuery()

      return result.data ?? null
    }, [
      jobKey,
      refetchJobQuery,
    ])

  const reset =
    useCallback(() => {
      const currentJobKey =
        jobKey

      setJobKey(null)
      setLocalErrorMessage(null)

      createMutation.reset()

      if (!currentJobKey) {
        return
      }

      void queryClient.cancelQueries({
        queryKey:
          bulkAssignmentKeys.job(
            currentJobKey
          ),
      })

      queryClient.removeQueries({
        queryKey:
          bulkAssignmentKeys.job(
            currentJobKey
          ),
      })

      queryClient.removeQueries({
        queryKey:
          bulkAssignmentKeys.agents(
            currentJobKey
          ),
      })
    }, [
      createMutation,
      jobKey,
      queryClient,
    ])

  return {
    job: job ?? null,
    jobKey,

    createAssignment,
    refetchJob,
    reset,

    isSubmitting:
      createMutation.isPending,

    isLoadingJob,
    isFetchingJob,
    isPolling,

    isCompleted,
    isFailed,

    progressPercentage,
    errorMessage,
  }
}

export default useBulkAssignment