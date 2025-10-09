import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, data, visibility, thumbnail, userId, tags } =
      body;

    const drawing = await prisma.drawing.create({
      data: {
        title,
        description,
        data,
        visibility,
        thumbnail,
        userId,
        ...(tags && tags.length > 0
          ? {
              tags: {
                connectOrCreate: tags.map((tag: string) => ({
                  where: { name: tag },
                  create: { name: tag },
                })),
              },
            }
          : {}),
      },
      include: { tags: true },
    });

    return NextResponse.json(drawing);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  const drawings = await prisma.drawing.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(drawings);
}
