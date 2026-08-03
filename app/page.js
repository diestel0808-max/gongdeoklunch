"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AddRestaurantModal from "@/components/AddRestaurantModal";
import AdminPanel from "@/components/AdminPanel";
import HeartIcon from "@/components/HeartIcon";
import MyPageModal from "@/components/MyPageModal";
import NoticeBanner from "@/components/NoticeBanner";
import OnboardingModal from "@/components/OnboardingModal";
import ShareButton from "@/components/ShareButton";
import KakaoMap from "@/components/KakaoMap";
import LunchPickerModal from "@/components/LunchPickerModal";
import ReviewModal from "@/components/ReviewModal";
import RestaurantDetailPanel from "@/components/RestaurantDetailPanel";
import { CATEGORIES, DISTANCE_FILTER_OPTIONS, GROUP_SIZE_OPTIONS, OFFICE, PRICE_RANGE_OPTIONS, RECOMMENDED_FOR_OPTIONS, WAITING_LEVELS } from "@/lib/constants";
import { getCustomRestaurants } from "@/lib/customRestaurantStorage";
import {
  getAllReviews,
  getProfile,
  getReviewsForRestaurantFrom,
  getRestaurantFilterDataFrom,
  hasLikedReview,
  summarizeReviews,
  toggleLikeReview,
} from "@/lib/reviewStorage";
import {
  getAllFavorites,
  getFavoriteCountFrom,
  isFavoritedFrom,
  toggleFavorite,
} from "@/lib/favoriteStorage";
import { cacheRestaurants } from "@/lib/restaurantCache";
import { getCategoryOverrides, getHiddenRestaurantIds } from "@/lib/adminActions";

function joinValues(value) {
  return Array.isArray(value) ? value.join(", ") : value;
}

// 필터가 "전체"가 아니라 실제로 적용중일 때 눈에 띄게 강조
// 모바일 서랍 메뉴의 버튼 하나하나에 쓰는 공통 스타일
function mobileMenuItemStyle(background, color, outlined = false) {
  return {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "12px 14px",
    borderRadius: 8,
    border: outlined ? "1px solid var(--color-gray-300)" : "none",
    background,
    color,
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    marginBottom: 10,
    boxSizing: "border-box",
  };
}

function filterSelectStyle(isActive) {
  return {
    fontSize: 13,
    padding: "7px 10px",
    borderRadius: 8,
    border: isActive ? "1px solid var(--color-teal)" : "1px solid var(--color-gray-300)",
    background: isActive ? "var(--color-teal-light)" : "#fff",
    color: isActive ? "var(--color-navy)" : "#555",
    fontWeight: isActive ? 700 : 400,
    cursor: "pointer",
  };
}

// 리스트 미리보기에서 후기가 너무 길면 몇 줄로 줄이고 "더보기"로 펼칠 수 있게 함
function TruncatedComment({ text }) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const paragraphRef = useRef(null);

  useEffect(() => {
    const el = paragraphRef.current;
    if (!el) return;
    // 실제로 2줄을 넘어서 잘리는 경우에만 "더보기"를 보여줌 (짧은 후기엔 안 뜸)
    setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  return (
    <div style={{ marginTop: 4 }}>
      <p
        ref={paragraphRef}
        style={{
          fontSize: 13,
          color: "#333",
          whiteSpace: "pre-line",
          ...(!expanded
            ? {
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
            : {}),
        }}
      >
        {text}
      </p>
      {isOverflowing && (
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            fontSize: 11,
            color: "#aaa",
            fontWeight: 400,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            marginTop: 2,
          }}
        >
          {expanded ? "접기" : "더보기"}
        </button>
      )}
    </div>
  );
}

function RestaurantCard({
  restaurant,
  allReviews,
  allFavorites,
  onWriteReview,
  onOpenDetail,
  onRefreshReviews,
  onRefreshFavorites,
}) {
  const reviews = useMemo(
    () => getReviewsForRestaurantFrom(allReviews, restaurant.id),
    [allReviews, restaurant.id]
  );
  const summary = useMemo(() => summarizeReviews(reviews), [reviews]);
  const favoriteCount = getFavoriteCountFrom(allFavorites, restaurant.id);
  const favorited = isFavoritedFrom(allFavorites, restaurant.id);

  const handleToggleFavorite = async () => {
    await toggleFavorite(restaurant.id);
    onRefreshFavorites();
  };

  const handleLike = async (review) => {
    await toggleLikeReview(review);
    onRefreshReviews();
  };

  return (
    <div
      style={{
        border: "1px solid var(--color-gray-300)",
        borderRadius: 12,
        padding: 18,
        marginBottom: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>{restaurant.name}</h2>
          <p style={{ fontSize: 13, color: "#7a8288", marginTop: 4, lineHeight: 1.4 }}>
            {restaurant.address}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
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
          <button
            onClick={handleToggleFavorite}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 13,
              fontWeight: 700,
              border: "none",
              background: "transparent",
              color: "#e2662f",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <HeartIcon filled={favorited} size={17} /> {favoriteCount}
          </button>
        </div>
      </div>

      {restaurant.source === "user" && (
        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            fontWeight: 700,
            color: "#888",
            border: "1px solid var(--color-gray-300)",
            padding: "2px 7px",
            borderRadius: 4,
            marginTop: 8,
          }}
        >
          사용자 등록
        </span>
      )}

      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 12,
          fontSize: 13,
          color: "#444",
          flexWrap: "wrap",
          lineHeight: 1.6,
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

      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <a
          href={restaurant.kakaoMapUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-navy)",
            border: "1px solid var(--color-gray-300)",
            borderRadius: 6,
            padding: "7px 12px",
          }}
        >
          카카오맵에서 보기
        </a>
        <button
          onClick={() => onOpenDetail(restaurant)}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-navy)",
            border: "1px solid var(--color-gray-300)",
            borderRadius: 6,
            padding: "7px 12px",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          상세보기
        </button>
        <button
          onClick={() => onWriteReview(restaurant)}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            background: "var(--color-navy)",
            border: "none",
            borderRadius: 6,
            padding: "7px 12px",
            cursor: "pointer",
          }}
        >
          후기 남기기
        </button>
      </div>

      {/* 후기는 접기/펼치기 없이 항상 전부 표시, 공감 많은 순 정렬 */}
      {/* 매장 정보와 구분되도록 연한 회색 배경 박스로 감쌈 */}
      {reviews.length > 0 && (
        <div
          style={{
            marginTop: 14,
            marginLeft: -18,
            marginRight: -18,
            marginBottom: -18,
            background: "var(--color-gray-100)",
            borderTop: "1px solid var(--color-gray-300)",
            borderRadius: "0 0 12px 12px",
            padding: "14px 18px 18px",
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8 }}>
            후기 {reviews.length}개
          </p>
          {reviews.slice(0, 2).map((review) => {
            const liked = hasLikedReview(review);
            return (
              <div
                key={review.id}
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 13, lineHeight: 2 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--color-teal-dark)" }}>{review.nickname}</span>
                  <span style={{ color: "#999" }}>·</span>
                  <span style={{ color: "#666" }}>⏱ {joinValues(review.waiting)}</span>
                  <span style={{ color: "#666" }}>👤 {joinValues(review.headcount)}</span>
                  <span style={{ color: "#666" }}>👥 {joinValues(review.recommendedFor)}</span>
                  <span style={{ color: "#666" }}>💰 {review.priceRange} ({review.priceFeel})</span>
                  <span style={{ color: "#666" }}>🔁 {review.revisit}</span>
                </div>
                {review.menu && (
                  <p style={{ fontSize: 13, marginTop: 4, color: "#0a8fa0", fontWeight: 600 }}>
                    🍽 {review.menu}
                  </p>
                )}
                {review.comment && <TruncatedComment text={review.comment} />}
                <button
                  onClick={() => handleLike(review)}
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
          {reviews.length > 2 && (
            <button
              onClick={() => onOpenDetail(restaurant)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--color-navy)",
                background: "transparent",
                border: "none",
                padding: "6px 0 2px",
                cursor: "pointer",
              }}
            >
              후기 {reviews.length - 2}개 더 보기 →
            </button>
          )}
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
  const [hiddenIds, setHiddenIds] = useState([]);
  const [categoryOverrides, setCategoryOverrides] = useState({});

  const refreshRestaurantMeta = useCallback(async () => {
    const [hidden, overrides] = await Promise.all([
      getHiddenRestaurantIds(),
      getCategoryOverrides(),
    ]);
    setHiddenIds(hidden);
    setCategoryOverrides(overrides);
  }, []);

  useEffect(() => {
    refreshRestaurantMeta();
  }, [refreshRestaurantMeta]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");
  const [reviewTarget, setReviewTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [showLunchPicker, setShowLunchPicker] = useState(false);
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [allReviews, setAllReviews] = useState([]);
  const [allFavorites, setAllFavorites] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMyPage, setShowMyPage] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    // 이 브라우저에 저장된 닉네임이 없으면(첫 접속) 온보딩 팝업을 띄움
    if (!getProfile()) {
      setShowOnboarding(true);
    }
  }, []);

  const refreshAllReviews = useCallback(async () => {
    setAllReviews(await getAllReviews());
  }, []);

  const refreshAllFavorites = useCallback(async () => {
    setAllFavorites(await getAllFavorites());
  }, []);

  useEffect(() => {
    refreshAllReviews();
    refreshAllFavorites();
  }, [refreshAllReviews, refreshAllFavorites]);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mql.matches);
    const handler = (e) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // onMarkerClick을 매 렌더마다 새로 만들면 지도 마커가 불필요하게 자주 다시 그려지므로 고정
  const handleMarkerClick = useCallback((restaurant) => setDetailTarget(restaurant), []);

  const restaurants = useMemo(() => {
    // 카카오 API 로딩이 끝나기 전에 사용자 등록 식당만 먼저 뜨면 어색해 보이므로,
    // 로딩이 완전히 끝난 뒤에만 두 목록을 합칩니다.
    if (status !== "ready") return [];
    const hiddenSet = new Set(hiddenIds.map(String));
    return [...apiRestaurants, ...customRestaurants]
      .filter((r) => !hiddenSet.has(String(r.id)))
      .map((r) =>
        categoryOverrides[r.id] ? { ...r, category: categoryOverrides[r.id] } : r
      )
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [apiRestaurants, customRestaurants, status, hiddenIds, categoryOverrides]);

  useEffect(() => {
    cacheRestaurants(restaurants);
  }, [restaurants]);

  useEffect(() => {
    getCustomRestaurants().then(setCustomRestaurants);
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
          getRestaurantFilterDataFrom(allReviews, r.id);
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
    allReviews,
  ]);

  const sortedRestaurants = useMemo(() => {
    if (sortOption === "favorite") {
      return [...filteredRestaurants].sort(
        (a, b) =>
          getFavoriteCountFrom(allFavorites, b.id) - getFavoriteCountFrom(allFavorites, a.id)
      );
    }
    if (sortOption === "review") {
      return [...filteredRestaurants].sort(
        (a, b) =>
          getRestaurantFilterDataFrom(allReviews, b.id).reviewCount -
          getRestaurantFilterDataFrom(allReviews, a.id).reviewCount
      );
    }
    return filteredRestaurants; // 기본: 거리순 (restaurants가 이미 거리순으로 정렬돼있음)
  }, [filteredRestaurants, sortOption, allFavorites, allReviews]);

  return (
    <main style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header
        className="app-header"
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--color-gray-300)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div className="header-logo-row" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
            <img src="/logo.png" alt="댕턴뭐먹지" className="header-logo" style={{ height: 30, display: "block" }} />
            <p style={{ fontSize: 12, color: "#7a8288" }}>{OFFICE.name} 기준</p>
          </div>
        </div>

        {/* PC에서만 보이는 기존 버튼 그룹 (그대로 유지) */}
        <div className="header-actions-desktop" style={{ display: "none", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
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
          <ShareButton />
          <button
            onClick={() => setShowMyPage(true)}
            style={{
              fontSize: 12,
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid var(--color-gray-300)",
              background: "#fff",
              color: "var(--color-navy)",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            🙋 마이페이지
          </button>
          <button
            onClick={() => setShowAdminPanel(true)}
            style={{
              fontSize: 12,
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid var(--color-gray-300)",
              background: "#fff",
              color: "#999",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            ⚙️
          </button>
        </div>

        {/* 모바일 전용: PC 최적화 안내 + 햄버거 버튼 */}
        <div className="mobile-menu-btn" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ fontSize: 10, color: "#bbb", textAlign: "right", lineHeight: 1.3, margin: 0 }}>
            💻 PC 환경에
            <br />
            최적화되어있어요
          </p>
          <button
            onClick={() => setShowMobileMenu(true)}
            style={{
              fontSize: 22,
              width: 40,
              height: 40,
              borderRadius: 8,
              border: "1px solid var(--color-gray-300)",
              background: "#fff",
              color: "var(--color-navy)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ☰
          </button>
        </div>
      </header>

      <NoticeBanner />

      <style>{`
        .app-content { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
        .map-pane { flex-shrink: 0; }
        .list-pane { flex: 1; overflow-y: auto; min-height: 0; }
        @media (min-width: 768px) {
          .app-content { flex-direction: row; }
          .map-pane { width: 42% !important; height: 100% !important; }
          .list-pane { width: 58%; height: 100%; }
          .app-header { padding: 22px 28px !important; }
          .header-logo { height: 42px !important; }
          .notice-title { font-size: 14px !important; }
          .notice-toggle-label { font-size: 11px !important; }
          .notice-toggle-label { font-size: 14px !important; }
          .header-logo-row { flex-direction: row !important; align-items: center !important; gap: 10px !important; }
          .header-actions-desktop { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>

      <div className="app-content">
        <div className="map-pane" style={{ height: "28vh", minHeight: 180 }}>
          <KakaoMap
            restaurants={sortedRestaurants}
            highlightedId={detailTarget?.id}
            onMarkerClick={handleMarkerClick}
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
        <div style={{ position: "relative" }}>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="식당 이름으로 검색 (예: 두껍삼)"
          autoComplete="off"
          name="restaurant-search"
          style={{
            width: "100%",
            padding: "10px 36px 10px 12px",
            borderRadius: 8,
            border: "1px solid var(--color-gray-300)",
            fontSize: 13,
            boxSizing: "border-box",
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              border: "none",
              background: "transparent",
              color: "#999",
              fontSize: 16,
              cursor: "pointer",
              padding: 4,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </div>
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
                padding: "7px 16px",
                borderRadius: 20,
                fontSize: 14,
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
            대학내일 ES 인근 식당 정보를 불러오는 중...
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
            allReviews={allReviews}
            allFavorites={allFavorites}
            onWriteReview={(target) => setReviewTarget({ restaurant: target })}
            onOpenDetail={(target) => setDetailTarget(target)}
            onRefreshReviews={refreshAllReviews}
            onRefreshFavorites={refreshAllFavorites}
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
            refreshAllReviews();
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
          allReviews={allReviews}
          onClose={() => setShowLunchPicker(false)}
          onOpenDetail={(restaurant) => {
            setShowLunchPicker(false);
            setDetailTarget(restaurant);
          }}
        />
      )}

      {showAddRestaurant && (
        <AddRestaurantModal
          existingRestaurants={restaurants}
          onClose={() => setShowAddRestaurant(false)}
          onAdded={() => {
            getCustomRestaurants().then(setCustomRestaurants);
            setShowAddRestaurant(false);
          }}
        />
      )}

      {showOnboarding && (
        <OnboardingModal
          onClose={() => setShowOnboarding(false)}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      {showMyPage && (
        <MyPageModal
          restaurants={restaurants}
          onClose={() => setShowMyPage(false)}
          onChanged={refreshAllReviews}
          onFavoritesChanged={refreshAllFavorites}
        />
      )}

      {showAdminPanel && (
        <AdminPanel
          restaurants={restaurants}
          allReviews={allReviews}
          onClose={() => setShowAdminPanel(false)}
          onDataChanged={() => {
            refreshRestaurantMeta();
            refreshAllReviews();
          }}
        />
      )}

      {showMobileMenu && (
        <div
          onClick={() => setShowMobileMenu(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(27,42,52,0.5)",
            zIndex: 80,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              width: "78%",
              maxWidth: 300,
              height: "100%",
              padding: 20,
              boxShadow: "-4px 0 20px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <img src="/logo.png" alt="댕턴뭐먹지" style={{ height: 22 }} />
              <button
                onClick={() => setShowMobileMenu(false)}
                style={{ border: "none", background: "transparent", fontSize: 20, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <button
              onClick={() => {
                setShowMobileMenu(false);
                setShowMyPage(true);
              }}
              style={mobileMenuItemStyle("#fff", "var(--color-navy)", true)}
            >
              🙋 마이페이지
            </button>

            <button
              onClick={() => {
                setShowMobileMenu(false);
                setShowLunchPicker(true);
              }}
              style={mobileMenuItemStyle("var(--color-navy)", "#fff")}
            >
              🍽 오늘 점심 뭐 먹지?
            </button>

            <button
              onClick={() => {
                setShowMobileMenu(false);
                setShowAddRestaurant(true);
              }}
              style={mobileMenuItemStyle("var(--color-teal)", "#fff")}
            >
              + 식당 등록
            </button>

            <div style={{ marginBottom: 10 }}>
              <ShareButton
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  textAlign: "left",
                  padding: "12px 14px",
                  fontSize: 14,
                }}
              />
            </div>

            <button
              onClick={() => {
                setShowMobileMenu(false);
                setShowAdminPanel(true);
              }}
              style={mobileMenuItemStyle("#fff", "#999", true)}
            >
              ⚙️ 관리자 페이지
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
