const CACHE_KEY = "gongdeok-lunch:restaurants-cache";

export function cacheRestaurants(restaurants) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(restaurants));
}

export function getCachedRestaurants() {
  if (typeof window === "undefined") return [];
  const raw = window.sessionStorage.getItem(CACHE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getCachedRestaurantById(id) {
  return getCachedRestaurants().find((r) => String(r.id) === String(id)) || null;
}
