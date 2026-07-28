import { NextResponse } from "next/server";
import {
  CATEGORY_KEYWORD_RULES,
  FALLBACK_CATEGORY,
  OFFICE,
  SEARCH_GROUP_CODES,
  SEARCH_RADIUS_METERS,
} from "@/lib/constants";
import { getDistanceMeters, estimateWalkMinutes } from "@/lib/distance";

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

// 카카오 "카테고리로 장소 검색" API - 이름에 단어가 없어도 해당 그룹(FD6/CE7)이면 전부 나옴
// 한 번에 최대 15개까지만 주므로, 여러 페이지를 이어서 요청
async function searchKakaoCategory({ groupCode, apiKey, page }) {
  const url = new URL("https://dapi.kakao.com/v2/local/search/category.json");
  url.searchParams.set("category_group_code", groupCode);
  url.searchParams.set("x", String(OFFICE.lng));
  url.searchParams.set("y", String(OFFICE.lat));
  url.searchParams.set("radius", String(SEARCH_RADIUS_METERS));
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

// 한 그룹코드(FD6/CE7)에 대해 여러 페이지를 끝까지(또는 최대 pageLimit까지) 가져오기
async function fetchAllPages({ groupCode, apiKey, pageLimit = 5 }) {
  const allDocuments = [];

  for (let page = 1; page <= pageLimit; page += 1) {
    const data = await searchKakaoCategory({ groupCode, apiKey, page });
    allDocuments.push(...(data.documents || []));

    // 카카오 응답의 is_end가 true면 더 이상 페이지가 없다는 뜻
    if (data.meta?.is_end) break;
  }

  return allDocuments;
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
    const documentsByGroup = await Promise.all(
      SEARCH_GROUP_CODES.map((groupCode) => fetchAllPages({ groupCode, apiKey }))
    );

    const restaurantMap = new Map();

    documentsByGroup.flat().forEach((doc) => {
      if (restaurantMap.has(doc.id)) return;

      const lat = Number(doc.y);
      const lng = Number(doc.x);
      const distanceMeters = getDistanceMeters(OFFICE.lat, OFFICE.lng, lat, lng);
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
