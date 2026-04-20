import React from "react";
import type { ClientLocationDto, Coords, LocationMode } from "@/Interfaces/Ecommerce/ClientLocationInterface";
import type { BillingFormState } from "@/Interfaces/Ecommerce/InvoiceOrderInterface";
import MapPicker from "@/Components/Common/MapPicker";

interface Props {
  addressList: ClientLocationDto[] | [];
  locationMode: LocationMode;
  setLocationMode: (locationMode: LocationMode) => void;
  selectedAddressId: number | null;
  setSelectedAddressId: (selectedAddressId: number | null) => void;
  billingForm: BillingFormState;
  setBillingForm: React.Dispatch<React.SetStateAction<BillingFormState>>;
  selectedCoords: Coords | null;
  setSelectedCoords: (selectedCoords: Coords | null) => void;
  selectedAddress: ClientLocationDto | null;
  handleBillingChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleGoToCurrency: () => void;
  handleCoordsChange: (coords: Coords) => void;
  isLocked?: boolean;
  isPickup?: boolean;
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
  const hasSaved = addressList.length > 0;

  return (
    <div className="checkout-section checkout-section__location">
      <div className="checkout-location__container">
        <h2 className="checkout-section__title">Selecciona la ubicación y tus datos</h2>

        {isPickup && (
              <div className="checkout-pickup-info">
                <p>
                  <strong>Retiro en sucursal</strong><br />
                  No se requiere seleccionar dirección ni ubicación en el mapa.
                </p>
              </div>
            )}

        <div className="checkout-location-mode">
          {hasSaved ? (
            <>
              <label className="checkout-location-option">
                <input
                  type="radio"
                  name="locationMode"
                  value="existing"
                  checked={locationMode === "existing"}
                  onChange={() => {
                    if (isLocked) return;
                    setLocationMode("existing");
                  }}
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
                  onChange={() => {
                    if (isLocked) return;
                    setLocationMode("new");
                    setSelectedAddressId(null);
                    setSelectedCoords(null);
                    setBillingForm((prev) => ({
                      ...prev,
                      address: prev.addressName ? "" : prev.address,
                      addressName: "",
                    }));
                  }}
                  disabled={isLocked}
                />
                Usar nueva dirección en el mapa
              </label>
            </>
          ) : (
            <p>No tienes direcciones guardadas. Selecciona una ubicación en el mapa.</p>
          )}
        </div>

        {locationMode === "existing" && hasSaved ? (
          <div className="checkout-address-list">
            {addressList.map((addr) => (
              <button
                key={addr.idDireccion}
                type="button"
                disabled={isLocked}
                className={
                  selectedAddressId === addr.idDireccion
                    ? "checkout-address checkout-address--active"
                    : "checkout-address"
                }
                onClick={() => {
                  if (isLocked) return;
                  setSelectedAddressId(addr.idDireccion ?? 0);
                  setSelectedCoords({ latitud: addr.latitud ?? 0, longitud: addr.longitud ?? 0 });
                  setBillingForm((prev) => ({
                    ...prev,
                    address: addr.descripcion ?? prev.address,
                    addressName: addr.nombre ?? prev.addressName,
                  }));
                }}
              >
                <span className="checkout-address__name">{addr.nombre}</span>
                <span className="checkout-address__description">{addr.descripcion}</span>
              </button>
            ))}
          </div>
        ) : null}

        {locationMode === "existing" && selectedAddress ? (
          <div className="checkout-current-location">
            <p>
              <strong>Dirección seleccionada:</strong>
            </p>
            <p>{selectedAddress.descripcion}</p>
          </div>
        ) : null}

        {/* Lista de direcciones dispponible, para ahorra al usuario el que tenga que slecccionar */}
        {locationMode === "new" && !isPickup ? (
          <MapPicker value={selectedCoords} 
          onChange={handleCoordsChange} 
          />
        ) : null}
      </div>
      
      <div className="checkout-grid__container">
        {locationMode === "existing" && selectedAddress ? (
          <div className="checkout-current-location">
            <p>
              <strong>Dirección seleccionada:</strong>
            </p>
            <p>{selectedAddress.descripcion}</p>
          </div>
        ) : null}

        {locationMode === "new" && !isPickup ? (
          <div className="checkout-current-location">
            <p className="checkout-location__hint">Haz clic en el mapa para marcar el lugar de entrega.</p>
          </div>
        ) : null}

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
              disabled={false}
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
              disabled={false}
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

          {locationMode === "new" ? (
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
          ) : null}
        </div>

          <button type="button" className="checkout-paybtn" onClick={handleGoToCurrency}>
            Continuar a pago
          </button>
      </div>
    </div>
  );
};
