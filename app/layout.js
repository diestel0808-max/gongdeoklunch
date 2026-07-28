import "./globals.css";

export const metadata = {
  title: "댕턴뭐먹지 | 대학내일 ES",
  description: "대학내일 ES 사옥(독막로 331) 기준 점심 맛집 리스트",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
