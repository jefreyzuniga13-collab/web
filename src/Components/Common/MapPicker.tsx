import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapPickerProps {
  value?: { latitud: number; longitud: number } | null;
  onChange?: (coords: { latitud: number; longitud: number }) => void;
}

// Tipo “real” de lo que vamos a guardar
type PositionState =
  | [number, number]
  | { lat: number; lng: number }
  | null;

const MapClickHandler = ({
  onSelect,
}: {
  onSelect: (coords: { latitud: number; longitud: number }) => void;
}) => {
  useMapEvents({
    click(e) {
      onSelect({
        latitud: e.latlng.lat,
        longitud: e.latlng.lng,
      });
    },
  });

  return null;
};

const MapPicker: React.FC<MapPickerProps> = ({ value, onChange }) => {
  const defaultCenter: LatLngExpression = [12.114993, -86.236174];

  const [position, setPosition] = useState<PositionState>(
    value ? [value.latitud, value.longitud] : null
  );

  useEffect(() => {
    if (value) {
      setPosition([value.latitud, value.longitud]);
      return;
    }

    if (!navigator.geolocation) {
      setPosition(defaultCenter as [number, number]);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
      },
      () => {
        setPosition(defaultCenter as [number, number]);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleSelect = (coords: { latitud: number; longitud: number }) => {
    // Siempre guardamos como array [lat, lng] cuando el usuario hace click
    setPosition([coords.latitud, coords.longitud]);
    onChange?.(coords);
  };

  // ====== Normalizar lat/lng de forma segura ======
  let lat: number | undefined;
  let lng: number | undefined;

  if (Array.isArray(position)) {
    lat = position[0];
    lng = position[1];
  } else if (position && typeof position === "object") {
    // Por si en algún momento Leaflet mete un LatLng
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p: any = position;
    lat = p.lat;
    lng = p.lng;
  }

  const hasValidCoords =
    typeof lat === "number" && typeof lng === "number";

  const center: LatLngExpression = hasValidCoords
    ? [lat!, lng!]
    : defaultCenter;

  return (
    <div className="mapPickert-container">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: "350px", width: "100%", borderRadius: "8px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onSelect={handleSelect} />

        {hasValidCoords && (
          <Marker position={[lat!, lng!]}>
            <Popup>
              Ubicación seleccionada
              <br />
              Lat: {lat!.toFixed(6)}
              <br />
              Lng: {lng!.toFixed(6)}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default MapPicker;