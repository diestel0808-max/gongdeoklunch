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
import { addReview, clearProfile, getProfile, saveProfile } from "@/lib/reviewStorage";

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
  const existingProfile = getProfile();

  // 프로필이 이미 있으면 그대로 재사용 (매번 다시 입력받지 않음)
  const [profile, setProfile] = useState(existingProfile);
  const [isEditingProfile, setIsEditingProfile] = useState(!existingProfile);
  const [nicknameInput, setNicknameInput] = useState(existingProfile?.nickname || "");
  const [pinInput, setPinInput] = useState(existingProfile?.pin || "");

  const [waiting, setWaiting] = useState([]);
  const [headcount, setHeadcount] = useState([]);
  const [recommendedFor, setRecommendedFor] = useState([]);
  const [priceRange, setPriceRange] = useState("");
  const [priceFeel, setPriceFeel] = useState("");
  const [revisit, setRevisit] = useState("");
  const [menu, setMenu] = useState("");
  const [comment, setComment] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const toggleValue = (list, setList, value) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const handleConfirmProfile = () => {
    if (!nicknameInput.trim() || pinInput.trim().length !== 6) {
      setErrorMessage("닉네임과 6자리 PIN을 입력해주세요.");
      return;
    }
    const newProfile = { nickname: nicknameInput.trim(), pin: pinInput.trim() };
    saveProfile(newProfile);
    setProfile(newProfile);
    setIsEditingProfile(false);
    setErrorMessage("");
  };

  const handleSwitchProfile = () => {
    clearProfile();
    setProfile(null);
    setNicknameInput("");
    setPinInput("");
    setIsEditingProfile(true);
  };

  const handleSubmit = () => {
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

    addReview(restaurant.id, {
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

        {/* 프로필 영역: 이미 설정되어 있으면 읽기 전용으로 표시, 없으면 설정 폼 */}
        {!isEditingProfile && profile ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--color-teal-light)",
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              "{profile.nickname}" 님으로 작성됩니다
            </span>
            <button
              onClick={handleSwitchProfile}
              style={{
                fontSize: 11,
                color: "#666",
                background: "transparent",
                border: "none",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              다른 사람으로 전환
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="닉네임 (예: 공덕맛집탐험가)"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                style={{
                  flex: 2,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--color-gray-300)",
                  fontSize: 13,
                }}
              />
              <input
                placeholder="PIN 6자리"
                value={pinInput}
                maxLength={6}
                inputMode="numeric"
                onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ""))}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--color-gray-300)",
                  fontSize: 13,
                }}
              />
              <button
                onClick={handleConfirmProfile}
                style={{
                  padding: "0 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--color-navy)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                확인
              </button>
            </div>
            <p style={{ fontSize: 11, color: "#999", marginTop: 6 }}>
              한 번 정하면 이 브라우저에서 계속 이 닉네임으로 후기가 남겨져요. (매번 다시 입력할
              필요 없음)
            </p>
            <p style={{ fontSize: 11, color: "#d9822b", marginTop: 4, fontWeight: 600 }}>
              ⚠️ 닉네임은 한 번 정하면 이후 수정이 어려워요. 신중하게 정해주세요!
            </p>
          </div>
        )}

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
          후기 등록하기
        </button>
      </div>
    </div>
  );
}
