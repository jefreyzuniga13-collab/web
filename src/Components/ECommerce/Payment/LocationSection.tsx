import React, { useMemo, useState } from "react"
import MapPicker from "@/Components/Common/MapPicker"
import type {
  ClientLocationDto,
  Coords,
  LocationMode
} from "@/Interfaces/Ecommerce/ClientLocationInterface"
import type { BillingFormState } from "@/Interfaces/Ecommerce/InvoiceOrderInterface"

interface Props {
  /**
   * Direcciones guardadas del usuario ecommerce.
   */
  addressList: ClientLocationDto[]

  /**
   * Modo actual de ubicación.
   *
   * Este componente administra únicamente:
   * - existing
   * - new
   *
   * El modo text se muestra mediante OnlyTextAddressSection.
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
   * Datos actuales del formulario de dirección.
   */
  billingForm: BillingFormState

  /**
   * Actualiza el formulario de dirección.
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
   * Dirección guardada actualmente seleccionada.
   */
  selectedAddress: ClientLocationDto | null

  /**
   * Maneja cambios de los campos del formulario.
   */
  handleBillingChange: (event: React.ChangeEvent<HTMLInputElement>) => void

  /**
   * Continúa al paso de moneda o pago.
   */
  handleGoToCurrency: () => void

  /**
   * Regresa al carrito.
   */
  handleGoBack?: () => void

  /**
   * Maneja el cambio de coordenadas desde el mapa.
   */
  handleCoordsChange: (coords: Coords) => void

  /**
   * Indica si la ubicación venía fija desde el carrito.
   */
  isLocked?: boolean

  /**
   * Indica si el pedido será retirado en sucursal.
   */
  isPickup?: boolean
}

/**
 * Normaliza texto para búsquedas.
 */
const normalizeText = (value: unknown): string => {
  return String(value ?? "")
    .toLowerCase()
    .trim()
}

/**
 * Obtiene el identificador numérico de una dirección.
 */
const getAddressId = (address: ClientLocationDto): number | null => {
  if (address.idDireccion == null) {
    return null
  }

  return Number(address.idDireccion)
}

/**
 * Indica si una dirección tiene coordenadas válidas.
 */
const hasCoords = (address: ClientLocationDto): boolean => {
  return address.latitud != null && address.longitud != null
}

/**
 * Sección para seleccionar una dirección guardada o marcar una
 * nueva ubicación en el mapa.
 *
 * El flujo de solo texto se mantiene separado en
 * OnlyTextAddressSection para respetar responsabilidad única.
 */
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
  handleGoBack,
  handleCoordsChange,
  isLocked = false,
  isPickup = false
}: Props) => {
  const [addressSearch, setAddressSearch] = useState("")

  const hasSaved = addressList.length > 0
  const showSavedPanel = !isPickup && locationMode === "existing" && hasSaved
  const showMapPanel = !isPickup && locationMode === "new"

  const filteredAddresses = useMemo(() => {
    const term = normalizeText(addressSearch)

    if (!term) {
      return addressList
    }

    return addressList.filter((address) => {
      const nombre = normalizeText(address.nombre)
      const descripcion = normalizeText(address.descripcion)
      const referencia = normalizeText(address.referencia)

      return (
        nombre.includes(term) ||
        descripcion.includes(term) ||
        referencia.includes(term)
      )
    })
  }, [addressList, addressSearch])

  const selectedAddressText = useMemo(() => {
    if (!selectedAddress) {
      return ""
    }

    return [selectedAddress.nombre, selectedAddress.descripcion, selectedAddress.referencia]
      .map((item) => String(item ?? "").trim())
      .filter(Boolean)
      .join(" · ")
  }, [selectedAddress])

  /**
   * Cambia al modo de dirección guardada.
   */
  const handleUseExistingAddress = () => {
    if (isPickup) return

    setLocationMode("existing")
    setSelectedCoords(null)
    setAddressSearch("")
  }

  /**
   * Cambia al modo de nueva dirección con mapa.
   */
  const handleUseNewAddress = () => {
    if (isPickup) return

    setLocationMode("new")
    setSelectedAddressId(null)
    setSelectedCoords(null)
    setAddressSearch("")

    setBillingForm((previous) => ({
      ...previous,
      address: "",
      addressName: "",
      city: "",
      country: previous.country || "NI"
    }))
  }

  /**
   * Selecciona una dirección guardada y copia sus datos al formulario.
   */
  const handleSelectAddress = (address: ClientLocationDto) => {
    if (isPickup) return

    const addressId = getAddressId(address)

    setLocationMode("existing")
    setSelectedAddressId(addressId)

    if (hasCoords(address)) {
      setSelectedCoords({
        latitud: Number(address.latitud),
        longitud: Number(address.longitud)
      })
    } else {
      setSelectedCoords(null)
    }

    setBillingForm((previous) => ({
      ...previous,
      address: address.descripcion ?? "",
      addressName: address.nombre ?? "",
      city: address.referencia ?? "",
      country: previous.country || "NI"
    }))
  }

  return (
    <div className="checkout-section checkout-section__location">
      {isPickup && (
        <div className="checkout-pickup-info">
          <p>
            <strong>Retiro en sucursal</strong>
          </p>
          <span>
            No se requiere seleccionar dirección ni ubicación en el mapa.
          </span>
        </div>
      )}

      {!isPickup && (
        <div className="checkout-location-mode">
          {hasSaved && (
            <label
              className={
                locationMode === "existing"
                  ? "checkout-location-option checkout-location-option--active"
                  : "checkout-location-option"
              }
            >
              <input
                type="radio"
                name="locationMode"
                value="existing"
                checked={locationMode === "existing"}
                onChange={handleUseExistingAddress}
              />
              <span className="checkout-location-option__content">
                <strong>Dirección guardada</strong>
                <small>Usar una dirección registrada.</small>
              </span>
            </label>
          )}

          <label
            className={
              locationMode === "new"
                ? "checkout-location-option checkout-location-option--active"
                : "checkout-location-option"
            }
          >
            <input
              type="radio"
              name="locationMode"
              value="new"
              checked={locationMode === "new"}
              onChange={handleUseNewAddress}
            />
            <span className="checkout-location-option__content">
              <strong>Marcar en mapa</strong>
              <small>Seleccionar una nueva ubicación.</small>
            </span>
          </label>
        </div>
      )}

      {isLocked && !isPickup && (
        <div className="checkout-location-warning">
          Esta dirección venía seleccionada desde el carrito. Puedes cambiarla
          si necesitas usar otra ubicación.
        </div>
      )}

      <div
        className={
          showMapPanel
            ? "checkout-location-layout checkout-location-layout--map"
            : "checkout-location-layout"
        }
      >
        <section className="checkout-location-primary" aria-label="Ubicación">
          {!isPickup && !hasSaved && locationMode !== "new" && (
            <div className="checkout-location-empty">
              <p>No tienes direcciones guardadas.</p>
              <button
                type="button"
                className="checkout-location-empty__btn"
                onClick={handleUseNewAddress}
              >
                Usar mapa
              </button>
            </div>
          )}

          {showSavedPanel && (
            <div className="checkout-address-panel">
              <div className="checkout-address-search">
                <label className="checkout-label" htmlFor="addressSearch">
                  Buscar dirección
                </label>
                <input
                  id="addressSearch"
                  type="text"
                  className="checkout-input"
                  value={addressSearch}
                  onChange={(event) => setAddressSearch(event.target.value)}
                  placeholder="Buscar por nombre, dirección o referencia"
                />
              </div>

              <div className="checkout-address-list">
                {filteredAddresses.map((address) => {
                  const addressId = getAddressId(address)
                  const isActive =
                    Number(selectedAddressId) === Number(addressId)

                  return (
                    <button
                      key={address.idDireccion}
                      type="button"
                      className={
                        isActive
                          ? "checkout-address checkout-address--active"
                          : "checkout-address"
                      }
                      onClick={() => handleSelectAddress(address)}
                    >
                      <span className="checkout-address__name">
                        {address.nombre || "Dirección sin nombre"}
                      </span>
                      <span className="checkout-address__description">
                        {address.descripcion || "Sin descripción"}
                      </span>
                      {address.referencia && (
                        <span className="checkout-address__reference">
                          {address.referencia}
                        </span>
                      )}
                    </button>
                  )
                })}

                {filteredAddresses.length === 0 && (
                  <div className="checkout-address-empty">
                    No se encontraron direcciones con esa búsqueda.
                  </div>
                )}
              </div>
            </div>
          )}

          {showMapPanel && (
            <div className="checkout-map-panel">
              <p className="checkout-location__hint">
                Haz clic en el mapa para marcar el lugar de entrega.
              </p>
              <MapPicker value={selectedCoords} onChange={handleCoordsChange} />
            </div>
          )}
        </section>

        {!isPickup && (
          <section
            className="checkout-location-details"
            aria-label="Datos de la dirección"
          >
            <div className="checkout-location-details__header">
              <h3 className="checkout-location-details__title">
                Datos de la dirección
              </h3>
              <p className="checkout-location-details__subtitle">
                {locationMode === "new"
                  ? "Completa los datos de la ubicación marcada."
                  : "Revisa o ajusta los datos de la dirección seleccionada."}
              </p>
            </div>

            {locationMode === "existing" && selectedAddress && (
              <div className="checkout-current-location">
                <p>
                  <strong>Seleccionada</strong>
                </p>
                <span>{selectedAddressText}</span>
              </div>
            )}

            <div className="checkout-grid">
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
                />
              </div>

              {locationMode === "new" && (
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
                    placeholder="Casa, trabajo, oficina, etc."
                  />
                </div>
              )}
            </div>

            <div className="checkout-actionBtn">
              {handleGoBack && (
                <button
                  type="button"
                  className="checkout-paybtn__back"
                  onClick={handleGoBack}
                >
                  Regresar
                </button>
              )}
              <button
                type="button"
                className="checkout-paybtn"
                onClick={handleGoToCurrency}
              >
                Continuar
              </button>
            </div>
          </section>
        )}

        {isPickup && (
          <div className="checkout-actionBtn">
            {handleGoBack && (
              <button
                type="button"
                className="checkout-paybtn__back"
                onClick={handleGoBack}
              >
                Regresar
              </button>
            )}
            <button
              type="button"
              className="checkout-paybtn"
              onClick={handleGoToCurrency}
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default LocationSection
