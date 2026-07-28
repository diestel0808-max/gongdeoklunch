export function loadKakaoMapScript(appKey) {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      resolve(window.kakao);
      return;
    }

    const existingScript = document.getElementById("kakao-map-sdk");
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        window.kakao.maps.load(() => resolve(window.kakao));
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    // libraries=services는 장소검색(식당 등록 자동완성)에서 사용
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => resolve(window.kakao));
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
