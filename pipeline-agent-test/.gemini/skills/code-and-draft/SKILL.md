---
name: code-and-draft
description: >
  실험 코드 작성 및 논문 초안 작성 스킬. 재현 가능한 실험 코드 표준,
  논문용 시각화 규칙, 학술 영어 작성 가이드를 제공한다.
  "코드 작성", "초안 작성", "실험 실행" 요청 시 활성화.
---

# 코드 + 초안 작성 스킬

## 코드 재현성 표준
```python
import random, numpy as np
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
```

## 논문용 그래프 표준
```python
import matplotlib
matplotlib.rcParams.update({
    'font.size': 12, 'axes.titlesize': 14,
    'axes.labelsize': 12, 'figure.dpi': 300,
    'savefig.dpi': 300, 'savefig.bbox': 'tight'
})
COLORS = ['#0072B2', '#D55E00', '#009E73', '#CC79A7']
```
- PNG (300 DPI) + PDF 동시 저장
- 색각이상자 친화 팔레트

## 학술 영어 치환 사전
| 금지 | 대체 |
|------|------|
| very important | crucial, significant |
| a lot of | numerous, substantial |
| things | factors, components |
| shows | demonstrates, indicates |
| good | effective, robust |
| bad | suboptimal, inadequate |

## Introduction 작성 공식
```
[배경 1-2문장] + [문제 1문장] + [기존 시도 2-3문장]
+ [한계 1-2문장] + [우리 방법 2-3문장] + [결과 1-2문장] + [기여 1문장]
```
