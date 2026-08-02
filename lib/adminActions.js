import { supabase } from "@/lib/supabaseClient";

// ------------------ 카테고리 오버라이드 ------------------

export async function getCategoryOverrides() {
  const { data, error } = await supabase
    .from("category_overrides")
    .select("restaurant_id, category");
  if (error) {
    console.error("카테고리 오버라이드를 불러오지 못했습니다:", error);
    return {};
  }
  const map = {};
  data.forEach((row) => {
    map[row.restaurant_id] = row.category;
  });
  return map;
}

export async function setCategoryOverride(restaurantId, category) {
  const { error } = await supabase
    .from("category_overrides")
    .upsert({ restaurant_id: String(restaurantId), category, updated_at: new Date().toISOString() });
  if (error) {
    console.error("카테고리 수정 실패:", error);
    throw new Error("카테고리 수정에 실패했어요.");
  }
}

// ------------------ 식당 숨김/삭제 ------------------

export async function getHiddenRestaurantIds() {
  const { data, error } = await supabase.from("hidden_restaurants").select("restaurant_id");
  if (error) {
    console.error("숨김 목록을 불러오지 못했습니다:", error);
    return [];
  }
  return data.map((row) => row.restaurant_id);
}

// 카카오 API로 수집된 식당은 우리 DB에 없어서 "숨김" 처리만 가능
export async function hideRestaurant(restaurantId, reason) {
  const { error } = await supabase
    .from("hidden_restaurants")
    .upsert({ restaurant_id: String(restaurantId), reason: reason || "" });
  if (error) {
    console.error("식당 숨김 실패:", error);
    throw new Error("숨김 처리에 실패했어요.");
  }
}

export async function unhideRestaurant(restaurantId) {
  const { error } = await supabase
    .from("hidden_restaurants")
    .delete()
    .eq("restaurant_id", String(restaurantId));
  if (error) {
    console.error("숨김 해제 실패:", error);
    throw new Error("숨김 해제에 실패했어요.");
  }
}

// 사용자가 직접 등록한 식당은 실제로 삭제 가능
export async function deleteCustomRestaurant(restaurantId) {
  const { error } = await supabase.from("custom_restaurants").delete().eq("id", restaurantId);
  if (error) {
    console.error("식당 삭제 실패:", error);
    throw new Error("삭제에 실패했어요.");
  }
}
