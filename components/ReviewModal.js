"use client";

import { useState } from "react";
import {
  GROUP_SIZE_OPTIONS,
  PRICE_FEEL_OPTIONS,
  PRICE_RANGE_OPTIONS,
  RECOMMENDED_FOR_OPTIONS,
  REVISIT_OPTIONS,
  WAITING_LEVELS,
} from "@/lib/constants";
import OnboardingModal from "@/components/OnboardingModal";
import { addReview, getProfile } from "@/lib/reviewStorage";

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

// 여러 개 선택 가능한 칩 그룹 (웨이팅, 추천 동행에서 사용)
function MultiChipGroup({ label, options, values, onToggle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
        {label} <span style={{ fontWeight: 400, color: "#999" }}>(복수 선택 가능)</span>
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

// 하나만 선택 가능한 칩 그룹 (가격 체감, 재방문 의사에서 사용)
function SingleChipGroup({ label, options, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{label}</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            style={chipStyle(value === option)}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReviewModal({ restaurant, onClose, onSubmitted }) {
  const [profile, setProfile] = useState(getProfile());

  const [waiting, setWaiting] = useState([]);
  const [headcount, setHeadcount] = useState([]);
  const [recommendedFor, setRecommendedFor] = useState([]);
  const [priceRange, setPriceRange] = useState("");
  const [priceFeel, setPriceFeel] = useState("");
  const [revisit, setRevisit] = useState("");
  const [menu, setMenu] = useState("");
  const [comment, setComment] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleValue = (list, setList, value) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  // 아직 닉네임을 정한 적 없는 브라우저면, 후기 폼 대신 온보딩 팝업부터 띄움
  if (!profile) {
    return (
      <OnboardingModal
        onClose={onClose}
        onComplete={(newProfile) => setProfile(newProfile)}
      />
    );
  }

  const handleSubmit = async () => {
    if (!profile) {
      setErrorMessage("먼저 닉네임과 PIN을 설정해주세요.");
      return;
    }
    if (
      waiting.length === 0 ||
      headcount.length === 0 ||
      recommendedFor.length === 0 ||
      !priceRange ||
      !priceFeel ||
      !revisit
    ) {
      setErrorMessage(
        "웨이팅 / 인원수 / 추천 대상 / 가격대 / 가격 체감 / 재방문 의사를 모두 선택해주세요."
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await addReview(restaurant.id, {
        nickname: profile.nickname,
        waiting,
        headcount,
        recommendedFor,
        priceRange,
        priceFeel,
        revisit,
        menu: menu.trim(),
        comment: comment.trim(),
      });
      onSubmitted();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
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
        zIndex: 50,
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
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>{restaurant.name} 후기 남기기</h2>
          <button
            onClick={onClose}
            style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {/* profile은 위에서 이미 보장됨 - 닉네임 표시만 */}
        <div
          style={{
            background: "var(--color-teal-light)",
            borderRadius: 8,
            padding: "10px 12px",
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            "{profile.nickname}" 님으로 작성됩니다
          </span>
        </div>

        <MultiChipGroup
          label="웨이팅 정도"
          options={WAITING_LEVELS}
          values={waiting}
          onToggle={(v) => toggleValue(waiting, setWaiting, v)}
        />
        <MultiChipGroup
          label="인원수"
          options={GROUP_SIZE_OPTIONS}
          values={headcount}
          onToggle={(v) => toggleValue(headcount, setHeadcount, v)}
        />
        <MultiChipGroup
          label="추천 대상"
          options={RECOMMENDED_FOR_OPTIONS}
          values={recommendedFor}
          onToggle={(v) => toggleValue(recommendedFor, setRecommendedFor, v)}
        />
        <SingleChipGroup
          label="가격대 (1인 기준)"
          options={PRICE_RANGE_OPTIONS}
          value={priceRange}
          onChange={setPriceRange}
        />
        <SingleChipGroup
          label="가격 체감"
          options={PRICE_FEEL_OPTIONS}
          value={priceFeel}
          onChange={setPriceFeel}
        />
        <SingleChipGroup
          label="재방문 의사"
          options={REVISIT_OPTIONS}
          value={revisit}
          onChange={setRevisit}
        />

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
            먹은 메뉴 <span style={{ fontWeight: 400, color: "#999" }}>(선택)</span>
          </p>
          <input
            value={menu}
            onChange={(e) => setMenu(e.target.value)}
            placeholder="예: 제육볶음, 순두부찌개"
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid var(--color-gray-300)",
              fontSize: 13,
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>한 줄 코멘트 (선택)</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="예: 점심시간엔 좀 붐비지만 맛있어요"
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid var(--color-gray-300)",
              fontSize: 13,
              resize: "none",
            }}
          />
        </div>

        {errorMessage && (
          <p style={{ fontSize: 12, color: "#d33", marginBottom: 12 }}>{errorMessage}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 8,
            border: "none",
            background: "var(--color-navy)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: isSubmitting ? "default" : "pointer",
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          {isSubmitting ? "등록 중..." : "후기 등록하기"}
        </button>
      </div>
    </div>
  );
}
