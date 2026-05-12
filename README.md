# vibe-coding

바이브 코딩으로 만드는 미니 프로젝트 모음.
규모가 커지면 별도 repo로 분리한다.

---

## 프로젝트 목록

| 프로젝트 | 설명 | 스택 | 상태 |
|----------|------|------|------|
| [travel-planner](./travel-planner/) | AI 여행 플래너 — 일정·숙소·예산·현지 가이드 자동 생성 후 GitHub Pages 정적 웹앱으로 출력 | Gemini CLI, HTML/CSS/JS | 완료 |
| [ai-bizplan](./ai-bizplan/) | 애슬레저 스타트업 사업계획서 자동화 — 시장조사 자료를 Knowledge에 넣고 AI로 사업계획서 초안 생성 | Gemini CLI, PDF/CSV | 완료 |
| [analysis-news](./analysis-news/) | 네이버 뉴스 API로 키워드 기사 수집 → 빈도 분석 → HTML 리포트 자동 생성 | Python, Naver API | 완료 |
| [making-slider](./making-slider/) | 이미지 묶음을 웹 슬라이더 HTML로 변환하는 Gemini CLI 스킬 실습 | Gemini CLI, HTML | 완료 |
| [pipeline-agent-test](./pipeline-agent-test/) | 논문 작성 3-에이전트 파이프라인 실험 — researcher → executor → critic 순서로 협업 | Gemini CLI, Python | 실험 완료 |
| [single-agent-test](./single-agent-test/) | 논문 작성 단일 에이전트 실험 — pipeline-agent-test의 비교 베이스라인 | Gemini CLI, Python | 실험 완료 |
| [lab-inventory](./lab-inventory/) | 연구실 물품 재고 관리 서비스 — 물품 CRUD, 카테고리 관리, 사진/파일 첨부, 엑셀 다운로드 | React, Vite, TypeScript, Tailwind CSS v4, Supabase, Vercel | 완료 |
| [sql-daily](./sql-daily/) | 평일 매일 오전 8시 SQL 연습 문제 이메일 구독 — Claude API로 문제 생성, Resend로 발송 | Node.js, Claude API, Resend, GitHub Actions | 운영 중 |

---

## 운영 규칙

- 미니 프로젝트는 이 repo 안에서 시작
- 프로젝트가 독립 서비스·라이브러리 규모로 커지면 별도 repo로 분리
