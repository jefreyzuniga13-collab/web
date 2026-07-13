import { BsPersonBoundingBox } from "react-icons/bs"
import { FaRegNoteSticky } from "react-icons/fa6"
import { IoStorefrontOutline } from "react-icons/io5"
import { TbCoins } from "react-icons/tb"

import type { ClientLocationDto } from "@/Interfaces/Ecommerce/ClientLocationInterface"
import type { SINO } from "@/Interfaces/Ecommerce/FacturaTempo"

import { safePositiveNumber } from "@/Utils/ECommerce/utils"

interface Props {
  invoiceName: string
  setInvoiceName: (value: string) => void

  observation: string
  setObservation: (value: string) => void

  addDescription: string
  setAddDescription: (value: string) => void

  transCost: number
  setTransCost: (value: number) => void

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
  retiraSucursal,
  setRetiraSucursal,
  onlyTextAddress,
  setOnlyTextAddress,
  onlyTextAddressDisabled,
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

  const handlePickupChange = (checked: boolean) => {
    setRetiraSucursal(checked ? "S" : "N")

    if (checked) {
      setOnlyTextAddress(false)
      setAddDescription("")
      setTransCost(0)
      setShowAddressModal(false)
    }
  }

  const handleOnlyTextChange = (checked: boolean) => {
    setOnlyTextAddress(checked)

    if (checked) {
      setAddDescription("")
      setShowAddressModal(false)
    }
  }

  return (
    <div className="carPCPanel-stepContent">
      <div className="productTab-content-footer">
        <div className="productTab-content__inputContaner">
          <div className="productTab-content__inputs">
            <div className="productTab-content__divContainer">
              <BsPersonBoundingBox fontSize={14} />
              <p className="productTab-content__text productTab-content__text--primary">
                Nombre de la persona que recibe
              </p>
            </div>

            <input
              type="text"
              id="invoiceName"
              name="invoiceName"
              className="productTab-content__input"
              placeholder="A nombre de"
              value={invoiceName}
              maxLength={200}
              onChange={(event) => setInvoiceName(event.target.value)}
            />

            <div className="productTab-content__divContainer">
              <FaRegNoteSticky fontSize={14} />
              <p className="productTab-content__text productTab-content__text--primary">
                Observaciones generales del pedido
              </p>
            </div>

            <textarea
              rows={5}
              id="observation"
              name="observation"
              className="productTab-content__input"
              placeholder="Observación"
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
            />

            <div className="productTab-content__divContainer">
              <IoStorefrontOutline fontSize={14} />
              <p className="productTab-content__text productTab-content__text--primary">
                Modalidad de entrega
              </p>
            </div>

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

            {/* <div className="productTab-content__divContainer">
              <FiMapPin fontSize={14} />
              <p className="productTab-content__text productTab-content__text--primary">
                Configuración del checkout
              </p>
            </div> */}

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

            {!onlyTextAddress && !isPickup && (
              <>
                {/* <div className="productTab-content__divContainer">
                  <FiMapPin fontSize={14} />
                  <p className="productTab-content__text productTab-content__text--primary">
                    Dirección de entrega
                  </p>
                </div> */}

                <textarea
                  rows={5}
                  id="descripcion"
                  name="descripcion"
                  className="productTab-content__input"
                  placeholder="Agente ingresa la dirección de entrega"
                  value={addDescription}
                  disabled={addressInputsDisabled}
                  onChange={(event) => {
                    if (!addressInputsDisabled) {
                      setAddDescription(event.target.value)
                    }
                  }}
                />
              </>
            )}

            {onlyTextAddress && !isPickup && (
              <p className="productTab-helperText productTab-helperText--info">
                La dirección será ingresada por el cliente en el checkout, por
                lo que no se requiere una dirección manual en este panel.
              </p>
            )}

            {isPickup && (
              <p className="productTab-helperText productTab-helperText--pickup">
                No se requiere dirección porque el pedido será retirado en
                sucursal.
              </p>
            )}

            <div className="productTab-content__divContainer">
              <TbCoins fontSize={14} />
              <p className="productTab-content__text productTab-content__text--primary">
                Costo de transporte
              </p>
            </div>

            <div className="transportationCost__input">
              <input
                type="number"
                min={0}
                id="shipment"
                name="shipment"
                className="productTab-content__input transportationCost"
                placeholder="C$ transporte"
                value={transCost}
                disabled={transportDisabled}
                onChange={(event) => {
                  if (transportDisabled) return

                  setTransCost(
                    event.target.value === ""
                      ? 0
                      : safePositiveNumber(event.target.value)
                  )
                }}
              />
            </div>
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
            <input
              type="text"
              className="addressMenu-search"
              placeholder="Buscar dirección..."
              value={addressSearch}
              onChange={(event) => setAddressSearch(event.target.value)}
            />

            {addressLoading && <p>Cargando direcciones...</p>}

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