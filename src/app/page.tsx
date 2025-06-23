'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { calculateDistance } from '@/lib/utils';

const LiveMap = dynamic(() => import('@/components/LiveMap'), {
  ssr: false, // ✅ 彻底禁用 SSR，防止 Leaflet 用到 window
});

export default function HomePage() {
  const [coords, setCoords] = useState<[number, number][]>([]);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [distance, setDistance] = useState(0);

  const startTracking = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('当前浏览器不支持定位');
      return;
    }

    const id = navigator.geolocation.watchPosition(
      pos => {
        const newCoord: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCoords(prev => {
          const updated = [...prev, newCoord];
          setDistance(calculateDistance(updated));
          return updated;
        });
      },
      err => alert(err.message),
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );
    setWatchId(id);
  };

  const stopTracking = () => {
    if (watchId) navigator.geolocation.clearWatch(watchId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`track-${Date.now()}`, JSON.stringify(coords));
    }
  };

  const lastPos: [number, number] = coords[coords.length - 1] || [25.033, 121.565];

  return (
    <div className="w-full h-screen relative">
      <LiveMap coords={coords} lastPos={lastPos} />
      <div className="absolute top-20 left-4 bg-white p-3 rounded shadow z-9999">
        <p>距离：{distance.toFixed(2)} km</p>
        <button onClick={startTracking} className="bg-green-600 text-white px-4 py-1 mr-2 rounded">开始</button>
        <button onClick={stopTracking} className="bg-red-600 text-white px-4 py-1 rounded">结束</button>
      </div>
    </div>
  );
}
