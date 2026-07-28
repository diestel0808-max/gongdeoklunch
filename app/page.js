"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import KakaoMap from "@/components/KakaoMap";
import ReviewModal from "@/components/ReviewModal";
import { CATEGORIES, OFFICE } from "@/lib/constants";
import { getReviewsForRestaurant, summarizeReviews } from "@/lib/reviewStorage";
import { cacheRestaurants } from "@/lib/restaurantCache";

function joinValues(value) {
  return Array.isArray(value) ? value.join(", ") : value;
}

function RestaurantCard({ restaurant, onWriteReview }) {
  const [showReviews, setShowReviews] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const list = getReviewsForRestaurant(restaurant.id);
    setReviews(list);
    setSummary(summarizeReviews(list));
  }, [restaurant.id]);

  const refreshReviews = () => {
    const list = getReviewsForRestaurant(restaurant.id);
    setReviews(list);
    setSummary(summarizeReviews(list));
  };

  return (
    <div
      style={{
        border: "1px solid var(--color-gray-300)",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>{restaurant.name}</h2>
          <p style={{ fontSize: 12, color: "#7a8288", marginTop: 2 }}>{restaurant.address}</p>
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
        <span>
          🚶 도보 {restaurant.walkMinutes}분 ({restaurant.distanceMeters}m)
        </span>
        {summary ? (
          <>
            {summary.topWaiting && <span>⏱ {summary.topWaiting}</span>}
            {summary.topCompanion && <span>👥 {summary.topCompanion} 추천</span>}
          </>
        ) : (
          <span style={{ color: "#bbb" }}>아직 등록된 후기가 없어요</span>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
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
        <Link
          href={`/restaurant/${restaurant.id}`}
          target="_blank"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--color-navy)",
            border: "1px solid var(--color-gray-300)",
            borderRadius: 6,
            padding: "6px 10px",
          }}
        >
          상세보기
        </Link>
        <button
          onClick={() => onWriteReview(restaurant, refreshReviews)}
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
        {reviews.length > 0 && (
          <button
            onClick={() => setShowReviews((v) => !v)}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--color-navy)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            후기 {reviews.length}개 {showReviews ? "접기 ▲" : "보기 ▼"}
          </button>
        )}
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

      {showReviews && (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--color-gray-300)", paddingTop: 10 }}>
          {reviews.map((review) => (
            <div key={review.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontSize: 11 }}>
                <span style={{ fontWeight: 700 }}>{review.nickname}</span>
                <span style={{ color: "#999" }}>·</span>
                <span style={{ color: "#666" }}>⏱ {joinValues(review.waiting)}</span>
                <span style={{ color: "#666" }}>👥 {joinValues(review.companion)}</span>
                <span style={{ color: "#666" }}>💰 {review.priceFeel}</span>
                <span style={{ color: "#666" }}>🔁 {review.revisit}</span>
              </div>
              {review.comment && (
                <p style={{ fontSize: 12, marginTop: 4, color: "#333" }}>{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");
  const [reviewTarget, setReviewTarget] = useState(null);

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
        const list = data.restaurants || [];
        setRestaurants(list);
        cacheRestaurants(list);
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
    let list = restaurants;

    if (activeCategory !== "전체") {
      list = list.filter((r) => r.category === activeCategory);
    }

    const query = searchQuery.trim();
    if (query) {
      list = list.filter((r) => r.name.includes(query));
    }

    return list;
  }, [restaurants, activeCategory, searchQuery]);

  return (
    <main style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
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

      <div style={{ height: "40vh", minHeight: 220 }}>
        <KakaoMap restaurants={filteredRestaurants} />
      </div>

      {/* 검색창 */}
      <div style={{ padding: "10px 16px 0" }}>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="식당 이름으로 검색 (예: 두껍삼)"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid var(--color-gray-300)",
            fontSize: 13,
          }}
        />
      </div>

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

      <div style={{ display: "flex", gap: 8, padding: "8px 16px", fontSize: 12, color: "#7a8288" }}>
        <span>거리 ▾</span>
        <span>가격 ▾</span>
        <span>인원 ▾</span>
        <span>웨이팅 ▾</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 24px" }}>
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
            {searchQuery
              ? `"${searchQuery}"에 해당하는 식당을 찾을 수 없어요.`
              : "해당 카테고리에 등록된 식당이 아직 없어요."}
          </p>
        )}

        {filteredRestaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            onWriteReview={(target, onDone) => setReviewTarget({ restaurant: target, onDone })}
          />
        ))}
      </div>

      {reviewTarget && (
        <ReviewModal
          restaurant={reviewTarget.restaurant}
          onClose={() => setReviewTarget(null)}
          onSubmitted={() => {
            reviewTarget.onDone();
            setReviewTarget(null);
          }}
        />
      )}
    </main>
  );
}
