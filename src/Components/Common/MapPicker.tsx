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

const MapClickHandler = ({
  onSelect,
}: {
  onSelect: (coords: { latitud: number; longitud: number }) => void;
}) => {
  useMapEvents({
    click(e: { latlng: { lat: number; lng: number; }; }) {
      onSelect({
        latitud: e.latlng.lat,
        longitud: e.latlng.lng,
      });
    },
  });

  return null;
};

const MapPicker: React.FC<MapPickerProps> = ({ value, onChange }) => {
  // Centro por defecto (Managua)
  const defaultCenter: LatLngExpression = [12.114993, -86.236174];

  const [position, setPosition] = useState<LatLngExpression | null>(
    value ? [value.latitud, value.longitud] : null
  );

  // Intentar obtener ubicación actual del navegador la primera vez
  useEffect(() => {
    if (value) {
      setPosition([value.latitud, value.longitud]);
      return;
    }

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
      },
      () => {
        // Si el usuario no da permiso, usar el centro por defecto
        setPosition(defaultCenter);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (coords: { latitud: number; longitud: number }) => {
    setPosition([coords.latitud, coords.longitud]);

    // Devolver valores al padre (para guardar en direcciones de la factura)
    if (onChange) {
      onChange(coords);
    }
  };

  return (
    <div className="mapPickert-container">
      <MapContainer
        center={position ?? defaultCenter}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: "350px", width: "100%", borderRadius: "8px" }}
      >
        {/* Capa de mapa gratis usando OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onSelect={handleSelect} />

        {position && (
          <Marker position={position}>
            <Popup>
              Ubicación seleccionada
              <br />
              Lat: {(position as [number, number])[0].toFixed(6)}
              <br />
              Lng: {(position as [number, number])[1].toFixed(6)}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default MapPicker;