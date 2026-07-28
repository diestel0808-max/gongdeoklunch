"use client";

import { useEffect, useMemo, useState } from "react";
import KakaoMap from "@/components/KakaoMap";
import { CATEGORIES, OFFICE } from "@/lib/constants";

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [restaurants, setRestaurants] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    fetch("/api/restaurants")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "식당 정보를 불러오지 못했습니다.");
        return data;
      })
      .then((data) => {
        if (!isMounted) return;
        setRestaurants(data.restaurants || []);
        setStatus("ready");
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMessage(err.message);
        setStatus("error");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRestaurants = useMemo(() => {
    if (activeCategory === "전체") return restaurants;
    return restaurants.filter((r) => r.category === activeCategory);
  }, [restaurants, activeCategory]);

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      {/* 헤더 */}
      <header
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--color-gray-300)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700 }}>공덕 점심 뭐먹지?</h1>
          <p style={{ fontSize: 12, color: "#7a8288" }}>{OFFICE.name} 기준</p>
        </div>
        <button
          style={{
            fontSize: 12,
            padding: "8px 12px",
            borderRadius: 8,
            border: "none",
            background: "var(--color-teal)",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + 식당 등록
        </button>
      </header>

      {/* 지도 영역 */}
      <div style={{ height: "45vh", minHeight: 240 }}>
        <KakaoMap restaurants={filteredRestaurants} />
      </div>

      {/* 카테고리 필터 탭 */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "10px 16px",
          overflowX: "auto",
          borderBottom: "1px solid var(--color-gray-300)",
        }}
      >
        {CATEGORIES.map((category) => {
          const isActive = category === activeCategory;
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              style={{
                flexShrink: 0,
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                border: isActive ? "none" : "1px solid var(--color-gray-300)",
                background: isActive ? "var(--color-navy)" : "#fff",
                color: isActive ? "#fff" : "var(--color-text)",
                cursor: "pointer",
              }}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* 상세 필터 자리 (다음 단계에서 실제 동작 연결 예정) */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "8px 16px",
          fontSize: 12,
          color: "#7a8288",
        }}
      >
        <span>거리 ▾</span>
        <span>가격 ▾</span>
        <span>인원 ▾</span>
        <span>웨이팅 ▾</span>
      </div>

      {/* 리스트 영역 */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 16px 24px",
        }}
      >
        {status === "loading" && (
          <p style={{ fontSize: 13, color: "#999", padding: "24px 0" }}>
            공덕역 인근 식당 정보를 불러오는 중...
          </p>
        )}

        {status === "error" && (
          <p style={{ fontSize: 13, color: "#d33", padding: "24px 0" }}>
            식당 정보를 불러오지 못했습니다: {errorMessage}
          </p>
        )}

        {status === "ready" && filteredRestaurants.length === 0 && (
          <p style={{ fontSize: 13, color: "#999", padding: "24px 0" }}>
            해당 카테고리에 등록된 식당이 아직 없어요.
          </p>
        )}

        {filteredRestaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            style={{
              border: "1px solid var(--color-gray-300)",
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700 }}>{restaurant.name}</h2>
                <p style={{ fontSize: 12, color: "#7a8288", marginTop: 2 }}>
                  {restaurant.address}
                </p>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--color-teal)",
                  background: "var(--color-teal-light)",
                  padding: "3px 8px",
                  borderRadius: 6,
                  flexShrink: 0,
                }}
              >
                {restaurant.category}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 10,
                fontSize: 12,
                color: "#555",
                flexWrap: "wrap",
              }}
            >
              <span>🚶 도보 {restaurant.walkMinutes}분 ({restaurant.distanceMeters}m)</span>
              <span>💰 {restaurant.priceRange}</span>
              <span>⏱ 웨이팅 {restaurant.waiting}</span>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <a
                href={restaurant.kakaoMapUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--color-navy)",
                  border: "1px solid var(--color-gray-300)",
                  borderRadius: 6,
                  padding: "6px 10px",
                }}
              >
                카카오맵에서 보기
              </a>
              <button
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#fff",
                  background: "var(--color-navy)",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 10px",
                  cursor: "pointer",
                }}
              >
                후기 남기기
              </button>
              <button
                style={{
                  fontSize: 12,
                  color: "#aaa",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  marginLeft: "auto",
                }}
              >
                신고
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
