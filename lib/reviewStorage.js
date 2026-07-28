// ---------------------------------------------------------------
// 임시 저장소: 지금은 이 브라우저(localStorage)에만 저장됩니다.
// 나중에 Supabase를 연동하면, 이 파일 안의 함수들만
// Supabase 호출 코드로 교체하면 되고 화면(컴포넌트) 쪽은 안 건드려도 됩니다.
// ---------------------------------------------------------------

const PROFILE_KEY = "gongdeok-lunch:profile"; // 닉네임 + PIN
const REVIEWS_KEY = "gongdeok-lunch:reviews"; // 식당별 후기 목록

function isBrowser() {
  return typeof window !== "undefined";
}

// ------------------ 닉네임 / PIN (내 후기함 열쇠) ------------------

export function getProfile() {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveProfile({ nickname, pin }) {
  if (!isBrowser()) return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify({ nickname, pin }));
}

// 이미 닉네임+PIN을 설정한 적이 있는지 (있으면 다시 입력받지 않고 그대로 재사용)
export function hasProfile() {
  return Boolean(getProfile()?.nickname && getProfile()?.pin);
}

// 명시적으로 "다른 사람으로 전환"할 때만 사용 (기본 흐름에서는 호출하지 않음)
export function clearProfile() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(PROFILE_KEY);
}

// ------------------ 후기 ------------------

function getAllReviews() {
  if (!isBrowser()) return {};
  const raw = window.localStorage.getItem(REVIEWS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveAllReviews(allReviews) {
  if (!isBrowser()) return;
  window.localStorage.setItem(REVIEWS_KEY, JSON.stringify(allReviews));
}

// 특정 식당의 후기 목록 가져오기 (공감 많은 순 -> 최신순)
export function getReviewsForRestaurant(restaurantId) {
  const allReviews = getAllReviews();
  const list = allReviews[restaurantId] || [];
  return [...list].sort((a, b) => {
    const likeDiff = (b.likes || 0) - (a.likes || 0);
    if (likeDiff !== 0) return likeDiff;
    return b.createdAt - a.createdAt;
  });
}

// 이 브라우저(사람)가 공감을 눌렀는지 구분하기 위한 간단한 익명 식별자
function getLikerId() {
  if (!isBrowser()) return "anonymous";
  const KEY = "gongdeok-lunch:liker-id";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = `liker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

// 후기에 공감 토글 (이미 눌렀으면 취소, 안 눌렀으면 추가)
export function toggleLikeReview(restaurantId, reviewId) {
  const allReviews = getAllReviews();
  const list = allReviews[restaurantId] || [];
  const likerId = getLikerId();

  const updated = list.map((review) => {
    if (review.id !== reviewId) return review;

    const likedBy = review.likedBy || [];
    const alreadyLiked = likedBy.includes(likerId);
    const newLikedBy = alreadyLiked
      ? likedBy.filter((id) => id !== likerId)
      : [...likedBy, likerId];

    return { ...review, likedBy: newLikedBy, likes: newLikedBy.length };
  });

  allReviews[restaurantId] = updated;
  saveAllReviews(allReviews);
  return updated;
}

export function hasLikedReview(review) {
  const likerId = getLikerId();
  return (review.likedBy || []).includes(likerId);
}

// 후기 추가
export function addReview(restaurantId, review) {
  const allReviews = getAllReviews();
  const list = allReviews[restaurantId] || [];

  const newReview = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    likes: 0,
    likedBy: [],
    ...review,
  };

  allReviews[restaurantId] = [...list, newReview];
  saveAllReviews(allReviews);
  return newReview;
}

// 특정 식당 후기들을 요약 (가장 많이 나온 웨이팅/동행 태그 등)
// waiting, companion은 복수 선택이라 배열로 들어옵니다.
export function summarizeReviews(reviews) {
  if (!reviews || reviews.length === 0) return null;

  const countBy = (key) => {
    const counts = {};
    reviews.forEach((r) => {
      const value = r[key];
      const values = Array.isArray(value) ? value : value ? [value] : [];
      values.forEach((v) => {
        counts[v] = (counts[v] || 0) + 1;
      });
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : null;
  };

  return {
    count: reviews.length,
    topWaiting: countBy("waiting"),
    topCompanion: countBy("companion"),
    topPriceFeel: countBy("priceFeel"),
  };
}
