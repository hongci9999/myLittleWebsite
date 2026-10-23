-- 사이트 대화창 하루 사용 횟수 (비로그인 IP 해시별). Supabase SQL 에디터에서 1회 실행.
-- 테이블은 RLS로 막고 정책 없음 → anon 키로는 chat_hit RPC로만 접근.

create table if not exists public.chat_usage (
  ip_hash text not null,
  day date not null default current_date,
  count int not null default 0,
  primary key (ip_hash, day)
);

alter table public.chat_usage enable row level security;

-- 1 증가 후 한도 이내면 true
create or replace function public.chat_hit(p_ip_hash text, p_limit int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  insert into chat_usage (ip_hash, day, count)
  values (p_ip_hash, current_date, 1)
  on conflict (ip_hash, day) do update set count = chat_usage.count + 1
  returning count into n;
  return n <= p_limit;
end;
$$;

grant execute on function public.chat_hit(text, int) to anon;
