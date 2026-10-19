import { useEffect, useState } from "react"
import { BsPersonBoundingBox } from "react-icons/bs"
import { FaRegNoteSticky } from "react-icons/fa6"
import { IoStorefrontOutline } from "react-icons/io5"
import { TbCoins } from "react-icons/tb"

import Input from "@/Services/Components/Common/Input"
import { Label } from "@/Services/Components/Common/Label"
import { Textarea } from "@/Services/Components/Common/Textarea"
import ListSkeleton from "@/Services/Components/Common/ListSkeleton"

import type { ClientLocationDto } from "@/Interfaces/Ecommerce/ClientLocationInterface"
import type { SINO } from "@/Interfaces/Ecommerce/FacturaTempo"

import { safePositiveNumber, limpiarMontoTexto } from "@/Utils/ECommerce/utils"

interface Props {
  invoiceName: string
  setInvoiceName: (value: string) => void

  observation: string
  setObservation: (value: string) => void

  addDescription: string
  setAddDescription: (value: string) => void

  transCost: number
  setTransCost: (value: number) => void

  /** Recalcula totales al salir de dirección / transporte. */
  onRecalcTotals?: () => void

  retiraSucursal: SINO
  setRetiraSucursal: (value: SINO) => void

  onlyTextAddress: boolean
  setOnlyTextAddress: (value: boolean) => void

  onlyTextAddressDisabled: boolean
  addressInputsDisabled: boolean
  transportDisabled: boolean
  pickupDisabled: boolean

  showAddressModal: boolean
  setShowAddressModal: (value: boolean) => void

  filteredAddresses: ClientLocationDto[]
  addressLoading: boolean
  addressesLength: number
  addressSearch: string
  setAddressSearch: (value: string) => void
  selectedAddressId: number | null

  applySelectedAddressToLog: (addressId: number) => Promise<void>
}

/** Paso de entrega del carrito administrado por el agente. */
export default function CartPanelDeliveryStep({
  invoiceName,
  setInvoiceName,
  observation,
  setObservation,
  addDescription,
  setAddDescription,
  transCost,
  setTransCost,
  onRecalcTotals,
  retiraSucursal,
  setRetiraSucursal,
  onlyTextAddress,
  setOnlyTextAddress: _setOnlyTextAddress,
  onlyTextAddressDisabled: _onlyTextAddressDisabled,
  addressInputsDisabled,
  transportDisabled,
  pickupDisabled,
  showAddressModal,
  setShowAddressModal,
  filteredAddresses,
  addressLoading,
  addressesLength,
  addressSearch,
  setAddressSearch,
  selectedAddressId,
  applySelectedAddressToLog
}: Props) {
  const isPickup = retiraSucursal === "S"

  const [transCostText, setTransCostText] = useState(
    transCost > 0 ? String(transCost) : ""
  )

  useEffect(() => {
    setTransCostText(transCost > 0 ? String(transCost) : "")
  }, [transCost])

  const handlePickupChange = (checked: boolean) => {
    setRetiraSucursal(checked ? "S" : "N")

    if (checked) {
      setAddDescription("")
      setTransCost(0)
      setTransCostText("")
      setShowAddressModal(false)
    }
  }

  const handleTransCostChange = (value: string) => {
    if (transportDisabled) return

    const limpio = limpiarMontoTexto(value)

    if (limpio === "" || limpio === ".") {
      setTransCostText(limpio)
      setTransCost(0)
      return
    }

    setTransCostText(limpio)
    setTransCost(safePositiveNumber(parseFloat(limpio) || 0))
  }

  const handleTransCostBlur = () => {
    if (transportDisabled) return

    const monto = safePositiveNumber(parseFloat(transCostText) || 0)
    setTransCost(monto)
    setTransCostText(monto > 0 ? String(monto) : "")
    onRecalcTotals?.()
  }

  return (
    <div className="carPCPanel-stepContent">
      <div className="productTab-content-footer">
        <div className="productTab-content__inputContaner">
          <div className="productTab-content__inputs">
            <Label htmlFor="invoiceName" icon={BsPersonBoundingBox}>
              Nombre de la persona que recibe
            </Label>

            <Input
              type="text"
              id="invoiceName"
              name="invoiceName"
              placeholder="A nombre de"
              value={invoiceName}
              maxLength={200}
              onChange={(event) => setInvoiceName(event.target.value)}
            />

            <Label htmlFor="observation" icon={FaRegNoteSticky}>
              Observaciones generales del pedido
            </Label>

            <Textarea
              id="observation"
              name="observation"
              rows={5}
              placeholder="Observación"
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
            />

            <Label htmlFor="retiraSucursal" icon={IoStorefrontOutline}>
              Modalidad de entrega
            </Label>

            <div className="transportationCost__input">
              <input
                type="checkbox"
                id="retiraSucursal"
                checked={isPickup}
                disabled={pickupDisabled}
                onChange={(event) => handlePickupChange(event.target.checked)}
              />

              <label htmlFor="retiraSucursal" className="productTab-optionText">
                Retirar en sucursal, sin costo de envío
              </label>
            </div>

            {/* Opción "cliente escribe dirección" oculta por ahora.
            <div className="transportationCost__input">
              <input
                type="checkbox"
                id="onlyTextAddress"
                checked={onlyTextAddress}
                disabled={onlyTextAddressDisabled}
                onChange={(event) =>
                  handleOnlyTextChange(event.target.checked)
                }
              />

              <label htmlFor="onlyTextAddress" className="productTab-optionText">
                El cliente escribirá la dirección en texto, sin mapa
              </label>
            </div>
            */}

            {!onlyTextAddress && !isPickup && (
              <Textarea
                id="descripcion"
                name="descripcion"
                rows={5}
                placeholder="Agente ingresa la dirección de entrega"
                value={addDescription}
                disabled={addressInputsDisabled}
                onChange={(event) => {
                  if (!addressInputsDisabled) {
                    setAddDescription(event.target.value)
                  }
                }}
                onBlur={() => {
                  if (!addressInputsDisabled) {
                    onRecalcTotals?.()
                  }
                }}
              />
            )}

            {/*
            {onlyTextAddress && !isPickup && (
              <p className="productTab-helperText productTab-helperText--info">
                La dirección será ingresada por el cliente en el checkout, por
                lo que no se requiere una dirección manual en este panel.
              </p>
            )}
            */}

            {isPickup && (
              <p className="productTab-helperText productTab-helperText--pickup">
                No se requiere dirección porque el pedido será retirado en
                sucursal.
              </p>
            )}

            <Label htmlFor="shipment" icon={TbCoins}>
              Costo de transporte
            </Label>

            <Input
              type="text"
              inputMode="decimal"
              id="shipment"
              name="shipment"
              placeholder="Ej. 100"
              value={transCostText}
              disabled={transportDisabled}
              onChange={(event) => handleTransCostChange(event.target.value)}
              onBlur={handleTransCostBlur}
            />
          </div>
        </div>
      </div>

      {showAddressModal && !onlyTextAddress && !isPickup && (
        <div className="addressMenu">
          <div className="addressMenu__header">
            <strong>Direcciones</strong>

            <button
              type="button"
              className="addressMenu-close"
              onClick={() => setShowAddressModal(false)}
            >
              Cerrar
            </button>
          </div>

          <div className="addressMenu__content">
            <Input
              type="text"
              placeholder="Buscar dirección..."
              value={addressSearch}
              onChange={(event) => setAddressSearch(event.target.value)}
            />

            {addressLoading && <ListSkeleton variant="list" count={3} />}

            {!addressLoading && filteredAddresses.length === 0 && (
              <p>
                {addressesLength === 0
                  ? "No hay direcciones registradas"
                  : "No hay resultados"}
              </p>
            )}

            {!addressLoading &&
              filteredAddresses.map((address) => (
                <button
                  key={address.idDireccion}
                  type="button"
                  className={
                    selectedAddressId === address.idDireccion
                      ? "addressMenu-item addressMenu-item--active"
                      : "addressMenu-item"
                  }
                  onClick={async () => {
                    if (
                      isPickup ||
                      onlyTextAddress ||
                      address.idDireccion == null
                    ) {
                      return
                    }

                    await applySelectedAddressToLog(
                      Number(address.idDireccion)
                    )

                    setShowAddressModal(false)
                  }}
                >
                  <strong>{address.nombre || "Dirección sin nombre"}</strong>
                  <p>{address.descripcion || "Sin descripción"}</p>
                  {address.referencia && <small>{address.referencia}</small>}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
