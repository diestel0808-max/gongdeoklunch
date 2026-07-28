import { supabase } from "@/lib/supabaseClient";
import { getDistanceMeters, estimateWalkMinutes } from "@/lib/distance";
import { OFFICE } from "@/lib/constants";

function mapRow(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    phone: row.phone || "",
    kakaoMapUrl: row.kakao_map_url,
    distanceMeters: row.distance_meters,
    walkMinutes: row.walk_minutes,
    priceRange: "정보 없음",
    groupSize: "정보 없음",
    waiting: "정보 없음",
    source: "user",
  };
}

export async function getCustomRestaurants() {
  const { data, error } = await supabase.from("custom_restaurants").select("*");
  if (error) {
    console.error("사용자 등록 식당을 불러오지 못했습니다:", error);
    return [];
  }
  return data.map(mapRow);
}

export async function addCustomRestaurant({
  placeName,
  address,
  lat,
  lng,
  category,
  kakaoMapUrl,
  phone,
}) {
  const distanceMeters = getDistanceMeters(OFFICE.lat, OFFICE.lng, lat, lng);
  const walkMinutes = estimateWalkMinutes(distanceMeters);

  const { data, error } = await supabase
    .from("custom_restaurants")
    .insert({
      name: placeName,
      category,
      address,
      lat,
      lng,
      phone: phone || "",
      kakao_map_url:
        kakaoMapUrl || `https://map.kakao.com/link/search/${encodeURIComponent(placeName)}`,
      distance_meters: distanceMeters,
      walk_minutes: walkMinutes,
    })
    .select()
    .single();

  if (error) {
    console.error("식당 등록 실패:", error);
    throw new Error("식당 등록에 실패했어요. 잠시 후 다시 시도해주세요.");
  }
  return mapRow(data);
}
