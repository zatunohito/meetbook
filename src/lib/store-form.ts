import "server-only";
import { list, str, strs } from "./form";
import { pickKeys } from "./taxonomy";

const url = (v: string | null) => (v && /^https?:\/\//.test(v) ? v : null);

/** 書店自身も編集できる項目（管理画面と書店画面で共用） */
export function parseStoreProfile(form: FormData) {
  return {
    address: str(form, "address", 200),
    phone: str(form, "phone", 30),
    description: str(form, "description", 4000),
    features: list(form, "features").slice(0, 12),
    specialty_genres: pickKeys("genre", strs(form, "specialty_genres")),
    atmosphere_tags: pickKeys("atmosphere", strs(form, "atmosphere_tags")),
    style_tags: pickKeys("style", strs(form, "style_tags")),
    tags: list(form, "tags").slice(0, 12),
    staff_name: str(form, "staff_name", 100),
    staff_message: str(form, "staff_message", 2000),
    access: str(form, "access", 1000),
    opening_hours: str(form, "opening_hours", 300),
    website_url: url(str(form, "website_url", 300)),
    visit_mission: str(form, "visit_mission", 500),
  };
}
