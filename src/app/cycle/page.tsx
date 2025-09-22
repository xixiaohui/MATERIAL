// app/gpx-viewer/page.tsx
// Next.js App Router page (client component) — GPX Viewer
// Features:
// - Choose a GPX file from local computer
// - Parse GPX (DOMParser)
// - Draw track on interactive map (react-leaflet)
// - Show basic stats: distance, duration, elevation gain, avg speed
// - Export viewport to PNG (uses html2canvas; note CORS for map tiles may block export)

/*
Instructions (run in project root):
1. Install dependencies:
   npm install react-leaflet leaflet html2canvas

2. Make sure shadcn/ui components are available in your project. If not, either install them or
   replace the UI components with plain HTML elements.

3. Add Leaflet CSS in your global CSS (e.g., app/globals.css or pages/_app):
   @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
   (or add a link tag in app/head)

4. Place this file at: app/gpx-viewer/page.tsx (or adapt for pages/ router)

5. Run dev server: npm run dev

Notes:
- Exporting the map to PNG may fail if map tiles disallow cross-origin image readback. Workarounds: use a CORS-enabled tile provider, proxy tiles, or draw a plain canvas/polyline instead of relying on tile images.
*/


// app/gpx-viewer/page.tsx
'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardTitle } from '@/components/ui/card'

// import html2canvas from 'html2canvas'
// import L from 'leaflet'
// import 'leaflet/dist/leaflet.css'

// Fix leaflet default icon issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// delete (L.Icon.Default.prototype as any)._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
//   iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
// });

// Dynamic import of react-leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Polyline = dynamic(() => import('react-leaflet').then(m => m.Polyline), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })


import { useMap } from 'react-leaflet'



// Type definitions
type Point = { lat: number; lon: number; ele?: number; time?: string }
type Stats = { distance: number; elevGain: number; durationSec: number; avgSpeed: number } | null

function haversine(a: [number, number], b: [number, number]) {
  const toRad = (deg: number) => deg * Math.PI / 180
  const R = 6371000
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const sinDlat = Math.sin(dLat/2)
  const sinDlon = Math.sin(dLon/2)
  const A = sinDlat*sinDlat + Math.cos(lat1)*Math.cos(lat2)*sinDlon*sinDlon
  const C = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1-A))
  return R * C
}

function parseGPX(text: string): Point[] {
  const parser = new DOMParser()
  const xml = parser.parseFromString(text, 'application/xml')
  const trkpts = Array.from(xml.getElementsByTagName('trkpt'))
  return trkpts.map(tp => {
    const lat = parseFloat(tp.getAttribute('lat') ?? '0')
    const lon = parseFloat(tp.getAttribute('lon') ?? '0')
    const eleEl = tp.getElementsByTagName('ele')[0]
    const timeEl = tp.getElementsByTagName('time')[0]
    const ele = eleEl?.textContent ? parseFloat(eleEl.textContent) : undefined
    const time = timeEl?.textContent ?? undefined
    return { lat, lon, ele, time }
  })
}

function computeStats(points: Point[]): Stats {
  if (points.length < 2) return null
  let distance = 0
  let elevGain = 0
  let prevEle: number | undefined = undefined
  const times: Date[] = []

  for (let i = 1; i < points.length; i++) {
    const a: [number, number] = [points[i-1].lat, points[i-1].lon]
    const b: [number, number] = [points[i].lat, points[i].lon]
    distance += haversine(a, b)

    if (points[i].ele !== undefined) {
      if (prevEle !== undefined) {
        const d = points[i].ele! - prevEle
        if (d > 0) elevGain += d
      }
      prevEle = points[i].ele
    }

    if (points[i].time) {
      times.push(new Date(points[i].time!))
    }
  }

  if (points[0]?.time) times.unshift(new Date(points[0].time))

  const durationSec = times.length >= 2 ? (times[times.length-1].getTime() - times[0].getTime())/1000 : 0
  const avgSpeed = durationSec > 0 ? (distance / durationSec) : 0

  return { distance, elevGain, durationSec, avgSpeed }
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (!map || points.length === 0) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [20, 20] })
  }, [map, points])
  return null
}

export default function GPXViewerPage() {
  const [points, setPoints] = useState<Point[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<Stats>(null)
  const mapRef = useRef<HTMLDivElement | null>(null)

  // ✅ 在客户端加载时初始化 Leaflet 图标
  useEffect(() => {
    (async () => {
      if (typeof window !== "undefined") {
        const L = (await import("leaflet")).default
        await import("leaflet/dist/leaflet.css")

        // 修复默认 marker 图标
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })
      }
    })()
  }, [])

  const onFile = useCallback(async (file: File | null) => {
    if (!file) return
    setLoading(true)
    try {
      const text = await file.text()
      const pts = parseGPX(text)
      setPoints(pts)
      setStats(computeStats(pts))
    } catch (e) {
      console.error(e)
      alert('Failed to parse GPX file')
    } finally {
      setLoading(false)
    }
  }, [])

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    onFile(f)
  }



  //非透明图片
  const exportPolylinePNG = () => {
    if (points.length === 0) return
  
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1920
    const ctx = canvas.getContext('2d')
    if (!ctx) return
  
    // === 计算统计数据 ===
    let distance = 0
    let elevGain = 0
    let prevEle: number | undefined = undefined
    const times: Date[] = []
  
    for (let i = 1; i < points.length; i++) {
      const a: [number, number] = [points[i - 1].lat, points[i - 1].lon]
      const b: [number, number] = [points[i].lat, points[i].lon]
      distance += haversine(a, b)
      if (points[i].ele !== undefined) {
        if (prevEle !== undefined) {
          const d = points[i].ele! - prevEle
          if (d > 0) elevGain += d
        }
        prevEle = points[i].ele
      }
      if (points[i].time) times.push(new Date(points[i].time!))
    }
    if (points[0]?.time) times.unshift(new Date(points[0].time))
    const durationSec =
      times.length >= 2
        ? (times[times.length - 1].getTime() - times[0].getTime()) / 1000
        : 0
    const avgSpeed = durationSec > 0 ? distance / durationSec : 0
  
    // === 统计数据 ===
    const stats = [
      { label: '距离', value: `${(distance / 1000).toFixed(3)} km` },
      { label: '爬升', value: `${elevGain.toFixed(1)} m` },
      {
        label: '时长',
        value: `${Math.floor(durationSec / 3600)}h ${Math.floor(
          (durationSec % 3600) / 60
        )}m ${Math.floor(durationSec % 60)}s`,
      },
      { label: '平均速度', value: `${(avgSpeed * 3.6).toFixed(2)} km/h` },
    ]
  
    // === 计算轨迹范围 ===
    const lats = points.map((p) => p.lat)
    const lons = points.map((p) => p.lon)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLon = Math.min(...lons)
    const maxLon = Math.max(...lons)
  
    const boxSize = Math.min(canvas.width, canvas.height) / 2
    const dataWidth = maxLon - minLon
    const dataHeight = maxLat - minLat
    const scale = boxSize / Math.max(dataWidth, dataHeight)
  
    // === 整体居中布局 ===
    const totalStatsHeight = stats.length * (32 + 80) // label+value间距翻倍
    const contentHeight = totalStatsHeight + boxSize + 100 // 上下留白
    const startY = (canvas.height - contentHeight) / 2
  
    const centerX = canvas.width / 2
    let textY = startY
  
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
  
    stats.forEach((stat) => {
      ctx.font = 'bold 20px sans-serif'
      ctx.fillText(stat.label, centerX, textY)
      textY += 57 // 标签和数值间距翻倍
  
      ctx.font = 'bold 40px sans-serif'
      ctx.fillText(stat.value, centerX, textY)
      textY += 67 // 数值与下一个标签间距翻倍
    })
  
    // === 轨迹图绘制位置（在统计数据下方居中） ===
    const boxX = (canvas.width - boxSize) / 2
    const boxY = textY
  
    ctx.strokeStyle = 'orange'
    ctx.lineWidth = 3
    ctx.beginPath()
    points.forEach((p, idx) => {
      const x =
        boxX +
        (p.lon - minLon) * scale +
        (boxSize - dataWidth * scale) / 2
      const y =
        boxY +
        boxSize -
        (p.lat - minLat) * scale -
        (boxSize - dataHeight * scale) / 2
      if (idx === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()
  
    // === 导出 PNG ===
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = 'gpx-track.png'
    a.click()
  }
  

  const polyline: [number, number][] = points.map(p => [p.lat, p.lon])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">GPX Viewer Cycle</h1>

      <div className="flex gap-4 mb-4">
        <Input type="file" accept=".gpx" onChange={onFileInputChange} />
        <Button onClick={exportPolylinePNG} disabled={points.length === 0}>导出 PNG图片</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1 md:col-span-1">
          <CardTitle>Activity Data</CardTitle>
          <CardContent>
            {loading && <div>解析中...</div>}
            {!loading && !stats && <div>请加载 GPX 文件以查看统计数据</div>}
            {stats && (
              <div>
                <div>距离: {(stats.distance/1000).toFixed(3)} km</div>
                <div>时长: {Math.floor(stats.durationSec/3600)}h {Math.floor((stats.durationSec%3600)/60)}m {Math.floor(stats.durationSec%60)}s</div>
                <div>爬升: {stats.elevGain.toFixed(1)} m</div>
                <div>平均速度: {(stats.avgSpeed*3.6).toFixed(2)} km/h</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2 md:col-span-2">
          <CardTitle>Map</CardTitle>
          <CardContent>
            <div ref={mapRef} style={{ height: 500, width: '100%' }}>
              {typeof window !== 'undefined' && (
                <MapContainer center={polyline.length ? [polyline[0][0], polyline[0][1]] : [0,0]} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                  {polyline.length > 0 && (
                    <>
                      <Polyline positions={polyline} />
                      <Marker position={[polyline[0][0], polyline[0][1]]}><Popup>Start</Popup></Marker>
                      <Marker position={[polyline[polyline.length-1][0], polyline[polyline.length-1][1]]}><Popup>End</Popup></Marker>
                      <FitBounds points={polyline} />
                    </>
                  )}
                </MapContainer>
              )}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">注意：导出 PNG 可能由于地图瓦片的 CORS 限制而失败。</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
