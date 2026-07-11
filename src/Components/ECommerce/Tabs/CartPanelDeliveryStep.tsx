import type {
  ClientLocationDto
} from "@/Interfaces/Ecommerce/ClientLocationInterface"
import { BsPersonBoundingBox } from "react-icons/bs"
import { TbCoins } from "react-icons/tb"
import { safePositiveNumber } from "@/Utils/ECommerce/utils"
import { FaRegNoteSticky } from "react-icons/fa6"
import { FiMapPin } from "react-icons/fi"
import { IoStorefrontOutline } from "react-icons/io5"
import type { SINO } from "@/Interfaces/Ecommerce/FacturaTempo"

interface Props {
  /**
   * Nombre que se usará para generar la factura/PDF.
   */
  invoiceName: string

  /**
   * Actualiza el nombre de facturación.
   */
  setInvoiceName: (value: string) => void

  /**
   * Observación general del pedido.
   */
  observation: string

  /**
   * Actualiza la observación del pedido.
   */
  setObservation: (value: string) => void

  /**
   * Dirección manual ingresada por el agente.
   */
  addDescription: string

  /**
   * Actualiza la dirección manual.
   */
  setAddDescription: (value: string) => void

  /**
   * Costo de transporte digitado por el agente.
   */
  transCost: number

  /**
   * Actualiza el costo de transporte.
   */
  setTransCost: (value: number) => void

  /**
   * Indica si el cliente retira en sucursal.
   */
  retiraSucursal: SINO

  /**
   * Actualiza si retira en sucursal o no.
   */
  setRetiraSucursal: (value: SINO) => void

  /**
   * Indica si el cliente solo debe digitar dirección en checkout.
   * No usa mapa, dirección guardada, dirección del agente ni transporte.
   */
  onlyTextAddress: boolean

  /**
   * Actualiza si el cliente solo digita dirección.
   */
  setOnlyTextAddress: (value: boolean) => void

  /**
   * Bloquea el checkbox de solo texto cuando ya hay retiro,
   * dirección guardada o dirección manual.
   */
  onlyTextAddressDisabled: boolean

  /**
   * Bloquea la dirección manual cuando ya hay dirección guardada,
   * retiro en sucursal o solo texto.
   */
  addressInputsDisabled: boolean

  /**
   * Bloquea transporte cuando retira en sucursal o solo texto.
   */
  transportDisabled: boolean

  /**
   * Bloquea el checkbox de retiro cuando ya hay dirección definida
   * o cuando está activo solo texto.
   */
  pickupDisabled: boolean

  /**
   * Controla si se muestra el modal/lista flotante de direcciones.
   */
  showAddressModal: boolean

  /**
   * Cierra o abre el modal/lista de direcciones.
   */
  setShowAddressModal: (value: boolean) => void

  /**
   * Lista filtrada de direcciones guardadas.
   */
  filteredAddresses: ClientLocationDto[]

  /**
   * Indica si se están cargando direcciones.
   */
  addressLoading: boolean

  /**
   * Total real de direcciones cargadas.
   */
  addressesLength: number

  /**
   * Texto de búsqueda dentro de direcciones guardadas.
   */
  addressSearch: string

  /**
   * Actualiza el texto de búsqueda de direcciones.
   */
  setAddressSearch: (value: string) => void

  /**
   * Dirección seleccionada actualmente.
   */
  selectedAddressId: number | null

  /**
   * Selecciona o deselecciona una dirección guardada.
   */
  applySelectedAddressToLog: (addressId: number) => Promise<void>
}

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
  return (
    <div className="carPCPanel-stepContent">
      <div className="productTab-content-footer">
        <div className="productTab-content__inputContaner">
          <div className="productTab-content__inputs">
            <div className="productTab-content__divContainer">
              <BsPersonBoundingBox fontSize={14} />
              <p className="productTab-content__text">
                Nombre de la persona que recibe
              </p>
            </div>

            <input
              type="text"
              name="invoiceName"
              id="invoiceName"
              className="productTab-content__input"
              placeholder="A nombre de"
              value={invoiceName}
              maxLength={200}
              onChange={(event) => setInvoiceName(event.target.value)}
            />

            <div className="productTab-content__divContainer">
              <FaRegNoteSticky fontSize={14} />
              <p className="productTab-content__text">
                Observaciones generales del pedido
              </p>
            </div>

            <textarea
              rows={5}
              name="observation"
              id="observation"
              className="productTab-content__input"
              placeholder="Observación"
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
            />

            <div className="productTab-content__divContainer">
              <FiMapPin fontSize={14} />
              <p className="productTab-content__text">
                Dirección de entrega
              </p>
            </div>

            <textarea
              rows={5}
              name="descripcion"
              id="descripcion"
              className="productTab-content__input"
              placeholder={
                onlyTextAddress
                  ? "El cliente escribirá la dirección en el checkout"
                  : "Dirección"
              }
              value={addDescription}
              disabled={addressInputsDisabled}
              onChange={(event) => {
                if (addressInputsDisabled) return

                setAddDescription(event.target.value)
              }}
            />

            <div className="productTab-content__divContainer">
              <TbCoins fontSize={14} />
              <p className="productTab-content__text">Costo de envío</p>
            </div>

            <div className="transportationCost__input">
              <input
                type="number"
                min={0}
                name="shipment"
                id="shipment"
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
                className="productTab-content__input transportationCost"
              />
            </div>

            <div className="productTab-content__divContainer">
              <IoStorefrontOutline fontSize={14} />
              <p className="productTab-content__text">
                Retirar en sucursal (sin costo de envío)
              </p>
            </div>

            <div className="transportationCost__input">
              <input
                type="checkbox"
                id="retiraSucursal"
                checked={retiraSucursal === "S"}
                disabled={pickupDisabled}
                onChange={(event) =>
                  setRetiraSucursal(event.target.checked ? "S" : "N")
                }
              />

              <label htmlFor="retiraSucursal">Retira en sucursal</label>
            </div>

            <div className="productTab-content__divContainer">
              <FiMapPin fontSize={14} />
              <p className="productTab-content__text">
                Cliente digita dirección (sin mapa)
              </p>
            </div>

            <div className="transportationCost__input">
              <input
                type="checkbox"
                id="onlyTextAddress"
                checked={onlyTextAddress}
                disabled={onlyTextAddressDisabled}
                onChange={(event) =>
                  setOnlyTextAddress(event.target.checked)
                }
              />

              <label htmlFor="onlyTextAddress">
                Cliente digita dirección
              </label>
            </div>
          </div>
        </div>
      </div>

      {showAddressModal && !onlyTextAddress && (
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
                <div
                  key={address.idDireccion}
                  className={`addressMenu-item ${
                    selectedAddressId === address.idDireccion
                      ? "addressMenu-item--active"
                      : ""
                  }`}
                  onClick={async () => {
                    if (retiraSucursal === "S") return
                    if (onlyTextAddress) return

                    await applySelectedAddressToLog(
                      Number(address.idDireccion)
                    )

                    setShowAddressModal(false)
                  }}
                >
                  <strong>{address.nombre}</strong>
                  <p>{address.descripcion}</p>
                  <small>{address.referencia}</small>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}