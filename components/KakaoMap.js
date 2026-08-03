"use client";

import { useEffect, useRef, useState } from "react";
import { OFFICE } from "@/lib/constants";
import { loadKakaoMapScript } from "@/lib/kakaoLoader";

// 문자열(식당 id)을 항상 같은 숫자로 바꿔주는 간단한 해시 함수
// (매번 렌더링해도 같은 식당은 항상 같은 방향/거리로 흩어지도록 하기 위함 - 무작위 아님)
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// 미터 단위 오프셋을 위/경도 오프셋으로 변환
function metersToLatLngOffset(offsetMetersLat, offsetMetersLng, baseLat) {
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos((baseLat * Math.PI) / 180);
  return {
    dLat: offsetMetersLat / metersPerDegLat,
    dLng: offsetMetersLng / metersPerDegLng,
  };
}

// 회사 마커와 같은 눈물방울(핀) 모양으로, 크기만 훨씬 작게 만듦
function buildRestaurantMarkerImage(kakao, visibleSizePx) {
  const w = visibleSizePx;
  const h = Math.round(visibleSizePx * 1.25);
  const canvasW = w + 14;
  const canvasH = h + 14;
  const offsetX = canvasW / 2;
  const offsetY = canvasH - 7;

  const scaleX = w / 46;
  const scaleY = h / 58;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}">
      <g transform="translate(7,7) scale(${scaleX},${scaleY})">
        <path d="M23 0C10.3 0 0 10.3 0 23c0 17.3 23 35 23 35s23-17.7 23-35C46 10.3 35.7 0 23 0z" fill="#1bc5d8" stroke="#ffffff" stroke-width="1.5"/>
      </g>
    </svg>`;
  return new kakao.maps.MarkerImage(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    new kakao.maps.Size(canvasW, canvasH),
    { offset: new kakao.maps.Point(offsetX, offsetY) }
  );
}

// 회사 마커와 크기는 비슷하지만 색이 다른, "선택된 식당" 강조용 핀 마커
function buildHighlightMarkerImage(kakao) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
      <path d="M20 0C9 0 0 9 0 20c0 15 20 30 20 30s20-15 20-30C40 9 31 0 20 0z" fill="#e2662f"/>
      <circle cx="20" cy="20" r="12" fill="#ffffff"/>
      <circle cx="20" cy="20" r="7" fill="#e2662f"/>
    </svg>`;
  return new kakao.maps.MarkerImage(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    new kakao.maps.Size(40, 50),
    { offset: new kakao.maps.Point(20, 50) }
  );
}

// restaurants: 지도에 표시할 식당 목록
// onMarkerClick: 식당 마커를 클릭했을 때 호출 (식당 객체를 인자로 받음)
// highlightedId: 이 id의 식당만 회사 마커급으로 크고 다른 색(주황)으로 강조 표시
export default function KakaoMap({ restaurants = [], onMarkerClick, highlightedId, onMapClick }) {
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const clustererRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowsRef = useRef([]);
  const [status, setStatus] = useState("loading");
  const [isMapReady, setIsMapReady] = useState(false);

  // ---------------------------------------------------------------
  // 지도(kakao.maps.Map) 자체는 딱 한 번만 생성합니다.
  // 이전에는 restaurants/highlightedId가 바뀔 때마다 지도를 통째로 새로 만들어서,
  // 식당을 하나 클릭할 때마다 사용자가 줌/이동해둔 위치가 초기 화면(줌아웃된 전체 보기)으로
  // 리셋되는 문제가 있었습니다. 이제는 최초 1회만 지도를 만들고, 그 이후엔 마커만 다시 그립니다.
  // ---------------------------------------------------------------
  useEffect(() => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

    if (!appKey) {
      setStatus("error");
      return;
    }

    let isMounted = true;

    loadKakaoMapScript(appKey)
      .then((kakao) => {
        if (!isMounted || !mapContainerRef.current || mapInstanceRef.current) return;

        const officePosition = new kakao.maps.LatLng(OFFICE.lat, OFFICE.lng);
        const map = new kakao.maps.Map(mapContainerRef.current, {
          center: officePosition,
          level: 5,
        });

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
        // 클러스터 숫자 버블(밀집 지역에서)이 이 이름표를 가리는 문제가 있어서,
        // 일반 InfoWindow 대신 zIndex를 훨씬 높게 줄 수 있는 커스텀 오버레이로 교체하고
        // 건물 위로 더 띄워서 겹치지 않게 함
        const officeInfo = new kakao.maps.CustomOverlay({
          position: officePosition,
          content: `<div style="padding:6px 10px;font-size:12px;font-weight:700;background:#fff;border:1px solid var(--color-gray-300, #dcdfe2);border-radius:6px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.15);">🏢 ${OFFICE.name}</div>`,
          yAnchor: 3.0,
          zIndex: 100,
        });
        officeInfo.setMap(map);

        // 지도 빈 공간을 클릭하면: 1) 열려있는 이름표 말풍선을 전부 닫고
        // (터치 환경에서 mouseout이 안 일어나 말풍선이 안 닫히는 문제 보완)
        // 2) 상위 컴포넌트에 "선택 해제"를 알려서 상세보기가 자동으로 닫히게 함
        kakao.maps.event.addListener(map, "click", () => {
          infoWindowsRef.current.forEach((overlay) => overlay.setMap(null));
          onMapClickRef.current?.();
        });

        mapInstanceRef.current = { map, kakao, officePosition };
        setStatus("ready");
        setIsMapReady(true);
      })
      .catch((error) => {
        console.error("카카오맵 로드/렌더링 오류:", error);
        if (isMounted) setStatus("error");
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------
  // 마커는 restaurants/highlightedId가 바뀔 때마다 다시 그리지만,
  // 지도 자체(중심/줌 레벨)는 절대 건드리지 않아서 사용자가 보고 있던 화면이 유지됩니다.
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

    const { map, kakao, officePosition } = mapInstanceRef.current;

    if (clustererRef.current) {
      clustererRef.current.clear();
      clustererRef.current = null;
    }
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    // 이전에 열려있던 말풍선(정보창)들을 확실히 닫아서, 마커를 다시 그릴 때
    // 예전 말풍선이 화면에 계속 남아있는 문제를 방지합니다.
    infoWindowsRef.current.forEach((overlay) => overlay.setMap(null));
    infoWindowsRef.current = [];

    const maxDistance = Math.max(...restaurants.map((r) => r.distanceMeters || 0), 1);
    const MIN_SIZE = 10;
    const MAX_SIZE = 16;

    const allMarkers = [];
    const clusterableMarkers = [];

    restaurants.forEach((restaurant) => {
      // 회사 건물과 아주 가까운(같은 건물 등) 식당은 좌표가 사실상 똑같아서
      // 마커가 랜드마크 아이콘 바로 밑에 겹쳐 쌓이는 문제가 있었습니다.
      // 이런 경우엔 식당 id를 기반으로 한 고정된 방향/거리로 살짝 흩어서 찍습니다.
      let markerLat = restaurant.lat;
      let markerLng = restaurant.lng;
      if ((restaurant.distanceMeters || 0) < 25) {
        const h = hashString(String(restaurant.id));
        const angle = ((h % 360) * Math.PI) / 180;
        const radius = 16 + (h % 14); // 16~30m 사이에서 고정된 값으로 흩어짐
        const { dLat, dLng } = metersToLatLngOffset(
          radius * Math.sin(angle),
          radius * Math.cos(angle),
          restaurant.lat
        );
        markerLat += dLat;
        markerLng += dLng;
      }

      const position = new kakao.maps.LatLng(markerLat, markerLng);
      const isHighlighted = highlightedId && String(restaurant.id) === String(highlightedId);

      const ratio = Math.min((restaurant.distanceMeters || 0) / maxDistance, 1);
      const sizePx = Math.round(MAX_SIZE - (MAX_SIZE - MIN_SIZE) * ratio);

      const marker = new kakao.maps.Marker({
        position,
        image: isHighlighted
          ? buildHighlightMarkerImage(kakao)
          : buildRestaurantMarkerImage(kakao, sizePx),
        zIndex: isHighlighted ? 9 : Math.round(10 - ratio * 5),
      });

      // 밀집된 지역에서 이름표가 바로 옆/아래 다른 핀과 겹치지 않도록,
      // 마커보다 충분히 위쪽에 뜨는 커스텀 오버레이를 사용 (기본 InfoWindow보다 위치 제어가 자유로움)
      const nameOverlay = new kakao.maps.CustomOverlay({
        position,
        content: `<div style="padding:5px 9px;font-size:12px;background:#1b2a34;color:#fff;border-radius:6px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.25);">${restaurant.name}</div>`,
        yAnchor: 2.3,
        zIndex: 30,
      });
      infoWindowsRef.current.push(nameOverlay);

      kakao.maps.event.addListener(marker, "mouseover", () => nameOverlay.setMap(map));
      kakao.maps.event.addListener(marker, "mouseout", () => nameOverlay.setMap(null));

      if (onMarkerClick) {
        kakao.maps.event.addListener(marker, "click", () => {
          nameOverlay.setMap(null);
          onMarkerClick(restaurant);
        });
      }

      allMarkers.push(marker);

      if (isHighlighted) {
        marker.setMap(map);
        nameOverlay.setMap(map);
      } else {
        clusterableMarkers.push(marker);
      }
    });

    markersRef.current = allMarkers;

    if (clusterableMarkers.length > 1) {
      const clusterer = new kakao.maps.MarkerClusterer({
        map,
        averageCenter: true,
        minLevel: 4,
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
      clusterer.addMarkers(clusterableMarkers);
      clustererRef.current = clusterer;
    } else {
      clusterableMarkers.forEach((marker) => marker.setMap(map));
    }

    // 식당이 정확히 1곳뿐인 경우(상세페이지 전용 지도)만, 이 지도가 처음 그려질 때
    // 회사-식당 두 지점이 잘 보이도록 범위를 맞춥니다. 홈 화면의 여러 식당이 있는
    // 지도에서는 이 로직이 실행되지 않아서, 사용자가 보고 있던 화면이 그대로 유지돼요.
    if (restaurants.length === 1) {
      const bounds = new kakao.maps.LatLngBounds();
      bounds.extend(officePosition);
      bounds.extend(new kakao.maps.LatLng(restaurants[0].lat, restaurants[0].lng));
      map.setBounds(bounds, 60, 60, 60, 60);
    }
  }, [restaurants, highlightedId, isMapReady, onMarkerClick]);

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
