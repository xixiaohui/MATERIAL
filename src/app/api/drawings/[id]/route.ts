import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/drawings/:id
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing drawing id" },
        { status: 400 }
      );
    }

    //查找数据库中的绘图
    const { data, error } = await supabase
      .from("Drawing") // ⚠️ 注意大小写，Supabase 区分表名大小写
      .select("*")
      .eq("id", id)
      .single(); // 返回单条记录

     if (error) {
      console.error("Supabase Error:", error.message);
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Drawing not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Drawing not found" }, { status: 404 });
    }
    //返回数据
    return NextResponse.json({
      id: data.id,
      title: data.title,
      description: data.description,
      thumbnail: data.thumbnail,
      data: data.data, // ✅ Excalidraw JSON 数据
      visibility: data.visibility,
      likes: data.likes,
      views: data.views,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching drawing:", error);
    return NextResponse.json(
      { error: "Failed to fetch drawing" },
      { status: 500 }
    );
  }
}
