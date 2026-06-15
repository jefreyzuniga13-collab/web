export interface FilterDashboard {
  from: string | null;
  to: string | null;
  agentId: number | null;
  agentName?: string | null;
}


export interface DashboardIndicatorsProj {
  conversacionesCantidad: number;
  proformasEnviadas: number;
  nivelServicio: number;
  tiempoPrimeraRespuestaMinutos: number;
  clientePotencialCantidad: number;
  clienteSeguimientoCantidad: number;
  clienteVentaCantidad: number;
  ventaTotal: number;
  lastConversationCreatedAt: string
}

export interface DashboardIndicatorsByAgentProj extends DashboardIndicatorsProj {
  agentId: number;
  agentName: string;
}

export interface DashboardRatingGlobalProj {
  totalConversations: number;
  excelentRatings: number;
  regularRatings: number;
  negativeRatings: number;
}

export interface DashboardRatingByAgentProj extends DashboardRatingGlobalProj {
  agentId: number;
  agentName: string;
}

export interface DashboardWaitingClientProj {
  id: number;
  contactName?: string | null;
  agentName?: string | null;
  systemDefinedCompanyName?: string | null;
  clientLastMessageAt?: string | null;
  waitingSeconds: number;
  waitingMinutes: number;
}

export interface DashboardAssignmentResponseTimeGlobalProj {
  averageSeconds: number;
  averageMinutes: number;
}

export interface DashboardAssignmentResponseTimeByAdminProj {
  id: number;
  name: string;
  averageSeconds: number;
  averageMinutes: number;
}

export interface DashboardAgentAverageResponseTopClientProj {
  agentId: number;
  agentName: string;
  clienteId: number;
  clientName?: string | null;
  averageSeconds: number;
  conversationCount: number;
}

export interface DashboardAgentAverageResponseByAgentProj {
  agentId: number;
  agentName: string;
  averageSeconds: number;
  averageMinutes: number;
  conversationCount: number;
  responseCount: number;
}