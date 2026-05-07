# Gemini Travel Planner Workspace

이 저장소는 **여행 계획 + 인터랙티브 웹페이지 제작**을 위한 Gemini CLI 하네스입니다.

## 기본 동작 원칙

- 사용자의 여행 요청이 들어오면 **먼저 여행 문서 파이프라인**을 완성합니다.
- 이후 그 결과를 바탕으로 **`docs/` 정적 웹페이지**를 생성합니다.
- 최신성이 중요한 항목(입국 요건, 환율, 교통패스, 운영시간, 긴급 연락처, 안전
  정보)은 가능한 한 웹 검색으로 재확인합니다.
- 산출물 간 모순이 있으면 문서 단계에서 먼저 수정한 뒤 웹페이지를 만듭니다.

## 우선 사용 명령

가능하면 아래 명령을 우선 사용합니다.

- `/travel:full`
- `/travel:plan`
- `/travel:web`
- `/travel:tokyo-demo`

## 기본 출력 경로

### 여행 문서
- `_workspace/00_input.md`
- `_workspace/01_destination_analysis.md`
- `_workspace/02_itinerary.md`
- `_workspace/03_accommodation.md`
- `_workspace/04_budget.md`
- `_workspace/05_local_guide.md`

### 웹페이지
- `docs/index.html`
- `docs/styles.css`
- `docs/app.js`
- `docs/trip-data.json`

## 웹페이지 품질 기준

- 정적 HTML/CSS/JS만 사용
- 외부 CDN, 빌드 툴, 프레임워크 의존 금지
- 모바일 대응
- 키보드 접근성 보장
- 최소한 아래 섹션 포함:
  - Hero
  - How It Was Made
  - Budget
  - Day by Day
  - Local Guide
  - Footer / Caveat
- 상호작용 최소 기준:
  - 예산 티어 전환
  - 일정 카드 펼침/접힘
  - 섹션 내비게이션
- 데이터는 가능하면 `docs/trip-data.json` 중심으로 분리하고, `app.js`가 렌더링
  하도록 구성합니다.

## 언어

- 기본 응답 언어는 한국어
- 사이트 본문도 기본은 한국어
- 사용자가 다른 언어를 요청하면 그 언어를 우선합니다.
