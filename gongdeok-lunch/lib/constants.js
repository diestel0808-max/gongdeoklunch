// 대학내일 ES 사옥 (독막로 331, 마스터즈타워빌딩) 좌표
export const OFFICE = {
  name: "대학내일 ES 사옥",
  address: "서울 마포구 독막로 331",
  lat: 37.542959,
  lng: 126.949366,
};

// 카테고리 목록 - 필터 탭에서 사용
export const CATEGORIES = ["전체", "한식", "일식", "중식", "양식", "브런치", "카페"];

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
