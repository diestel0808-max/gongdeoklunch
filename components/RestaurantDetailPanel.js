"use client";

import { useEffect, useState } from "react";
import KakaoMap from "@/components/KakaoMap";
import HeartIcon from "@/components/HeartIcon";
import ReviewModal from "@/components/ReviewModal";
import {
  getReviewsForRestaurant,
  hasLikedReview,
  summarizeReviews,
  toggleLikeReview,
} from "@/lib/reviewStorage";
import { getFavoriteCount, isFavorited, toggleFavorite } from "@/lib/favoriteStorage";

function joinValues(value) {
  return Array.isArray(value) ? value.join(", ") : value;
}

export default function RestaurantDetailPanel({ restaurant, onClose, inline = false }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [favorited, setFavorited] = useState(false);

  const refreshReviews = () => {
    const list = getReviewsForRestaurant(restaurant.id);
    setReviews(list);
    setSummary(summarizeReviews(list));
  };

  useEffect(() => {
    refreshReviews();
    setFavoriteCount(getFavoriteCount(restaurant.id));
    setFavorited(isFavorited(restaurant.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant.id]);

  const handleToggleFavorite = () => {
    const newCount = toggleFavorite(restaurant.id);
    setFavoriteCount(newCount);
    setFavorited(isFavorited(restaurant.id));
  };

  const handleLike = (reviewId) => {
    toggleLikeReview(restaurant.id, reviewId);
    refreshReviews();
  };

  const outerStyle = inline
    ? { width: "100%", height: "100%", overflowY: "auto", background: "#fff" }
    : {
        position: "fixed",
        inset: 0,
        background: "rgba(27,42,52,0.5)",
        display: "flex",
        justifyContent: "flex-end",
        zIndex: 40,
      };

  const innerStyle = inline
    ? { background: "#fff", width: "100%" }
    : {
        background: "#fff",
        width: "100%",
        maxWidth: 480,
        height: "100%",
        overflowY: "auto",
      };

  return (
    <div style={outerStyle} onClick={inline ? undefined : onClose}>
      <div
        onClick={inline ? undefined : (e) => e.stopPropagation()}
        style={innerStyle}
      >
        {/* 상단 바: PC 인라인 모드는 "목록으로" 링크, 모바일 오버레이는 닫기(X) */}
        <div
          style={{
            position: "sticky",
            top: 0,
            background: "#fff",
            zIndex: 1,
            display: "flex",
            justifyContent: inline ? "flex-start" : "flex-end",
            padding: "10px 14px",
            borderBottom: "1px solid var(--color-gray-300)",
          }}
        >
          {inline ? (
            <button
              onClick={onClose}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--color-navy)",
                cursor: "pointer",
              }}
            >
              ← 목록으로
            </button>
          ) : (
            <button
              onClick={onClose}
              style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer" }}
            >
              ✕
            </button>
          )}
        </div>

        {/* 지도 - PC 인라인 모드는 왼쪽에 이미 같은 식당이 강조 표시되므로 생략 */}
        {!inline && (
          <div style={{ height: "32vh", minHeight: 180 }}>
            <KakaoMap restaurants={[restaurant]} highlightedId={restaurant.id} />
          </div>
        )}

        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>{restaurant.name}</h1>
              <p style={{ fontSize: 14, color: "#7a8288", marginTop: 4 }}>{restaurant.address}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--color-teal)",
                  background: "var(--color-teal-light)",
                  padding: "5px 12px",
                  borderRadius: 6,
                  flexShrink: 0,
                }}
              >
                {restaurant.category}
              </span>
              <button
                onClick={handleToggleFavorite}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 14,
                  fontWeight: 700,
                  border: "none",
                  background: "transparent",
                  color: "#e2662f",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <HeartIcon filled={favorited} size={19} /> {favoriteCount}
              </button>
            </div>
          </div>

          <div
            style={{
              marginTop: 18,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              fontSize: 15,
              color: "#333",
            }}
          >
            <span>
              🚶 대학내일 ES 사옥에서 도보 {restaurant.walkMinutes}분 ({restaurant.distanceMeters}m)
            </span>
            {restaurant.phone && <span>📞 {restaurant.phone}</span>}
            <span>💰 가격대: {summary?.topPriceRange || restaurant.priceRange}</span>
            <span>👥 함께 가기 좋은 인원: {summary?.topHeadcount || restaurant.groupSize}</span>
          </div>

          {summary && (
            <div
              style={{
                marginTop: 18,
                background: "var(--color-gray-100)",
                borderRadius: 10,
                padding: 14,
                display: "flex",
                gap: 14,
                fontSize: 14,
                flexWrap: "wrap",
              }}
            >
              <span>📝 후기 {summary.count}개</span>
              {summary.topWaiting && <span>⏱ 주로 "{summary.topWaiting}"</span>}
              {summary.topHeadcount && <span>👤 "{summary.topHeadcount}" 인원 많음</span>}
              {summary.topRecommendedFor && (
                <span>👥 "{summary.topRecommendedFor}" 추천 많음</span>
              )}
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

          {/* 후기 목록 - 접기/펼치기 없이 항상 전부 표시, 공감 많은 순 */}
          <div style={{ marginTop: 26 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>
              후기 {reviews.length}개
            </h2>

            {reviews.length === 0 && (
              <p style={{ fontSize: 14, color: "#999" }}>
                아직 등록된 후기가 없어요. 첫 후기를 남겨보세요!
              </p>
            )}

            {reviews.map((review) => {
              const liked = hasLikedReview(review);
              return (
                <div
                  key={review.id}
                  style={{
                    borderBottom: "1px solid var(--color-gray-300)",
                    paddingBottom: 14,
                    marginBottom: 14,
                  }}
                >
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 14 }}>
                    <span style={{ fontWeight: 700 }}>{review.nickname}</span>
                    <span style={{ color: "#999" }}>·</span>
                    <span style={{ color: "#555" }}>⏱ {joinValues(review.waiting)}</span>
                    <span style={{ color: "#555" }}>👤 {joinValues(review.headcount)}</span>
                    <span style={{ color: "#555" }}>👥 {joinValues(review.recommendedFor)}</span>
                    <span style={{ color: "#555" }}>💰 {review.priceRange} ({review.priceFeel})</span>
                    <span style={{ color: "#555" }}>🔁 {review.revisit}</span>
                  </div>
                  {review.menu && (
                    <p style={{ fontSize: 14, marginTop: 8, color: "#0a8fa0", fontWeight: 600 }}>
                      🍽 {review.menu}
                    </p>
                  )}
                  {review.comment && (
                    <p style={{ fontSize: 14, marginTop: 8, color: "#333", whiteSpace: "pre-line" }}>{review.comment}</p>
                  )}
                  <button
                    onClick={() => handleLike(review.id)}
                    style={{
                      marginTop: 10,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 13,
                      fontWeight: 600,
                      padding: "5px 11px",
                      borderRadius: 20,
                      border: liked
                        ? "none"
                        : "1px solid var(--color-gray-300)",
                      background: liked ? "var(--color-teal)" : "#fff",
                      color: liked ? "#fff" : "var(--color-text)",
                      cursor: "pointer",
                    }}
                  >
                    👍 공감 {review.likes || 0}
                  </button>
                </div>
              );
            })}
          </div>
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
    </div>
  );
}
