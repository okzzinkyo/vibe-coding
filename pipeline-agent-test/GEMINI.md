# 논문 작성 프로젝트 — 3-에이전트 파이프라인

## 팀 구성

이 프로젝트는 3명의 전문가 에이전트가 파이프라인으로 협업한다.
**반드시 아래 순서대로 실행**하고, 각 단계의 출력을 다음 단계의 입력으로 전달한다.

```
[사용자 요청]
     ↓
 @researcher  →  research_plan.md (계획서 + 근거)
     ↓
 @executor    →  drafts/introduction.md + src/*.py + figures/
     ↓
 @critic      →  review_report.md + drafts/introduction.md (수정 반영)
     ↓
[사용자에게 최종 결과 + 리뷰 요약 전달]
```

## 파이프라인 규칙

1. **순차 실행**: researcher → executor → critic 순서를 반드시 지킨다
2. **파일 기반 전달**: 각 에이전트는 결과를 파일로 저장하고, 다음 에이전트는 그 파일을 읽는다
3. **critic은 반드시 호출**: executor의 결과가 아무리 좋아 보여도 critic을 건너뛰지 않는다
4. **최종 보고**: 메인 에이전트가 critic의 리뷰 리포트를 요약하여 사용자에게 전달한다

## 기본 규칙
- 출력 언어: Introduction은 영어, 코드 주석은 한국어
- 논문 형식: ACL/EMNLP 스타일
- 코드: Python 3.10+
- 결과물 저장 위치:
  - 연구 계획서: `research_plan.md` (프로젝트 루트)
  - 논문 초안: `drafts/`
  - 코드: `src/`
  - 그래프: `figures/`
  - 리뷰 리포트: `review_report.md` (프로젝트 루트)

## 디렉토리 구조
```
pipeline-team/
├── GEMINI.md
├── .gemini/agents/          ← 3명의 전문가
├── .gemini/skills/          ← 각 전문가의 스킬
├── research_plan.md         ← researcher 출력
├── review_report.md         ← critic 출력
├── drafts/introduction.md   ← 최종 결과물
├── src/                     ← 실험 코드
└── figures/                 ← 그래프
```
