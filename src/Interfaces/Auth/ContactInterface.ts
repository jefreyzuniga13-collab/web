import type { User } from "../Auth/UserInterfaces";

export type ContactStatus =
  | 'New'
  | 'PendingApproval'
  | 'Approved'
  | 'Rejected'
  | 'AwaitingFullName'
  | 'AwaitingIdCard'
  | 'Completed';

export type IdType =
  | 'NationalCard'
  | 'Passport'
  | 'ResidenceCard';

export interface ContactLogInterface {
  id: number;
  waName: string | null;
  waId: string | null;
  waUserId?: string | null;
  phone: string;
  idType: IdType | null;
  idCard?: string | null;
  passport?: string | null;
  residenceCard?: string | null;
  fullName?: string | null;
  companyName?: string | null;
  companyId?: number | null;
  clientId?: string | null;
  isProvidingData?: boolean;
  email?: string | null;
  isVerified?: boolean;
  isActive?: boolean;
  status: ContactStatus;
  createdAt: string;
  updatedAt?: string | null;
  verifiedAt?: string | null;
  verifiedId?: number | null;
  verifiedBy?: User | null;
  clienteCodigo?: string;
  clienteNombre?: string;

   ecommerceUserId?: number;
  isSpam?: boolean;

    //  Mismo que el chat, 1 whatsapp, 2 messenger y 3 instagrsm
    metaChannelId: number;


    //Messenger usar el mismo para el instagram al bloquear
    psid?: string;

    messengerPsid?: string;
    messengerFirstName?: string;
    messengerLastName?: string;
    messengerProfilePic?: string;

    //Instagram
    instagramScopedId?: string;
    instegramName?: string;
    instegramUsername?: string;
    instegramProfilePic?: string;
}

export interface ContactFormValues {
  waName: string | null;
  waId: string | null;
  waUserId: string | null;
  phone: string;
  idType: IdType | null;
  idCard: string | null;
  passport: string | null;
  residenceCard: string | null;
  fullName: string | null;
  companyName: string | null;
  companyId: number | null;
  clientId? : string | null;
  status: ContactStatus;
  isVerified: boolean;
  isActive: boolean;
  verifiedAt: string | null;
  verifiedBy: number | null;

  ecommerceUserId?: number


  isBlocked?: boolean;
}

/**
 * Resultado de sp_SearchClientes
 */
export interface ClienteResponseDto {
  codCliente: string;
  nombre: string;
  telefono: string;
  celular?: string;
  direccion: string;
  finalContrato?: string;
  saldoUltimoCorte?: number;
}

export type ClienteDetalleResponseDto = ClienteResponseDto;