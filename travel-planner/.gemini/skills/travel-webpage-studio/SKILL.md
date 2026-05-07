---
name: travel-webpage-studio
description: 여행 계획 문서를 GitHub Pages용 인터랙티브 웹페이지로 변환하는 프런트엔드 제작 스킬. 여행 결과물을 웹페이지, 랜딩 페이지, 발표용 사이트로 만들 때 사용한다.
---

# Travel Webpage Studio — 여행 웹페이지 제작 스킬

여행 계획 문서를 **정적 HTML/CSS/JS 기반의 인터랙티브 사이트**로 바꾸는 스킬입니다.

## 언제 사용하나

- "웹페이지로 만들어줘"
- "인터랙티브하게 보여줘"
- "GitHub Pages에 올릴 수 있게 만들어줘"
- "계획서를 랜딩페이지처럼 정리해줘"

## 입력 계약

기본적으로 아래 문서를 읽고 사이트를 만든다.

- `_workspace/00_input.md`
- `_workspace/01_destination_analysis.md`
- `_workspace/02_itinerary.md`
- `_workspace/03_accommodation.md`
- `_workspace/04_budget.md`
- `_workspace/05_local_guide.md`

## 출력 계약

- `docs/index.html`
- `docs/styles.css`
- `docs/app.js`
- `docs/trip-data.json`
- `docs/.nojekyll`

## 사이트 요구사항

반드시 아래를 포함합니다.

1. **Hero**
2. **How It Was Made**
3. **Budget**
4. **Day by Day**
5. **Local Guide**
6. **Footer / Caveat**

## 상호작용 최소 기준

- 예산 티어 전환 버튼
- 일정 카드/아코디언 열기·닫기
- 섹션 내비게이션
- 모바일 화면 최적화
- 키보드 접근성

## 기술 제약

- 정적 HTML/CSS/JS만 사용
- 외부 JS/CSS 라이브러리 사용 금지
- 빌드 시스템 금지
- 상대 경로만 사용
- GitHub Pages `main /docs` 기준으로 동작해야 함

## 작업 순서

1. 여행 문서에서 구조화 가능한 데이터를 추출한다.
2. `trip-data.json`을 먼저 작성한다.
3. `assets/` 템플릿을 참고해 HTML/CSS/JS를 작성한다.
4. JS 의존 없이도 핵심 콘텐츠는 HTML에 존재하게 한다.
5. 마지막에 모든 파일을 다시 읽어 링크와 섹션 구조를 검증한다.

## 디자인 방향

- 여행 분위기에 맞는 감성적 Hero
- 정보는 카드형/섹션형으로 명료하게 정리
- 과도한 애니메이션보다 가독성 우선
- 비용 정보는 숫자 강조
- 출발 전 재확인 안내를 항상 하단에 노출

## 참고 자료

- `references/site-requirements.md`
- `references/data-schema.md`
- `assets/base-index.html`
- `assets/base-styles.css`
- `assets/base-app.js`
