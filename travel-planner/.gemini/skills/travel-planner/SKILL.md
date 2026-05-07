---
name: travel-planner
description: 여행 계획의 목적지 분석부터 일정, 숙소, 예산, 현지 정보 문서까지 전 과정을 오케스트레이션하는 풀 파이프라인 스킬. 여행 일정, 코스, 예산, 숙소, 현지 가이드 요청에서 사용한다.
---

# Travel Planner — 여행 계획 풀 파이프라인

목적지 분석 → 일정 → 숙소 → 예산 → 현지 정보를 한 번에 생성하는 오케스트레이터
스킬입니다.

## 언제 이 스킬을 사용하나

다음과 같은 요청에서 사용합니다.

- "여행 계획 짜줘"
- "도쿄 6박 7일 일정 만들어줘"
- "숙소와 예산까지 포함해서 정리해줘"
- "기존 일정 개선해줘"
- "이 여행 계획을 문서로 만들어줘"

## 범위 밖

- 실시간 예약 대행
- 비자 신청 대행
- 여행사 패키지 비교 대행
- 항공권/호텔 결제 실행

## 입력 해석 규칙

요청에서 최대한 아래 정보를 추출합니다.

- 목적지
- 여행 기간
- 인원 / 동행 형태
- 예산
- 여행 스타일
- 꼭 가고 싶은 곳
- 제외 조건
- 웹페이지 생성 요청 여부

누락 정보가 있어도 멈추지 말고 합리적 가정을 명시한 뒤 진행합니다.

## 기본 출력 계약

### `_workspace/`
- `00_input.md`
- `01_destination_analysis.md`
- `02_itinerary.md`
- `03_accommodation.md`
- `04_budget.md`
- `05_local_guide.md`

## 권장 위임 구조

| 순서 | 작업 | 담당 subagent | 산출물 |
|---|---|---|---|
| 1 | 목적지 분석 | `destination-analyst` | `01_destination_analysis.md` |
| 2 | 일정 + 숙소 | `itinerary-designer` | `02_itinerary.md`, `03_accommodation.md` |
| 3a | 예산 | `budget-manager` | `04_budget.md` |
| 3b | 현지 정보 | `local-guide` | `05_local_guide.md` |

예산과 현지 정보는 일정이 완성된 뒤 병렬로 진행해도 됩니다.

## 실행 단계

### Phase 1 — 준비
1. `_workspace/00_input.md` 작성
2. 필요한 경우 기존 `_workspace/` 문서를 읽어 재사용 여부 판단
3. 시간 민감 정보가 많으면 최신 웹 확인 계획 수립

### Phase 2 — 문서 생산
1. `destination-analyst`
2. `itinerary-designer`
3. `budget-manager`
4. `local-guide`

### Phase 3 — 교차 검증
- 일정과 예산이 맞는지
- 교통패스 정보가 일정과 맞는지
- 현지 가이드의 지역 정보가 일정 동선과 맞는지
- 출발일 기준으로 운영시간/입국 요건 재확인이 필요한지

### Phase 4 — 최종 요약
사용자에게 문서별 역할과 핵심 결과를 요약 보고합니다.

## 작업 규모별 모드

| 사용자 요청 | 권장 모드 | 투입 |
|---|---|---|
| 전체 여행 계획 | 풀 파이프라인 | 4명 전원 |
| 목적지 추천 | 목적지 추천 모드 | analyst |
| 일정만 | 일정 모드 | analyst + designer |
| 예산만 | 예산 모드 | budget-manager |
| 현지 정보만 | 가이드 모드 | local-guide |
| 기존 일정 개선 | 분석 모드 | designer + budget-manager |

## 기존 파일 활용 규칙

사용자가 기존 일정표를 제공하면:
1. `_workspace/02_itinerary.md`로 반영하거나 비교 대상으로 읽고
2. 일정 설계는 보완/개선 위주로 진행하며
3. 예산과 현지 정보는 새로 갱신합니다.

## 에러 핸들링

| 에러 유형 | 대응 |
|---|---|
| 웹 검색 실패 | 현재 확보된 정보로 작성 + `최신 정보 확인 필요` 명시 |
| 목적지 미확정 | 3개 후보 비교 후 최적안 추천 |
| 예산 초과 | 절약형 대안과 우선순위 조정안 제시 |
| 정보 불일치 | 일정 기준으로 재정렬하고 충돌 메모 기록 |
| 일부 파일 누락 | 누락 사실을 보고하고 가능한 범위까지 계속 진행 |

## 함께 쓰는 스킬

- `route-optimizer`
- `budget-calculator`

## 참고 자료

- `references/workflow.md`
- `references/deliverables.md`
