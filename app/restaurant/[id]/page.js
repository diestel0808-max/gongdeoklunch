"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import KakaoMap from "@/components/KakaoMap";
import ReviewModal from "@/components/ReviewModal";
import { getCachedRestaurantById } from "@/lib/restaurantCache";
import { getReviewsForRestaurant, summarizeReviews } from "@/lib/reviewStorage";

function joinValues(value) {
  return Array.isArray(value) ? value.join(", ") : value;
}

export default function RestaurantDetailPage() {
  const params = useParams();
  const { id } = params;

  const [restaurant, setRestaurant] = useState(undefined); // undefined: 로딩중, null: 못찾음
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const refreshReviews = async () => {
    const list = await getReviewsForRestaurant(id);
    setReviews(list);
    setSummary(summarizeReviews(list));
  };

  useEffect(() => {
    // 1순위: 홈 화면에서 캐시해둔 데이터 사용 (API 재호출 없이 즉시 표시)
    const cached = getCachedRestaurantById(id);
    if (cached) {
      setRestaurant(cached);
    } else {
      // 캐시가 없는 경우(주소 직접 접속 등) - 전체 목록을 다시 불러와서 찾기
      fetch("/api/restaurants")
        .then((res) => res.json())
        .then((data) => {
          const found = (data.restaurants || []).find((r) => String(r.id) === String(id));
          setRestaurant(found || null);
        })
        .catch(() => setRestaurant(null));
    }

    refreshReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (restaurant === undefined) {
    return (
      <main style={{ padding: 24, fontSize: 14, color: "#999" }}>불러오는 중...</main>
    );
  }

  if (restaurant === null) {
    return (
      <main style={{ padding: 24, fontSize: 14, color: "#999" }}>
        식당 정보를 찾을 수 없어요. 홈 화면에서 다시 들어와주세요.
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh" }}>
      {/* 상단 지도 */}
      <div style={{ height: "35vh", minHeight: 200 }}>
        <KakaoMap restaurants={[restaurant]} highlightedId={restaurant.id} />
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>{restaurant.name}</h1>
            <p style={{ fontSize: 13, color: "#7a8288", marginTop: 4 }}>{restaurant.address}</p>
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--color-teal)",
              background: "var(--color-teal-light)",
              padding: "4px 10px",
              borderRadius: 6,
              flexShrink: 0,
            }}
          >
            {restaurant.category}
          </span>
        </div>

        {/* 기본 정보 */}
        <div
          style={{
            marginTop: 16,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontSize: 13,
            color: "#444",
          }}
        >
          <span>
            🚶 대학내일 ES 사옥에서 도보 {restaurant.walkMinutes}분 ({restaurant.distanceMeters}m)
          </span>
          {restaurant.phone && <span>📞 {restaurant.phone}</span>}
          <span>💰 가격대: {summary?.topPriceRange || restaurant.priceRange}</span>
          <span>👥 함께 가기 좋은 인원: {summary?.topHeadcount || restaurant.groupSize}</span>
        </div>

        {/* 후기 요약 */}
        {summary && (
          <div
            style={{
              marginTop: 16,
              background: "var(--color-gray-100)",
              borderRadius: 10,
              padding: 12,
              display: "flex",
              gap: 12,
              fontSize: 12,
              flexWrap: "wrap",
            }}
          >
            <span>📝 후기 {summary.count}개</span>
            {summary.topWaiting && <span>⏱ 주로 "{summary.topWaiting}"</span>}
            {summary.topHeadcount && <span>👤 "{summary.topHeadcount}" 인원 많음</span>}
            {summary.topRecommendedFor && <span>👥 "{summary.topRecommendedFor}" 추천 많음</span>}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            onClick={() => setShowReviewModal(true)}
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 8,
              border: "none",
              background: "var(--color-navy)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            후기 남기기
          </button>
          <a
            href={restaurant.kakaoMapUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1,
              padding: "12px 0",
              borderRadius: 8,
              border: "1px solid var(--color-gray-300)",
              color: "var(--color-navy)",
              fontWeight: 700,
              fontSize: 14,
              textAlign: "center",
            }}
          >
            카카오맵 원본
          </a>
        </div>

        {/* 후기 목록 */}
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>
            후기 {reviews.length}개
          </h2>

          {reviews.length === 0 && (
            <p style={{ fontSize: 13, color: "#999" }}>아직 등록된 후기가 없어요. 첫 후기를 남겨보세요!</p>
          )}

          {reviews.map((review) => (
            <div
              key={review.id}
              style={{
                borderBottom: "1px solid var(--color-gray-300)",
                paddingBottom: 12,
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 13 }}>
                <span style={{ fontWeight: 700, color: "var(--color-teal-dark)" }}>{review.nickname}</span>
                <span style={{ color: "#999" }}>·</span>
                <span style={{ color: "#666" }}>⏱ {joinValues(review.waiting)}</span>
                <span style={{ color: "#666" }}>👤 {joinValues(review.headcount)}</span>
                <span style={{ color: "#666" }}>👥 {joinValues(review.recommendedFor)}</span>
                <span style={{ color: "#666" }}>💰 {review.priceRange} ({review.priceFeel})</span>
                <span style={{ color: "#666" }}>🔁 {review.revisit}</span>
              </div>
              {review.menu && (
                <p style={{ fontSize: 13, marginTop: 6, color: "#0a8fa0", fontWeight: 600 }}>
                  🍽 {review.menu}
                </p>
              )}
              {review.comment && (
                <p style={{ fontSize: 13, marginTop: 6, color: "#333", whiteSpace: "pre-line" }}>{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {showReviewModal && (
        <ReviewModal
          restaurant={restaurant}
          onClose={() => setShowReviewModal(false)}
          onSubmitted={() => {
            refreshReviews();
            setShowReviewModal(false);
          }}
        />
      )}
    </main>
  );
}
