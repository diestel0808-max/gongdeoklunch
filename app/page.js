"use client";

import { useEffect, useMemo, useState } from "react";
import AddRestaurantModal from "@/components/AddRestaurantModal";
import HeartIcon from "@/components/HeartIcon";
import NoticeBanner from "@/components/NoticeBanner";
import KakaoMap from "@/components/KakaoMap";
import LunchPickerModal from "@/components/LunchPickerModal";
import ReviewModal from "@/components/ReviewModal";
import RestaurantDetailPanel from "@/components/RestaurantDetailPanel";
import { CATEGORIES, DISTANCE_FILTER_OPTIONS, GROUP_SIZE_OPTIONS, OFFICE, PRICE_RANGE_OPTIONS, RECOMMENDED_FOR_OPTIONS, WAITING_LEVELS } from "@/lib/constants";
import { getCustomRestaurants } from "@/lib/customRestaurantStorage";
import {
  getReviewsForRestaurant,
  getRestaurantFilterData,
  hasLikedReview,
  summarizeReviews,
  toggleLikeReview,
} from "@/lib/reviewStorage";
import { getFavoriteCount, isFavorited, toggleFavorite } from "@/lib/favoriteStorage";
import { cacheRestaurants } from "@/lib/restaurantCache";

function joinValues(value) {
  return Array.isArray(value) ? value.join(", ") : value;
}

// 필터가 "전체"가 아니라 실제로 적용중일 때 눈에 띄게 강조
function filterSelectStyle(isActive) {
  return {
    fontSize: 12,
    padding: "6px 8px",
    borderRadius: 8,
    border: isActive ? "1px solid var(--color-teal)" : "1px solid var(--color-gray-300)",
    background: isActive ? "var(--color-teal-light)" : "#fff",
    color: isActive ? "var(--color-navy)" : "#555",
    fontWeight: isActive ? 700 : 400,
    cursor: "pointer",
  };
}

function RestaurantCard({ restaurant, onWriteReview, onOpenDetail }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
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
          <button
            onClick={handleToggleFavorite}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 700,
              border: "none",
              background: "transparent",
              color: "#e2662f",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <HeartIcon filled={favorited} size={16} /> {favoriteCount}
          </button>
        </div>
      </div>

      {restaurant.source === "user" && (
        <span
          style={{
            display: "inline-block",
            fontSize: 10,
            fontWeight: 700,
            color: "#888",
            border: "1px solid var(--color-gray-300)",
            padding: "1px 6px",
            borderRadius: 4,
            marginTop: 6,
          }}
        >
          사용자 등록
        </span>
      )}

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
            {summary.topHeadcount && <span>👤 {summary.topHeadcount}</span>}
            {summary.topRecommendedFor && <span>👥 {summary.topRecommendedFor} 추천</span>}
            {summary.topPriceRange && <span>💰 {summary.topPriceRange}</span>}
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
        <button
          onClick={() => onOpenDetail(restaurant)}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--color-navy)",
            border: "1px solid var(--color-gray-300)",
            borderRadius: 6,
            padding: "6px 10px",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          상세보기
        </button>
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

      {/* 후기는 접기/펼치기 없이 항상 전부 표시, 공감 많은 순 정렬 */}
      {reviews.length > 0 && (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--color-gray-300)", paddingTop: 10 }}>
          {reviews.map((review) => {
            const liked = hasLikedReview(review);
            return (
              <div key={review.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontSize: 11 }}>
                  <span style={{ fontWeight: 700 }}>{review.nickname}</span>
                  <span style={{ color: "#999" }}>·</span>
                  <span style={{ color: "#666" }}>⏱ {joinValues(review.waiting)}</span>
                  <span style={{ color: "#666" }}>👤 {joinValues(review.headcount)}</span>
                  <span style={{ color: "#666" }}>👥 {joinValues(review.recommendedFor)}</span>
                  <span style={{ color: "#666" }}>💰 {review.priceRange} ({review.priceFeel})</span>
                  <span style={{ color: "#666" }}>🔁 {review.revisit}</span>
                </div>
                {review.menu && (
                  <p style={{ fontSize: 12, marginTop: 4, color: "#0a8fa0", fontWeight: 600 }}>
                    🍽 {review.menu}
                  </p>
                )}
                {review.comment && (
                  <p style={{ fontSize: 12, marginTop: 4, color: "#333" }}>{review.comment}</p>
                )}
                <button
                  onClick={() => handleLike(review.id)}
                  style={{
                    marginTop: 6,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 9px",
                    borderRadius: 20,
                    border: liked ? "none" : "1px solid var(--color-gray-300)",
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
      )}
    </div>
  );
}

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [distanceFilter, setDistanceFilter] = useState("전체");
  const [priceFilter, setPriceFilter] = useState("전체");
  const [headcountFilter, setHeadcountFilter] = useState("전체");
  const [recommendedForFilter, setRecommendedForFilter] = useState("전체");
  const [waitingFilter, setWaitingFilter] = useState("전체");
  const [sortOption, setSortOption] = useState("distance"); // distance | favorite | review
  const [apiRestaurants, setApiRestaurants] = useState([]);
  const [customRestaurants, setCustomRestaurants] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");
  const [reviewTarget, setReviewTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [showLunchPicker, setShowLunchPicker] = useState(false);
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mql.matches);
    const handler = (e) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const restaurants = useMemo(() => {
    // 카카오 API 로딩이 끝나기 전에 사용자 등록 식당만 먼저 뜨면 어색해 보이므로,
    // 로딩이 완전히 끝난 뒤에만 두 목록을 합칩니다.
    if (status !== "ready") return [];
    return [...apiRestaurants, ...customRestaurants].sort(
      (a, b) => a.distanceMeters - b.distanceMeters
    );
  }, [apiRestaurants, customRestaurants, status]);

  useEffect(() => {
    cacheRestaurants(restaurants);
  }, [restaurants]);

  useEffect(() => {
    setCustomRestaurants(getCustomRestaurants());
  }, []);

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
        setApiRestaurants(list);
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

    // 거리 필터 - 도보 시간 기준 (카카오 API 좌표로 항상 계산되는 값이라 후기 없이도 동작)
    const distanceOption = DISTANCE_FILTER_OPTIONS.find((o) => o.label === distanceFilter);
    if (distanceOption?.maxWalkMinutes) {
      list = list.filter((r) => r.walkMinutes <= distanceOption.maxWalkMinutes);
    }

    // 가격대 / 인원수 / 추천대상 / 웨이팅 필터 - 후기 데이터 기준이라, 후기가 없는 곳은 이 필터들에서 제외됨
    if (
      priceFilter !== "전체" ||
      headcountFilter !== "전체" ||
      recommendedForFilter !== "전체" ||
      waitingFilter !== "전체"
    ) {
      list = list.filter((r) => {
        const { waitingSet, headcountSet, recommendedForSet, priceRangeSet } =
          getRestaurantFilterData(r.id);
        if (priceFilter !== "전체" && !priceRangeSet.has(priceFilter)) return false;
        if (headcountFilter !== "전체" && !headcountSet.has(headcountFilter)) return false;
        if (recommendedForFilter !== "전체" && !recommendedForSet.has(recommendedForFilter))
          return false;
        if (waitingFilter !== "전체" && !waitingSet.has(waitingFilter)) return false;
        return true;
      });
    }

    return list;
  }, [
    restaurants,
    activeCategory,
    searchQuery,
    distanceFilter,
    priceFilter,
    headcountFilter,
    recommendedForFilter,
    waitingFilter,
  ]);

  const sortedRestaurants = useMemo(() => {
    if (sortOption === "favorite") {
      return [...filteredRestaurants].sort(
        (a, b) => getFavoriteCount(b.id) - getFavoriteCount(a.id)
      );
    }
    if (sortOption === "review") {
      return [...filteredRestaurants].sort(
        (a, b) => getRestaurantFilterData(b.id).reviewCount - getRestaurantFilterData(a.id).reviewCount
      );
    }
    return filteredRestaurants; // 기본: 거리순 (restaurants가 이미 거리순으로 정렬돼있음)
  }, [filteredRestaurants, sortOption]);

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
          <h1 style={{ fontSize: 16, fontWeight: 700 }}>댕턴뭐먹지</h1>
          <p style={{ fontSize: 12, color: "#7a8288" }}>{OFFICE.name} 기준</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setShowLunchPicker(true)}
            style={{
              fontSize: 12,
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: "var(--color-navy)",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            🍽 오늘 점심 뭐 먹지?
          </button>
          <button
            onClick={() => setShowAddRestaurant(true)}
            style={{
              fontSize: 12,
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: "var(--color-teal)",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            + 식당 등록
          </button>
        </div>
      </header>

      <NoticeBanner />

      <style>{`
        .app-content { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
        @media (min-width: 768px) {
          .app-content { flex-direction: row; }
          .map-pane { width: 42% !important; height: 100% !important; flex-shrink: 0; }
          .list-pane { width: 58%; height: 100%; overflow-y: auto; }
        }
      `}</style>

      <div className="app-content">
        <div className="map-pane" style={{ height: "40vh", minHeight: 220 }}>
          <KakaoMap
            restaurants={sortedRestaurants}
            highlightedId={detailTarget?.id}
            onMarkerClick={(restaurant) => setDetailTarget(restaurant)}
          />
        </div>

        <div className="list-pane">
        {isDesktop && detailTarget ? (
          <RestaurantDetailPanel
            restaurant={detailTarget}
            onClose={() => setDetailTarget(null)}
            inline
          />
        ) : (
        <>
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

      <div style={{ display: "flex", justifyContent: "flex-end", padding: "8px 16px 0" }}>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          style={{
            fontSize: 12,
            padding: "6px 8px",
            borderRadius: 8,
            border: "1px solid var(--color-gray-300)",
            background: "#fff",
            color: "#555",
            cursor: "pointer",
          }}
        >
          <option value="distance">거리순</option>
          <option value="favorite">인기순 (찜 많은 순)</option>
          <option value="review">후기 많은 순</option>
        </select>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "8px 16px",
          flexWrap: "wrap",
        }}
      >
        <select
          value={distanceFilter}
          onChange={(e) => setDistanceFilter(e.target.value)}
          style={filterSelectStyle(distanceFilter !== "전체")}
        >
          {DISTANCE_FILTER_OPTIONS.map((o) => (
            <option key={o.label} value={o.label}>
              거리: {o.label}
            </option>
          ))}
        </select>

        <select
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value)}
          style={filterSelectStyle(priceFilter !== "전체")}
        >
          <option value="전체">가격: 전체</option>
          {PRICE_RANGE_OPTIONS.map((o) => (
            <option key={o} value={o}>
              가격: {o}
            </option>
          ))}
        </select>

        <select
          value={headcountFilter}
          onChange={(e) => setHeadcountFilter(e.target.value)}
          style={filterSelectStyle(headcountFilter !== "전체")}
        >
          <option value="전체">인원수: 전체</option>
          {GROUP_SIZE_OPTIONS.map((o) => (
            <option key={o} value={o}>
              인원수: {o}
            </option>
          ))}
        </select>

        <select
          value={recommendedForFilter}
          onChange={(e) => setRecommendedForFilter(e.target.value)}
          style={filterSelectStyle(recommendedForFilter !== "전체")}
        >
          <option value="전체">추천대상: 전체</option>
          {RECOMMENDED_FOR_OPTIONS.map((o) => (
            <option key={o} value={o}>
              추천대상: {o}
            </option>
          ))}
        </select>

        <select
          value={waitingFilter}
          onChange={(e) => setWaitingFilter(e.target.value)}
          style={filterSelectStyle(waitingFilter !== "전체")}
        >
          <option value="전체">웨이팅: 전체</option>
          {WAITING_LEVELS.map((o) => (
            <option key={o} value={o}>
              웨이팅: {o}
            </option>
          ))}
        </select>

        {(priceFilter !== "전체" ||
          headcountFilter !== "전체" ||
          recommendedForFilter !== "전체" ||
          waitingFilter !== "전체") && (
          <button
            onClick={() => {
              setPriceFilter("전체");
              setHeadcountFilter("전체");
              setRecommendedForFilter("전체");
              setWaitingFilter("전체");
            }}
            style={{
              fontSize: 12,
              color: "#999",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            필터 초기화
          </button>
        )}
      </div>

      {(priceFilter !== "전체" ||
        headcountFilter !== "전체" ||
        recommendedForFilter !== "전체" ||
        waitingFilter !== "전체") && (
        <p style={{ fontSize: 11, color: "#999", padding: "0 16px 8px" }}>
          가격/인원수/추천대상/웨이팅 필터는 후기가 등록된 식당에서만 적용돼요.
        </p>
      )}

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

        {status === "ready" && sortedRestaurants.length === 0 && (
          <p style={{ fontSize: 13, color: "#999", padding: "24px 0" }}>
            {searchQuery
              ? `"${searchQuery}"에 해당하는 식당을 찾을 수 없어요.`
              : "선택한 필터 조건에 맞는 식당이 없어요. (가격/인원/웨이팅 필터는 후기가 달린 곳만 대상이에요)"}
          </p>
        )}

        {sortedRestaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            onWriteReview={(target, onDone) => setReviewTarget({ restaurant: target, onDone })}
            onOpenDetail={(target) => setDetailTarget(target)}
          />
        ))}
      </div>
        </>
        )}
        </div>
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

      {!isDesktop && detailTarget && (
        <RestaurantDetailPanel restaurant={detailTarget} onClose={() => setDetailTarget(null)} />
      )}

      {showLunchPicker && (
        <LunchPickerModal
          restaurants={restaurants}
          onClose={() => setShowLunchPicker(false)}
          onOpenDetail={(restaurant) => {
            setShowLunchPicker(false);
            setDetailTarget(restaurant);
          }}
        />
      )}

      {showAddRestaurant && (
        <AddRestaurantModal
          onClose={() => setShowAddRestaurant(false)}
          onAdded={() => {
            setCustomRestaurants(getCustomRestaurants());
            setShowAddRestaurant(false);
          }}
        />
      )}
    </main>
  );
}
