"use client";

import { useMemo, useState } from "react";
import {
  CATEGORIES,
  COMPANION_TAGS,
  DISTANCE_FILTER_OPTIONS,
  PRICE_RANGE_OPTIONS,
  WAITING_LEVELS,
} from "@/lib/constants";
import { getRestaurantFilterData } from "@/lib/reviewStorage";

const chipStyle = (isActive) => ({
  padding: "6px 12px",
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 600,
  border: isActive ? "none" : "1px solid var(--color-gray-300)",
  background: isActive ? "var(--color-teal)" : "#fff",
  color: isActive ? "#fff" : "var(--color-text)",
  cursor: "pointer",
});

function MultiChipGroup({ label, options, values, onToggle, hint }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: "#999", marginLeft: 6 }}>{hint}</span>}
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            style={chipStyle(values.includes(option))}
            onClick={() => onToggle(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function RestaurantResultCard({ restaurant, onOpenDetail }) {
  return (
    <div
      style={{
        border: "1px solid var(--color-gray-300)",
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{restaurant.name}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--color-teal)",
            background: "var(--color-teal-light)",
            padding: "2px 8px",
            borderRadius: 6,
          }}
        >
          {restaurant.category}
        </span>
      </div>
      <p style={{ fontSize: 12, color: "#7a8288", marginTop: 4 }}>
        🚶 도보 {restaurant.walkMinutes}분 · {restaurant.address}
      </p>
      <button
        onClick={() => onOpenDetail(restaurant)}
        style={{
          marginTop: 8,
          fontSize: 12,
          fontWeight: 600,
          color: "var(--color-navy)",
          border: "1px solid var(--color-gray-300)",
          borderRadius: 6,
          padding: "6px 10px",
          background: "#fff",
          cursor: "pointer",
        }}
      >
        상세보기
      </button>
    </div>
  );
}

export default function LunchPickerModal({ restaurants, onClose, onOpenDetail }) {
  const [step, setStep] = useState("form"); // form | result
  const [categories, setCategories] = useState([]);
  const [distances, setDistances] = useState([]);
  const [prices, setPrices] = useState([]);
  const [companions, setCompanions] = useState([]);
  const [waitings, setWaitings] = useState([]);

  const distanceOptions = DISTANCE_FILTER_OPTIONS.filter((o) => o.maxWalkMinutes !== null);
  const categoryOptions = CATEGORIES.filter((c) => c !== "전체");

  const toggle = (list, setList, value) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const candidates = useMemo(() => {
    const maxWalkMinutes = distances.length
      ? Math.max(...distances.map((d) => distanceOptions.find((o) => o.label === d).maxWalkMinutes))
      : null;

    const matchesCategoryAndDistance = (r) => {
      if (categories.length > 0 && !categories.includes(r.category)) return false;
      if (maxWalkMinutes !== null && r.walkMinutes > maxWalkMinutes) return false;
      return true;
    };

    const matchesReviewConditions = (r) => {
      if (prices.length === 0 && companions.length === 0 && waitings.length === 0) return true;
      const { waitingSet, companionSet, priceRangeSet } = getRestaurantFilterData(r.id);
      if (prices.length > 0 && !prices.some((p) => priceRangeSet.has(p))) return false;
      if (companions.length > 0 && !companions.some((c) => companionSet.has(c))) return false;
      if (waitings.length > 0 && !waitings.some((w) => waitingSet.has(w))) return false;
      return true;
    };

    const strict = restaurants
      .filter((r) => matchesCategoryAndDistance(r) && matchesReviewConditions(r))
      .sort((a, b) => a.walkMinutes - b.walkMinutes);

    // 후기 기반 조건(가격/인원/웨이팅)까지 만족하는 곳이 부족하면,
    // 아직 후기가 없어서 못 걸러졌을 뿐일 수 있으니 카테고리+거리 조건만으로 대체 후보를 채웁니다.
    let fallback = [];
    const MIN_RESULTS = 3;
    if (strict.length < MIN_RESULTS) {
      const strictIds = new Set(strict.map((r) => r.id));
      fallback = restaurants
        .filter((r) => matchesCategoryAndDistance(r) && !strictIds.has(r.id))
        .sort((a, b) => a.walkMinutes - b.walkMinutes)
        .slice(0, MIN_RESULTS + 2 - strict.length);
    }

    return { strict, fallback };
  }, [restaurants, categories, distances, prices, companions, waitings]);

  const hasAnyReviewCondition = prices.length > 0 || companions.length > 0 || waitings.length > 0;

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
          maxHeight: "88vh",
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
            marginBottom: 4,
          }}
        >
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>오늘 점심 뭐 먹지?</h2>
          <button
            onClick={onClose}
            style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
        <p style={{ fontSize: 12, color: "#999", marginBottom: 16 }}>
          원하는 조건을 자유롭게 골라주세요. 여러 개 선택할수록 후보가 좁혀져요.
        </p>

        {step === "form" && (
          <>
            <MultiChipGroup
              label="카테고리"
              options={categoryOptions}
              values={categories}
              onToggle={(v) => toggle(categories, setCategories, v)}
            />
            <MultiChipGroup
              label="거리"
              options={distanceOptions.map((o) => o.label)}
              values={distances}
              onToggle={(v) => toggle(distances, setDistances, v)}
            />
            <MultiChipGroup
              label="가격대"
              options={PRICE_RANGE_OPTIONS}
              values={prices}
              onToggle={(v) => toggle(prices, setPrices, v)}
              hint="(후기 기반)"
            />
            <MultiChipGroup
              label="추천 동행"
              options={COMPANION_TAGS}
              values={companions}
              onToggle={(v) => toggle(companions, setCompanions, v)}
              hint="(후기 기반)"
            />
            <MultiChipGroup
              label="웨이팅"
              options={WAITING_LEVELS}
              values={waitings}
              onToggle={(v) => toggle(waitings, setWaitings, v)}
              hint="(후기 기반)"
            />

            <button
              onClick={() => setStep("result")}
              style={{
                width: "100%",
                padding: "13px 0",
                borderRadius: 8,
                border: "none",
                background: "var(--color-navy)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                marginTop: 4,
              }}
            >
              이 조건으로 추천받기
            </button>
          </>
        )}

        {step === "result" && (
          <>
            <button
              onClick={() => setStep("form")}
              style={{
                fontSize: 12,
                color: "var(--color-navy)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              ← 조건 다시 고르기
            </button>

            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
              추천 후보 {candidates.strict.length}곳
            </p>
            {hasAnyReviewCondition && (
              <p style={{ fontSize: 11, color: "#999", marginBottom: 12 }}>
                가격/인원/웨이팅 조건은 후기가 등록된 식당만 대상이에요.
              </p>
            )}

            {candidates.strict.length === 0 && candidates.fallback.length === 0 && (
              <p style={{ fontSize: 13, color: "#999", padding: "24px 0" }}>
                조건에 맞는 식당이 없어요. 조건을 조금 줄여서 다시 시도해보세요.
              </p>
            )}

            {candidates.strict.map((restaurant) => (
              <RestaurantResultCard
                key={restaurant.id}
                restaurant={restaurant}
                onOpenDetail={onOpenDetail}
              />
            ))}

            {candidates.fallback.length > 0 && (
              <>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    marginTop: candidates.strict.length > 0 ? 20 : 0,
                    marginBottom: 4,
                  }}
                >
                  🤖 이런 식당은 어때요?
                </p>
                <p style={{ fontSize: 11, color: "#999", marginBottom: 12 }}>
                  {candidates.strict.length > 0
                    ? "후기 조건까지 딱 맞진 않지만, 카테고리·거리는 조건에 맞는 곳이에요."
                    : "아직 후기가 부족해서 정확히 맞는 곳을 찾기 어려웠어요. 대신 카테고리·거리 조건에 맞는 곳을 추천드려요."}
                </p>
                {candidates.fallback.map((restaurant) => (
                  <RestaurantResultCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    onOpenDetail={onOpenDetail}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
