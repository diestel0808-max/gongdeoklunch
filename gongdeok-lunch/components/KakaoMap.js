"use client";

import { useEffect, useRef, useState } from "react";
import { OFFICE } from "@/lib/constants";
import { loadKakaoMapScript } from "@/lib/kakaoLoader";

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

        // 회사 위치는 일반 식당 마커보다 훨씬 크고 눈에 띄는 커스텀 핀으로 표시
        const officeMarkerSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="46" height="58" viewBox="0 0 46 58">
            <path d="M23 0C10.3 0 0 10.3 0 23c0 17.3 23 35 23 35s23-17.7 23-35C46 10.3 35.7 0 23 0z" fill="#1b2a34"/>
            <circle cx="23" cy="23" r="15" fill="#1bc5d8"/>
            <text x="23" y="29" font-size="16" text-anchor="middle" fill="#ffffff">🏢</text>
          </svg>`;
        const officeMarkerImage = new kakao.maps.MarkerImage(
          `data:image/svg+xml;charset=utf-8,${encodeURIComponent(officeMarkerSvg)}`,
          new kakao.maps.Size(46, 58),
          { offset: new kakao.maps.Point(23, 58) }
        );
        const officeMarker = new kakao.maps.Marker({
          position: officePosition,
          map,
          image: officeMarkerImage,
          zIndex: 10,
        });
        const officeInfo = new kakao.maps.InfoWindow({
          content: `<div style="padding:6px 10px;font-size:12px;font-weight:700;">🏢 ${OFFICE.name}</div>`,
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
          map.setBounds(bounds, 40, 40, 40, 40);
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
