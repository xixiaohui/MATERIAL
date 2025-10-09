import { PrismaClient } from "@/generated/prisma";

import { Drawing } from "@/generated/prisma";

import Link from "next/link";

const prisma = new PrismaClient();

export default async function GalleryPage() {
    
    const drawings: Drawing[] = await prisma.drawing.findMany({orderBy:{ createdAt:'desc'}});

    return(
        <main className="p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {drawings.map(d =>(
                <Link key={d.id} href={`/d/${d.id}`} className="border p-2 rounded hover:shadow-md">

                    <img src={d.thumbnail || '/yumrin.svg'} className="aspect-video object-cover" />

                    <h3 className="text-sm mt-2">{d.title}</h3>
                </Link>
            ))}

        </main>
    );
}