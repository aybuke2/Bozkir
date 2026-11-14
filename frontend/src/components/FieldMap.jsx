
import { useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

function LocationSelector({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({
        lat: event.latlng.lat,
        lng: event.latlng.lng
      });
    }
  });

  return null;
}

function FieldMap({ position, setPosition }) {
  const center = [37.87, 32.48];

  return (
    <MapContainer
      center={center}
      zoom={8}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <LocationSelector onSelect={setPosition} />

      {position && (
        <Marker
          position={[position.lat, position.lng]}
        />
      )}
    </MapContainer>
  );
}

export default FieldMap;
