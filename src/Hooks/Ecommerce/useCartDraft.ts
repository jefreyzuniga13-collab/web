import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { DestinationSelection } from "@/Hooks/Ecommerce/useDestinationBranchGate"

export type CartDraftState = {
  addDescription: string
  retiraSucursal: "S" | "N"
  transCost: number
  selectedAddressId: number | null
  observation: string
  destinationBranchCode: string | null
  destinationBranchName: string | null
  destinationWherehouseCode: string | null
  destinationWherehouseName: string | null
  destinationSerie: string | null
}

type Options = {
  conversationId: number
  contactId: number
  version?: string
}

const normalizeNumber = (v: unknown, fallback = 0) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return fallback
  return n
}

const normalizeId = (v: unknown): number | null => {
  if (v == null) return null
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return n
}

export function useCartDraft({ conversationId, contactId, version = "v1" }: Options) {
  const draftKey = useMemo(() => `cartDraft:${version}:${conversationId}:${contactId}`, [version, conversationId, contactId])

  const hydratedRef = useRef(false)
  const skipPersistOnceRef = useRef(false)

  const [addDescription, setAddDescription] = useState<string>("")
  const [retiraSucursal, setRetiraSucursal] = useState<"S" | "N">("N")
  const [transCost, setTransCost] = useState<number>(0)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [observation, setObservation] = useState<string>("")

  const [destinationBranchCode, setDestinationBranchCode] = useState<string | null>(null)
  const [destinationBranchName, setDestinationBranchName] = useState<string | null>(null)
  const [destinationWherehouseCode, setDestinationWherehouseCode] = useState<string | null>(null)
  const [destinationWherehouseName, setDestinationWherehouseName] = useState<string | null>(null)
  const [destinationSerie, setDestinationSerie] = useState<string | null>(null)

  const readDraft = useCallback((): CartDraftState | null => {
    try {
      const raw = localStorage.getItem(draftKey)
      if (!raw) return null

      const parsed = JSON.parse(raw) as Partial<CartDraftState>

      const next: CartDraftState = {
        addDescription: String(parsed.addDescription ?? ""),
        retiraSucursal: parsed.retiraSucursal === "S" ? "S" : "N",
        transCost: normalizeNumber(parsed.transCost, 0),
        selectedAddressId: normalizeId(parsed.selectedAddressId),
        observation: String(parsed.observation ?? ""),

        destinationBranchCode: String(parsed.destinationBranchCode ?? "").trim() || null,
        destinationBranchName: String(parsed.destinationBranchName ?? "").trim() || null,
        destinationWherehouseCode: String(parsed.destinationWherehouseCode ?? "").trim() || null,
        destinationWherehouseName: String(parsed.destinationWherehouseName ?? "").trim() || null,
        destinationSerie: String(parsed.destinationSerie ?? "").trim() || null,
      }

      if (next.transCost < 0) next.transCost = 0
      return next
    } catch {
      return null
    }
  }, [draftKey])

  const writeDraft = useCallback(
    (state: CartDraftState) => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(state))
      // eslint-disable-next-line no-empty
      } catch {}
    },
    [draftKey]
  )

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey)
    // eslint-disable-next-line no-empty
    } catch {}
  }, [draftKey])

  const hydrate = useCallback(
    (incoming?: Partial<CartDraftState> | null) => {
      const draft = incoming ?? readDraft()
      hydratedRef.current = true
      if (!draft) return

      skipPersistOnceRef.current = true

      setAddDescription(String(draft.addDescription ?? ""))
      setRetiraSucursal(draft.retiraSucursal === "S" ? "S" : "N")
      setTransCost(normalizeNumber(draft.transCost, 0))
      setSelectedAddressId(normalizeId(draft.selectedAddressId))
      setObservation(String(draft.observation ?? ""))

      setDestinationBranchCode(String(draft.destinationBranchCode ?? "").trim() || null)
      setDestinationBranchName(String(draft.destinationBranchName ?? "").trim() || null)
      setDestinationWherehouseCode(String(draft.destinationWherehouseCode ?? "").trim() || null)
      setDestinationWherehouseName(String(draft.destinationWherehouseName ?? "").trim() || null)
      setDestinationSerie(String(draft.destinationSerie ?? "").trim() || null)
    },
    [readDraft]
  )

  const applyDestination = useCallback((next: DestinationSelection) => {
    setDestinationBranchCode(String(next.destinationBranchCode ?? "").trim() || null)
    setDestinationBranchName(String(next.destinationBranchName ?? "").trim() || null)
    setDestinationWherehouseCode(String(next.destinationWherehouseCode ?? "").trim() || null)
    setDestinationWherehouseName(String(next.destinationWherehouseName ?? "").trim() || null)
    setDestinationSerie(String(next.destinationSerie ?? "").trim() || null)
  }, [])

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!hydratedRef.current) return
    if (skipPersistOnceRef.current) {
      skipPersistOnceRef.current = false
      return
    }

    const next: CartDraftState = {
      addDescription,
      retiraSucursal,
      transCost: normalizeNumber(transCost, 0),
      selectedAddressId,
      observation,

      destinationBranchCode: destinationBranchCode?.trim() || null,
      destinationBranchName: destinationBranchName?.trim() || null,
      destinationWherehouseCode: destinationWherehouseCode?.trim() || null,
      destinationWherehouseName: destinationWherehouseName?.trim() || null,
      destinationSerie: destinationSerie?.trim() || null,
    }

    if (next.transCost < 0) next.transCost = 0
    writeDraft(next)
  }, [
    addDescription,
    retiraSucursal,
    transCost,
    selectedAddressId,
    observation,
    destinationBranchCode,
    destinationBranchName,
    destinationWherehouseCode,
    destinationWherehouseName,
    destinationSerie,
    writeDraft,
  ])

  const state = useMemo<CartDraftState>(
    () => ({
      addDescription,
      retiraSucursal,
      transCost,
      selectedAddressId,
      observation,
      destinationBranchCode,
      destinationBranchName,
      destinationWherehouseCode,
      destinationWherehouseName,
      destinationSerie,
    }),
    [
      addDescription,
      retiraSucursal,
      transCost,
      selectedAddressId,
      observation,
      destinationBranchCode,
      destinationBranchName,
      destinationWherehouseCode,
      destinationWherehouseName,
      destinationSerie,
    ]
  )

  return {
    draftKey,
    hydrated: hydratedRef.current,

    state,

    setAddDescription,
    setRetiraSucursal,
    setTransCost,
    setSelectedAddressId,
    setObservation,

    applyDestination,
    setDestinationBranchCode,
    setDestinationBranchName,
    setDestinationWherehouseCode,
    setDestinationWherehouseName,
    setDestinationSerie,

    readDraft,
    writeDraft,
    hydrate,
    clearDraft,
  }
}