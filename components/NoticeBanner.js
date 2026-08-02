"use client";

import { useEffect, useRef, useState } from "react";

const DISMISS_KEY = "gongdeok-lunch:notice-dismissed";

export default function NoticeBanner() {
  const [dismissed, setDismissed] = useState(true); // 초기엔 숨겨서 깜빡임 방지, 마운트 후 판단
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [expanded]);

  if (dismissed) return null;

  const handleDismiss = (e) => {
    e.stopPropagation();
    window.sessionStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        background: "var(--color-teal-light)",
        borderBottom: "1px solid var(--color-teal)",
        padding: "12px 16px",
        cursor: "pointer",
        zIndex: 30,
      }}
    >
      <div onClick={() => setExpanded((v) => !v)} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <span className="notice-title" style={{ fontSize: 10, flex: 1, fontWeight: 700, color: "var(--color-navy)" }}>
          📢 "오늘 점심 뭐 먹지?" 매일 고민되는 댕턴이라면 주목! 👀{" "}
          <span className="notice-toggle-label" style={{ fontWeight: 400, color: "#0a8fa0", fontSize: 10 }}>
            {expanded ? "접기 ▲" : "자세히 보기 ▼"}
          </span>
        </span>
        <button
          onClick={handleDismiss}
          style={{
            border: "none",
            background: "transparent",
            fontSize: 16,
            color: "#666",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* 펼쳤을 때 아래 콘텐츠를 밀어내지 않도록, 말풍선처럼 배너 위에 겹쳐서 띄움 */}
      {expanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "100%",
            left: 16,
            right: 16,
            background: "#fff",
            border: "1px solid var(--color-teal)",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(27,42,52,0.15)",
            padding: 16,
            marginTop: 6,
            zIndex: 31,
          }}
        >
          <p
            style={{
              fontSize: 15,
              color: "#333",
              lineHeight: 1.7,
            }}
          >
            갑작스러운 동기들과의 점심 약속부터 팀 점심 장소 추천까지! 🍽️
            <br />
            입사 후 매일 11시 30분부터 무한 고민을 시작할 댕턴들을 위해, 공덕 맛집을 섭렵한
            선배들의 찐 후기를 모아모아 <strong>[댕턴뭐먹지 맵]</strong>을 만들었습니다 🗺️✨
            <br />
            더 알찬 메뉴 추천으로 도움을 드리기 위해{" "}
            <strong>익명 후기, 찜, 식당 등록 기능도 적극 활용해 주세요!</strong>
            <br />
            <br />
            여러분 오늘도 모두 맛점하세요! 😋🍚
          </p>
        </div>
      )}
    </div>
  );
}
