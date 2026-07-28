export default function HeartIcon({ filled, size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "#e2662f" : "none"}
      stroke="#e2662f"
      strokeWidth="2"
    >
      <path d="M12 21s-6.7-4.35-9.3-8.2C.8 9.9 1.6 6.4 4.6 5.1c2.1-.9 4.4-.1 5.7 1.8L12 8.6l1.7-1.7c1.3-1.9 3.6-2.7 5.7-1.8 3 1.3 3.8 4.8 1.9 7.7C18.7 16.65 12 21 12 21z" />
    </svg>
  );
}
