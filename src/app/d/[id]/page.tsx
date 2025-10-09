"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);

import { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { AppState } from "@excalidraw/excalidraw/types";

interface DrawingData {
  elements: ExcalidrawElement[];
  appState: AppState;
  
}

export default function DrawingPage() {
  const params = useParams();
  const [drawingData, setDrawingData] = useState<DrawingData | null>(null);

  // 从后端获取绘图数据
  useEffect(() => {
    async function fetchDrawing() {
      const res = await fetch(`/api/drawings/${params.id}`);
      const json = await res.json();

      if(json.data){
        const safeData:DrawingData ={
          elements:json.data.elements || [],
          appState:{
            ...(json.data.appState || {}),
            collaborators: new Map(), // 🧩 防止 forEach 报错
          }
        };

        setDrawingData(safeData); // json.data 就是保存的 Excalidraw JSON
      }
    }
    fetchDrawing();
  }, [params.id]);

  return (
    <div style={{ height: "100vh" }}>
      {drawingData ? (
        <Excalidraw
          initialData={{
            elements: drawingData.elements,
            appState: drawingData.appState,
            scrollToContent: true,
          }}
          langCode="zh-CN"
          viewModeEnabled={false} // 如果只读，可以开启 viewMode
        />
      ) : (
        <p>加载中...</p>
      )}
    </div>
  );
}
