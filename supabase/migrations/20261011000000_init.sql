-- MEET BOOK 初期スキーマ
-- すべてのアクセスはサーバー（service_role）経由で行う。
-- RLS を有効化し anon / authenticated 向けのポリシーは作らないことで、公開キーからの直接アクセスを遮断する。

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- 書店・出版社・書籍
-- ---------------------------------------------------------------
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  area text,                                      -- 表示用エリア（例：中心商店街）
  region text,                                    -- マッチング用地域（taxonomy の region キー）
  address text,
  description text,
  features text[] not null default '{}',          -- 特徴（自由記述タグ）
  specialty_genres text[] not null default '{}',  -- 得意ジャンル（taxonomy の genre キー）
  atmosphere_tags text[] not null default '{}',   -- 店の雰囲気（taxonomy の atmosphere キー）
  style_tags text[] not null default '{}',        -- 合う過ごし方（taxonomy の style キー）
  staff_name text,                                -- メッセージの話し手（例：城下さん（店主））
  staff_message text,
  access text,
  opening_hours text,
  website_url text,
  visit_mission text,
  photo_urls text[] not null default '{}',
  photo_credit text,                              -- 写真の提供者・撮影者
  photo_meta jsonb not null default '{}',         -- 写真ごとの説明・撮影者・ライセンス・出典（URL をキーにする）
  tags text[] not null default '{}',              -- 表示用の自由タグ
  phone text,
  sources text[] not null default '{}',           -- 情報の出典URL（読者には非表示）
  admin_note text,                                -- 管理者メモ（読者には非表示）
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.publishers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  location text,
  description text,
  website_url text,
  consultation_enabled boolean not null default false,
  consultation_note text,
  genres text[] not null default '{}',            -- 得意ジャンル（taxonomy の genre キー）
  tags text[] not null default '{}',              -- 表示用の自由タグ
  mission text,                                   -- 大切にしていること
  seeking text,                                   -- 求めている書店・届け先
  photo_urls text[] not null default '{}',
  photo_credit text,
  photo_meta jsonb not null default '{}',
  admin_note text,                                -- 管理者メモ（読者には非表示）
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.books (
  id uuid primary key default gen_random_uuid(),
  isbn text unique,
  title text not null,
  author text,
  publisher_id uuid references public.publishers(id) on delete set null,
  publisher_name text,                              -- 地域外出版社など publishers に無い場合の表記
  genres text[] not null default '{}',              -- taxonomy の genre キー
  keywords text[] not null default '{}',
  description text,
  cover_url text,
  published_on date,
  target_readers text,                              -- 想定読者（出版社が登録）
  consultation_note text,                           -- 書店向け相談設定
  data_source text not null default 'manual',       -- manual / openbd / ndl / ndl+openbd
  source_url text,                                  -- 書誌の出典ページ（国立国会図書館サーチなど）
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index books_publisher_idx on public.books(publisher_id);

-- 取扱書店（実店舗在庫）。登録されたものだけを「取扱あり」と表示する
create table public.store_books (
  store_id uuid not null references public.stores(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  is_weekly_pick boolean not null default false,    -- 今週の本
  staff_comment text,
  verified_at timestamptz not null default now(),   -- 在庫を確認した日時
  primary key (store_id, book_id)
);
create index store_books_book_idx on public.store_books(book_id);

-- 感想（実データのみ。出典を必ず保持）
create table public.book_reviews (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  body text not null,
  author_label text not null,                       -- 「好文堂書店 スタッフ」など
  source text,                                      -- 出典（イベント名・アンケート等）
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create index book_reviews_book_idx on public.book_reviews(book_id);

-- 関係性マップ用の明示的な関係（同著者・同出版社などは自動導出）
create table public.book_relations (
  book_id uuid not null references public.books(id) on delete cascade,
  related_book_id uuid not null references public.books(id) on delete cascade,
  note text,
  primary key (book_id, related_book_id),
  check (book_id <> related_book_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete set null,
  publisher_id uuid references public.publishers(id) on delete set null,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  place text,
  url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create index events_starts_idx on public.events(starts_at);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  url text,
  published_at timestamptz not null default now(),
  is_published boolean not null default true
);

-- ---------------------------------------------------------------
-- 読者
-- ---------------------------------------------------------------
create table public.readers (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  interests text[] not null default '{}',           -- Q1 興味テーマ
  favorite_books text,                              -- Q2 好きな本（自由記述）
  favorite_genres text[] not null default '{}',     -- Q2 好きなジャンル
  current_thoughts text,                            -- Q3 最近考えていること
  unexplored_genres text[] not null default '{}',   -- Q4 未開拓だが興味のあるジャンル
  store_styles text[] not null default '{}',        -- Q5 書店での過ごし方
  atmospheres text[] not null default '{}',         -- Q6 好みの店の雰囲気
  adventure_level smallint not null default 3 check (adventure_level between 1 and 5), -- Q7 挑戦度
  home_area text,                                   -- Q7 地域設定
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reader_meets (
  reader_id uuid not null references public.readers(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reader_id, book_id)
);

create table public.reader_follows (
  reader_id uuid not null references public.readers(id) on delete cascade,
  target_type text not null check (target_type in ('store', 'publisher')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (reader_id, target_type, target_id)
);

-- ---------------------------------------------------------------
-- 相談（スレッド／メッセージ）
-- ---------------------------------------------------------------
create table public.threads (
  thread_id uuid primary key default gen_random_uuid(),
  reader_id uuid not null references public.readers(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  book_id uuid references public.books(id) on delete set null,
  subject text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  reader_last_read_at timestamptz,
  store_last_read_at timestamptz,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index threads_store_idx on public.threads(store_id, last_message_at desc);
create index threads_reader_idx on public.threads(reader_id, last_message_at desc);

create table public.messages (
  message_id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(thread_id) on delete cascade,
  body text not null check (length(body) between 1 and 4000),
  sender_role text not null check (sender_role in ('reader', 'store')),
  created_at timestamptz not null default now()
);
create index messages_thread_idx on public.messages(thread_id, created_at);

-- メッセージ追加時にスレッドの最終更新を進める
create function public.touch_thread() returns trigger language plpgsql as $$
begin
  update public.threads set last_message_at = new.created_at where thread_id = new.thread_id;
  return new;
end $$;
create trigger messages_touch_thread after insert on public.messages
  for each row execute function public.touch_thread();

create function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
create trigger stores_updated before update on public.stores for each row execute function public.set_updated_at();
create trigger publishers_updated before update on public.publishers for each row execute function public.set_updated_at();
create trigger books_updated before update on public.books for each row execute function public.set_updated_at();
create trigger readers_updated before update on public.readers for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- RLS: 全テーブル有効化・ポリシーなし（service_role のみアクセス可）
-- ---------------------------------------------------------------
alter table public.stores enable row level security;
alter table public.publishers enable row level security;
alter table public.books enable row level security;
alter table public.store_books enable row level security;
alter table public.book_reviews enable row level security;
alter table public.book_relations enable row level security;
alter table public.events enable row level security;
alter table public.announcements enable row level security;
alter table public.readers enable row level security;
alter table public.reader_meets enable row level security;
alter table public.reader_follows enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
