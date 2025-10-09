import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/drawings/:id
export async function GET(
  req: Request,
  context:  { params: Promise<{ id: string }>  }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Missing drawing id" }, { status: 400 });
    }
    

    //查找数据库中的绘图
    const drawing = await prisma.drawing.findUnique({
      where: { id },
    });
    if (!drawing) {
      return NextResponse.json({ error: "Drawing not found" }, { status: 404 });
    }
    //返回数据
    return NextResponse.json({
      id: drawing.id,
      title: drawing.title,
      description: drawing.description,
      thumbnail: drawing.thumbnail,
      data: drawing.data, // ✅ Excalidraw JSON 数据
      visibility: drawing.visibility,
      likes: drawing.likes,
      views: drawing.views,
      createdAt: drawing.createdAt,
      updatedAt: drawing.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching drawing:", error);
    return NextResponse.json(
      { error: "Failed to fetch drawing" },
      { status: 500 }
    );
  }
}
