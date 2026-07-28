"use client";

import { useMemo, useRef, useState } from "react";
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

function RestaurantResultCard({ restaurant, tagText, tagColor, onOpenDetail }) {
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
      {tagText && (
        <p style={{ fontSize: 11, color: tagColor || "var(--color-navy)", fontWeight: 700, marginTop: 4 }}>
          {tagText}
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

// 슬롯머신처럼 점점 느려지며 멈추는 딜레이 간격(ms)
const ROLL_DELAYS = [70, 70, 80, 90, 100, 120, 150, 190, 240, 300, 380];

// 룰렛이 도는 동안 보여줄 음식 이모지 (실제 후보 이름은 숨기고 긴장감만 연출)
const ROLL_EMOJIS = ["🍜", "🍣", "🍕", "🍔", "🥗", "🍱", "🍲", "🥘", "🌮", "🍛"];

export default function LunchPickerModal({ restaurants, onClose, onOpenDetail }) {
  const [step, setStep] = useState("form"); // form | result
  const [categories, setCategories] = useState([]);
  const [distances, setDistances] = useState([]);
  const [prices, setPrices] = useState([]);
  const [companions, setCompanions] = useState([]);
  const [waitings, setWaitings] = useState([]);

  const [pickerState, setPickerState] = useState("idle"); // idle | rolling | picked
  const [rollingEmoji, setRollingEmoji] = useState("🍜");
  const [pickedResult, setPickedResult] = useState(null);
  const lastPickedIdRef = useRef(null);
  const rollTimeoutRef = useRef(null);

  const distanceOptions = DISTANCE_FILTER_OPTIONS.filter((o) => o.maxWalkMinutes !== null);
  const categoryOptions = CATEGORIES.filter((c) => c !== "전체");

  const toggle = (list, setList, value) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  // ---------------------------------------------------------------
  // 조건을 두 종류로 나눠서 계산합니다.
  // - "하드 조건" (카테고리/거리): 카카오 API 좌표로 항상 정확히 계산되는 조건
  // - "소프트 조건" (가격/인원/웨이팅): 후기가 있어야만 확인 가능한 조건
  //
  // 이렇게 나누는 이유: 후기가 아직 없는 식당은 소프트 조건을 애초에 만족할 방법이
  // 없어서, 하드+소프트를 한꺼번에 걸면 후기 있는 곳만 계속 뽑히는 문제가 있었어요.
  // 그래서 하드 조건만 만족하는 곳도 "새로운 곳 도전" 섹션으로 따로 보여줍니다.
  // ---------------------------------------------------------------
  const evaluated = useMemo(() => {
    const maxWalkMinutes = distances.length
      ? Math.max(...distances.map((d) => distanceOptions.find((o) => o.label === d).maxWalkMinutes))
      : null;

    const totalSoftGroups = [prices.length > 0, companions.length > 0, waitings.length > 0].filter(
      Boolean
    ).length;
    const totalHardGroups = [categories.length > 0, distances.length > 0].filter(Boolean).length;

    const list = restaurants.map((restaurant) => {
      const hardMatch =
        (categories.length === 0 || categories.includes(restaurant.category)) &&
        (maxWalkMinutes === null || restaurant.walkMinutes <= maxWalkMinutes);

      const { waitingSet, companionSet, priceRangeSet, reviewCount } = getRestaurantFilterData(
        restaurant.id
      );

      let softMatched = 0;
      if (prices.length > 0 && prices.some((p) => priceRangeSet.has(p))) softMatched += 1;
      if (companions.length > 0 && companions.some((c) => companionSet.has(c))) softMatched += 1;
      if (waitings.length > 0 && waitings.some((w) => waitingSet.has(w))) softMatched += 1;

      return { restaurant, hardMatch, softMatched, reviewCount };
    });

    const hardMatchList = list.filter((r) => r.hardMatch);

    const primary = hardMatchList
      .filter((r) => r.softMatched === totalSoftGroups)
      .sort((a, b) => {
        if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
        return a.restaurant.walkMinutes - b.restaurant.walkMinutes;
      });

    const secondary =
      totalSoftGroups > 0
        ? hardMatchList
            .filter((r) => r.softMatched < totalSoftGroups)
            .sort((a, b) => a.restaurant.walkMinutes - b.restaurant.walkMinutes)
            .slice(0, 6)
        : [];

    return {
      primary,
      secondary,
      hardMatchList,
      totalConditions: totalHardGroups + totalSoftGroups,
      totalSoftGroups,
    };
  }, [restaurants, categories, distances, prices, companions, waitings]);

  // 룰렛 전용 후보 풀: 카테고리 선택과 무관하게 "거리" 조건만 반영합니다.
  // (카테고리까지 걸어버리면 "오늘은 새로운 카테고리 도전"이 안 되니, 랜덤 뽑기는
  // 최대한 넓은 범위에서 진짜 서프라이즈가 되도록 카테고리는 무시함)
  const rollPool = useMemo(() => {
    const maxWalkMinutes = distances.length
      ? Math.max(...distances.map((d) => distanceOptions.find((o) => o.label === d).maxWalkMinutes))
      : null;

    const pool = restaurants.filter(
      (restaurant) => maxWalkMinutes === null || restaurant.walkMinutes <= maxWalkMinutes
    );

    return pool.length > 0 ? pool : restaurants;
  }, [restaurants, distances]);

  const topPrimary = evaluated.primary.slice(0, 10);

  const startRoll = () => {
    let pool = rollPool;
    if (pool.length === 0) return;

    let candidatePool = pool.length > 1 ? pool.filter((r) => r.id !== lastPickedIdRef.current) : pool;
    if (candidatePool.length === 0) candidatePool = pool;

    const finalPick = candidatePool[Math.floor(Math.random() * candidatePool.length)];

    if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current);
    setPickerState("rolling");
    setPickedResult(null);

    const runStep = (idx) => {
      setRollingEmoji(ROLL_EMOJIS[Math.floor(Math.random() * ROLL_EMOJIS.length)]);

      if (idx >= ROLL_DELAYS.length) {
        lastPickedIdRef.current = finalPick.id;
        setPickedResult({ restaurant: finalPick });
        setPickerState("picked");
        return;
      }
      rollTimeoutRef.current = setTimeout(() => runStep(idx + 1), ROLL_DELAYS[idx]);
    };

    runStep(0);
  };

  const handleClosePicker = () => {
    if (rollTimeoutRef.current) clearTimeout(rollTimeoutRef.current);
    setPickerState("idle");
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
        <style>{`
          @keyframes lunchpicker-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.04); }
          }
          @keyframes lunchpicker-pop {
            0% { transform: scale(0.85); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}</style>

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

        {pickerState !== "idle" ? (
          <div style={{ padding: "12px 0" }}>
            <button
              onClick={handleClosePicker}
              style={{
                fontSize: 12,
                color: "var(--color-navy)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              ← 목록으로 돌아가기
            </button>

            <div
              style={{
                border: "2px solid var(--color-teal)",
                borderRadius: 16,
                padding: "32px 16px",
                textAlign: "center",
                background: "var(--color-teal-light)",
              }}
            >
              {pickerState === "rolling" && (
                <>
                  <p style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
                    오늘의 점심을 뽑는 중...
                  </p>
                  <p
                    style={{
                      fontSize: 48,
                      fontWeight: 800,
                      color: "var(--color-navy)",
                      animation: "lunchpicker-pulse 0.3s ease-in-out infinite",
                    }}
                  >
                    {rollingEmoji}
                  </p>
                </>
              )}

              {pickerState === "picked" && pickedResult && (
                <div style={{ animation: "lunchpicker-pop 0.25s ease-out" }}>
                  <p style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>오늘의 점심은!</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color: "var(--color-navy)" }}>
                    🎉 {pickedResult.restaurant.name}
                  </p>
                  <p style={{ fontSize: 13, color: "#555", marginTop: 8 }}>
                    {pickedResult.restaurant.category} · 도보 {pickedResult.restaurant.walkMinutes}
                    분 · {pickedResult.restaurant.address}
                  </p>

                  <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                    <button
                      onClick={startRoll}
                      style={{
                        flex: 1,
                        padding: "11px 0",
                        borderRadius: 8,
                        border: "1px solid var(--color-navy)",
                        background: "#fff",
                        color: "var(--color-navy)",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      🔁 다시 뽑기
                    </button>
                    <button
                      onClick={() => onOpenDetail(pickedResult.restaurant)}
                      style={{
                        flex: 1,
                        padding: "11px 0",
                        borderRadius: 8,
                        border: "none",
                        background: "var(--color-navy)",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      ✅ 이걸로 결정!
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
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
                  onClick={startRoll}
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
                    onClick={startRoll}
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
                  추천 후보 {topPrimary.length}곳
                </p>
                {evaluated.totalConditions > 0 && (
                  <p style={{ fontSize: 11, color: "#999", marginBottom: 12 }}>
                    조건에 딱 맞는 곳부터, 후기 많은 순으로 보여드려요.
                  </p>
                )}

                {topPrimary.length === 0 && evaluated.secondary.length === 0 && (
                  <p style={{ fontSize: 13, color: "#999", padding: "24px 0" }}>
                    추천할 식당이 없어요. 조건을 조금 줄여서 다시 시도해보세요.
                  </p>
                )}

                {topPrimary.map(({ restaurant }) => (
                  <RestaurantResultCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    tagText={evaluated.totalConditions > 0 ? "✅ 조건에 딱 맞아요" : null}
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
                        tagText="🌱 아직 후기 없음 · 새로운 도전"
                        tagColor="#0a8fa0"
                        onOpenDetail={onOpenDetail}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
