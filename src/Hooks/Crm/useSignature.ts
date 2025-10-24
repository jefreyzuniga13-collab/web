import { useCallback, useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { WorkOrderService } from '@/Services/Crm/WorkOrderService'

export function useSignature() {
  const ref = useRef<SignatureCanvas | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const clear = useCallback(() => ref.current?.clear(), [])
  const isEmpty = useCallback(() => ref.current?.isEmpty() ?? true, [])

  const toDataURL = useCallback(() => {
    if (!ref.current || isEmpty()) return null
    return ref.current.getTrimmedCanvas().toDataURL('image/png')
  }, [isEmpty])

  const send = useCallback(async (contactId: string) => {
    const dataUrl = toDataURL()
    if (!dataUrl) throw new Error('Firma vacía')
    setSubmitting(true)
    try {
      return await WorkOrderService.sendSignature(dataUrl, contactId)
    } finally {
      setSubmitting(false)
    }
  }, [toDataURL])

  return { ref, clear, isEmpty, toDataURL, send, submitting }
}