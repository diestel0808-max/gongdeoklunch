import { supabase } from "@/lib/supabaseClient";
import { getLikerId } from "@/lib/reviewStorage";

// 전체 찜 데이터를 한 번에 불러옴 (홈 화면 인기순 정렬/카운트 표시용)
export async function getAllFavorites() {
  const { data, error } = await supabase.from("favorites").select("restaurant_id, liker_id");
  if (error) {
    console.error("찜 목록을 불러오지 못했습니다:", error);
    return [];
  }
  return data;
}

export function getFavoriteCountFrom(allFavorites, restaurantId) {
  return (allFavorites || []).filter((f) => String(f.restaurant_id) === String(restaurantId))
    .length;
}

export function isFavoritedFrom(allFavorites, restaurantId) {
  const likerId = getLikerId();
  return (allFavorites || []).some(
    (f) => String(f.restaurant_id) === String(restaurantId) && f.liker_id === likerId
  );
}

// 상세 패널처럼 식당 하나만 다룰 때 쓰는 단건 조회
export async function getFavoriteInfoForRestaurant(restaurantId) {
  const likerId = getLikerId();
  const { data, error } = await supabase
    .from("favorites")
    .select("liker_id")
    .eq("restaurant_id", restaurantId);

  if (error) {
    console.error("찜 정보를 불러오지 못했습니다:", error);
    return { count: 0, favorited: false };
  }
  return {
    count: data.length,
    favorited: data.some((f) => f.liker_id === likerId),
  };
}

// 찜 토글 - 성공 시 true(찜함)/false(찜 취소) 반환
export async function toggleFavorite(restaurantId) {
  const likerId = getLikerId();

  const { data: existing } = await supabase
    .from("favorites")
    .select("restaurant_id")
    .eq("restaurant_id", restaurantId)
    .eq("liker_id", likerId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("favorites")
      .delete()
      .eq("restaurant_id", restaurantId)
      .eq("liker_id", likerId);
    return false;
  }

  await supabase.from("favorites").insert({ restaurant_id: restaurantId, liker_id: likerId });
  return true;
}
