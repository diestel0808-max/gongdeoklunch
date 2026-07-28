"use client";

import { useMemo, useState } from "react";
import {
  CATEGORIES,
  DISTANCE_FILTER_OPTIONS,
  GROUP_SIZE_OPTIONS,
  PRICE_RANGE_OPTIONS,
  RECOMMENDED_FOR_OPTIONS,
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

function RestaurantResultCard({ restaurant, reasonText, reasonColor, onOpenDetail }) {
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
      {reasonText && (
        <p
          style={{
            fontSize: 11,
            color: reasonColor || "var(--color-navy)",
            fontWeight: 700,
            marginTop: 6,
            background: "var(--color-gray-100)",
            display: "inline-block",
            padding: "3px 8px",
            borderRadius: 6,
          }}
        >
          {reasonText}
        </p>
      )}
      <div>
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
    </div>
  );
}

// 여러 카테고리를 선택했을 때, 정렬만 하면 후기/거리 우세한 카테고리 하나가
// 상위 결과를 독차지할 수 있어서, 카테고리별로 그룹을 나눈 뒤 라운드로빈으로 섞음
function interleaveByCategory(sortedList) {
  const buckets = new Map();
  const order = [];

  sortedList.forEach((item) => {
    const cat = item.restaurant.category;
    if (!buckets.has(cat)) {
      buckets.set(cat, []);
      order.push(cat);
    }
    buckets.get(cat).push(item);
  });

  const result = [];
  let idx = 0;
  while (result.length < sortedList.length) {
    let addedAny = false;
    for (const cat of order) {
      const bucket = buckets.get(cat);
      if (bucket[idx]) {
        result.push(bucket[idx]);
        addedAny = true;
      }
    }
    idx += 1;
    if (!addedAny) break;
  }
  return result;
}

export default function LunchPickerModal({ restaurants, onClose, onOpenDetail }) {
  const [step, setStep] = useState("form"); // form | thinking | result
  const [categories, setCategories] = useState([]);
  const [distances, setDistances] = useState([]);
  const [prices, setPrices] = useState([]);
  const [headcounts, setHeadcounts] = useState([]);
  const [recommendedFors, setRecommendedFors] = useState([]);
  const [waitings, setWaitings] = useState([]);

  const distanceOptions = DISTANCE_FILTER_OPTIONS.filter((o) => o.maxWalkMinutes !== null);
  const categoryOptions = CATEGORIES.filter((c) => c !== "전체");

  const toggle = (list, setList, value) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  // ---------------------------------------------------------------
  // "하드 조건"(카테고리/거리)과 "소프트 조건"(가격/인원수/추천대상/웨이팅, 후기 기반)을
  // 나눠서 계산합니다. 후기가 없는 식당도 하드 조건만 맞으면 "새로운 곳 도전"으로
  // 따로 보여줘서, 이 추천 기능이 단순 카테고리 리스트와는 다르게 느껴지도록 합니다.
  // ---------------------------------------------------------------
  const evaluated = useMemo(() => {
    const maxWalkMinutes = distances.length
      ? Math.max(...distances.map((d) => distanceOptions.find((o) => o.label === d).maxWalkMinutes))
      : null;

    const totalSoftGroups = [
      prices.length > 0,
      headcounts.length > 0,
      recommendedFors.length > 0,
      waitings.length > 0,
    ].filter(Boolean).length;

    const list = restaurants.map((restaurant) => {
      const hardMatch =
        (categories.length === 0 || categories.includes(restaurant.category)) &&
        (maxWalkMinutes === null || restaurant.walkMinutes <= maxWalkMinutes);

      const { waitingSet, headcountSet, recommendedForSet, priceRangeSet, reviewCount } =
        getRestaurantFilterData(restaurant.id);

      let softMatched = 0;
      if (prices.length > 0 && prices.some((p) => priceRangeSet.has(p))) softMatched += 1;
      if (headcounts.length > 0 && headcounts.some((h) => headcountSet.has(h))) softMatched += 1;
      if (recommendedFors.length > 0 && recommendedFors.some((r) => recommendedForSet.has(r)))
        softMatched += 1;
      if (waitings.length > 0 && waitings.some((w) => waitingSet.has(w))) softMatched += 1;

      return { restaurant, hardMatch, softMatched, reviewCount };
    });

    const hardMatchList = list.filter((r) => r.hardMatch);

    const primarySorted = hardMatchList
      .filter((r) => r.softMatched === totalSoftGroups)
      .sort((a, b) => {
        if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
        return a.restaurant.walkMinutes - b.restaurant.walkMinutes;
      });

    const primary = categories.length > 1 ? interleaveByCategory(primarySorted) : primarySorted;

    const secondarySorted =
      totalSoftGroups > 0
        ? hardMatchList
            .filter((r) => r.softMatched < totalSoftGroups)
            .sort((a, b) => a.restaurant.walkMinutes - b.restaurant.walkMinutes)
        : [];
    const secondary =
      categories.length > 1
        ? interleaveByCategory(secondarySorted).slice(0, 6)
        : secondarySorted.slice(0, 6);

    return {
      primary,
      secondary,
      totalConditions:
        totalSoftGroups + (categories.length > 0 ? 1 : 0) + (distances.length > 0 ? 1 : 0),
    };
  }, [restaurants, categories, distances, prices, headcounts, recommendedFors, waitings]);

  const topPrimary = evaluated.primary.slice(0, 10);

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
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>🤖 오늘 점심 뭐 먹지?</h2>
          <button
            onClick={onClose}
            style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {step === "form" && (
          <>
            <p style={{ fontSize: 12, color: "#999", marginBottom: 16 }}>
              동료들이 남긴 후기 데이터를 분석해서, 조건에 맞는 곳을 찾아드릴게요.
            </p>

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
              label="인원수"
              options={GROUP_SIZE_OPTIONS}
              values={headcounts}
              onToggle={(v) => toggle(headcounts, setHeadcounts, v)}
              hint="(후기 기반)"
            />
            <MultiChipGroup
              label="추천 대상"
              options={RECOMMENDED_FOR_OPTIONS}
              values={recommendedFors}
              onToggle={(v) => toggle(recommendedFors, setRecommendedFors, v)}
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
              onClick={() => {
                setStep("thinking");
                setTimeout(() => setStep("result"), 1400);
              }}
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
              🤖 후기 분석해서 추천받기
            </button>
          </>
        )}

        {step === "thinking" && (
          <div style={{ padding: "50px 0", textAlign: "center" }}>
            <style>{`
              @keyframes lunchpicker-thinking-bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
              }
            `}</style>
            <p
              style={{
                fontSize: 40,
                animation: "lunchpicker-thinking-bounce 0.6s ease-in-out infinite",
              }}
            >
              🤔
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-navy)", marginTop: 12 }}>
              최적의 메뉴를 추천하는 중!
            </p>
            <p style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
              동료들의 후기를 살펴보고 있어요
            </p>
          </div>
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
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              ← 조건 다시 고르기
            </button>

            <div
              style={{
                background: "var(--color-teal-light)",
                borderRadius: 10,
                padding: "10px 12px",
                marginBottom: 16,
                fontSize: 12,
                color: "var(--color-navy)",
                fontWeight: 600,
              }}
            >
              🤖 동료들의 후기를 분석해서 조건에 맞는 곳을 골라봤어요.
            </div>

            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
              AI 추천 결과 {topPrimary.length}곳
            </p>

            {topPrimary.length === 0 && evaluated.secondary.length === 0 && (
              <p style={{ fontSize: 13, color: "#999", padding: "24px 0" }}>
                추천할 식당이 없어요. 조건을 조금 줄여서 다시 시도해보세요.
              </p>
            )}

            {topPrimary.map(({ restaurant, reviewCount }) => (
              <RestaurantResultCard
                key={restaurant.id}
                restaurant={restaurant}
                reasonText={
                  reviewCount > 0
                    ? "📝 후기 참고 · 조건에 딱 맞아요"
                    : evaluated.totalConditions > 0
                    ? "✅ 조건에 딱 맞아요"
                    : null
                }
                onOpenDetail={onOpenDetail}
              />
            ))}

            {evaluated.secondary.length > 0 && (
              <>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    marginTop: topPrimary.length > 0 ? 20 : 0,
                    marginBottom: 4,
                  }}
                >
                  🌱 이런 새로운 곳은 어때요?
                </p>
                <p style={{ fontSize: 11, color: "#999", marginBottom: 12 }}>
                  같은 카테고리·거리 조건은 맞지만, 아직 후기가 없어서 가격/인원/웨이팅까지는
                  확인 못한 곳이에요. 한 번 도전해보는 건 어떨까요?
                </p>
                {evaluated.secondary.map(({ restaurant }) => (
                  <RestaurantResultCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    reasonText="🌱 아직 후기 없음 · 새로운 도전"
                    reasonColor="#0a8fa0"
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
