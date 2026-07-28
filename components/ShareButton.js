"use client";

import { useState } from "react";

export default function ShareButton({ style }) {
  const [toastMessage, setToastMessage] = useState("");

  const handleShare = async () => {
    const shareData = {
      title: "댕턴 뭐먹지 | 댕턴에 의한, 댕턴을 위한 점메추 지도",
      text: "같이 메뉴 고르러 가기! 🍚",
      url: window.location.origin,
    };

    // 모바일: 카카오톡/팀즈 등이 설치되어 있으면 그 목록이 포함된 공유창이 뜸
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // 사용자가 공유를 취소한 경우 등은 조용히 무시
      }
      return;
    }

    // PC 등 공유 API 미지원 환경: 링크만 클립보드로 복사
    try {
      await navigator.clipboard.writeText(shareData.url);
      setToastMessage("초대 링크가 복사되었어요! 카톡/팀즈에 붙여넣기 해주세요 📋");
    } catch (error) {
      setToastMessage("복사에 실패했어요. 주소창의 링크를 직접 복사해주세요.");
    }

    setTimeout(() => setToastMessage(""), 2500);
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={handleShare}
        style={{
          fontSize: 12,
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid var(--color-gray-300)",
          background: "#fff",
          color: "var(--color-navy)",
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
          ...style,
        }}
      >
        🔗 같이 메뉴 고르러 가기
      </button>

      {toastMessage && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: "var(--color-navy)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            padding: "8px 12px",
            borderRadius: 8,
            whiteSpace: "nowrap",
            zIndex: 50,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
