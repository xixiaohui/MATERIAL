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

const { WelcomeScreen } = await import("@excalidraw/excalidraw");

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
function formatSportTime(timeNode: Element, type: "local" | "utc" | "custom" = "local"): string {
  if (!timeNode || !timeNode.textContent) return "";

  const isoString = timeNode.textContent;
  const date = new Date(isoString);

  if (isNaN(date.getTime())) return "";

  switch (type) {
    case "local":
      return date.toLocaleString(); // 本地时间字符串
    case "utc":
      return date.toISOString();    // UTC 时间字符串
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
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);

  // 解析 GPX 文件
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
    if(totalTime && totalDistance){
      const totalSeconds = parseInt(totalTime.textContent, 10);
      const meters = parseInt(totalDistance.textContent || "0");
      averageSpeed_text = calcAverageSpeed(meters,totalSeconds);
    }
    //时间
    const sportTime = Array.from(
      xmlDoc.getElementsByTagName("time")
    )[0];
    let sportTime_text= ""
    if (sportTime) {
      console.log(formatSportTime(sportTime, "local"));  // 本地时间
      console.log(formatSportTime(sportTime, "utc"));    // UTC ISO 字符串
      console.log(formatSportTime(sportTime, "custom")); // 2025-09-28 10:59:45
      sportTime_text = formatSportTime(sportTime, "custom")
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
    const scaleX = 200; // 水平缩放比例
    const scaleY = 200; // 垂直缩放比例
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
      points: transformedPoints.map((p, i) => [
        p.x - transformedPoints[0].x,
        p.y - transformedPoints[0].y,
      ]),
      pressures: Array(transformedPoints.length).fill(0.2), // 跟 points 对齐
      simulatePressure: false,
      lastCommittedPoint: null,
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
          text: "累计爬升:"+cumulativeClimb_text,
          fontSize: 20,
          strokeColor: "#1971c2",
        },
        {
          type: "text",
          x: 150,
          y: 400,
          text: "平均速度:"+averageSpeed_text,
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
        freedraw,
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

  return (
    <div style={{ height: "100vh" }}>
      <Excalidraw
        initialData={{
          // elements: [freedrawElement],
          appState: { viewBackgroundColor: "#f8f9fa" },
          scrollToContent: true,
        }}
        renderTopRightUI={() => (
          <div>
            <input
              type="file"
              accept=".gpx"
              onChange={handleFileUpload}
              style={{ marginRight: 7 }}
            />
          </div>
        )}
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
      >
        <WelcomeScreen />
      </Excalidraw>
    </div>
  );
}
