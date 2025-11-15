export interface UserSessionResponseDto {
  id: number;
  userId: number;
  userName?: string | null;
  loginAt: string;
  logOutAt?: string | null;
  duration?: number | null;
  publicIp?: string | null;
 location?: string | null
  device?: string | null
}

export interface UserSessionRequestDto {
  userId: number;
  userName?: string | null;
  loginAt: string;
  logOutAt?: string | null;
  duration?: string | null;
  publicIp?: string | null;
}

export interface ExportUserSessionPdfArgs {
  sessionId: number;
  title?: string;
  subtitle?: string;
}