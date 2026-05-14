-- categories 테이블 생성
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table categories enable row level security;

drop policy if exists "authenticated users can select categories" on categories;
drop policy if exists "authenticated users can insert categories" on categories;
drop policy if exists "authenticated users can delete categories" on categories;

create policy "authenticated users can select categories" on categories
  for select to authenticated using (true);

create policy "authenticated users can insert categories" on categories
  for insert to authenticated with check (true);

create policy "authenticated users can delete categories" on categories
  for delete to authenticated using (true);

-- items 테이블 생성
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default '',
  quantity integer not null default 0,
  description text,
  image_url text,
  file_urls text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Data API 접근 권한 부여
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.items to authenticated;

-- RLS (Row Level Security) 활성화
alter table items enable row level security;

-- 로그인한 사용자는 모두 읽기/쓰기 가능
drop policy if exists "authenticated users can select" on items;
drop policy if exists "authenticated users can insert" on items;
drop policy if exists "authenticated users can update" on items;
drop policy if exists "authenticated users can delete" on items;

create policy "authenticated users can select" on items
  for select to authenticated using (true);

create policy "authenticated users can insert" on items
  for insert to authenticated with check (true);

create policy "authenticated users can update" on items
  for update to authenticated using (true);

create policy "authenticated users can delete" on items
  for delete to authenticated using (true);

-- Storage 버킷 생성 (Supabase 대시보드 > Storage에서 직접 만들거나 아래 SQL 실행)
-- 버킷 이름: item-images, item-files (public 버킷으로 생성)
insert into storage.buckets (id, name, public)
  values ('item-images', 'item-images', true)
  on conflict do nothing;

insert into storage.buckets (id, name, public)
  values ('item-files', 'item-files', true)
  on conflict do nothing;

-- Storage 정책: 로그인한 사용자만 업로드/삭제 가능, 누구나 읽기
drop policy if exists "authenticated upload item-images" on storage.objects;
drop policy if exists "public read item-images" on storage.objects;
drop policy if exists "authenticated upload item-files" on storage.objects;
drop policy if exists "public read item-files" on storage.objects;

create policy "authenticated upload item-images" on storage.objects
  for insert to authenticated with check (bucket_id = 'item-images');

create policy "public read item-images" on storage.objects
  for select using (bucket_id = 'item-images');

create policy "authenticated upload item-files" on storage.objects
  for insert to authenticated with check (bucket_id = 'item-files');

create policy "public read item-files" on storage.objects
  for select using (bucket_id = 'item-files');
