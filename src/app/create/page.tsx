"use client";

import dynamic from "next/dynamic";


const GpxExcalidrawPage = dynamic(
  async () => (await import("../gpxexcalidrawpage")).default,
  {
    ssr: false,
  },
);

export default function CreatePage() {

  return (
    <GpxExcalidrawPage />
  );
}