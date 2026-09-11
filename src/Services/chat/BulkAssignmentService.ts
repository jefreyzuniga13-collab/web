import api from '@/Utils/ApiConfig'

import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface'

import type {
  BulkAssignmentAgentResult,
  BulkAssignmentJob,
  BulkAssignmentRequest,
} from '@/Interfaces/Chat/BulkAssignmentInterface'

class BulkAssignmentServi {
  async createAssignmentAsync(
    request: BulkAssignmentRequest
  ): Promise<BulkAssignmentJob> {
    const { data } = await api.post<
      ApiResponse<BulkAssignmentJob>
    >(
      '/Conversations/bulk-assignment',
      request
    )

    return data.data
  }

  async getJobAsync(
    jobKey: string,
    signal?: AbortSignal
  ): Promise<BulkAssignmentJob> {
    const { data } = await api.get<
      ApiResponse<BulkAssignmentJob>
    >(
      `/Conversations/bulk-assignment/${jobKey}`,
      { signal }
    )

    return data.data
  }

  async getAgentResultsAsync(
    jobKey: string,
    signal?: AbortSignal
  ): Promise<BulkAssignmentAgentResult[]> {
    const { data } = await api.get<
      ApiResponse<BulkAssignmentAgentResult[]>
    >(
      `/Conversations/bulk-assignment/${jobKey}/agents`,
      { signal }
    )

    return data.data
  }

  async cancelAsync(
    jobKey: string
  ): Promise<BulkAssignmentJob> {
    const { data } = await api.post<
      ApiResponse<BulkAssignmentJob>
    >(
      `/Conversations/bulk-assignment/${jobKey}/cancel`
    )

    return data.data
  }
}

export const BulkAssignmentService =
  new BulkAssignmentServi()