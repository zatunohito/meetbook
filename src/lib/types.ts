/** 写真ごとの説明とクレジット（photo_urls の URL をキーにする） */
export type PhotoMeta = Record<string, { caption?: string; author?: string; license?: string; source?: string }>;

export type Store = {
  id: string;
  slug: string;
  name: string;
  area: string | null;
  region: string | null;
  address: string | null;
  description: string | null;
  features: string[];
  specialty_genres: string[];
  atmosphere_tags: string[];
  style_tags: string[];
  staff_name: string | null;
  staff_message: string | null;
  access: string | null;
  opening_hours: string | null;
  website_url: string | null;
  visit_mission: string | null;
  photo_urls: string[];
  photo_credit: string | null;
  photo_meta: PhotoMeta;
  tags: string[];
  admin_note: string | null;
  phone: string | null;
  sources: string[];
  is_published: boolean;
};

export type Publisher = {
  id: string;
  slug: string;
  name: string;
  location: string | null;
  description: string | null;
  website_url: string | null;
  consultation_enabled: boolean;
  consultation_note: string | null;
  genres: string[];
  tags: string[];
  mission: string | null;
  seeking: string | null;
  admin_note: string | null;
  photo_urls: string[];
  photo_credit: string | null;
  photo_meta: PhotoMeta;
  is_published: boolean;
};

export type Book = {
  id: string;
  isbn: string | null;
  title: string;
  author: string | null;
  publisher_id: string | null;
  publisher_name: string | null;
  genres: string[];
  keywords: string[];
  description: string | null;
  cover_url: string | null;
  published_on: string | null;
  target_readers: string | null;
  consultation_note: string | null;
  data_source: string;
  source_url: string | null;
  is_published: boolean;
  created_at: string;
};

export type StoreBook = {
  store_id: string;
  book_id: string;
  is_weekly_pick: boolean;
  staff_comment: string | null;
  verified_at: string;
};

export type BookReview = {
  id: string;
  book_id: string;
  body: string;
  author_label: string;
  source: string | null;
  is_published: boolean;
  created_at: string;
};

export type EventRow = {
  id: string;
  store_id: string | null;
  publisher_id: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  place: string | null;
  url: string | null;
  is_published: boolean;
};

export type Announcement = {
  id: string;
  title: string;
  body: string | null;
  url: string | null;
  published_at: string;
  is_published: boolean;
};

export type Reader = {
  id: string;
  display_name: string | null;
  interests: string[];
  favorite_books: string | null;
  favorite_genres: string[];
  current_thoughts: string | null;
  unexplored_genres: string[];
  store_styles: string[];
  atmospheres: string[];
  adventure_level: number;
  home_area: string | null;
  onboarded_at: string | null;
};

export type ThreadStatus = "open" | "in_progress" | "resolved";

export type Thread = {
  thread_id: string;
  reader_id: string;
  store_id: string;
  book_id: string | null;
  subject: string;
  status: ThreadStatus;
  reader_last_read_at: string | null;
  store_last_read_at: string | null;
  last_message_at: string;
  created_at: string;
};

export type Message = {
  message_id: string;
  thread_id: string;
  body: string;
  sender_role: "reader" | "store";
  created_at: string;
};

/** 推薦エンジンに渡す書籍（取扱書店・出版社を結合済み） */
export type BookWithContext = Book & {
  publisher: Pick<Publisher, "id" | "slug" | "name"> | null;
  stores: (Pick<Store, "id" | "slug" | "name" | "region"> & { is_weekly_pick: boolean })[];
};
