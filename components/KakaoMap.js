"use client";

import { useEffect, useRef, useState } from "react";
import { OFFICE } from "@/lib/constants";
import { loadKakaoMapScript } from "@/lib/kakaoLoader";

// 거리 비율(0=가까움, 1=멂)에 따라 아주 살짝 크기가 다른 작은 점 마커 이미지를 만듦
// (예전엔 가까울수록 크게 키웠는데, 지도 위에서 너무 두드러져 지저분해 보여서
// 이제는 전체적으로 작은 점 형태로 줄이고 차이도 미세하게만 둠)
//
// 화면에 보이는 점은 작지만, 탭(클릭) 가능한 영역은 그보다 넓게 잡아서
// 모바일에서도 손가락으로 정확히 누르기 쉽도록 투명한 여백을 둘레에 둡니다.
function buildRestaurantMarkerImage(kakao, visibleSizePx) {
  const canvasSize = visibleSizePx + 20; // 실제 터치 가능 영역 (투명 여백 포함)
  const center = canvasSize / 2;
  const radius = visibleSizePx / 2 - 1;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}">
      <circle cx="${center}" cy="${center}" r="${radius}" fill="#1bc5d8" stroke="#ffffff" stroke-width="1"/>
    </svg>`;
  return new kakao.maps.MarkerImage(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    new kakao.maps.Size(canvasSize, canvasSize),
    { offset: new kakao.maps.Point(center, center) }
  );
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
          level: 5,
        });

        // 회사 위치는 일반 식당 마커보다 훨씬 크고 눈에 띄는 커스텀 핀으로 표시
        const officeMarkerSvg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="46" height="58" viewBox="0 0 46 58">
            <path d="M23 0C10.3 0 0 10.3 0 23c0 17.3 23 35 23 35s23-17.7 23-35C46 10.3 35.7 0 23 0z" fill="#1b2a34"/>
            <circle cx="23" cy="23" r="15" fill="#1bc5d8"/>
            <circle cx="23" cy="23" r="6" fill="#ffffff"/>
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

        // 거리 정규화를 위한 최댓값 (0으로 나누는 것 방지)
        const maxDistance = Math.max(...restaurants.map((r) => r.distanceMeters || 0), 1);
        const MIN_SIZE = 10; // 가장 먼 식당 마커 크기
        const MAX_SIZE = 16; // 가장 가까운 식당 마커 크기 (클러스터 풀렸을 때도 잘 보이도록)

        const restaurantMarkers = restaurants.map((restaurant) => {
          const position = new kakao.maps.LatLng(restaurant.lat, restaurant.lng);

          const ratio = Math.min((restaurant.distanceMeters || 0) / maxDistance, 1);
          const sizePx = Math.round(MAX_SIZE - (MAX_SIZE - MIN_SIZE) * ratio);

          const marker = new kakao.maps.Marker({
            position,
            image: buildRestaurantMarkerImage(kakao, sizePx),
            zIndex: Math.round(10 - ratio * 5), // 가까운 마커가 먼 마커 위에 그려지도록
          });

          const infoWindow = new kakao.maps.InfoWindow({
            content: `<div style="padding:6px 10px;font-size:12px;">${restaurant.name}</div>`,
          });

          kakao.maps.event.addListener(marker, "mouseover", () => infoWindow.open(map, marker));
          kakao.maps.event.addListener(marker, "mouseout", () => infoWindow.close());

          if (onMarkerClick) {
            kakao.maps.event.addListener(marker, "click", () => onMarkerClick(restaurant));
          }

          return marker;
        });

        // 식당이 여러 곳이고 밀집된 지역에서는 점들이 서로 겹쳐서 누르기 어려우므로,
        // 카카오 클러스터러로 가까운 마커들을 숫자 뭉치로 묶어서 보여줍니다.
        // 확대(줌인)하면 클러스터가 자동으로 풀리면서 개별 마커가 눌리기 쉬운 간격으로 흩어져요.
        if (restaurantMarkers.length > 1) {
          const clusterer = new kakao.maps.MarkerClusterer({
            map,
            averageCenter: true,
            minLevel: 4, // 이 레벨보다 축소된(숫자가 큰) 상태에서만 클러스터로 묶임
            gridSize: 60,
            styles: [
              {
                width: "34px",
                height: "34px",
                background: "rgba(27,42,52,0.85)",
                color: "#fff",
                borderRadius: "17px",
                textAlign: "center",
                lineHeight: "34px",
                fontSize: "12px",
                fontWeight: "700",
              },
              {
                width: "42px",
                height: "42px",
                background: "rgba(27,42,52,0.9)",
                color: "#fff",
                borderRadius: "21px",
                textAlign: "center",
                lineHeight: "42px",
                fontSize: "13px",
                fontWeight: "700",
              },
            ],
          });
          clusterer.addMarkers(restaurantMarkers);
        } else {
          restaurantMarkers.forEach((marker) => marker.setMap(map));
        }

        // 식당이 1곳뿐인 경우(상세페이지)만 회사-식당 두 지점 기준으로 범위를 맞추고,
        // 여러 곳일 때(홈 화면 전체 지도)는 좌표 이상치 하나 때문에 지도가 서울 전체로
        // 확 줌아웃되는 것을 막기 위해 고정 줌 레벨(5)을 그대로 사용합니다.
        if (restaurants.length === 1) {
          const bounds = new kakao.maps.LatLngBounds();
          bounds.extend(officePosition);
          bounds.extend(new kakao.maps.LatLng(restaurants[0].lat, restaurants[0].lng));
          map.setBounds(bounds, 60, 60, 60, 60);
        }

        setStatus("ready");
      })
      .catch((error) => {
        console.error("카카오맵 로드/렌더링 오류:", error);
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
