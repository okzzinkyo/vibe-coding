-- profiles 테이블 (auth.users 확장)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  avatar_url text,
  created_at timestamptz default now() not null
);

-- events 테이블
create table public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  color text not null default 'blue' check (color in ('blue', 'green', 'red', 'yellow', 'purple', 'orange')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- announcements 테이블
create table public.announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  pinned boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- RLS 활성화
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.announcements enable row level security;

-- profiles 정책
create policy "로그인한 사용자는 프로필 조회 가능" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "본인 프로필 수정 가능" on public.profiles
  for update using (auth.uid() = id);

create policy "관리자는 모든 프로필 수정 가능" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- events 정책
create policy "로그인한 사용자는 일정 조회 가능" on public.events
  for select using (auth.role() = 'authenticated');

create policy "관리자만 일정 등록/수정/삭제 가능" on public.events
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- announcements 정책
create policy "로그인한 사용자는 공지 조회 가능" on public.announcements
  for select using (auth.role() = 'authenticated');

create policy "관리자만 공지 등록/수정/삭제 가능" on public.announcements
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 회원가입 시 profiles 자동 생성 트리거
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'member'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
