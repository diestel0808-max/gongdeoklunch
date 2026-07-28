"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "gongdeok-lunch:notice-dismissed";
const NOTICE_TEXT = `갑작스러운 동기 모임부터 팀 점심 식사 장소 추천까지! 🍽️
공덕 맛집을 섭렵한 선배 댕턴들의 찐 후기를 모아 [댕턴뭐먹지 맵]을 만들었습니다 🗺️✨
더 완벽한 지도 완성을 위해 익명 후기, 찜, 식당 등록 기능도 적극 활용해 주세요!
오늘도 모두 맛점하세요! 😋🍚`;

export default function NoticeBanner() {
  const [dismissed, setDismissed] = useState(true); // 초기엔 숨겨서 깜빡임 방지, 마운트 후 판단
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  if (dismissed) return null;

  const handleDismiss = (e) => {
    e.stopPropagation();
    window.sessionStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      style={{
        background: "var(--color-teal-light)",
        borderBottom: "1px solid var(--color-teal)",
        padding: "10px 16px",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <span style={{ fontSize: 13, flex: 1, fontWeight: 700, color: "var(--color-navy)" }}>
          📢 "오늘 점심 뭐 먹지?" 매일 고민되는 댕턴이라면 주목! 👀{" "}
          <span style={{ fontWeight: 400, color: "#0a8fa0" }}>
            {expanded ? "접기 ▲" : "자세히 보기 ▼"}
          </span>
        </span>
        <button
          onClick={handleDismiss}
          style={{
            border: "none",
            background: "transparent",
            fontSize: 14,
            color: "#666",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      {expanded && (
        <p
          style={{
            fontSize: 12,
            color: "#333",
            marginTop: 8,
            lineHeight: 1.6,
            whiteSpace: "pre-line",
          }}
        >
          {NOTICE_TEXT}
        </p>
      )}
    </div>
  );
}
