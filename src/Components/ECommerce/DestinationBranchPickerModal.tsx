import React from "react"
import type { ExistenciaSucursalItem } from "@/Interfaces/Ecommerce/FacturaTempo"
import { SucursalPickerModal } from "@/Components/ECommerce/SucursalPickerModal"
import type { SucursalPickerValue } from "@/Components/ECommerce/SucursalPickerModal"

interface Props {
  open: boolean
  loading?: boolean
  codProducto?: string
  items: ExistenciaSucursalItem[]
  selectedCodSucursal?: string | null
  onClose: () => void
  onConfirm: (value: SucursalPickerValue) => void
}

export function DestinationBranchPickerModal({
  open,
  loading = false,
  codProducto,
  items,
  selectedCodSucursal = null,
  onClose,
  onConfirm,
}: Props) {
  return (
    <SucursalPickerModal
      open={open}
      loading={loading}
      codProducto={codProducto}
      items={items}
      selectedCodSucursal={selectedCodSucursal}
      onClose={onClose}
      onSelect={onConfirm}
    />
  )
}
