---
name: image-slideshow
description: 폴더에 있는 이미지 파일들로 영상 강의 녹화용 슬라이드 쇼 HTML을 생성하는 스킬. 이미지 슬라이드쇼, 프레젠테이션 HTML, 슬라이드 쇼 만들기 요청 시 사용.
---

# Image Slideshow HTML Generator

폴더에 있는 이미지 파일들로 슬라이드 쇼 HTML을 생성하는 스킬입니다.

## 사용 시나리오

- 영상 강의 녹화용 이미지 슬라이드 쇼가 필요할 때
- 폴더에 이미지를 추가/삭제/이름변경 후 HTML을 다시 생성할 때
- 새로운 챕터 폴더에 슬라이드 쇼를 만들어야 할 때

## 사용법

```
이 폴더의 슬라이드 쇼 HTML을 만들어줘: output/교안 v1.3 슬라이드 쇼/Make 소개
```

또는 여러 폴더를 한 번에:

```
다음 폴더들의 슬라이드 쇼 HTML을 만들어줘:
- output/교안 v1.3 슬라이드 쇼/Make 소개
- output/교안 v1.3 슬라이드 쇼/첫번째 실습 - Hello, Make
```

## 작업 흐름

### 단계 1: 대상 폴더의 이미지 파일 목록 수집

```bash
# 폴더에서 이미지 파일 목록 가져오기 (이름순 정렬)
ls -1 "{folder_path}/"*.{jpg,jpeg,png,gif,webp,bmp,svg} 2>/dev/null | sort
```

- 지원 확장자: jpg, jpeg, png, gif, webp, bmp, svg
- 파일명 기준 오름차순 정렬 (001, 002, ... 또는 01, 02, ...)
- HTML 파일(*.html)은 제외

### 단계 2: 이미지 목록에서 TOC 제목 추출

각 이미지 파일명에서 제목을 추출합니다:
- 앞의 숫자 접두사 제거 (예: `001 `, `01.`, `1-` 등)
- 확장자 제거 (예: `.jpg`)
- 남은 문자열을 TOC 제목으로 사용

예시:
- `001 Make 업무 자동화.jpg` → `Make 업무 자동화`
- `01.실습1 - 지메일 - 슬랙.jpg` → `실습1 - 지메일 - 슬랙`
- `03.make 인터페이스 정복하기.jpg` → `make 인터페이스 정복하기`

### 단계 3: HTML 생성

아래 HTML 템플릿의 `images` 배열에 수집한 이미지 정보를 채워서 `{폴더이름}.html` 파일을 폴더 안에 생성합니다.

**파일명 규칙**: HTML 파일명 = 폴더 이름 (예: 폴더가 `Make 소개`이면 `Make 소개.html`)

### HTML 템플릿

```html
<!doctype html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{폴더이름}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            background: #000;
            color: #ccc;
            font-family: 'Segoe UI', -apple-system, 'Malgun Gothic', sans-serif;
            overflow: hidden;
            user-select: none;
        }

        /* ── Progress ── */
        .progress {
            position: fixed;
            top: 0;
            left: 0;
            height: 2px;
            background: rgba(255,255,255,0.18);
            transition: width 0.5s ease;
            z-index: 100;
        }

        /* ── Slide Area ── */
        .slide-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 220px;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .slide-image {
            max-width: calc(100% - 60px);
            max-height: calc(100vh - 60px);
            object-fit: contain;
            position: absolute;
            opacity: 0;
            transform: translateY(0);
            transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
        }

        .slide-image.active {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
        }

        /* ── Navigation Areas (invisible click zones) ── */
        .nav-area {
            position: fixed;
            top: 0;
            bottom: 0;
            width: 80px;
            background: transparent;
            border: none;
            cursor: pointer;
            z-index: 40;
        }

        .nav-area:hover { background: rgba(255,255,255,0.015); }
        .nav-area:disabled { cursor: default; pointer-events: none; }
        .nav-area-prev { left: 0; }
        .nav-area-next { right: 220px; }

        /* ── Table of Contents ── */
        .toc {
            position: fixed;
            top: 0;
            right: 0;
            width: 220px;
            height: 100vh;
            background: rgba(8,8,8,0.92);
            border-left: 1px solid rgba(255,255,255,0.05);
            display: flex;
            flex-direction: column;
            z-index: 60;
        }

        .toc-header {
            font-size: 0.7rem;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.25);
            padding: 18px 16px 14px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            flex-shrink: 0;
        }

        .toc-list {
            flex: 1;
            overflow-y: auto;
            padding: 6px 0;
        }

        .toc-item {
            display: block;
            padding: 7px 14px;
            color: rgba(255,255,255,0.30);
            font-size: 0.78rem;
            line-height: 1.4;
            text-decoration: none;
            cursor: pointer;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            transition: color 0.25s ease, border-color 0.25s ease, background 0.25s ease;
            border-left: 2px solid transparent;
        }

        .toc-item:hover {
            color: rgba(255,255,255,0.60);
            background: rgba(255,255,255,0.02);
        }

        .toc-item.active {
            color: rgba(255,255,255,0.85);
            border-left-color: rgba(255,255,255,0.4);
            background: rgba(255,255,255,0.03);
        }

        /* ── Navigation Buttons (below TOC) ── */
        .toc-nav {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            padding: 14px 16px;
            border-top: 1px solid rgba(255,255,255,0.05);
        }

        .toc-nav-btn {
            background: transparent;
            border: 1px solid rgba(255,255,255,0.22);
            color: rgba(255,255,255,0.55);
            font-size: 0.82rem;
            padding: 6px 18px;
            border-radius: 3px;
            cursor: pointer;
            transition: color 0.25s ease, border-color 0.25s ease;
            font-family: inherit;
            letter-spacing: 0.04em;
        }

        .toc-nav-btn:hover {
            color: rgba(255,255,255,0.85);
            border-color: rgba(255,255,255,0.40);
        }

        .toc-nav-btn:disabled {
            color: rgba(255,255,255,0.12);
            border-color: rgba(255,255,255,0.06);
            cursor: default;
        }

        .toc-nav-counter {
            font-size: 0.75rem;
            color: rgba(255,255,255,0.38);
            font-variant-numeric: tabular-nums;
            min-width: 50px;
            text-align: center;
        }

        /* ── Scrollbar ── */
        .toc-list::-webkit-scrollbar { width: 3px; }
        .toc-list::-webkit-scrollbar-track { background: transparent; }
        .toc-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
    </style>
</head>
<body>
    <div class="progress" id="progress"></div>

    <div class="slide-container" id="slides"></div>

    <button class="nav-area nav-area-prev" id="areaPrev"></button>
    <button class="nav-area nav-area-next" id="areaNext"></button>

    <div class="toc">
        <div class="toc-header">목차</div>
        <div class="toc-list" id="tocList"></div>
        <div class="toc-nav">
            <button class="toc-nav-btn" id="btnPrev">&larr;</button>
            <span class="toc-nav-counter" id="counter"></span>
            <button class="toc-nav-btn" id="btnNext">&rarr;</button>
        </div>
    </div>

    <script>
        const images = [
            // ★ 여기에 이미지 목록을 채워 넣으세요
            // { file: '001 제목.jpg', title: '제목' },
        ];

        let current = 0;
        let isTransitioning = false;
        const TRANSITION_MS = 500;

        const container = document.getElementById('slides');
        const tocList = document.getElementById('tocList');
        const counter = document.getElementById('counter');
        const progress = document.getElementById('progress');
        const btnPrev = document.getElementById('btnPrev');
        const btnNext = document.getElementById('btnNext');
        const areaPrev = document.getElementById('areaPrev');
        const areaNext = document.getElementById('areaNext');

        images.forEach((img, i) => {
            const el = document.createElement('img');
            el.src = img.file;
            el.alt = img.title;
            el.className = 'slide-image' + (i === 0 ? ' active' : '');
            el.draggable = false;
            container.appendChild(el);

            const tocItem = document.createElement('div');
            tocItem.className = 'toc-item' + (i === 0 ? ' active' : '');
            tocItem.textContent = (i + 1) + '. ' + img.title;
            tocItem.title = img.title;
            tocItem.addEventListener('click', () => goTo(i));
            tocList.appendChild(tocItem);
        });

        function goTo(index) {
            if (index < 0 || index >= images.length || index === current || isTransitioning) return;
            isTransitioning = true;

            const direction = index > current ? 1 : -1;
            const slides = container.querySelectorAll('.slide-image');
            const tocItems = tocList.querySelectorAll('.toc-item');
            const outgoing = slides[current];
            const incoming = slides[index];

            // Position incoming off-screen instantly (no transition)
            incoming.style.transition = 'none';
            incoming.style.opacity = '1';
            incoming.style.transform = 'translateY(' + (direction * 100) + 'vh)';
            incoming.offsetHeight; // force reflow

            // Re-enable transition, then animate both
            incoming.style.transition = '';
            outgoing.style.transform = 'translateY(' + (-direction * 100) + 'vh)';
            incoming.style.transform = 'translateY(0)';

            // Update TOC immediately
            tocItems[current].classList.remove('active');
            tocItems[index].classList.add('active');
            tocItems[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });

            current = index;
            updateUI();

            // Cleanup after animation completes
            setTimeout(() => {
                outgoing.classList.remove('active');
                outgoing.removeAttribute('style');
                incoming.classList.add('active');
                incoming.removeAttribute('style');
                isTransitioning = false;
            }, TRANSITION_MS + 20);
        }

        function next() { goTo(current + 1); }
        function prev() { goTo(current - 1); }

        function updateUI() {
            counter.textContent = (current + 1) + ' / ' + images.length;
            progress.style.width = ((current + 1) / images.length * 100) + '%';
            btnPrev.disabled = areaPrev.disabled = current === 0;
            btnNext.disabled = areaNext.disabled = current === images.length - 1;
        }

        btnPrev.addEventListener('click', prev);
        btnNext.addEventListener('click', next);
        areaPrev.addEventListener('click', prev);
        areaNext.addEventListener('click', next);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); next(); }
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prev(); }
            else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
            else if (e.key === 'End') { e.preventDefault(); goTo(images.length - 1); }
        });

        updateUI();
    </script>
</body>
</html>
```

## 주의사항

- 이미지 파일은 HTML과 **같은 폴더**에 있어야 합니다
- 이미지 파일명에 한글, 공백, 특수문자가 포함되어도 됩니다
- HTML 파일 1개 + 이미지 파일들로만 폴더가 구성됩니다 (외부 CSS/JS 없음)
- 이미지가 추가/삭제/이름변경된 후에는 이 스킬을 다시 실행하여 HTML을 재생성하세요
