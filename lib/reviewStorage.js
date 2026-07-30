import { supabase } from "@/lib/supabaseClient";
import { hashPin } from "@/lib/pinHash";

const PROFILE_KEY = "gongdeok-lunch:profile"; // 이 브라우저가 기억하는 닉네임 (매번 재입력 방지용)
const LIKER_ID_KEY = "gongdeok-lunch:liker-id"; // 공감/찜을 누른 사람 구분용 익명 식별자

function isBrowser() {
  return typeof window !== "undefined";
}

// ------------------ 이 브라우저가 기억하는 프로필 (매번 재입력 방지) ------------------

export function getProfile() {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveProfile({ nickname, pin }) {
  if (!isBrowser()) return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify({ nickname, pin }));
}

export function hasProfile() {
  return Boolean(getProfile()?.nickname && getProfile()?.pin);
}

export function clearProfile() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(PROFILE_KEY);
}

// ------------------ 서버(Supabase)에 닉네임+PIN 확인/등록 ------------------
// 처음 쓰는 닉네임이면 새로 등록하고, 이미 있는 닉네임이면 PIN이 맞는지 확인합니다.
// 이미 있는 닉네임인지 미리 확인 (신규 등록 화면에서 실시간 안내용)
export async function checkNicknameAvailable(nickname) {
  const { data, error } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("nickname", nickname)
    .maybeSingle();
  if (error) return { ok: false, message: "확인 중 오류가 발생했어요." };
  return { available: !data };
}

// 신규 가입 전용: 닉네임이 이미 있으면 실패, 전화번호도 이미 등록되어 있으면 실패
export async function createProfile(nickname, phone, pin) {
  const pinHash = await hashPin(pin);

  const { data: existingNickname, error: nicknameError } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("nickname", nickname)
    .maybeSingle();
  if (nicknameError) return { ok: false, message: "서버 확인 중 오류가 발생했어요." };
  if (existingNickname)
    return { ok: false, message: "이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해주세요." };

  if (phone) {
    const { data: existingPhone, error: phoneError } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("phone", phone)
      .maybeSingle();
    if (phoneError) return { ok: false, message: "서버 확인 중 오류가 발생했어요." };
    if (existingPhone)
      return { ok: false, message: "이미 등록된 전화번호예요. 로그인으로 시도해주세요." };
  }

  const { error: insertError } = await supabase
    .from("profiles")
    .insert({ nickname, phone: phone || null, pin_hash: pinHash });
  if (insertError) {
    if (insertError.code === "23505") {
      return {
        ok: false,
        message: "방금 다른 사람이 같은 닉네임/전화번호를 선점했어요. 다시 확인해주세요.",
      };
    }
    return { ok: false, message: "가입 중 오류가 발생했어요." };
  }
  return { ok: true };
}

// 전화번호 + PIN으로 로그인 - 닉네임을 몰라도 이걸로 내 계정을 찾을 수 있음
export async function loginByPhone(phone, pin) {
  const pinHash = await hashPin(pin);

  const { data: nickname, error } = await supabase.rpc("login_by_phone", {
    input_phone: phone,
    input_pin_hash: pinHash,
  });

  if (error) return { ok: false, message: "서버 확인 중 오류가 발생했어요." };
  if (!nickname) {
    return { ok: false, message: "전화번호 또는 PIN이 일치하지 않아요." };
  }
  return { ok: true, nickname };
}

// 로그인 전용: 이미 등록된 닉네임+PIN이 맞는지만 확인 (없으면 실패, 새로 만들지 않음)
export async function verifyProfile(nickname, pin) {
  const pinHash = await hashPin(pin);

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("nickname", nickname)
    .maybeSingle();
  if (selectError) return { ok: false, message: "서버 확인 중 오류가 발생했어요." };
  if (!existing) {
    return { ok: false, message: "등록되지 않은 닉네임이에요. 처음이시면 아래에서 등록해주세요." };
  }

  const { data: isValid, error: rpcError } = await supabase.rpc("verify_pin", {
    input_nickname: nickname,
    input_pin_hash: pinHash,
  });
  if (rpcError) return { ok: false, message: "PIN 확인 중 오류가 발생했어요." };
  if (!isValid) return { ok: false, message: "PIN이 일치하지 않아요." };
  return { ok: true };
}

// ReviewModal 등에서 쓰는 기존 방식 (있으면 확인, 없으면 새로 생성) - 하위 호환용으로 유지
export async function verifyOrCreateProfile(nickname, pin) {
  const pinHash = await hashPin(pin);

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("nickname", nickname)
    .maybeSingle();

  if (selectError) return { ok: false, message: "서버 확인 중 오류가 발생했어요." };

  if (existing) {
    const { data: isValid, error: rpcError } = await supabase.rpc("verify_pin", {
      input_nickname: nickname,
      input_pin_hash: pinHash,
    });
    if (rpcError) return { ok: false, message: "PIN 확인 중 오류가 발생했어요." };
    if (!isValid) return { ok: false, message: "이미 있는 닉네임인데 PIN이 일치하지 않아요." };
    return { ok: true };
  }

  const { error: insertError } = await supabase
    .from("profiles")
    .insert({ nickname, pin_hash: pinHash });
  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, message: "방금 다른 사람이 같은 닉네임을 선점했어요. 다른 닉네임을 써주세요." };
    }
    return { ok: false, message: "프로필 생성 중 오류가 발생했어요." };
  }
  return { ok: true, created: true };
}

// ------------------ 좋아요/찜을 누른 사람 구분용 익명 식별자 ------------------

export function getLikerId() {
  if (!isBrowser()) return "anonymous";
  let id = window.localStorage.getItem(LIKER_ID_KEY);
  if (!id) {
    id = `liker-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem(LIKER_ID_KEY, id);
  }
  return id;
}

// ------------------ 후기 (Supabase reviews 테이블) ------------------

function mapReviewRow(row) {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    nickname: row.nickname,
    waiting: row.waiting || [],
    headcount: row.headcount || [],
    recommendedFor: row.recommended_for || [],
    priceRange: row.price_range,
    priceFeel: row.price_feel,
    revisit: row.revisit,
    menu: row.menu,
    comment: row.comment,
    likes: row.likes || 0,
    likedBy: row.liked_by || [],
    createdAt: row.created_at,
  };
}

// 전체 식당의 후기를 한 번에 가져옴 (홈 화면 필터/정렬/추천 계산용 - 매번 여러 번 조회하지 않도록)
export async function getAllReviews() {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("likes", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("후기 목록을 불러오지 못했습니다:", error);
    return [];
  }
  return data.map(mapReviewRow);
}

// 특정 식당의 후기만 (상세 패널 등에서 사용)
export async function getReviewsForRestaurant(restaurantId) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("likes", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("후기를 불러오지 못했습니다:", error);
    return [];
  }
  return data.map(mapReviewRow);
}

export async function addReview(restaurantId, review) {
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      restaurant_id: restaurantId,
      nickname: review.nickname,
      waiting: review.waiting,
      headcount: review.headcount,
      recommended_for: review.recommendedFor,
      price_range: review.priceRange,
      price_feel: review.priceFeel,
      revisit: review.revisit,
      menu: review.menu,
      comment: review.comment,
    })
    .select()
    .single();

  if (error) {
    console.error("후기 등록 실패:", error);
    throw new Error("후기 등록에 실패했어요. 잠시 후 다시 시도해주세요.");
  }
  return mapReviewRow(data);
}

// 내가 쓴 후기만 조회 (마이페이지용)
export async function getMyReviews(nickname) {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("nickname", nickname)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("내 후기를 불러오지 못했습니다:", error);
    return [];
  }
  return data.map(mapReviewRow);
}

export async function updateReview(reviewId, review) {
  const { data, error } = await supabase
    .from("reviews")
    .update({
      waiting: review.waiting,
      headcount: review.headcount,
      recommended_for: review.recommendedFor,
      price_range: review.priceRange,
      price_feel: review.priceFeel,
      revisit: review.revisit,
      menu: review.menu,
      comment: review.comment,
    })
    .eq("id", reviewId)
    .select()
    .single();

  if (error) {
    console.error("후기 수정 실패:", error);
    throw new Error("후기 수정에 실패했어요.");
  }
  return mapReviewRow(data);
}

export async function deleteReview(reviewId) {
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (error) {
    console.error("후기 삭제 실패:", error);
    throw new Error("후기 삭제에 실패했어요.");
  }
}

// 공감 토글 (이미 눌렀으면 취소)
export async function toggleLikeReview(review) {
  const likerId = getLikerId();
  const likedBy = review.likedBy || [];
  const alreadyLiked = likedBy.includes(likerId);
  const newLikedBy = alreadyLiked ? likedBy.filter((id) => id !== likerId) : [...likedBy, likerId];

  const { error } = await supabase
    .from("reviews")
    .update({ liked_by: newLikedBy, likes: newLikedBy.length })
    .eq("id", review.id);

  if (error) {
    console.error("공감 처리 실패:", error);
  }
}

export function hasLikedReview(review) {
  const likerId = getLikerId();
  return (review.likedBy || []).includes(likerId);
}

// ------------------ 집계/필터용 순수 함수 (이미 불러온 배열을 대상으로 계산) ------------------

// waiting, headcount, recommendedFor는 복수 선택이라 배열로 들어옵니다.
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
    topHeadcount: countBy("headcount"),
    topRecommendedFor: countBy("recommendedFor"),
    topPriceFeel: countBy("priceFeel"),
    topPriceRange: countBy("priceRange"),
  };
}

// 전체 후기 배열(allReviews)에서 특정 식당 후기만 걸러내고, 필터링용 셋을 만듦
// (getAllReviews()를 한 번만 불러온 뒤, 이 함수로 식당별 계산을 반복하는 용도)
export function getRestaurantFilterDataFrom(allReviews, restaurantId) {
  const reviews = (allReviews || []).filter(
    (r) => String(r.restaurantId) === String(restaurantId)
  );

  const waitingSet = new Set();
  const headcountSet = new Set();
  const recommendedForSet = new Set();
  const priceRangeSet = new Set();

  reviews.forEach((review) => {
    (review.waiting || []).forEach((v) => v && waitingSet.add(v));
    (review.headcount || []).forEach((v) => v && headcountSet.add(v));
    (review.recommendedFor || []).forEach((v) => v && recommendedForSet.add(v));
    if (review.priceRange) priceRangeSet.add(review.priceRange);
  });

  return {
    waitingSet,
    headcountSet,
    recommendedForSet,
    priceRangeSet,
    reviewCount: reviews.length,
  };
}

export function getReviewsForRestaurantFrom(allReviews, restaurantId) {
  return (allReviews || []).filter((r) => String(r.restaurantId) === String(restaurantId));
}
