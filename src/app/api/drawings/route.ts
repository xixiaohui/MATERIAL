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
  try {
    const drawings = await prisma.drawing.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json(drawings);
  } catch (err) {
    console.error("Failed to fetch drawings:", err);
    // 始终返回 JSON，即使查询失败
    return NextResponse.json({ data: [], error: "Failed to fetch drawings" }, { status: 500 });
  }
}
