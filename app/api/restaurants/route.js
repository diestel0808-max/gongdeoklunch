import { NextResponse } from "next/server";
import {
  CATEGORY_SEARCH_CONFIG,
  OFFICE,
  SEARCH_RADIUS_METERS,
} from "@/lib/constants";
import { getDistanceMeters, estimateWalkMinutes } from "@/lib/distance";

// 카카오 로컬(키워드) 검색 API 한 번 호출
async function searchKakaoKeyword({ keyword, groupCode, apiKey }) {
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", keyword);
  url.searchParams.set("x", String(OFFICE.lng));
  url.searchParams.set("y", String(OFFICE.lat));
  url.searchParams.set("radius", String(SEARCH_RADIUS_METERS));
  url.searchParams.set("category_group_code", groupCode);
  url.searchParams.set("sort", "distance");
  url.searchParams.set("size", "15");

  const response = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${apiKey}` },
    // 매번 최신 데이터를 가져오도록 캐시하지 않음
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `카카오 API 호출 실패 (${response.status}): ${errorBody || "알 수 없는 오류"}`
    );
  }

  const data = await response.json();
  return data.documents || [];
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
    // 카테고리별로 병렬 검색
    const resultsByCategory = await Promise.all(
      CATEGORY_SEARCH_CONFIG.map(async ({ category, keyword, groupCode }) => {
        const documents = await searchKakaoKeyword({ keyword, groupCode, apiKey });
        return { category, documents };
      })
    );

    // 같은 식당이 여러 카테고리 검색에 중복으로 걸릴 수 있어 id 기준으로 합치기
    const restaurantMap = new Map();

    resultsByCategory.forEach(({ category, documents }) => {
      documents.forEach((doc) => {
        if (restaurantMap.has(doc.id)) return; // 먼저 매칭된 카테고리를 우선 사용

        const lat = Number(doc.y);
        const lng = Number(doc.x);
        const distanceMeters = getDistanceMeters(OFFICE.lat, OFFICE.lng, lat, lng);

        restaurantMap.set(doc.id, {
          id: doc.id,
          name: doc.place_name,
          category,
          address: doc.road_address_name || doc.address_name,
          lat,
          lng,
          phone: doc.phone || "",
          kakaoMapUrl: doc.place_url,
          distanceMeters,
          walkMinutes: estimateWalkMinutes(distanceMeters),
          // 아래는 카카오 API가 제공하지 않는 정보라 기본값으로 채워두고,
          // 추후 관리자 보완 입력이나 후기 집계로 대체될 예정
          priceRange: "정보 없음",
          groupSize: "정보 없음",
          waiting: "정보 없음",
        });
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
