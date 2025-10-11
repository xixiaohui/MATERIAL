"use client";

import { useEffect, useState } from "react";

import { Drawing } from "@/generated/prisma";

import Link from "next/link";
import Image from "next/image";

export default function GalleryPage() {
  const [drawings, setDrawings] = useState<Drawing[]>([]);

  useEffect(() => {
    fetch("/api/drawings")
      .then((res) => res.json())
      .then((data) => setDrawings(data))
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  return (
    <main className="p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
      {drawings.map((d) => (
        <Link
          key={d.id}
          href={`/d/${d.id}`}
          className="group block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-700">
            <Image
              src="/cycle.svg"
              alt={d.title || "preview"}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-contain transition-transform duration-300 group-hover:scale-105"
              priority={false}
            />
          </div>

          <h3 className="mt-3 text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2">
            {d.title}
          </h3>
        </Link>
      ))}
    </main>
  );
}
