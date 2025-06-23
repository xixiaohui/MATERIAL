'use client';
import { useState } from 'react';
import TrackReplayer from '@/components/TrackReplayer';

export default function HistoryPage() {
  const [track, setTrack] = useState<[number, number][] | null>(null);

  const allTracks = Object.keys(localStorage)
    .filter(k => k.startsWith("track-"))
    .map(k => ({
      id: k,
      data: JSON.parse(localStorage.getItem(k) || '[]'),
    }));

  return (
    <>
      {track ? (
        <TrackReplayer coords={track} />
      ) : (
        <div className="p-6">
          <h1 className="text-xl font-bold mb-4">历史轨迹</h1>
          <ul>
            {allTracks.map(t => (
              <li key={t.id} className="mb-2">
                <button
                  className="text-blue-600 underline"
                  onClick={() => setTrack(t.data)}
                >
                  {t.id}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
