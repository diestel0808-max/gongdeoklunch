// 대학내일 ES 사옥 (독막로 331, 마스터즈타워빌딩) 좌표
export const OFFICE = {
  name: "대학내일 ES 사옥",
  address: "서울 마포구 독막로 331",
  lat: 37.542959,
  lng: 126.949366,
};

// 카테고리 목록 - 필터 탭에서 사용
export const CATEGORIES = ["전체", "한식", "일식", "중식", "양식", "브런치", "카페"];

// 카카오 카테고리 상세 분류(category_name)에 등장하는 단어를 보고
// 우리 서비스의 카테고리(한식/일식/중식/양식/브런치/카페)로 재분류하기 위한 규칙.
// 배열 순서대로 검사해서 먼저 매칭되는 카테고리로 분류합니다.
export const CATEGORY_KEYWORD_RULES = [
  { category: "브런치", keywords: ["브런치", "샌드위치", "샐러드"] },
  { category: "카페", keywords: ["카페", "커피", "디저트", "베이커리", "제과"] },
  { category: "일식", keywords: ["일식", "일본", "돈까스", "회", "초밥", "라멘", "돈부리", "우동"] },
  { category: "중식", keywords: ["중식", "중국"] },
  {
    category: "양식",
    keywords: ["양식", "이탈리안", "파스타", "피자", "스테이크", "멕시칸", "아시안"],
  },
  {
    category: "한식",
    keywords: [
      "한식",
      "국밥",
      "찌개",
      "백반",
      "고기",
      "구이",
      "국수",
      "냉면",
      "분식",
      "죽",
      "탕",
      "찜",
      "전골",
      "삼겹살",
      "감자탕",
    ],
  },
];

// 위 규칙에 걸리지 않는 애매한 곳은 이 카테고리로 분류 (필터 탭에는 안 보이지만 "전체"에는 포함)
export const FALLBACK_CATEGORY = "기타";

// 검색 시 조회할 카카오 카테고리 그룹 코드 (FD6 = 음식점, CE7 = 카페)
export const SEARCH_GROUP_CODES = ["FD6", "CE7"];

// 수집 반경 (미터 단위) - 독막로 331 기준 800m~1km
export const SEARCH_RADIUS_METERS = 1000;

// 추천 동행 옵션 - 후기 작성 시 사용 예정
export const COMPANION_TAGS = [
  "동기들과",
  "팀원들과",
  "선배와",
  "후배와",
  "소수 인원(2~3명)",
  "다인원(5명+)",
];

// 웨이팅 정도 옵션 - 후기 작성 시 사용 예정
export const WAITING_LEVELS = ["웨이팅 없음", "5~10분", "10~20분", "20분 이상"];

// 가격 체감 옵션
export const PRICE_FEEL_OPTIONS = ["가성비 좋음", "적당", "다소 비쌈"];

// 재방문 의사 옵션
export const REVISIT_OPTIONS = ["또 가고 싶음", "한 번이면 충분"];

// ---------------------------------------------------------------
// 아래는 임시 더미 데이터입니다.
// 다음 단계에서 카카오 로컬 API로 실제 식당 데이터를 자동 수집해서
// 이 부분을 대체할 예정입니다. 지금은 화면 구조 확인용입니다.
// ---------------------------------------------------------------
export const DUMMY_RESTAURANTS = [
  {
    id: "1",
    name: "두껍삼 마포직영점",
    category: "한식",
    address: "서울 마포구 독막로 331",
    lat: 37.54301,
    lng: 126.94935,
    priceRange: "1.5만원대",
    groupSize: "단체 가능",
    waiting: "보통",
    kakaoMapUrl: "https://map.kakao.com/",
  },
  {
    id: "2",
    name: "예시 일식당",
    category: "일식",
    address: "서울 마포구 공덕동 인근",
    lat: 37.5442,
    lng: 126.9505,
    priceRange: "1만원대",
    groupSize: "2~4인",
    waiting: "적음",
    kakaoMapUrl: "https://map.kakao.com/",
  },
  {
    id: "3",
    name: "예시 브런치 카페",
    category: "브런치",
    address: "서울 마포구 공덕동 인근",
    lat: 37.5427,
    lng: 126.9518,
    priceRange: "2만원대",
    groupSize: "2~4인",
    waiting: "많음",
    kakaoMapUrl: "https://map.kakao.com/",
  },
];
