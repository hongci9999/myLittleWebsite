-- 현대오토에버 부트캠프 프로젝트 기록. Supabase SQL 에디터에서 1회 실행.
-- 본문은 bootcamp_docs 테이블, 슬라이드 이미지는 Storage 버킷 bootcamp(공개 읽기).
-- 쓰기는 로그인 사용자만 (server/scripts/import-bootcamp.ts가 BULK 계정으로 올림).

create table if not exists public.bootcamp_docs (
  slug text primary key,             -- 'index' = 과정 소개, 나머지 = 프로젝트 (파일명 기준)
  title text not null,
  date date,
  summary text,
  tags text[] not null default '{}',
  body_md text not null,             -- 이미지 경로는 Storage 공개 URL로 치환된 상태
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.bootcamp_docs enable row level security;

create policy "anon_read_bootcamp_docs" on public.bootcamp_docs
  for select to anon, authenticated using (true);
create policy "auth_write_bootcamp_docs" on public.bootcamp_docs
  for all to authenticated using (true) with check (true);

-- 이미지 버킷 (공개 읽기 — public 버킷은 URL로 바로 읽힘)
insert into storage.buckets (id, name, public)
values ('bootcamp', 'bootcamp', true)
on conflict (id) do nothing;

create policy "auth_write_bootcamp_images" on storage.objects
  for all to authenticated
  using (bucket_id = 'bootcamp') with check (bucket_id = 'bootcamp');
