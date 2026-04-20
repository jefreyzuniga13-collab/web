import { useEffect, useMemo, useState } from "react"

type DraftState = {
  addDescription: string
  retiraSucursal: "S" | "N"
  transCost: number
  selectedAddressId: number | null
  observation: string
}

interface Props {
  conversationId: number
  contactId: number
}

export const useCartDraft = ({ conversationId, contactId }: Props) => {
  const key = useMemo(
    () => `cartDraft:v1:${conversationId}:${contactId}`,
    [conversationId, contactId]
  )

  const [state, setState] = useState<DraftState>({
    addDescription: "",
    retiraSucursal: "N",
    transCost: 0,
    selectedAddressId: null,
    observation: "",
  })

  // hidratar
  useEffect(() => {
    const raw = localStorage.getItem(key)
    if (!raw) return

      const parsed = JSON.parse(raw) as DraftState
      setState(parsed)
  }, [key])

  // persistir
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state))
  }, [state, key])

  const update = (partial: Partial<DraftState>) => {
    setState((prev) => ({ ...prev, ...partial }))
  }

  const clear = () => {
    localStorage.removeItem(key)
    setState({
      addDescription: "",
      retiraSucursal: "N",
      transCost: 0,
      selectedAddressId: null,
      observation: "",
    })
  }

  return {
    ...state,
    setAddDescription: (v: string) => update({ addDescription: v }),
    setRetiraSucursal: (v: "S" | "N") => update({ retiraSucursal: v }),
    setTransCost: (v: number) => update({ transCost: v }),
    setSelectedAddressId: (v: number | null) =>
      update({ selectedAddressId: v }),
    setObservation: (v: string) => update({ observation: v }),
    clear,
  }
}