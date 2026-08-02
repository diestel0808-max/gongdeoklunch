"use client";

import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import { isAdminUnlocked, tryUnlockAdmin } from "@/lib/adminAuth";
import {
  deleteCustomRestaurant,
  hideRestaurant,
  setCategoryOverride,
} from "@/lib/adminActions";
import { deleteReview } from "@/lib/reviewStorage";

const categoryOptions = CATEGORIES.filter((c) => c !== "전체");

export default function AdminPanel({ restaurants, allReviews, onClose, onDataChanged }) {
  const [unlocked, setUnlocked] = useState(isAdminUnlocked());
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  const [tab, setTab] = useState("restaurants"); // restaurants | reviews
  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [reviewQuery, setReviewQuery] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState("");

  const handleUnlock = () => {
    if (tryUnlockAdmin(password)) {
      setUnlocked(true);
      setAuthError("");
    } else {
      setAuthError("비밀번호가 올바르지 않아요.");
    }
  };

  const filteredRestaurants = useMemo(() => {
    const q = restaurantQuery.trim();
    if (!q) return restaurants.slice(0, 30);
    return restaurants.filter((r) => r.name.includes(q)).slice(0, 30);
  }, [restaurants, restaurantQuery]);

  const restaurantNameOf = (id) =>
    restaurants.find((r) => String(r.id) === String(id))?.name || "(알 수 없는 식당)";

  const filteredReviews = useMemo(() => {
    const q = reviewQuery.trim();
    let list = allReviews;
    if (q) {
      list = list.filter(
        (r) =>
          (r.comment || "").includes(q) ||
          (r.nickname || "").includes(q) ||
          restaurantNameOf(r.restaurantId).includes(q)
      );
    }
    return list.slice(0, 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allReviews, reviewQuery, restaurants]);

  const handleCategoryChange = async (restaurant, category) => {
    setBusyId(restaurant.id);
    try {
      await setCategoryOverride(restaurant.id, category);
      setMessage(`"${restaurant.name}" 카테고리를 "${category}"(으)로 변경했어요.`);
      onDataChanged();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleRemoveRestaurant = async (restaurant) => {
    const isUserAdded = restaurant.source === "user";
    const confirmMsg = isUserAdded
      ? `"${restaurant.name}"을(를) 완전히 삭제할까요? 되돌릴 수 없어요.`
      : `"${restaurant.name}"을(를) 목록에서 숨길까요? (카카오 API 자동수집 식당이라 완전삭제는 불가능하고, 숨김 처리돼요)`;
    if (!window.confirm(confirmMsg)) return;

    setBusyId(restaurant.id);
    try {
      if (isUserAdded) {
        await deleteCustomRestaurant(restaurant.id);
      } else {
        await hideRestaurant(restaurant.id, "관리자 삭제");
      }
      setMessage(`"${restaurant.name}"을(를) 처리했어요.`);
      onDataChanged();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteReview = async (review) => {
    if (!window.confirm("이 후기를 삭제할까요? 되돌릴 수 없어요.")) return;
    setBusyId(review.id);
    try {
      await deleteReview(review.id);
      setMessage("후기를 삭제했어요.");
      onDataChanged();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyId(null);
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
        zIndex: 65,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: 520,
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
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>⚙️ 관리자 페이지</h2>
          <button
            onClick={onClose}
            style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {!unlocked ? (
          <div>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>관리자 비밀번호를 입력해주세요.</p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                style={{
                  flex: 1,
                  padding: "9px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--color-gray-300)",
                  fontSize: 13,
                }}
              />
              <button
                onClick={handleUnlock}
                style={{
                  padding: "0 16px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--color-navy)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                확인
              </button>
            </div>
            {authError && <p style={{ fontSize: 12, color: "#d33", marginTop: 8 }}>{authError}</p>}
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button
                onClick={() => setTab("restaurants")}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 8,
                  border: tab === "restaurants" ? "none" : "1px solid var(--color-gray-300)",
                  background: tab === "restaurants" ? "var(--color-navy)" : "#fff",
                  color: tab === "restaurants" ? "#fff" : "var(--color-text)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                🍽 식당 관리
              </button>
              <button
                onClick={() => setTab("reviews")}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 8,
                  border: tab === "reviews" ? "none" : "1px solid var(--color-gray-300)",
                  background: tab === "reviews" ? "var(--color-navy)" : "#fff",
                  color: tab === "reviews" ? "#fff" : "var(--color-text)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                📝 후기 관리
              </button>
            </div>

            {message && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--color-navy)",
                  background: "var(--color-teal-light)",
                  padding: "8px 10px",
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                {message}
              </p>
            )}

            {tab === "restaurants" && (
              <>
                <input
                  value={restaurantQuery}
                  onChange={(e) => setRestaurantQuery(e.target.value)}
                  placeholder="식당 이름 검색"
                  style={{
                    width: "100%",
                    padding: "9px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--color-gray-300)",
                    fontSize: 13,
                    marginBottom: 12,
                  }}
                />
                {filteredRestaurants.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    style={{
                      border: "1px solid var(--color-gray-300)",
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{restaurant.name}</span>
                      <span style={{ fontSize: 11, color: "#999" }}>
                        {restaurant.source === "user" ? "사용자 등록" : "카카오 자동수집"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {categoryOptions.map((cat) => (
                        <button
                          key={cat}
                          disabled={busyId === restaurant.id}
                          onClick={() => handleCategoryChange(restaurant, cat)}
                          style={{
                            padding: "4px 9px",
                            borderRadius: 16,
                            fontSize: 11,
                            fontWeight: 600,
                            border:
                              restaurant.category === cat
                                ? "none"
                                : "1px solid var(--color-gray-300)",
                            background: restaurant.category === cat ? "var(--color-teal)" : "#fff",
                            color: restaurant.category === cat ? "#fff" : "var(--color-text)",
                            cursor: "pointer",
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <button
                      disabled={busyId === restaurant.id}
                      onClick={() => handleRemoveRestaurant(restaurant)}
                      style={{
                        marginTop: 10,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#d33",
                        border: "1px solid #f0c2c2",
                        borderRadius: 6,
                        padding: "5px 10px",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      {restaurant.source === "user" ? "완전 삭제" : "목록에서 숨기기"}
                    </button>
                  </div>
                ))}
              </>
            )}

            {tab === "reviews" && (
              <>
                <input
                  value={reviewQuery}
                  onChange={(e) => setReviewQuery(e.target.value)}
                  placeholder="닉네임, 식당명, 내용으로 검색"
                  style={{
                    width: "100%",
                    padding: "9px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--color-gray-300)",
                    fontSize: 13,
                    marginBottom: 12,
                  }}
                />
                {filteredReviews.length === 0 && (
                  <p style={{ fontSize: 13, color: "#999" }}>표시할 후기가 없어요.</p>
                )}
                {filteredReviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      border: "1px solid var(--color-gray-300)",
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>
                        {restaurantNameOf(review.restaurantId)}
                      </span>
                      <span style={{ fontSize: 11, color: "#999" }}>{review.nickname}</span>
                    </div>
                    {review.comment && (
                      <p style={{ fontSize: 12, color: "#333", marginTop: 6, whiteSpace: "pre-line" }}>
                        {review.comment}
                      </p>
                    )}
                    <button
                      disabled={busyId === review.id}
                      onClick={() => handleDeleteReview(review)}
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#d33",
                        border: "1px solid #f0c2c2",
                        borderRadius: 6,
                        padding: "5px 10px",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
