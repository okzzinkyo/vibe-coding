# Gemini CLI Travel Planner Harness

Claude Code용 `Travel Planner` 하네스를 **Gemini CLI 프로젝트 레포** 형태로 변환한 버전입니다.

학생들은 이 저장소를 그대로 복제한 뒤, 별도 확장 설치 없이 `gemini`를 실행하고
프로젝트 명령(`/travel:*`)만 호출하면 다음 산출물을 만들 수 있습니다.

- `_workspace/00_input.md` ~ `_workspace/05_local_guide.md`
- `docs/index.html`, `docs/styles.css`, `docs/app.js`, `docs/trip-data.json`
- GitHub Pages로 바로 게시 가능한 정적 사이트

## 무엇이 바뀌었나

| 원본 Harness 100 요소 | Gemini CLI 대응 |
|---|---|
| `.claude/agents/*.md` | `.gemini/agents/*.md` custom subagents |
| `.claude/skills/*/skill.md` | `.gemini/skills/*/SKILL.md` Agent Skills |
| 자연어 트리거 | `GEMINI.md` + `/travel:*` custom commands |
| `_workspace/*.md` 산출물 | 그대로 유지 |
| 없음 | `docs/` 정적 웹페이지 생성 추가 |

## 빠른 시작

### 1) Gemini CLI 설치
```bash
npm install -g @google/gemini-cli@latest
# 또는 설치 없이
npx @google/gemini-cli
```

### 2) 저장소 복제
```bash
git clone <강사-저장소-URL>
cd gemini-travel-planner-harness
```

### 3) Gemini 실행
```bash
gemini
```

### 4) 바로 써보기
아래 중 하나를 실행하세요.

```text
/travel:tokyo-demo
```

또는 자유 입력:

```text
/travel:full 2026-04-24부터 2026-04-30까지 도쿄 문화 여행을 계획하고, 결과를 바탕으로 인터랙티브한 웹페이지까지 docs/에 만들어줘.
```

## 제공 명령

| 명령 | 용도 |
|---|---|
| `/travel:full <요청>` | 여행 문서 + 인터랙티브 웹페이지까지 한 번에 생성 |
| `/travel:plan <요청>` | 여행 계획 문서만 생성 |
| `/travel:web <요청>` | 이미 생성된 `_workspace/` 문서를 바탕으로 `docs/` 웹페이지 생성 |
| `/travel:tokyo-demo` | 도쿄 6박 7일 문화 여행 데모 실행 |

## 산출물 위치

### 문서형 산출물
- `_workspace/00_input.md`
- `_workspace/01_destination_analysis.md`
- `_workspace/02_itinerary.md`
- `_workspace/03_accommodation.md`
- `_workspace/04_budget.md`
- `_workspace/05_local_guide.md`

### 웹페이지 산출물
- `docs/index.html`
- `docs/styles.css`
- `docs/app.js`
- `docs/trip-data.json`

## 로컬 미리보기

이 저장소는 별도 프레임워크 없이 정적 파일만 생성합니다.

```bash
npm run preview
```

브라우저에서 다음 주소를 엽니다.

```text
http://localhost:4173
```

## GitHub Pages 게시

이 저장소는 **`docs/` 폴더 출력**을 기본으로 사용합니다.
따라서 생성 결과를 커밋한 뒤 GitHub Pages의 게시 원본을 `main` 브랜치의 `/docs`
폴더로 지정하면 바로 공개 사이트로 사용할 수 있습니다.

## 수업 운영 권장 방식

### 강사
1. 이 저장소를 GitHub에 업로드
2. 저장소 설명에 실행 명령 예시 추가
3. GitHub Pages를 `main /docs`로 설정
4. 예시 프롬프트는 `prompts/` 디렉토리 기준으로 안내

### 수강생
1. Fork 또는 Clone
2. `gemini` 실행
3. `/travel:tokyo-demo` 또는 `/travel:full ...` 실행
4. 결과 확인 후 `docs/`를 GitHub Pages로 게시

## 팁

- 여행 정보는 시간이 지나며 바뀌므로, 입국 요건·환율·교통패스·운영시간은 항상
  최신 웹 정보를 다시 확인하도록 프롬프트가 설계되어 있습니다.
- 결과 웹페이지는 **정적 HTML/CSS/JS**만 사용하도록 설계되어, 로컬/Pages 환경
  모두에서 바로 동작합니다.
- 필요하면 `prompts/demo-tokyo-culture.md`를 다른 도시 버전으로 복제해 수업용
  데모 명령을 더 만들 수 있습니다.

## 원본 출처

- `revfactory/harness-100`
- `ko/76-travel-planner`

자세한 변환 근거는 `NOTICE.md`를 참고하세요.
# dk2604-gemini-travel-planner-preview
# dk2604-gemini-travel-planner-preview
