"use client";

import { useEffect, useRef, useState } from "react";
import { OFFICE } from "@/lib/constants";

// 카카오맵 SDK 스크립트를 한 번만 불러오기 위한 헬퍼
function loadKakaoMapScript(appKey) {
  return new Promise((resolve, reject) => {
    // 이미 로드되어 있으면 다시 불러오지 않음
    if (window.kakao && window.kakao.maps) {
      resolve(window.kakao);
      return;
    }

    const existingScript = document.getElementById("kakao-map-sdk");
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        window.kakao.maps.load(() => resolve(window.kakao));
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => resolve(window.kakao));
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function KakaoMap({ restaurants = [] }) {
  const mapContainerRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

    if (!appKey) {
      setStatus("error");
      return;
    }

    let isMounted = true;

    loadKakaoMapScript(appKey)
      .then((kakao) => {
        if (!isMounted || !mapContainerRef.current) return;

        const center = new kakao.maps.LatLng(OFFICE.lat, OFFICE.lng);
        const map = new kakao.maps.Map(mapContainerRef.current, {
          center,
          level: 4, // 숫자가 작을수록 확대
        });

        // 회사 위치 마커 (강조 표시)
        const officeMarker = new kakao.maps.Marker({
          position: center,
          map,
        });
        const officeInfo = new kakao.maps.InfoWindow({
          content: `<div style="padding:6px 10px;font-size:12px;">🏢 ${OFFICE.name}</div>`,
        });
        officeInfo.open(map, officeMarker);

        // 식당 마커들
        restaurants.forEach((restaurant) => {
          const position = new kakao.maps.LatLng(restaurant.lat, restaurant.lng);
          const marker = new kakao.maps.Marker({ position, map });

          const infoWindow = new kakao.maps.InfoWindow({
            content: `<div style="padding:6px 10px;font-size:12px;">${restaurant.name}</div>`,
          });

          kakao.maps.event.addListener(marker, "mouseover", () => {
            infoWindow.open(map, marker);
          });
          kakao.maps.event.addListener(marker, "mouseout", () => {
            infoWindow.close();
          });
        });

        setStatus("ready");
      })
      .catch(() => {
        if (isMounted) setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, [restaurants]);

  if (status === "error") {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-gray-100)",
          color: "#888",
          fontSize: 14,
          padding: 16,
          textAlign: "center",
        }}
      >
        지도를 불러올 수 없습니다.
        <br />
        .env.local에 NEXT_PUBLIC_KAKAO_JS_KEY가 올바르게 설정되었는지,
        <br />
        카카오 개발자 사이트에 이 사이트 도메인이 등록되었는지 확인해주세요.
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {status === "loading" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--color-gray-100)",
            fontSize: 14,
            color: "#888",
          }}
        >
          지도를 불러오는 중...
        </div>
      )}
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
