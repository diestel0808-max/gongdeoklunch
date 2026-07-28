# 공덕 점심 뭐먹지 (대학내일 ES)

대학내일 ES 사옥(독막로 331) 기준, 점심시간에 갈 수 있는 식당을 지도와 함께 찾고 후기를 남길 수 있는 사내용 서비스입니다.

지금 이 폴더는 **"0단계 뼈대"** 입니다. 지도가 뜨는 홈 화면까지만 만들어져 있고, 후기/등록/신고 기능은 다음 단계에서 순서대로 추가할 예정입니다.

---

## 1. 이 폴더를 GitHub에 올리는 방법 (처음이라면 이대로 따라하세요)

### 1) GitHub에 새 저장소(repository) 만들기
1. github.com 로그인 → 오른쪽 위 **+** 버튼 → **New repository**
2. Repository name: `gongdeok-lunch` (원하는 이름으로 해도 됨)
3. Public/Private 중 선택 (사내용이면 **Private** 추천)
4. 나머지 옵션(README 추가 등)은 전부 체크하지 말고 그대로 둔 채 **Create repository** 클릭
5. 생성되면 나오는 화면에서 `https://github.com/내계정/gongdeok-lunch.git` 같은 주소를 복사해두세요.

### 2) 이 폴더를 업로드하기 (터미널 사용)
받은 폴더를 컴퓨터 원하는 위치에 둔 다음, 그 폴더 안에서 터미널(맥은 터미널 앱, 윈도우는 Git Bash 추천)을 열고 아래 명령을 순서대로 입력합니다.

```bash
git init
git add .
git commit -m "첫 커밋: 프로젝트 뼈대 생성"
git branch -M main
git remote add origin 여기에_아까_복사한_주소_붙여넣기
git push -u origin main
```

> Git이 설치되어 있지 않다면 "git 설치"로 검색해서 공식 사이트(git-scm.com)에서 먼저 설치해주세요.

이제 GitHub 저장소 페이지를 새로고침하면 파일들이 올라가 있을 거예요.

---

## 2. 카카오 API 키 등록하기 (내 컴퓨터에서 테스트하려면)

1. 이 폴더에 있는 `.env.local.example` 파일을 복사해서 `.env.local` 이라는 이름으로 저장
2. 카카오 개발자 사이트(developers.kakao.com) → 내 애플리케이션 → 앱 키에서
   - **JavaScript 키** → `.env.local`의 `NEXT_PUBLIC_KAKAO_JS_KEY` 자리에 붙여넣기
   - **REST API 키** → `KAKAO_REST_API_KEY` 자리에 붙여넣기 (지금은 안 쓰지만 다음 단계에서 사용)
3. 카카오 개발자 사이트 → 내 애플리케이션 → **플랫폼** 설정에서 **Web 플랫폼 등록**
   - 로컬 테스트용: `http://localhost:3000`
   - 배포 후: Vercel에서 받은 주소 (예: `https://gongdeok-lunch.vercel.app`) 도 반드시 추가해야 지도가 정상적으로 뜹니다.

`.env.local` 파일은 절대 GitHub에 올라가지 않으니 (`.gitignore`에 이미 등록되어 있음) 안심하고 실제 키를 넣으셔도 됩니다.

---

## 3. Vercel로 배포하기

1. vercel.com 접속 → **"Continue with GitHub"** 로 로그인
2. **Add New → Project** 클릭
3. 아까 만든 `gongdeok-lunch` 저장소 선택 → **Import**
4. **Environment Variables** 항목에서 아래 2개를 추가
   - `NEXT_PUBLIC_KAKAO_JS_KEY` = 발급받은 JS 키
   - `KAKAO_REST_API_KEY` = 발급받은 REST API 키
5. **Deploy** 클릭 → 몇 분 기다리면 `https://프로젝트이름.vercel.app` 형태의 링크가 생성됩니다.
6. 이 주소를 카카오 개발자 사이트의 **Web 플랫폼**에도 등록해야 지도가 뜹니다 (위 2번 항목 참고).

이후 GitHub에 새로운 내용을 `git push` 할 때마다 Vercel이 자동으로 재배포합니다. 파일을 수정하고 올릴 때마다 저에게 보여주시면, 다음 수정사항을 이어서 짜드릴게요.

---

## 4. 지금까지 만들어진 것 / 아직 없는 것

**만들어진 것 (0단계)**
- 지도가 상단에 뜨고, 회사 위치 마커 + 더미 식당 마커 표시
- 카테고리 필터 탭 (한식/일식/중식/양식/브런치/카페) - 클릭하면 리스트가 바뀜
- 리스트 카드 UI (거리/가격/인원/웨이팅 표시 자리 포함)
- 대학내일 브랜드 컬러(네이비 + 틸) 적용

**아직 없는 것 (다음 단계에서 추가 예정)**
- 카카오 로컬 API로 실제 식당 자동 수집 (지금은 더미 데이터 3개만 있음)
- 후기 작성/열람, 닉네임+PIN 시스템
- 식당 등록 폼, 신고 기능, 관리자 페이지
- Supabase 연동 (실제 데이터베이스 저장)

---

## 5. 폴더 구조 설명

```
gongdeok-lunch/
├── app/
│   ├── layout.js       # 모든 페이지 공통 레이아웃 (제목, 폰트 등)
│   ├── page.js         # 홈 화면 (지도 + 필터 + 리스트)
│   └── globals.css     # 전체 디자인 톤(컬러 등) 정의
├── components/
│   └── KakaoMap.js     # 지도를 그려주는 부품
├── lib/
│   └── constants.js    # 회사 위치, 카테고리 목록, 더미 데이터 등 공통 값
├── .env.local.example  # 환경변수(API 키) 작성 예시 (실제 키는 여기 X)
├── .gitignore          # 깃허브에 올리지 않을 파일 목록
└── package.json        # 프로젝트 설정 및 필요한 라이브러리 목록
```
