"use client";

import { useState } from "react";
import {
  COMPANION_TAGS,
  PRICE_FEEL_OPTIONS,
  REVISIT_OPTIONS,
  WAITING_LEVELS,
} from "@/lib/constants";
import { addReview, getProfile, saveProfile } from "@/lib/reviewStorage";

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

function ChipGroup({ label, options, value, onChange }) {
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

  const [nickname, setNickname] = useState(existingProfile?.nickname || "");
  const [pin, setPin] = useState(existingProfile?.pin || "");
  const [waiting, setWaiting] = useState("");
  const [companion, setCompanion] = useState("");
  const [priceFeel, setPriceFeel] = useState("");
  const [revisit, setRevisit] = useState("");
  const [comment, setComment] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = () => {
    if (!nickname.trim() || pin.trim().length !== 4) {
      setErrorMessage("닉네임과 4자리 PIN을 모두 입력해주세요.");
      return;
    }
    if (!waiting || !companion || !priceFeel || !revisit) {
      setErrorMessage("웨이팅 / 추천 동행 / 가격 체감 / 재방문 의사를 모두 선택해주세요.");
      return;
    }

    saveProfile({ nickname: nickname.trim(), pin: pin.trim() });

    addReview(restaurant.id, {
      nickname: nickname.trim(),
      waiting,
      companion,
      priceFeel,
      revisit,
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

        {/* 닉네임 + PIN */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            placeholder="닉네임 (예: 공덕맛집탐험가)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={{
              flex: 2,
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid var(--color-gray-300)",
              fontSize: 13,
            }}
          />
          <input
            placeholder="PIN 4자리"
            value={pin}
            maxLength={4}
            inputMode="numeric"
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid var(--color-gray-300)",
              fontSize: 13,
            }}
          />
        </div>
        <p style={{ fontSize: 11, color: "#999", marginTop: -10, marginBottom: 16 }}>
          닉네임+PIN은 "내가 쓴 후기 모아보기"용 열쇠예요. 처음이면 자유롭게 정해주세요.
        </p>

        <ChipGroup
          label="웨이팅 정도"
          options={WAITING_LEVELS}
          value={waiting}
          onChange={setWaiting}
        />
        <ChipGroup
          label="추천 동행"
          options={COMPANION_TAGS}
          value={companion}
          onChange={setCompanion}
        />
        <ChipGroup
          label="가격 체감"
          options={PRICE_FEEL_OPTIONS}
          value={priceFeel}
          onChange={setPriceFeel}
        />
        <ChipGroup
          label="재방문 의사"
          options={REVISIT_OPTIONS}
          value={revisit}
          onChange={setRevisit}
        />

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
