'use client';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import { useEffect, useState } from 'react';

export default function TrackReplayer({ coords }: { coords: [number, number][] }) {
  const [index, setIndex] = useState(1);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || index >= coords.length) return;
    const interval = setInterval(() => setIndex(i => i + 1), 200);
    return () => clearInterval(interval);
  }, [playing, index]);

  return (
    <div className="w-full h-screen">
      <MapContainer center={coords[0]} zoom={16} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Polyline positions={coords.slice(0, index)} pathOptions={{ color: 'blue' }} />
        <Marker position={coords[Math.min(index, coords.length - 1)]} />
      </MapContainer>

      <div className="absolute top-4 left-4 bg-white p-3 rounded shadow z-10">
        <button onClick={() => {
          if (index >= coords.length) setIndex(1);
          setPlaying(!playing);
        }} className="bg-blue-600 text-white px-4 py-1 rounded">
          {playing ? '暂停' : index >= coords.length ? '重播' : '播放'}
        </button>
      </div>
    </div>
  );
}
