import { NextRequest, NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";

import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, drawingdata, visibility, thumbnail, userId } = body;

   
    const {data,error} = await supabase
    .from("Drawing")
    .insert({
      id:uuidv4(),
      title:title,
      description:description,
      data:drawingdata,
      visibility:visibility,
      thumbnail:thumbnail,
      userId:userId,
      likes:0,
      views:0,
      updatedAt:new Date().toISOString(),
    })
    .select()


    if(error){
      console.error("Insert error:",error.message);
      return;
    }

    console.log("Insert drawing",data)


    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  const { data, error } = await supabase
    .from("Drawing") // 表名
    .select("*")
    .limit(50);

  if (error) {
    console.error("Supabase Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data || []);
}
