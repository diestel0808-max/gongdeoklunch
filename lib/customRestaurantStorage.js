import { getDistanceMeters, estimateWalkMinutes } from "@/lib/distance";
import { OFFICE } from "@/lib/constants";

const KEY = "gongdeok-lunch:custom-restaurants";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getCustomRestaurants() {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

// 카카오 장소검색 결과 하나를 우리 식당 데이터 형태로 변환해서 저장
export function addCustomRestaurant({ placeName, address, lat, lng, category, kakaoMapUrl, phone }) {
  const list = getCustomRestaurants();
  const distanceMeters = getDistanceMeters(OFFICE.lat, OFFICE.lng, lat, lng);

  const restaurant = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: placeName,
    category,
    address,
    lat,
    lng,
    phone: phone || "",
    kakaoMapUrl: kakaoMapUrl || `https://map.kakao.com/link/search/${encodeURIComponent(placeName)}`,
    distanceMeters,
    walkMinutes: estimateWalkMinutes(distanceMeters),
    priceRange: "정보 없음",
    groupSize: "정보 없음",
    waiting: "정보 없음",
    source: "user",
  };

  window.localStorage.setItem(KEY, JSON.stringify([...list, restaurant]));
  return restaurant;
}
