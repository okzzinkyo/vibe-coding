# Lab Inventory

연구실 물품 재고 관리 서비스

**스택:** React 19 + Vite + TypeScript + Tailwind CSS v4 + Supabase + Vercel

---

## 기능

**인증**
- 이메일/비밀번호 로그인

**물품 관리**
- 물품 목록 테이블 조회
- 물품명 검색 (부분 일치)
- 카테고리 필터
- 물품 추가 / 수정 / 삭제 (삭제 확인 모달 포함)
- 수량 0개일 때 빨간색 강조

**상세 보기**
- 물품명 클릭 시 하단 바텀시트로 상세 정보 표시
- 바텀시트에서 사진, 설명, 첨부파일 확인 및 수정/삭제 가능

**카테고리 관리**
- 카테고리 추가 / 삭제 (모달)
- 중복 카테고리 입력 방지

**파일 첨부**
- 사진 업로드 (Supabase Storage: `item-images` 버킷)
- 파일 첨부 (Supabase Storage: `item-files` 버킷)

**내보내기**
- 전체 재고 엑셀 다운로드 (물품명, 카테고리, 수량, 설명, 최종 수정일)

---

## DB 스키마

### `categories`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | PK, 자동 생성 |
| `name` | text (unique) | 카테고리 이름 |
| `created_at` | timestamptz | 생성일 |

### `items`

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | PK, 자동 생성 |
| `name` | text | 물품명 |
| `category` | text | 카테고리 이름 |
| `quantity` | integer | 수량 |
| `description` | text | 설명 (nullable) |
| `image_url` | text | 사진 URL (nullable) |
| `file_urls` | text[] | 첨부파일 URL 배열 (nullable) |
| `created_at` | timestamptz | 생성일 |
| `updated_at` | timestamptz | 최종 수정일 |

RLS 활성화 — 로그인한 사용자만 읽기/쓰기 가능

### Storage 버킷

| 버킷 | 용도 |
|------|------|
| `item-images` | 물품 사진 (public read) |
| `item-files` | 물품 첨부파일 (public read) |

---

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

---

## Supabase 설정

### 2. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 접속 후 로그인
2. **New Project** 클릭
3. 프로젝트 이름, 데이터베이스 비밀번호, 리전(Northeast Asia 권장) 입력 후 생성
4. 프로젝트 생성 완료까지 약 1~2분 대기

---

### 3. 데이터베이스 & Storage 초기화

Supabase 대시보드 → 왼쪽 메뉴 **SQL Editor** → **New query**

`supabase-setup.sql` 파일 내용을 전체 복사해서 붙여넣고 **Run** 클릭

> 이 SQL은 다음을 생성합니다:
> - `categories` 테이블 (카테고리 목록)
> - `items` 테이블 (물품 정보)
> - Row Level Security 정책 (로그인한 사용자만 접근)
> - Storage 버킷 `item-images`, `item-files` (public read)

---

### 4. 환경변수 설정

Supabase 대시보드 → 왼쪽 메뉴 **Settings** → **Data API**

아래 두 값을 복사:

| 항목 | 위치 |
|------|------|
| Project URL | `https://xxxx.supabase.co` 형태 |
| anon public key | `eyJ...` 로 시작하는 긴 문자열 |

프로젝트 루트의 `.env.local` 파일을 열어 값 입력:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

### 5. 첫 번째 계정 만들기

Supabase 대시보드 → **Authentication** → **Users** → **Add user**

이메일과 비밀번호를 입력해 랩 구성원 계정을 미리 생성하거나,
앱의 회원가입 화면에서 직접 가입할 수 있습니다.

> 외부 가입을 막으려면: Supabase 대시보드 → **Authentication** → **Settings** → **User Signups** 비활성화

---

### 6. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

---

## Vercel 배포

### 7. GitHub에 푸시

```bash
git init
git add .
git commit -m "init: lab-inventory"
git remote add origin https://github.com/your-username/lab-inventory.git
git push -u origin main
```

### 8. Vercel 연결

1. [vercel.com](https://vercel.com) 접속 후 GitHub 로그인
2. **Add New Project** → GitHub 저장소 선택
3. **Environment Variables** 섹션에서 아래 두 값 추가:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Deploy** 클릭

이후 `main` 브랜치에 push할 때마다 자동 배포됩니다.
