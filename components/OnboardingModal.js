"use client";

import { useEffect, useRef, useState } from "react";
import { createProfile, loginByPhone, saveProfile, verifyProfile } from "@/lib/reviewStorage";

export default function OnboardingModal({ onClose, onComplete }) {
  const [showSignup, setShowSignup] = useState(false);
  const [loginMode, setLoginMode] = useState("nickname"); // nickname | phone
  const [showForgotHelp, setShowForgotHelp] = useState(false);
  const forgotHelpRef = useRef(null);

  useEffect(() => {
    if (!showForgotHelp) return;
    const handleOutsideClick = (e) => {
      if (forgotHelpRef.current && !forgotHelpRef.current.contains(e.target)) {
        setShowForgotHelp(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showForgotHelp]);

  const [loginNickname, setLoginNickname] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [loginPhone, setLoginPhone] = useState("");
  const [loginPhonePin, setLoginPhonePin] = useState("");
  const [phoneLoginError, setPhoneLoginError] = useState("");
  const [isPhoneLoggingIn, setIsPhoneLoggingIn] = useState(false);

  const [signupNickname, setSignupNickname] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPin, setSignupPin] = useState("");
  const [signupPinConfirm, setSignupPinConfirm] = useState("");
  const [signupError, setSignupError] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleLogin = async () => {
    if (!loginNickname.trim() || loginPin.trim().length !== 6) {
      setLoginError("닉네임과 6자리 PIN을 입력해주세요.");
      return;
    }
    setIsLoggingIn(true);
    setLoginError("");

    const nickname = loginNickname.trim();
    const pin = loginPin.trim();
    const result = await verifyProfile(nickname, pin);

    setIsLoggingIn(false);

    if (!result.ok) {
      setLoginError(result.message);
      if (result.message.includes("등록되지 않은")) {
        setShowSignup(true);
        setSignupNickname(nickname);
      }
      return;
    }

    saveProfile({ nickname, pin });
    onComplete({ nickname, pin });
  };

  const handlePhoneLogin = async () => {
    if (!loginPhone.trim() || loginPhonePin.trim().length !== 6) {
      setPhoneLoginError("전화번호와 6자리 PIN을 입력해주세요.");
      return;
    }
    setIsPhoneLoggingIn(true);
    setPhoneLoginError("");

    const phone = loginPhone.trim();
    const pin = loginPhonePin.trim();
    const result = await loginByPhone(phone, pin);

    setIsPhoneLoggingIn(false);

    if (!result.ok) {
      setPhoneLoginError(result.message);
      return;
    }

    saveProfile({ nickname: result.nickname, pin });
    onComplete({ nickname: result.nickname, pin });
  };

  const handleSignup = async () => {
    if (!signupNickname.trim() || !signupPhone.trim() || signupPin.trim().length !== 6) {
      setSignupError("닉네임, 전화번호, 6자리 PIN을 모두 입력해주세요.");
      return;
    }
    if (signupPin.trim() !== signupPinConfirm.trim()) {
      setSignupError("PIN이 서로 일치하지 않아요. 다시 확인해주세요.");
      return;
    }

    setIsSigningUp(true);
    setSignupError("");

    const nickname = signupNickname.trim();
    const phone = signupPhone.trim();
    const pin = signupPin.trim();
    const result = await createProfile(nickname, phone, pin);

    setIsSigningUp(false);

    if (!result.ok) {
      setSignupError(result.message);
      return;
    }

    saveProfile({ nickname, pin });
    onComplete({ nickname, pin });
  };

  const inputStyle = {
    padding: "9px 10px",
    borderRadius: 8,
    border: "1px solid var(--color-gray-300)",
    fontSize: 13,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(27,42,52,0.55)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 70,
        padding: "10vh 16px 0",
      }}
    >
      <div
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: 420,
          maxHeight: "80vh",
          overflowY: "auto",
          borderRadius: 16,
          padding: 22,
          position: "relative",
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -10,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderBottom: "10px solid #fff",
          }}
        />

        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            border: "none",
            background: "transparent",
            fontSize: 16,
            color: "#999",
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
          👋 댕턴뭐먹지에 오신 걸 환영해요!
        </h2>
        <p style={{ fontSize: 12, color: "#999", marginBottom: 18 }}>
          닉네임+PIN으로 이 브라우저에 나를 저장해두면, 후기 작성이나 찜할 때 매번 다시 입력할
          필요가 없어요.
        </p>

        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <button
            onClick={() => setLoginMode("nickname")}
            style={{
              flex: 1,
              padding: "6px 0",
              borderRadius: 8,
              border: "none",
              background: loginMode === "nickname" ? "var(--color-navy)" : "var(--color-gray-100)",
              color: loginMode === "nickname" ? "#fff" : "#666",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            닉네임으로 로그인
          </button>
          <button
            onClick={() => setLoginMode("phone")}
            style={{
              flex: 1,
              padding: "6px 0",
              borderRadius: 8,
              border: "none",
              background: loginMode === "phone" ? "var(--color-navy)" : "var(--color-gray-100)",
              color: loginMode === "phone" ? "#fff" : "#666",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            📱 전화번호로 로그인
          </button>
        </div>

        {loginMode === "nickname" ? (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                placeholder="닉네임"
                value={loginNickname}
                onChange={(e) => setLoginNickname(e.target.value)}
                style={{ ...inputStyle, flex: 2 }}
              />
              <input
                placeholder="PIN 6자리"
                value={loginPin}
                maxLength={6}
                inputMode="numeric"
                onChange={(e) => setLoginPin(e.target.value.replace(/[^0-9]/g, ""))}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              style={{
                width: "100%",
                padding: "11px 0",
                borderRadius: 8,
                border: "none",
                background: "var(--color-navy)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: isLoggingIn ? "default" : "pointer",
                opacity: isLoggingIn ? 0.6 : 1,
              }}
            >
              {isLoggingIn ? "확인 중..." : "입장하기"}
            </button>
            {loginError && <p style={{ fontSize: 12, color: "#d33", marginTop: 8 }}>{loginError}</p>}
          </>
        ) : (
          <>
            <p style={{ fontSize: 11, color: "#999", marginBottom: 8 }}>
              닉네임이 기억 안 나도, 가입할 때 등록한 전화번호+PIN으로 내 계정을 바로 찾을 수
              있어요.
            </p>
            <input
              placeholder="전화번호 (예: 01012345678)"
              value={loginPhone}
              inputMode="numeric"
              onChange={(e) => setLoginPhone(e.target.value.replace(/[^0-9]/g, ""))}
              style={{ ...inputStyle, width: "100%", marginBottom: 8 }}
            />
            <input
              placeholder="PIN 6자리"
              value={loginPhonePin}
              maxLength={6}
              inputMode="numeric"
              onChange={(e) => setLoginPhonePin(e.target.value.replace(/[^0-9]/g, ""))}
              style={{ ...inputStyle, width: "100%", marginBottom: 8 }}
            />
            <button
              onClick={handlePhoneLogin}
              disabled={isPhoneLoggingIn}
              style={{
                width: "100%",
                padding: "11px 0",
                borderRadius: 8,
                border: "none",
                background: "var(--color-navy)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: isPhoneLoggingIn ? "default" : "pointer",
                opacity: isPhoneLoggingIn ? 0.6 : 1,
              }}
            >
              {isPhoneLoggingIn ? "확인 중..." : "입장하기"}
            </button>
            {phoneLoginError && (
              <p style={{ fontSize: 12, color: "#d33", marginTop: 8 }}>{phoneLoginError}</p>
            )}
          </>
        )}

        <div ref={forgotHelpRef} style={{ position: "relative", marginTop: 8 }}>
          <button
            onClick={() => setShowForgotHelp((v) => !v)}
            style={{
              fontSize: 12,
              color: "#999",
              background: "transparent",
              border: "none",
              textDecoration: "underline",
              cursor: "pointer",
              padding: 0,
            }}
          >
            PIN을 잊어버렸나요?
          </button>

          {showForgotHelp && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                background: "var(--color-navy)",
                color: "#fff",
                fontSize: 12,
                lineHeight: 1.6,
                padding: "10px 14px",
                borderRadius: 10,
                boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                zIndex: 10,
                whiteSpace: "nowrap",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -6,
                  left: 16,
                  width: 0,
                  height: 0,
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderBottom: "6px solid var(--color-navy)",
                }}
              />
              <strong>관리자 문의)</strong>
              <br />
              비즈니스임팩트1팀 인턴 김다인
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid var(--color-gray-300)",
          }}
        >
          <button
            onClick={() => setShowSignup((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-navy)" }}>
              🙋 처음 방문했다면?
            </span>
            <span style={{ fontSize: 12, color: "#999" }}>
              {showSignup ? "접기 ▲" : "펼치기 ▼"}
            </span>
          </button>

          {showSignup && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 11, color: "#999", marginBottom: 10 }}>
                원하는 닉네임과 6자리 PIN을 정해주세요. 닉네임은 다른 사람과 겹칠 수 없어요.
              </p>

              <input
                placeholder="새 닉네임 (예: 공덕맛집탐험가)"
                value={signupNickname}
                onChange={(e) => setSignupNickname(e.target.value)}
                style={{ ...inputStyle, width: "100%", marginBottom: 8 }}
              />

              <input
                placeholder="전화번호 입력 (닉네임 대신 로그인 가능)"
                value={signupPhone}
                inputMode="numeric"
                onChange={(e) => setSignupPhone(e.target.value.replace(/[^0-9]/g, ""))}
                style={{ ...inputStyle, width: "100%", marginBottom: 8 }}
              />

              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  placeholder="PIN 6자리"
                  value={signupPin}
                  maxLength={6}
                  inputMode="numeric"
                  onChange={(e) => setSignupPin(e.target.value.replace(/[^0-9]/g, ""))}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  placeholder="PIN 확인"
                  value={signupPinConfirm}
                  maxLength={6}
                  inputMode="numeric"
                  onChange={(e) => setSignupPinConfirm(e.target.value.replace(/[^0-9]/g, ""))}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>

              <p style={{ fontSize: 11, color: "#d9822b", fontWeight: 600, marginBottom: 12 }}>
                ⚠️ 닉네임과 PIN은 한 번 정하면 이후 수정이 어려워요. 신중하게 정하고,{" "}
                <strong>PIN은 꼭 기억해주세요!</strong>
              </p>

              <button
                onClick={handleSignup}
                disabled={isSigningUp}
                style={{
                  width: "100%",
                  padding: "11px 0",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--color-teal)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: isSigningUp ? "default" : "pointer",
                  opacity: isSigningUp ? 0.6 : 1,
                }}
              >
                {isSigningUp ? "등록 중..." : "이 닉네임으로 등록하기"}
              </button>
              {signupError && (
                <p style={{ fontSize: 12, color: "#d33", marginTop: 8 }}>{signupError}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
