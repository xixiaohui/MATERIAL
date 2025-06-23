'use client';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { calculateDistance } from '../lib/utils';

export default function LiveTracker() {
  const [coords, setCoords] = useState<[number, number][]>([]);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [distance, setDistance] = useState(0);

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert("不支持 GPS 定位");
      return;
    }

    const id = navigator.geolocation.watchPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setCoords(prev => {
        const updated = [...prev, [lat, lng]];
        setDistance(calculateDistance(updated));
        return updated;
      });
    }, console.error, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000,
    });
    setWatchId(id);
  };

  const stopTracking = () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    const trackId = `track-${Date.now()}`;
    localStorage.setItem(trackId, JSON.stringify(coords));
    alert(`轨迹已保存：${trackId}`);
  };

  return (
    <div className="w-full h-screen">
      <MapContainer center={[25.033, 121.565]} zoom={16} scrollWheelZoom className="h-full w-full z-0">
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {coords.length > 0 && (
          <>
            <Polyline positions={coords} color="red" />
            <Marker position={coords[coords.length - 1]} />
          </>
        )}
      </MapContainer>

      <div className="absolute top-4 left-4 bg-white p-3 rounded shadow z-10">
        <p>距离：{distance.toFixed(2)} km</p>
        <button onClick={startTracking} className="bg-green-600 text-white px-4 py-1 mr-2 rounded">开始</button>
        <button onClick={stopTracking} className="bg-red-600 text-white px-4 py-1 rounded">结束</button>
      </div>
    </div>
  );
}
