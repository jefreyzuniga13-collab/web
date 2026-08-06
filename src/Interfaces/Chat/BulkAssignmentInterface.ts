export type BulkAssignmentJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'partial'
  | 'failed'

export interface BulkAssignmentRequest {
  from: string | null
  to: string | null
  metaChannelId: number | null
  searchConversation: string | null

  useAllAgents: boolean
  agentIds: number[]
  onlyOnlineAgents: boolean

  comment: string | null
}

export interface BulkAssignmentJob {
  jobId: number
  jobKey: string
  status: BulkAssignmentJobStatus | string

  progressPercentage: number

  totalRequested: number
  totalProcessed: number
  totalAssigned: number
  totalSkipped: number
  totalFailed: number

  createdAt: string
  startedAt?: string | null
  completedAt?: string | null

  message?: string | null
  errorMessage?: string | null

  agents?: BulkAssignmentAgentResult[]
}

export interface BulkAssignmentAgentResult {
  agentUserId: number
  agentName: string
  isOnline: boolean

  assignedCount: number
  skippedCount: number

  conversationIds: number[]
  message?: string | null
}

export interface AssignableAgent {
  id: number
  name: string
  email?: string | null
  imageUrl?: string | null
  isOnline: boolean
  isActive: boolean
}

// Interfaces usado en el formulario
export interface BulkAssignmentFormFilters {
  from: string | null;
  to: string | null;
  metaChannelId: number | null;
  searchConversation: string | null;
}

export interface BulkAssignmentFormFilters {
  from: string | null;
  to: string | null;
  metaChannelId: number | null;
  searchConversation: string | null;
}




export type ModalStep = "form" | "processing" | "completed" | "failed";
