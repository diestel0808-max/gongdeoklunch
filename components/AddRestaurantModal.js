"use client";

import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import { addCustomRestaurant } from "@/lib/customRestaurantStorage";
import { loadKakaoMapScript } from "@/lib/kakaoLoader";

export default function AddRestaurantModal({ onClose, onAdded, existingRestaurants = [] }) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("idle"); // idle | searching | error
  const [errorMessage, setErrorMessage] = useState("");

  const categoryOptions = CATEGORIES.filter((c) => c !== "전체");

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setStatus("searching");
    setErrorMessage("");
    setSelectedPlace(null);

    try {
      const appKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
      const kakao = await loadKakaoMapScript(appKey);

      const places = new kakao.maps.services.Places();
      places.keywordSearch(keyword.trim(), (data, statusCode) => {
        if (statusCode === kakao.maps.services.Status.OK) {
          setResults(data);
          setStatus("idle");
        } else {
          setResults([]);
          setStatus("idle");
          setErrorMessage("검색 결과가 없어요. 다른 검색어로 시도해보세요.");
        }
      });
    } catch (error) {
      setStatus("error");
      setErrorMessage("지도 서비스를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  // 이름이 같거나(공백 무시), 좌표가 아주 가까우면(15m 이내) 이미 등록된 곳으로 판단
  // 같은 건물에 여러 식당이 입점해 있으면 카카오 좌표가 거의 동일하게 잡히는 경우가 많아서,
  // "좌표가 가깝다"만으로 중복 판정하면 전혀 다른 식당(예: 같은 건물의 카페와 초밥집)이
  // 서로 중복으로 잘못 걸리는 문제가 있었습니다. 그래서 이름이 실제로 같을 때만 중복으로 판단합니다.
  const duplicateRestaurant = useMemo(() => {
    if (!selectedPlace) return null;
    const normalizedName = selectedPlace.place_name.replace(/\s/g, "");

    return (
      existingRestaurants.find((r) => (r.name || "").replace(/\s/g, "") === normalizedName) ||
      null
    );
  }, [selectedPlace, existingRestaurants]);

  const handleSubmit = async () => {
    if (!selectedPlace) {
      setErrorMessage("먼저 검색 결과에서 식당을 선택해주세요.");
      return;
    }
    if (duplicateRestaurant) {
      setErrorMessage("이미 등록된 식당이에요. 목록에서 확인해주세요.");
      return;
    }
    if (!category) {
      setErrorMessage("카테고리를 선택해주세요.");
      return;
    }

    try {
      await addCustomRestaurant({
        placeName: selectedPlace.place_name,
        address: selectedPlace.road_address_name || selectedPlace.address_name,
        lat: Number(selectedPlace.y),
        lng: Number(selectedPlace.x),
        category,
        kakaoMapUrl: selectedPlace.place_url,
        phone: selectedPlace.phone,
      });
      onAdded();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(27,42,52,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 60,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: 480,
          maxHeight: "85vh",
          overflowY: "auto",
          borderRadius: "16px 16px 0 0",
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>식당 등록하기</h2>
          <button
            onClick={onClose}
            style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: 12, color: "#999", marginBottom: 12 }}>
          목록에 없는 식당을 카카오맵에서 검색해서 추가할 수 있어요.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="식당 이름 검색 (예: 두껍삼)"
              style={{
                width: "100%",
                padding: "8px 30px 8px 10px",
                borderRadius: 8,
                border: "1px solid var(--color-gray-300)",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
            {keyword && (
              <button
                onClick={() => {
                  setKeyword("");
                  setResults([]);
                  setSelectedPlace(null);
                  setErrorMessage("");
                }}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  color: "#999",
                  fontSize: 15,
                  cursor: "pointer",
                  padding: 4,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            style={{
              padding: "0 16px",
              borderRadius: 8,
              border: "none",
              background: "var(--color-navy)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            검색
          </button>
        </div>

        {status === "searching" && (
          <p style={{ fontSize: 12, color: "#999", marginBottom: 12 }}>검색 중...</p>
        )}

        {results.length > 0 && (
          <div style={{ marginBottom: 16, maxHeight: 220, overflowY: "auto" }}>
            {results.map((place) => {
              const isSelected = selectedPlace?.id === place.id;
              return (
                <button
                  key={place.id}
                  onClick={() => setSelectedPlace(place)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: isSelected
                      ? "2px solid var(--color-teal)"
                      : "1px solid var(--color-gray-300)",
                    background: isSelected ? "var(--color-teal-light)" : "#fff",
                    marginBottom: 6,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{place.place_name}</div>
                  <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                    {place.road_address_name || place.address_name}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selectedPlace && duplicateRestaurant && (
          <div
            style={{
              background: "#fff4e5",
              border: "1px solid #f0c060",
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 700, color: "#9a6a00" }}>
              ⚠️ 이미 등록된 식당이에요!
            </p>
            <p style={{ fontSize: 12, color: "#9a6a00", marginTop: 4 }}>
              "{duplicateRestaurant.name}"(으)로 이미 목록에 있어요. 후기를 남기고 싶다면 홈
              화면에서 검색해서 "후기 남기기"를 이용해주세요.
            </p>
          </div>
        )}

        {selectedPlace && !duplicateRestaurant && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>카테고리 선택</p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {categoryOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setCategory(option)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    border: category === option ? "none" : "1px solid var(--color-gray-300)",
                    background: category === option ? "var(--color-teal)" : "#fff",
                    color: category === option ? "#fff" : "var(--color-text)",
                    cursor: "pointer",
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {errorMessage && (
          <p style={{ fontSize: 12, color: "#d33", marginBottom: 12 }}>{errorMessage}</p>
        )}

        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 8,
            border: "none",
            background: "var(--color-navy)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          등록하기
        </button>
      </div>
    </div>
  );
}
