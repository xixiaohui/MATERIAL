'use client';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

export default function LiveMap({
  coords,
  lastPos,
}: {
  coords: [number, number][];
  lastPos: [number, number];
}) {
  const center: LatLngExpression = lastPos;

  return (
    <MapContainer
      center={center}
      zoom={16}
      scrollWheelZoom={true}
      className="w-full h-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {coords.length > 0 && (
        <>
          <Polyline positions={coords} pathOptions={{ color: 'red' }} />
          <Marker position={lastPos} />
        </>
      )}
    </MapContainer>
  );
}
