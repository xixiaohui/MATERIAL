/* eslint-disable @next/next/no-img-element */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

"use client";
import React, { useState } from "react";
import {
  Excalidraw,
  CaptureUpdateAction,
  convertToExcalidrawElements,
} from "@excalidraw/excalidraw";

import type {
  ExcalidrawImperativeAPI,
  ExcalidrawFreeDrawElement,
} from "@excalidraw/excalidraw/types";

import { useRouter } from 'next/navigation';

const { WelcomeScreen, MainMenu } = await import("@excalidraw/excalidraw");

// 将一个点扩展成小圆的点数组
function makeCirclePoints(
  centerX: number,
  centerY: number,
  radius: number,
  segments = 100
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    points.push([
      centerX + radius * Math.cos(angle),
      centerY + radius * Math.sin(angle),
    ]);
  }
  return points;
}

// 创建 freedraw + 嵌入首尾 marker
function makeFreeDrawWithMarkers(
  rawPoints: { x: number; y: number }[],
  color: string
): ExcalidrawFreeDrawElement {
  if (rawPoints.length === 0) throw new Error("Points array is empty");

  const start = rawPoints[0];
  const end = rawPoints[rawPoints.length - 1];

  // 将 marker 嵌入 points
  const radius = 2;
  const startCirclePoints = makeCirclePoints(start.x, start.y, radius);
  const endCirclePoints = makeCirclePoints(end.x, end.y, radius);

  // 构建最终 points 数组
  const points = [
    ...startCirclePoints,
    ...rawPoints.map((p) => [p.x, p.y]),
    ...endCirclePoints,
  ];

  // 相对坐标：以第一个点为原点
  const originX = points[0][0];
  const originY = points[0][1];
  const relativePoints = points.map(([x, y]) => [x - originX, y - originY]);

  return {
    id: "freedraw-1",
    type: "freedraw",
    x: 400,
    y: 500,
    width: 1080, // 可按需要计算 bounding box
    height: 1080,
    strokeColor: color,
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    strokeStyle: "solid",
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: Math.random(),
    version: 1,
    versionNonce: Math.random(),
    isDeleted: false,
    boundElements: [],
    angle: 0,
    updated: Date.now(),
    index: "a1",
    points: relativePoints,
    pressures: Array(relativePoints.length).fill(0.2),
    simulatePressure: false,
    lastCommittedPoint: null,
  };
}

/**
 * 格式化总时长
 * @param {number} totalSeconds - 总时长（单位：秒）
 * @param {"hhmm" | "chinese"} type - 输出格式
 * @returns {string} 格式化后的时间字符串
 */
function formatTotalTime(totalSeconds, type = "hhmm") {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (type === "chinese") {
    return `${hours}小时${minutes}分钟`;
  }

  // 默认 HH:mm 格式
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} 公里`;
  }
  return `${Math.round(meters)} 米`;
}

/**
 * 计算平均速度
 * @param {number} totalDistance - 总距离（米）
 * @param {number} totalTime - 总时间（秒）
 * @param {"m/s" | "km/h"} unit - 输出单位
 * @returns {string} 平均速度字符串
 */
function calcAverageSpeed(
  totalDistance: number,
  totalTime: number,
  unit: "m/s" | "km/h" = "km/h"
): string {
  if (totalTime <= 0) return "0";

  let speed: number;

  if (unit === "m/s") {
    speed = totalDistance / totalTime;
    return `${speed.toFixed(2)} m/s`;
  } else {
    // km/h = (米 / 秒) * 3.6
    speed = (totalDistance / totalTime) * 3.6;
    return `${speed.toFixed(2)} km/h`;
  }
}

/**
 * 解析 <time> 节点并格式化
 * @param {Element} timeNode - XML 中的 <time> 节点
 * @param {"local" | "utc" | "custom"} type - 输出格式
 * @returns {string} 格式化后的时间字符串
 */
function formatSportTime(
  timeNode: Element,
  type: "local" | "utc" | "custom" = "local"
): string {
  if (!timeNode || !timeNode.textContent) return "";

  const isoString = timeNode.textContent;
  const date = new Date(isoString);

  if (isNaN(date.getTime())) return "";

  switch (type) {
    case "local":
      return date.toLocaleString(); // 本地时间字符串
    case "utc":
      return date.toISOString(); // UTC 时间字符串
    case "custom":
      // YYYY-MM-DD HH:mm:ss（本地时间）
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const hh = String(date.getHours()).padStart(2, "0");
      const min = String(date.getMinutes()).padStart(2, "0");
      const ss = String(date.getSeconds()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    default:
      return date.toLocaleString();
  }
}

export default function GpxExcalidrawPage() {
  const router = useRouter();

  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);

  const [fileName, setFileName] = useState("还未选择文件");

  // const [lang, setLang] = useState("zh-CN"); // 默认中文

  // 解析 GPX 文件
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file ? file.name : "还未选择文件");

    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "application/xml");

    const trkpts = Array.from(xmlDoc.getElementsByTagName("trkpt"));
    if (trkpts.length === 0) {
      alert("没有找到轨迹点");
      return;
    }

    //时长
    const totalTime = Array.from(xmlDoc.getElementsByTagName("totalTime"))[0];
    //距离
    const totalDistance = Array.from(
      xmlDoc.getElementsByTagName("totalDistance")
    )[0];
    //累计爬升
    const cumulativeClimb = Array.from(
      xmlDoc.getElementsByTagName("cumulativeClimb")
    )[0];

    let totalTime_text = "";
    if (totalTime) {
      const totalSeconds = parseInt(totalTime.textContent, 10);
      console.log(formatTotalTime(totalSeconds, "hhmm")); // 02:05
      console.log(formatTotalTime(totalSeconds, "chinese")); // 2小时5分钟

      totalTime_text = formatTotalTime(totalSeconds, "chinese");
    }

    let totalDistance_text = "";
    if (totalDistance) {
      const meters = parseFloat(totalDistance.textContent || "0");
      totalDistance_text = formatDistance(meters);
    }

    let cumulativeClimb_text = "";
    if (cumulativeClimb) {
      const meters = parseFloat(cumulativeClimb.textContent || "0");
      cumulativeClimb_text = formatDistance(meters);
    }

    let averageSpeed_text = "";
    if (totalTime && totalDistance) {
      const totalSeconds = parseInt(totalTime.textContent, 10);
      const meters = parseInt(totalDistance.textContent || "0");
      averageSpeed_text = calcAverageSpeed(meters, totalSeconds);
    }
    //时间
    const sportTime = Array.from(xmlDoc.getElementsByTagName("time"))[0];
    let sportTime_text = "";
    if (sportTime) {
      console.log(formatSportTime(sportTime, "local")); // 本地时间
      console.log(formatSportTime(sportTime, "utc")); // UTC ISO 字符串
      console.log(formatSportTime(sportTime, "custom")); // 2025-09-28 10:59:45
      sportTime_text = formatSportTime(sportTime, "custom");
    }

    // 提取轨迹点
    const points = trkpts.map((pt) => ({
      lat: parseFloat(pt.getAttribute("lat") || "0"),
      lon: parseFloat(pt.getAttribute("lon") || "0"),
    }));

    // 简单坐标映射 (lon→x, lat→y)
    const minLat = Math.min(...points.map((p) => p.lat));
    const minLon = Math.min(...points.map((p) => p.lon));
    const maxLat = Math.max(...points.map((p) => p.lat));
    const maxLon = Math.max(...points.map((p) => p.lon));

    // 缩放比例，确保轨迹不会超出画布
    const scaleX = 100; // 水平缩放比例
    const scaleY = 100; // 垂直缩放比例
    const width = maxLon - minLon;
    const height = maxLat - minLat;

    const scale = Math.max(scaleX / width, scaleY / height); // 取较大比例，确保轨迹合适

    // 转换为 Excalidraw 的坐标系
    const transformedPoints = points.map((p) => ({
      x: (p.lon - minLon) * scale,
      y: -(p.lat - minLat) * scale, // Y轴反向
    }));

    const freedraw: ExcalidrawFreeDrawElement = {
      id: "free-1",
      type: "freedraw",
      x: 100,
      y: 500,
      width: 1080,
      height: 1080,
      strokeColor: "#1971c2",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: null,
      seed: Math.random(),
      version: 1,
      versionNonce: Math.random(),
      isDeleted: false,
      boundElements: [],
      angle: 0,
      updated: Date.now(),
      index: "a1", // 新版必需
      points: transformedPoints.map((p) => [
        p.x - transformedPoints[0].x,
        p.y - transformedPoints[0].y,
      ]),
      pressures: Array(transformedPoints.length).fill(0.2), // 跟 points 对齐
      simulatePressure: false,
      lastCommittedPoint: null,
    };

    const rawPoints = transformedPoints;
    const freedraw2 = makeFreeDrawWithMarkers(rawPoints, "#1971c2");

    // ✅ 计算起点/终点的绝对坐标
    const first = freedraw.points[0];
    const last = freedraw.points[freedraw.points.length - 1];

    const firstAbsX = freedraw.x + first[0];
    const firstAbsY = freedraw.y + first[1];
    const lastAbsX = freedraw.x + last[0];
    const lastAbsY = freedraw.y + last[1];
    // ✅ 画圈半径
    const r = 3;

    // ✅ 起点圈
    const startCircle = {
      id: "circle-start",
      type: "ellipse",
      x: firstAbsX - r,
      y: firstAbsY - r,
      width: r * 2,
      height: r * 2,
      strokeColor: "#ff0000", // 红色
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 5,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      seed: Math.random(),
      version: 1,
      versionNonce: Math.random(),
      isDeleted: false,
      groupIds: [],
      frameId: null,
      boundElements: [],
      roundness: null,
      angle: 0,
      updated: Date.now(),
      index: "a2",
    };

    // ✅ 终点圈
    const endCircle = {
      ...startCircle,
      id: "circle-end",
      x: lastAbsX - r,
      y: lastAbsY - r,
      strokeColor: "#00aa00", // 绿色
      index: "a3",
    };
    const sceneData = {
      elements: convertToExcalidrawElements([
        {
          type: "text",
          x: 150,
          y: 250,
          text: "距离:" + totalDistance_text,
          fontSize: 20,
          strokeColor: "#1971c2",
        },
        {
          type: "text",
          x: 150,
          y: 300,
          text: "时长: " + totalTime_text,
          fontSize: 20,
          strokeColor: "#1971c2",
        },
        {
          type: "text",
          x: 150,
          y: 350,
          text: "累计爬升:" + cumulativeClimb_text,
          fontSize: 20,
          strokeColor: "#1971c2",
        },
        {
          type: "text",
          x: 150,
          y: 400,
          text: "平均速度:" + averageSpeed_text,
          fontSize: 20,
          strokeColor: "#1971c2",
        },
        {
          type: "text",
          x: 150,
          y: 450,
          text: sportTime_text,
          fontSize: 20,
          strokeColor: "#1971c2",
        },
        // {
        //   type: "rectangle",
        //   x: 10,
        //   y: 10,
        //   strokeWidth: 2,
        //   id: "1",
        // },
        // {
        //   type: "frame",
        //   children: ["1"],
        //   name: "My frame",
        //   width: 360,
        //   height: 640,
        // },
        freedraw,
        startCircle,
        endCircle,
        freedraw2,
      ]),
      appState: {
        // viewBackgroundColor: "#a5d8ff",
        scrollToContent: true,
      },
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    };

    // 更新画布
    excalidrawAPI?.updateScene(sceneData);
    excalidrawAPI?.scrollToContent();
  };

  // const freedrawElement = convertToExcalidrawElements([
  //   {
  //     type: "rectangle",
  //     x: 10,
  //     y: 10,
  //     strokeWidth: 2,
  //     id: "1",
  //   },

  //   {
  //     type: "frame",
  //     children: ["1"],
  //     name: "My frame",
  //     width: 360,
  //     height: 640,
  //   },
  // ]);

  const handleSave = async () => {
    try{
      const elements = await excalidrawAPI.getSceneElements();
      const appState = await excalidrawAPI.getAppState();

      // 删除无法序列化的属性
      delete appState.collaborators;

      const data = { elements, appState};

      // console.log(data)

      const res = await fetch("/api/drawings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: "未命名", 
          data : data,
          description: "通过菜单保存的测试绘图",
          visibility: "public",
        }),
      });
      if (!res.ok) throw new Error("保存失败");
        alert("✅ 已保存到数据库！");
    }catch(err){
      console.error(err);
      alert("❌ 保存失败");
    }
  };

  return (
    <div style={{ height: "100vh" }}>
      <Excalidraw
        initialData={{
          // elements: freedrawElement,

          appState: {
            viewBackgroundColor: "#f8f9fa",
            gridSize: 16,
          },
          scrollToContent: true,
        }}
        langCode="zh-CN"
        gridModeEnabled="true"
        renderTopRightUI={() => (
          <div className="flex items-center space-x-3">
            {/* 自定义按钮 */}
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-pink-500 hover:bg-pink-600 text-cyan-50 px-4 py-2 rounded-lg transition-colors"
            >
              📂 选择 GPX 文件
            </label>

            {/* 隐藏的 input */}
            <input
              id="file-upload"
              type="file"
              accept=".gpx"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* 文件名显示 */}
            <span className="text-gray-700">{fileName}</span>
          </div>
        )}
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
      >
        <WelcomeScreen>
          <WelcomeScreen.Center>
            <WelcomeScreen.Center.Logo>
              {/* <h2 style={{ color: "#333" }}>欢迎使用我的画板</h2> */}
              <img
                src="/yumrin.svg"
                alt="My Logo"
                style={{ width: 240, marginBottom: 7 }}
              ></img>
            </WelcomeScreen.Center.Logo>
            <WelcomeScreen.Center.Heading>
              解析GPX文件，显示运动数据与轨迹
            </WelcomeScreen.Center.Heading>
            <WelcomeScreen.Center.Menu>
              <WelcomeScreen.Center.MenuItemLoadScene />
              <WelcomeScreen.Center.MenuItemHelp />
              <WelcomeScreen.Center.MenuItem onSelect={() => (router.push(`/gallery`))}>
                相册
              </WelcomeScreen.Center.MenuItem>
            </WelcomeScreen.Center.Menu>
          </WelcomeScreen.Center>
          <WelcomeScreen.Hints.ToolbarHint />
          <WelcomeScreen.Hints.MenuHint />
          <WelcomeScreen.Hints.HelpHint />
        </WelcomeScreen>
        <MainMenu>
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.SaveToActiveFile />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.DefaultItems.SearchMenu />
          <MainMenu.DefaultItems.Help />
          <MainMenu.DefaultItems.Socials />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
          <MainMenu.DefaultItems.ToggleTheme />

          <MainMenu.Item onSelect={() => handleSave()}>
            保存到相册
          </MainMenu.Item>
        </MainMenu>
      </Excalidraw>
    </div>
  );
}
