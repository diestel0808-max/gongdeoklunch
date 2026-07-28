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

function RestaurantResultCard({ result, totalConditions, onOpenDetail }) {
  const { restaurant, matchedCount } = result;
  return (
    <div
      style={{
        border: "1px solid var(--color-gray-300)",
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{restaurant.name}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--color-teal)",
            background: "var(--color-teal-light)",
            padding: "2px 8px",
            borderRadius: 6,
            flexShrink: 0,
          }}
        >
          {restaurant.category}
        </span>
      </div>
      <p style={{ fontSize: 12, color: "#7a8288", marginTop: 4 }}>
        🚶 도보 {restaurant.walkMinutes}분 · {restaurant.address}
      </p>
      {totalConditions > 0 && (
        <p style={{ fontSize: 11, color: "var(--color-navy)", fontWeight: 700, marginTop: 4 }}>
          🎯 조건 {matchedCount}/{totalConditions} 일치
        </p>
      )}
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

  // ---------------------------------------------------------------
  // 점수 기반 추천: 조건을 "다 맞아야만 통과"가 아니라, 5개 조건군(카테고리/거리/
  // 가격/동행/웨이팅) 중 사용자가 실제로 선택한 것들을 기준으로 "몇 개나 맞는지"
  // 점수를 매겨서 높은 순으로 정렬합니다. 후기가 부족해 일부 조건을 확인할 수
  // 없는 곳도 완전히 배제되지 않고, 맞는 조건 개수만큼 순위에 반영돼요.
  // ---------------------------------------------------------------
  const rankedResults = useMemo(() => {
    const maxWalkMinutes = distances.length
      ? Math.max(...distances.map((d) => distanceOptions.find((o) => o.label === d).maxWalkMinutes))
      : null;

    const selectedGroups = [
      categories.length > 0,
      distances.length > 0,
      prices.length > 0,
      companions.length > 0,
      waitings.length > 0,
    ].filter(Boolean).length;

    const scored = restaurants.map((restaurant) => {
      const { waitingSet, companionSet, priceRangeSet, reviewCount } = getRestaurantFilterData(
        restaurant.id
      );

      let matchedCount = 0;
      if (categories.length > 0 && categories.includes(restaurant.category)) matchedCount += 1;
      if (maxWalkMinutes !== null && restaurant.walkMinutes <= maxWalkMinutes) matchedCount += 1;
      if (prices.length > 0 && prices.some((p) => priceRangeSet.has(p))) matchedCount += 1;
      if (companions.length > 0 && companions.some((c) => companionSet.has(c))) matchedCount += 1;
      if (waitings.length > 0 && waitings.some((w) => waitingSet.has(w))) matchedCount += 1;

      return { restaurant, matchedCount, reviewCount };
    });

    scored.sort((a, b) => {
      if (b.matchedCount !== a.matchedCount) return b.matchedCount - a.matchedCount;
      if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount; // 후기 많은 곳 우선
      return a.restaurant.walkMinutes - b.restaurant.walkMinutes; // 가까운 곳 우선
    });

    return { scored, totalConditions: selectedGroups };
  }, [restaurants, categories, distances, prices, companions, waitings]);

  const topResults = rankedResults.scored.slice(0, 10);
  const hasAnyReviewCondition = prices.length > 0 || companions.length > 0 || waitings.length > 0;

  const handleRandomPick = () => {
    if (rankedResults.scored.length === 0) return;
    const topScore = rankedResults.scored[0].matchedCount;
    const topTier = rankedResults.scored.filter((r) => r.matchedCount === topScore).slice(0, 8);
    const picked = topTier[Math.floor(Math.random() * topTier.length)];
    onOpenDetail(picked.restaurant);
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
          원하는 조건을 자유롭게 골라주세요. 조건에 가장 많이 맞는 곳부터 보여드려요.
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

            <button
              onClick={handleRandomPick}
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 8,
                border: "1px solid var(--color-gray-300)",
                background: "#fff",
                color: "var(--color-navy)",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                marginTop: 8,
              }}
            >
              🎲 그냥 아무거나 골라줘 (랜덤 추천)
            </button>
          </>
        )}

        {step === "result" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <button
                onClick={() => setStep("form")}
                style={{
                  fontSize: 12,
                  color: "var(--color-navy)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                ← 조건 다시 고르기
              </button>
              <button
                onClick={handleRandomPick}
                style={{
                  fontSize: 12,
                  color: "var(--color-navy)",
                  background: "var(--color-teal-light)",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                🎲 랜덤 뽑기
              </button>
            </div>

            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
              추천 후보 {topResults.length}곳
            </p>
            {rankedResults.totalConditions > 0 && (
              <p style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>
                조건을 가장 많이 만족하는 곳부터 순서대로 보여드려요.
              </p>
            )}
            {hasAnyReviewCondition && (
              <p style={{ fontSize: 11, color: "#999", marginBottom: 12 }}>
                가격/인원/웨이팅 조건은 후기가 등록된 식당에서만 확인 가능해요.
              </p>
            )}

            {topResults.length === 0 && (
              <p style={{ fontSize: 13, color: "#999", padding: "24px 0" }}>
                추천할 식당이 없어요. 조건을 조금 줄여서 다시 시도해보세요.
              </p>
            )}

            {topResults.map((result) => (
              <RestaurantResultCard
                key={result.restaurant.id}
                result={result}
                totalConditions={rankedResults.totalConditions}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
