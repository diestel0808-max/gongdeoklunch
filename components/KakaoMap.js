"use client";

import { useEffect, useRef, useState } from "react";
import { OFFICE } from "@/lib/constants";

function loadKakaoMapScript(appKey) {
  return new Promise((resolve, reject) => {
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
    // libraries=services는 나중에 주소검색(식당 등록 기능)에서 필요해서 미리 포함
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => resolve(window.kakao));
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// restaurants: 지도에 표시할 식당 목록
// onMarkerClick: 식당 마커를 클릭했을 때 호출 (식당 객체를 인자로 받음)
export default function KakaoMap({ restaurants = [], onMarkerClick }) {
  const mapContainerRef = useRef(null);
  const [status, setStatus] = useState("loading");

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

        const officePosition = new kakao.maps.LatLng(OFFICE.lat, OFFICE.lng);
        const map = new kakao.maps.Map(mapContainerRef.current, {
          center: officePosition,
          level: 4,
        });

        // 회사 위치 마커
        const officeMarker = new kakao.maps.Marker({ position: officePosition, map });
        const officeInfo = new kakao.maps.InfoWindow({
          content: `<div style="padding:6px 10px;font-size:12px;">🏢 ${OFFICE.name}</div>`,
        });
        officeInfo.open(map, officeMarker);

        // 지도 범위를 자동으로 맞추기 위한 bounds
        const bounds = new kakao.maps.LatLngBounds();
        bounds.extend(officePosition);

        restaurants.forEach((restaurant) => {
          const position = new kakao.maps.LatLng(restaurant.lat, restaurant.lng);
          bounds.extend(position);

          const marker = new kakao.maps.Marker({ position, map });

          const infoWindow = new kakao.maps.InfoWindow({
            content: `<div style="padding:6px 10px;font-size:12px;">${restaurant.name}</div>`,
          });

          kakao.maps.event.addListener(marker, "mouseover", () => infoWindow.open(map, marker));
          kakao.maps.event.addListener(marker, "mouseout", () => infoWindow.close());

          // 마커를 클릭하면 상세 정보로 이동할 수 있도록 콜백 연결
          if (onMarkerClick) {
            kakao.maps.event.addListener(marker, "click", () => onMarkerClick(restaurant));
          }
        });

        if (restaurants.length > 0) {
          map.setBounds(bounds);
        }

        setStatus("ready");
      })
      .catch(() => {
        if (isMounted) setStatus("error");
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
