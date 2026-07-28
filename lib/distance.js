// 두 좌표 사이의 직선거리(미터)를 계산하는 Haversine 공식
export function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // 지구 반지름(미터)
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// 도보 이동시간(분) 대략 계산 - 평균 도보 속도 시속 4.5km 기준
export function estimateWalkMinutes(distanceMeters) {
  const walkSpeedMetersPerMinute = 75; // 시속 4.5km = 분당 75m
  return Math.max(1, Math.round(distanceMeters / walkSpeedMetersPerMinute));
}
