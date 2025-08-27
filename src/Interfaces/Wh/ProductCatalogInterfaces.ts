export interface ProductCatalogRequest{
    id?: number | null;
  name: string | null;
  description: string | null;
  vertical?: string | null;
  isActive: boolean;
}

export interface ProductCatalogResponse{
    id: number;
  name: string | null;
  description?: string | null;
  vertical?: string | null;
  createdByName: string;
  updatedByName?: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean | null;
}


export type HeaderFormat = "NOT_SET" | "ADVERTISING" | "AUTOMOTIVE" | "CONSUMER_PACKAGED_GOODS" 
| "ECOMMERCE" | "ECOMMERCE" | "ENERGY_AND_UTILITIES"
| "ENTERTAINMENT_AND_MEDIA" | "ENTERTAINMENT_AND_MEDIA" | "GAMING"
| "GOVERNMENT_AND_POLITICS" | "MARKETING" | "ORGANIZATIONS_AND_ASSOCIATIONS"
| "PROFESSIONAL_SERVICES" | "RETAIL" | "TECHNOLOGY"
| "TELECOM" | "TRAVEL" | "NON_PROFIT"
| "RESTAURANT" | "HEALTH" | "LUXURY"
| "OTHER";