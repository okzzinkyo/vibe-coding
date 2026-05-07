# 검토 리포트

검토일: 2026-04-04
검토 대상: drafts/introduction.md, src/*.py

## 종합 평가
- 논리 구조: ★★★★☆
- 인용 정확성: ★★★★☆
- 영어 품질: ★★★★★
- 코드 품질: ★★★★★
- 과장 여부: ★★★☆☆

## 🔴 Critical (반드시 수정)

### C1: [위치] 문단 4, 3번째 문장
- 현재: "DA-RAG achieved a Pass@1 accuracy of 67.0%, significantly outperforming Vanilla RAG (51.5%)"
- 문제: 'significantly'라는 표현은 통계적 유의성 검정(p-value) 없이 사용하기 부적절함. 예비 실험 결과는 'substantial improvement' 또는 'notable' 정도로 표현하는 것이 안전함.
- 수정: "DA-RAG achieved a Pass@1 accuracy of 67.0%, demonstrating a substantial improvement over Vanilla RAG (51.5%)"

### C2: [위치] 문단 4, 4-5번째 문장
- 현재: "DA-RAG maintained a 100% executability rate relative to its successful generations, whereas Vanilla RAG exhibited a notable drop in executability (43.5%)"
- 문제: 비교 대상인 43.5%는 전체 시도 대비 성공률(Absolute Executability)이며, DA-RAG의 100%는 성공한 케이스 내에서의 비율(Relative Executability)임. 서로 다른 기준으로 비교하여 독자에게 혼란을 줄 수 있음.
- 수정: 두 수치를 동일한 기준(Absolute Executability)으로 비교하거나, 각각의 정의를 명확히 명시해야 함.

### C3: [위치] 문단 3, 3번째 문장
- 현재: "While some recent efforts like B-CodeRAG (2024) have attempted..."
- 문제: 다른 인용들은 (Author et al., Year) 형식을 따르나, B-CodeRAG만 제목 기반으로 인용됨.
- 수정: 저자명이 불분명할 경우 연구 계획서에 따라 (Anonymous, 2024) 또는 저자 정보를 보완하여 수정.

## 🟡 Major (강력 권고)

### M1: [위치] 문단 2
- 문제: 연구 계획서(research_plan.md)에 포함된 RAP-Gen (Wang et al., 2023) 논문이 초안에서 누락됨. RAG가 학습 단계와 생성 단계 모두에 통합될 수 있다는 점을 언급하며 문맥을 보강할 필요가 있음.
- 수정: RAP-Gen을 인용하여 RAG의 다양한 발전 방향을 설명.

### M2: [위치] 문단 1
- 문제: StarCoder와 CodeLlama에 대한 구체적인 인용이 누락됨. (Li et al., 2023; Rozière et al., 2023) 등 표준 인용을 추가하여 학술적 엄밀성 확보.

## 🟢 Minor (개선 권장)

### m1: [위치] 문단 1 & 2
- 문제: RepoCoder (Zhang et al., 2023)가 두 문단에 걸쳐 반복적으로 주된 근거로 활용됨. 문단 1에서는 LLM의 한계 지적에 더 집중하고, 문단 2에서 RepoCoder를 본격적으로 RAG의 대안으로 소개하는 것이 더 깔끔함.

## 수정 요약
- Critical: 3건
- Major: 2건
- Minor: 1건
