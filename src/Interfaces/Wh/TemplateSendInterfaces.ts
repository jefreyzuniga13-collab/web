export type SendTemplateItemResult = {
  phone: string
  success: boolean
  wamid?: string | null
  error?: string | null
}

export type SendTemplateBatchRequest = {
  templateName: string            // snake_case (ExternalName en tu BD)
  language: string                // ej "es" | "es_MX"
  headerMediaId?: string | null
  headerMediaUrl?: string | null
  buttonUrlBase?: string | null
  recipients: Array<{
    phone: string
    fullName?: string | null
    variables?: string[] | null   // {{1}}, {{2}}, ... del BODY
    headerVar?: string | null //variables para el header
    headerVariables?: string[] | null;
    headerMediaId?: string | null
    headerMediaUrl?: string | null
    buttonUrlParam?: string | null // si botón URL usa {{1}}
  }>
}

export type SendTemplateBatchResult = {
  total: number
  sent: number
  failed: number
  items: SendTemplateItemResult[]
}
