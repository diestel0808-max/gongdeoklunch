// ---------------------------------------------------------------
// 임시 저장소: 지금은 이 브라우저(localStorage)에만 저장됩니다.
// 나중에 Supabase를 연동하면, 이 파일 안의 함수들만 교체하면 됩니다.
// 그 전까지는 "모든 사용자가 본다"는 표현이 정확히는 "이 브라우저에서는 계속 유지된다"에
// 가까워요 - 다른 사람 브라우저의 찜 개수까지 실시간 동기화되진 않습니다.
// ---------------------------------------------------------------

const FAVORITES_KEY = "gongdeok-lunch:favorites"; // { [restaurantId]: string[] (찜한 사람 식별자 목록) }
const LIKER_ID_KEY = "gongdeok-lunch:liker-id"; // reviewStorage와 동일한 익명 식별자 재사용

function isBrowser() {
  return typeof window !== "undefined";
}

function getLikerId() {
  if (!isBrowser()) return "anonymous";
  let id = window.localStorage.getItem(LIKER_ID_KEY);
  if (!id) {
    id = `liker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem(LIKER_ID_KEY, id);
  }
  return id;
}

function getAllFavorites() {
  if (!isBrowser()) return {};
  const raw = window.localStorage.getItem(FAVORITES_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveAllFavorites(all) {
  if (!isBrowser()) return;
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(all));
}

export function getFavoriteCount(restaurantId) {
  const all = getAllFavorites();
  return (all[restaurantId] || []).length;
}

export function isFavorited(restaurantId) {
  const all = getAllFavorites();
  return (all[restaurantId] || []).includes(getLikerId());
}

// 찜 토글 (이미 찜했으면 취소) - 변경 후 개수를 반환
export function toggleFavorite(restaurantId) {
  const all = getAllFavorites();
  const likerId = getLikerId();
  const current = all[restaurantId] || [];

  all[restaurantId] = current.includes(likerId)
    ? current.filter((id) => id !== likerId)
    : [...current, likerId];

  saveAllFavorites(all);
  return all[restaurantId].length;
}
