import "./globals.css";

// 배포 후 실제 도메인으로 이 값을 꼭 바꿔주세요 (카톡/팀즈 미리보기에서 절대경로로 필요함)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gongdeoklunch.vercel.app";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "댕턴 뭐먹지 | 댕턴에 의한, 댕턴을 위한 점메추 지도",
  description: "같이 메뉴 고르러 가기!",
  openGraph: {
    title: "댕턴 뭐먹지 | 댕턴에 의한, 댕턴을 위한 점메추 지도",
    description: "같이 메뉴 고르러 가기!",
    url: SITE_URL,
    siteName: "댕턴뭐먹지",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "댕턴뭐먹지",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "댕턴 뭐먹지 | 댕턴에 의한, 댕턴을 위한 점메추 지도",
    description: "같이 메뉴 고르러 가기!",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
