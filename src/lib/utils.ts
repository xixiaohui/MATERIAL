import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function calculateDistance(coords: [number, number][]) {
  let dist = 0;
  for (let i = 1; i < coords.length; i++) {
    dist += haversine(coords[i - 1], coords[i]);
  }
  return dist;
}

function haversine([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]) {
  const R = 6371; // km
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}
