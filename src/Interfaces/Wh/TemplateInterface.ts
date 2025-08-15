export interface WaTemplateRequestDto{
    id: number;
    externalName: string;
    language: string;
    templateCategoryId: number | null;
    templateCategoryName: string | null;
    templateStatus: string | null;
    externalId?: string | null;
    componentsJson?: string | null;
    isActive: boolean
}

export interface WaTemplateResponseDto{
    id: number;
    name: string;
    externalId: string;
    templateCategoryId: number;
    templateCategoryName: string;
    language: string;
    status: string;
    components: string;
    isActive: boolean;
    createdAt: Date | string;
    updatedAt: Date | string;
    updatedByName: string;
    createdByName: string;
}

export type HeaderFormat = "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
export type ButtonType = "QUICK_REPLY" | "URL" | "PHONE_NUMBER"

export type HeaderComponent = | { type: "HEADER"; Format: "TEXT"; text: string} |
{
      type: "HEADER";
      format: Exclude<HeaderFormat, "TEXT">; //IMAGE | VIDEO | DOCUMENT
      example?: { header_handle: string[] };
};

export type FooterComponent = { type: "FOOTER"; text: string };

export type BodyComponent = {type: "BODY", text: string};

export type ButtonsComponent = {
  type: "BUTTONS";
  buttons: (
    | { type: "QUICK_REPLY"; text: string }
    | { type: "URL"; text: string; url: string } // incluir {{1}} como variable
    | { type: "PHONE_NUMBER"; text: string; phone_number: string }
  )[];
};

export type TemplateComponents =
  | HeaderComponent
  | BodyComponent
  | FooterComponent
  | ButtonsComponent;