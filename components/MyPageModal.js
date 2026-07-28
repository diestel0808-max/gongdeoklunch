"use client";

import { useEffect, useState } from "react";
import OnboardingModal from "@/components/OnboardingModal";
import {
  GROUP_SIZE_OPTIONS,
  PRICE_FEEL_OPTIONS,
  PRICE_RANGE_OPTIONS,
  RECOMMENDED_FOR_OPTIONS,
  REVISIT_OPTIONS,
  WAITING_LEVELS,
} from "@/lib/constants";
import { deleteReview, getMyReviews, getProfile, updateReview } from "@/lib/reviewStorage";
import { getMyFavoriteRestaurantIds, toggleFavorite } from "@/lib/favoriteStorage";

function joinValues(value) {
  return Array.isArray(value) ? value.join(", ") : value;
}

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

function MultiChipGroup({ label, options, values, onToggle }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{label}</p>
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

function SingleChipGroup({ label, options, value, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{label}</p>
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

export default function MyPageModal({ restaurants, onClose, onChanged, onFavoritesChanged }) {
  const [profile, setProfile] = useState(getProfile());
  const [activeTab, setActiveTab] = useState("reviews"); // reviews | favorites
  const [myReviews, setMyReviews] = useState([]);
  const [myFavoriteIds, setMyFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);

  const [waiting, setWaiting] = useState([]);
  const [headcount, setHeadcount] = useState([]);
  const [recommendedFor, setRecommendedFor] = useState([]);
  const [priceRange, setPriceRange] = useState("");
  const [priceFeel, setPriceFeel] = useState("");
  const [revisit, setRevisit] = useState("");
  const [menu, setMenu] = useState("");
  const [comment, setComment] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const toggleValue = (list, setList, value) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const loadMyReviews = async (nickname) => {
    setLoading(true);
    const [reviewList, favoriteIds] = await Promise.all([
      getMyReviews(nickname),
      getMyFavoriteRestaurantIds(),
    ]);
    setMyReviews(reviewList);
    setMyFavoriteIds(favoriteIds);
    setLoading(false);
  };

  useEffect(() => {
    if (profile) loadMyReviews(profile.nickname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!profile) {
    return (
      <OnboardingModal
        onClose={onClose}
        onComplete={(newProfile) => {
          setProfile(newProfile);
          loadMyReviews(newProfile.nickname);
        }}
      />
    );
  }

  const findRestaurantName = (restaurantId) => {
    const found = restaurants?.find((r) => String(r.id) === String(restaurantId));
    return found ? { name: found.name, category: found.category } : null;
  };

  const handleUnfavorite = async (restaurantId) => {
    await toggleFavorite(restaurantId);
    setMyFavoriteIds(await getMyFavoriteRestaurantIds());
    onFavoritesChanged?.();
  };

  const handleDelete = async (review) => {
    if (!window.confirm("이 후기를 삭제할까요? 되돌릴 수 없어요.")) return;
    try {
      await deleteReview(review.id);
      await loadMyReviews(profile.nickname);
      onChanged();
    } catch (error) {
      alert(error.message);
    }
  };

  const startEdit = (review) => {
    setEditingReview(review);
    setWaiting(review.waiting || []);
    setHeadcount(review.headcount || []);
    setRecommendedFor(review.recommendedFor || []);
    setPriceRange(review.priceRange || "");
    setPriceFeel(review.priceFeel || "");
    setRevisit(review.revisit || "");
    setMenu(review.menu || "");
    setComment(review.comment || "");
    setErrorMessage("");
  };

  const handleSaveEdit = async () => {
    if (
      waiting.length === 0 ||
      headcount.length === 0 ||
      recommendedFor.length === 0 ||
      !priceRange ||
      !priceFeel ||
      !revisit
    ) {
      setErrorMessage("웨이팅 / 인원수 / 추천 대상 / 가격대 / 가격 체감 / 재방문 의사를 모두 선택해주세요.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      await updateReview(editingReview.id, {
        waiting,
        headcount,
        recommendedFor,
        priceRange,
        priceFeel,
        revisit,
        menu: menu.trim(),
        comment: comment.trim(),
      });
      setEditingReview(null);
      await loadMyReviews(profile.nickname);
      onChanged();
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSaving(false);
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
        zIndex: 60,
      }}
      onClick={editingReview ? undefined : onClose}
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
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>
            {editingReview ? "후기 수정" : "🙋 마이페이지"}
          </h2>
          <button
            onClick={editingReview ? () => setEditingReview(null) : onClose}
            style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {!editingReview && (
          <>
            <p style={{ fontSize: 12, color: "#999", marginBottom: 12 }}>
              "{profile.nickname}" 님의 활동이에요.
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button
                onClick={() => setActiveTab("reviews")}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 8,
                  border: activeTab === "reviews" ? "none" : "1px solid var(--color-gray-300)",
                  background: activeTab === "reviews" ? "var(--color-navy)" : "#fff",
                  color: activeTab === "reviews" ? "#fff" : "var(--color-text)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                📝 내가 쓴 후기 ({myReviews.length})
              </button>
              <button
                onClick={() => setActiveTab("favorites")}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: 8,
                  border: activeTab === "favorites" ? "none" : "1px solid var(--color-gray-300)",
                  background: activeTab === "favorites" ? "var(--color-navy)" : "#fff",
                  color: activeTab === "favorites" ? "#fff" : "var(--color-text)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                ❤️ 내가 찜한 식당 ({myFavoriteIds.length})
              </button>
            </div>
          </>
        )}

        {editingReview ? (
          <>
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

            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>먹은 메뉴 (선택)</p>
              <input
                value={menu}
                onChange={(e) => setMenu(e.target.value)}
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
              <p style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>한 줄 코멘트 (선택)</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
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
              onClick={handleSaveEdit}
              disabled={isSaving}
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 8,
                border: "none",
                background: "var(--color-navy)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: isSaving ? "default" : "pointer",
                opacity: isSaving ? 0.6 : 1,
              }}
            >
              {isSaving ? "저장 중..." : "수정 완료"}
            </button>
          </>
        ) : (
          <>
            {activeTab === "reviews" && (
              <>
                {loading && <p style={{ fontSize: 13, color: "#999" }}>불러오는 중...</p>}

                {!loading && myReviews.length === 0 && (
                  <p style={{ fontSize: 13, color: "#999", padding: "24px 0" }}>
                    아직 작성한 후기가 없어요. 마음에 드는 식당에 첫 후기를 남겨보세요!
                  </p>
                )}

                {myReviews.map((review) => {
              const restaurantInfo = findRestaurantName(review.restaurantId);
              return (
                <div
                  key={review.id}
                  style={{
                    border: "1px solid var(--color-gray-300)",
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 10,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>
                      {restaurantInfo?.name || "삭제되었거나 알 수 없는 식당"}
                    </span>
                    {restaurantInfo?.category && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--color-teal)",
                          background: "var(--color-teal-light)",
                          padding: "2px 8px",
                          borderRadius: 6,
                        }}
                      >
                        {restaurantInfo.category}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", fontSize: 12, marginTop: 8, color: "#555" }}>
                    <span>⏱ {joinValues(review.waiting)}</span>
                    <span>👤 {joinValues(review.headcount)}</span>
                    <span>👥 {joinValues(review.recommendedFor)}</span>
                    <span>💰 {review.priceRange} ({review.priceFeel})</span>
                    <span>🔁 {review.revisit}</span>
                  </div>

                  {review.menu && (
                    <p style={{ fontSize: 13, marginTop: 6, color: "#0a8fa0", fontWeight: 600 }}>
                      🍽 {review.menu}
                    </p>
                  )}
                  {review.comment && (
                    <p style={{ fontSize: 13, marginTop: 6, color: "#333", whiteSpace: "pre-line" }}>
                      {review.comment}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                      onClick={() => startEdit(review)}
                      style={{
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
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(review)}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#d33",
                        border: "1px solid #f0c2c2",
                        borderRadius: 6,
                        padding: "6px 10px",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
              </>
            )}

            {activeTab === "favorites" && (
              <>
                {myFavoriteIds.length === 0 && (
                  <p style={{ fontSize: 13, color: "#999", padding: "24px 0" }}>
                    아직 찜한 식당이 없어요. 마음에 드는 곳에 하트를 눌러보세요!
                  </p>
                )}

                {myFavoriteIds.map((restaurantId) => {
                  const found = restaurants?.find((r) => String(r.id) === String(restaurantId));
                  return (
                    <div
                      key={restaurantId}
                      style={{
                        border: "1px solid var(--color-gray-300)",
                        borderRadius: 12,
                        padding: 14,
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 700 }}>
                            {found?.name || "삭제되었거나 알 수 없는 식당"}
                          </span>
                          {found?.address && (
                            <p style={{ fontSize: 12, color: "#7a8288", marginTop: 4 }}>
                              {found.address}
                            </p>
                          )}
                        </div>
                        {found?.category && (
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
                            {found.category}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleUnfavorite(restaurantId)}
                        style={{
                          marginTop: 10,
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#d33",
                          border: "1px solid #f0c2c2",
                          borderRadius: 6,
                          padding: "6px 10px",
                          background: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        찜 해제
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
