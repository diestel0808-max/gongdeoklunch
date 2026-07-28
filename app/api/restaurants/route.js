import { NextResponse } from "next/server";
import {
  CATEGORY_KEYWORD_RULES,
  FALLBACK_CATEGORY,
  OFFICE,
  SEARCH_GROUP_CODES,
  SEARCH_RADIUS_METERS,
} from "@/lib/constants";
import { getDistanceMeters, estimateWalkMinutes } from "@/lib/distance";

// Vercel 서버리스 함수 기본 제한(10초)보다 여유를 주기 위해 최대 실행시간을 늘림
// (요금제에 따라 무시될 수 있지만, 지원되는 환경에서는 타임아웃을 방지해줌)
export const maxDuration = 30;

// 카카오가 준 상세 분류 문자열(예: "음식점 > 한식 > 국밥")을 보고
// 우리 서비스 카테고리로 재분류
function classifyCategory(categoryName, placeName) {
  const text = `${categoryName} ${placeName}`;
  for (const rule of CATEGORY_KEYWORD_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return rule.category;
    }
  }
  return FALLBACK_CATEGORY;
}

// 미터 단위 오프셋을 위/경도 오프셋으로 변환 (독막로 331 위도 기준 근사치)
function metersToLatLngOffset(offsetMetersLat, offsetMetersLng, baseLat) {
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos((baseLat * Math.PI) / 180);
  return {
    dLat: offsetMetersLat / metersPerDegLat,
    dLng: offsetMetersLng / metersPerDegLng,
  };
}

// 카카오 "카테고리로 장소 검색" API 1페이지 호출
async function searchKakaoCategory({ groupCode, apiKey, page, centerLat, centerLng, radius }) {
  const url = new URL("https://dapi.kakao.com/v2/local/search/category.json");
  url.searchParams.set("category_group_code", groupCode);
  url.searchParams.set("x", String(centerLng));
  url.searchParams.set("y", String(centerLat));
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("sort", "distance");
  url.searchParams.set("size", "15");
  url.searchParams.set("page", String(page));

  const response = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${apiKey}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `카카오 API 호출 실패 (${response.status}): ${errorBody || "알 수 없는 오류"}`
    );
  }

  return response.json();
}

// 한 중심점에서 최대 3페이지(45개, 카카오 API 상한)까지 가져오기.
// 실패해도(순간적인 요청제한 등) 전체가 죽지 않도록 빈 배열을 반환하고 넘어감.
// 한 번 실패하면 잠깐 쉬었다가 1회 재시도해서, 일시적인 요청제한이었을 경우 복구를 시도함.
async function fetchAllPagesForPoint({ groupCode, apiKey, centerLat, centerLng, radius }) {
  const allDocuments = [];

  const fetchPageWithRetry = async (page) => {
    try {
      return await searchKakaoCategory({ groupCode, apiKey, page, centerLat, centerLng, radius });
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      try {
        return await searchKakaoCategory({ groupCode, apiKey, page, centerLat, centerLng, radius });
      } catch (retryError) {
        console.error("격자 지점 검색 실패(건너뜀):", retryError.message);
        return null;
      }
    }
  };

  for (let page = 1; page <= 3; page += 1) {
    const data = await fetchPageWithRetry(page);
    if (!data) break;
    allDocuments.push(...(data.documents || []));
    if (data.meta?.is_end) break;
  }

  return allDocuments;
}

// 여러 지점을 한 번에 다 요청하면(동시 100개 이상) 카카오의 요청제한(rate limit)에
// 걸려서 일부 구역이 조용히 누락될 수 있습니다. 그래서 한 번에 BATCH_SIZE개씩만
// 동시에 요청하고, 그 배치가 끝나면 다음 배치를 요청하는 방식으로 나눠서 보냅니다.
async function runInBatches(tasks, batchSize) {
  const results = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((task) => task()));
    results.push(...batchResults);
  }
  return results;
}

// ---------------------------------------------------------------
// 카카오 로컬 API는 한 번의 검색(중심점+반경)당 최대 45개까지만 돌려줍니다.
// 반경 안에 식당이 45개보다 많으면 뒤에 있는 곳들이 통째로 누락돼요.
// 특히 공덕역 인근처럼 상권이 밀집된 곳은 900m~1.5km 반경 안에도 식당이
// 45개를 훌쩍 넘을 수 있어서, 격자를 촘촘하게(5x5=25개 지점) 나눠
// 각 지점이 담당하는 구역을 좁혀 45개 상한에 덜 걸리도록 합니다.
//
// 격자 간격(spacing)과 각 지점의 검색 반경(subRadius)은 SEARCH_RADIUS_METERS에
// 비례해서 자동 계산됩니다. 5개 지점이 -radius~+radius를 균등하게 나눠 잡고,
// 각 지점의 반경은 격자 대각선 절반(spacing/√2)보다 여유있게 잡아 사각지대를 없앱니다.
// ---------------------------------------------------------------
function buildSearchGridPoints() {
  const GRID_SIZE = 5;
  const radius = SEARCH_RADIUS_METERS;
  const spacing = (2 * radius) / (GRID_SIZE - 1);
  const subRadius = Math.round((spacing / Math.SQRT2) * 1.15); // 대각선 사각지대까지 여유있게 커버

  const offsetsMeters = Array.from({ length: GRID_SIZE }, (_, i) => -radius + i * spacing);

  const points = [];
  offsetsMeters.forEach((offsetLat) => {
    offsetsMeters.forEach((offsetLng) => {
      const { dLat, dLng } = metersToLatLngOffset(offsetLat, offsetLng, OFFICE.lat);
      points.push({
        centerLat: OFFICE.lat + dLat,
        centerLng: OFFICE.lng + dLng,
        radius: subRadius,
      });
    });
  });
  return points;
}

export async function GET() {
  const apiKey = process.env.KAKAO_REST_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "KAKAO_REST_API_KEY가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요.",
      },
      { status: 500 }
    );
  }

  try {
    const gridPoints = buildSearchGridPoints();

    const fetchTasks = [];
    SEARCH_GROUP_CODES.forEach((groupCode) => {
      gridPoints.forEach((point) => {
        fetchTasks.push(() =>
          fetchAllPagesForPoint({
            groupCode,
            apiKey,
            centerLat: point.centerLat,
            centerLng: point.centerLng,
            radius: point.radius,
          })
        );
      });
    });

    // 동시에 8개씩만 배치로 요청 (카카오 요청제한 회피)
    const documentsByPoint = await runInBatches(fetchTasks, 8);

    const restaurantMap = new Map();

    documentsByPoint.flat().forEach((doc) => {
      if (restaurantMap.has(doc.id)) return;

      const lat = Number(doc.y);
      const lng = Number(doc.x);
      const distanceMeters = getDistanceMeters(OFFICE.lat, OFFICE.lng, lat, lng);

      // 격자 검색 특성상 반경 밖의 결과가 섞일 수 있어 최종적으로 한 번 더 필터링
      if (distanceMeters > SEARCH_RADIUS_METERS) return;

      const category = classifyCategory(doc.category_name || "", doc.place_name || "");

      restaurantMap.set(doc.id, {
        id: doc.id,
        name: doc.place_name,
        category,
        rawCategory: doc.category_name,
        address: doc.road_address_name || doc.address_name,
        lat,
        lng,
        phone: doc.phone || "",
        kakaoMapUrl: doc.place_url,
        distanceMeters,
        walkMinutes: estimateWalkMinutes(distanceMeters),
        priceRange: "정보 없음",
        groupSize: "정보 없음",
        waiting: "정보 없음",
        source: "kakao",
      });
    });

    const restaurants = Array.from(restaurantMap.values()).sort(
      (a, b) => a.distanceMeters - b.distanceMeters
    );

    return NextResponse.json({ restaurants });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
