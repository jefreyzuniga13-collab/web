import React from "react"

import MapPicker from "@/Components/Common/MapPicker"

import type {
  ClientLocationDto,
  Coords,
  LocationMode
} from "@/Interfaces/Ecommerce/ClientLocationInterface"

import type {
  BillingFormState
} from "@/Interfaces/Ecommerce/InvoiceOrderInterface"

interface Props {
  /**
   * Direcciones guardadas del usuario ecommerce.
   */
  addressList: ClientLocationDto[] | []

  /**
   * Modo actual de ubicación.
   *
   * existing:
   * Usa una dirección guardada.
   *
   * new:
   * Usa una nueva ubicación marcada en el mapa.
   */
  locationMode: LocationMode

  /**
   * Actualiza el modo de ubicación.
   */
  setLocationMode: (locationMode: LocationMode) => void

  /**
   * Id de la dirección guardada seleccionada.
   */
  selectedAddressId: number | null

  /**
   * Actualiza la dirección guardada seleccionada.
   */
  setSelectedAddressId: (selectedAddressId: number | null) => void

  /**
   * Datos del formulario de facturación/dirección.
   */
  billingForm: BillingFormState

  /**
   * Actualiza el formulario de facturación/dirección.
   */
  setBillingForm: React.Dispatch<React.SetStateAction<BillingFormState>>

  /**
   * Coordenadas seleccionadas en el mapa.
   */
  selectedCoords: Coords | null

  /**
   * Actualiza las coordenadas seleccionadas.
   */
  setSelectedCoords: (selectedCoords: Coords | null) => void

  /**
   * Dirección seleccionada completa.
   * Se usa solo para mostrar un resumen visual.
   */
  selectedAddress: ClientLocationDto | null

  /**
   * Maneja cambios del formulario.
   */
  handleBillingChange: (event: React.ChangeEvent<HTMLInputElement>) => void

  /**
   * Continúa al paso de divisa/pago.
   */
  handleGoToCurrency: () => void

  /**
   * Maneja cambios de coordenadas desde el mapa.
   */
  handleCoordsChange: (coords: Coords) => void

  /**
   * Bloquea el cambio de ubicación cuando la dirección ya viene fija
   * desde el LogCart.
   */
  isLocked?: boolean

  /**
   * Indica si el pedido será retirado en sucursal.
   * En ese caso no se requiere mapa ni dirección.
   */
  isPickup?: boolean
}

export const LocationSection = ({
  addressList,
  locationMode,
  setLocationMode,
  selectedAddressId,
  setSelectedAddressId,
  setSelectedCoords,
  billingForm,
  setBillingForm,
  selectedAddress,
  selectedCoords,
  handleBillingChange,
  handleGoToCurrency,
  handleCoordsChange,
  isLocked = false,
  isPickup = false
}: Props) => {
  const hasSaved = addressList.length > 0

  /**
   * Cambia a dirección guardada.
   */
  const handleUseExistingAddress = () => {
    if (isLocked || isPickup) return

    setLocationMode("existing")
  }

  /**
   * Cambia a nueva dirección en mapa.
   *
   * Limpia dirección seleccionada y coordenadas anteriores para evitar
   * mezclar información vieja con la nueva ubicación.
   */
  const handleUseNewAddress = () => {
    if (isLocked || isPickup) return

    setLocationMode("new")
    setSelectedAddressId(null)
    setSelectedCoords(null)

    setBillingForm((prev) => ({
      ...prev,
      address: prev.addressName ? "" : prev.address,
      addressName: ""
    }))
  }

  /**
   * Selecciona una dirección guardada y copia sus datos al formulario.
   */
  const handleSelectAddress = (address: ClientLocationDto) => {
    if (isLocked || isPickup) return

    const addressId = address.idDireccion ?? null

    setSelectedAddressId(addressId)

    if (
      address.latitud !== undefined &&
      address.longitud !== undefined
    ) {
      setSelectedCoords({
        latitud: Number(address.latitud),
        longitud: Number(address.longitud)
      })
    } else {
      setSelectedCoords(null)
    }

    setBillingForm((prev) => ({
      ...prev,
      address: address.descripcion ?? prev.address,
      addressName: address.nombre ?? prev.addressName
    }))
  }

  return (
    <div className="checkout-section checkout-section__location">
      <div className="checkout-location__container">
        <h2 className="checkout-section__title">
          Marca tu ubicación en el mapa o selecciona una guardada
        </h2>

        {isPickup && (
          <div className="checkout-pickup-info">
            <p>
              <strong>Retiro en sucursal</strong>
              <br />
              No se requiere seleccionar dirección ni ubicación en el mapa.
            </p>
          </div>
        )}

        {!isPickup && (
          <div className="checkout-location-mode">
            {hasSaved ? (
              <>
                <label className="checkout-location-option">
                  <input
                    type="radio"
                    name="locationMode"
                    value="existing"
                    checked={locationMode === "existing"}
                    onChange={handleUseExistingAddress}
                    disabled={isLocked}
                  />
                  Usar una dirección guardada
                </label>

                <label className="checkout-location-option">
                  <input
                    type="radio"
                    name="locationMode"
                    value="new"
                    checked={locationMode === "new"}
                    onChange={handleUseNewAddress}
                    disabled={isLocked}
                  />
                  Usar nueva dirección en el mapa
                </label>
              </>
            ) : (
              <p>
                No tienes direcciones guardadas. Selecciona una ubicación en el
                mapa.
              </p>
            )}
          </div>
        )}

        {!isPickup && locationMode === "existing" && hasSaved && (
          <div className="checkout-address-list">
            {addressList.map((address) => {
              const isActive =
                Number(selectedAddressId) === Number(address.idDireccion)

              return (
                <button
                  key={address.idDireccion}
                  type="button"
                  disabled={isLocked}
                  className={
                    isActive
                      ? "checkout-address checkout-address--active"
                      : "checkout-address"
                  }
                  onClick={() => handleSelectAddress(address)}
                >
                  <span className="checkout-address__name">
                    {address.nombre}
                  </span>

                  <span className="checkout-address__description">
                    {address.descripcion}
                  </span>

                  {address.referencia && (
                    <span className="checkout-address__description">
                      {address.referencia}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {!isPickup && locationMode === "new" && (
          <MapPicker
            value={selectedCoords}
            onChange={handleCoordsChange}
          />
        )}
      </div>

      <div className="checkout-grid__container">
        {!isPickup && locationMode === "existing" && selectedAddress && (
          <div className="checkout-current-location">
            <p>
              <strong>Dirección seleccionada:</strong>
            </p>
            <p>{selectedAddress.descripcion}</p>

            {selectedAddress.referencia && (
              <p>{selectedAddress.referencia}</p>
            )}
          </div>
        )}

        {!isPickup && locationMode === "new" && (
          <div className="checkout-current-location">
            <p className="checkout-location__hint">
              Haz clic en el mapa para marcar el lugar de entrega.
            </p>
          </div>
        )}

        <div className="checkout-grid">
          <div className="checkout-field">
            <label className="checkout-label" htmlFor="firstName">
              Nombre
            </label>

            <input
              id="firstName"
              type="text"
              className="checkout-input"
              value={billingForm.firstName}
              onChange={handleBillingChange}
              disabled={isLocked && locationMode !== "new"}
            />
          </div>

          <div className="checkout-field">
            <label className="checkout-label" htmlFor="lastName">
              Apellidos
            </label>

            <input
              id="lastName"
              type="text"
              className="checkout-input"
              value={billingForm.lastName}
              onChange={handleBillingChange}
              disabled={isLocked && locationMode !== "new"}
            />
          </div>

          <div className="checkout-field">
            <label className="checkout-label" htmlFor="country">
              País
            </label>

            <input
              id="country"
              type="text"
              className="checkout-input"
              value={billingForm.country}
              onChange={handleBillingChange}
              disabled={isLocked && locationMode !== "new"}
            />
          </div>

          <div className="checkout-field">
            <label className="checkout-label" htmlFor="city">
              Ciudad
            </label>

            <input
              id="city"
              type="text"
              className="checkout-input"
              value={billingForm.city}
              onChange={handleBillingChange}
              disabled={isLocked && locationMode !== "new"}
            />
          </div>

          <div className="checkout-field checkout-field--full">
            <label className="checkout-label" htmlFor="address">
              Dirección
            </label>

            <input
              id="address"
              type="text"
              className="checkout-input"
              value={billingForm.address}
              onChange={handleBillingChange}
              disabled={isLocked && locationMode !== "new"}
            />
          </div>

          {locationMode === "new" && !isPickup && (
            <div className="checkout-field checkout-field--full">
              <label className="checkout-label" htmlFor="addressName">
                Nombre de la dirección
              </label>

              <input
                id="addressName"
                type="text"
                className="checkout-input"
                value={billingForm.addressName}
                onChange={handleBillingChange}
                disabled={isLocked}
              />
            </div>
          )}
        </div>

        <button
          type="button"
          className="checkout-paybtn"
          onClick={handleGoToCurrency}
        >
          Continuar a pago
        </button>
      </div>
    </div>
  )
}

export default LocationSection