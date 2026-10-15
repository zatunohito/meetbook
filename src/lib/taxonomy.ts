// アンケート・書籍・書店で共通に使う語彙。マッチングはこのキー同士の一致で行う。

export type Option = { key: string; label: string };

export const GENRES: Option[] = [
  { key: "philosophy", label: "哲学・思想" },
  { key: "literature", label: "文学・小説" },
  { key: "local", label: "地域文化（長崎）" },
  { key: "history", label: "歴史" },
  { key: "peace", label: "平和・記憶" },
  { key: "religion", label: "宗教・祈り" },
  { key: "art", label: "アート・デザイン" },
  { key: "nature", label: "自然・科学" },
  { key: "society", label: "社会・ノンフィクション" },
  { key: "life", label: "暮らし・食" },
  { key: "travel", label: "旅・紀行" },
  { key: "poetry", label: "詩・エッセイ" },
  { key: "picturebook", label: "絵本・児童書" },
  { key: "mystery", label: "ミステリー・エンタメ" },
  { key: "comics", label: "マンガ" },
  { key: "language", label: "語学・海外文化" },
];

export const STYLES: Option[] = [
  { key: "quiet_read", label: "静かに試し読みする" },
  { key: "talk_staff", label: "店員さんと話して選ぶ" },
  { key: "browse", label: "棚をゆっくり歩いて探す" },
  { key: "cafe", label: "喫茶で本と過ごす" },
  { key: "events", label: "イベントや読書会に参加する" },
  { key: "quick", label: "目当ての本を手早く買う" },
];

export const ATMOSPHERES: Option[] = [
  { key: "quiet", label: "静かで落ち着いた" },
  { key: "cozy", label: "小さく親密な" },
  { key: "spacious", label: "広くて品揃えが多い" },
  { key: "cafe", label: "喫茶・カフェ併設" },
  { key: "local_focus", label: "地域の本が充実" },
  { key: "lively", label: "にぎやかで発見が多い" },
  { key: "retro", label: "レトロ" },
  { key: "hideaway", label: "隠れ家のような" },
  { key: "modern", label: "モダン" },
];

export const REGIONS: Option[] = [
  { key: "nagasaki_center", label: "長崎市 中心部" },
  { key: "nagasaki_station", label: "長崎市 駅周辺・浦上" },
  { key: "nagasaki_north", label: "長崎市 北部（住吉など）" },
  { key: "omura", label: "大村市" },
  { key: "other_pref", label: "長崎県内のその他の地域" },
  { key: "outside", label: "県外" },
];

export const ADVENTURE_LEVELS: Option[] = [
  { key: "1", label: "好きな分野の中で深めたい" },
  { key: "2", label: "少しだけ寄り道したい" },
  { key: "3", label: "ほどよく新しい分野も" },
  { key: "4", label: "積極的に知らない分野へ" },
  { key: "5", label: "まったく未知の一冊に出会いたい" },
];

// 隣り合うジャンル同士と、その「接点」の説明。偶然の一冊の理由づけに使う。
export const GENRE_BRIDGES: { a: string; b: string; why: string }[] = [
  { a: "philosophy", b: "religion", why: "どちらも「生きる意味」を問い続ける営み" },
  { a: "philosophy", b: "society", why: "抽象的な問いを社会の現実に引き寄せて考えられる" },
  { a: "philosophy", b: "poetry", why: "言葉で世界の手触りを捉え直す点で通じ合う" },
  { a: "literature", b: "poetry", why: "物語の外にある言葉の響きに触れられる" },
  { a: "literature", b: "mystery", why: "人物の心の動きを追う読み方がそのまま活きる" },
  { a: "literature", b: "history", why: "物語の背景にある時代を深く知ることができる" },
  { a: "local", b: "history", why: "長崎の街並みを時間の層として読み解ける" },
  { a: "local", b: "religion", why: "長崎の祈りの歴史と土地の記憶が重なる" },
  { a: "local", b: "travel", why: "暮らす街を旅人の目で見つめ直せる" },
  { a: "local", b: "life", why: "土地の食や暮らしから地域を知ることができる" },
  { a: "history", b: "peace", why: "過去を知ることが記憶を受け継ぐことにつながる" },
  { a: "society", b: "peace", why: "社会の仕組みから平和を考える視点が得られる" },
  { a: "art", b: "picturebook", why: "絵と言葉が響き合う表現として地続き" },
  { a: "art", b: "comics", why: "コマと線で語る表現の豊かさに触れられる" },
  { a: "poetry", b: "picturebook", why: "短い言葉に込められた余白を味わえる" },
  { a: "nature", b: "life", why: "身近な暮らしの中に自然の仕組みが見えてくる" },
  { a: "nature", b: "philosophy", why: "科学の知見が世界の見方そのものを揺さぶる" },
  { a: "travel", b: "language", why: "異なる文化に身を置く感覚を言葉から得られる" },
  { a: "language", b: "literature", why: "翻訳や異文化の視点で物語を読み直せる" },
  { a: "mystery", b: "comics", why: "展開を追う楽しさを別の表現で味わえる" },
];

const labelMaps = new Map<Option[], Map<string, string>>();
function labelOf(list: Option[], key: string) {
  let m = labelMaps.get(list);
  if (!m) {
    m = new Map(list.map((o) => [o.key, o.label]));
    labelMaps.set(list, m);
  }
  return m.get(key) ?? key;
}

export const genreLabel = (k: string) => labelOf(GENRES, k);
export const styleLabel = (k: string) => labelOf(STYLES, k);
export const atmosphereLabel = (k: string) => labelOf(ATMOSPHERES, k);
export const regionLabel = (k: string) => labelOf(REGIONS, k);

export function bridgeBetween(a: string, b: string) {
  return GENRE_BRIDGES.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
}

const keysOf = (list: Option[]) => new Set(list.map((o) => o.key));
const VALID = {
  genre: keysOf(GENRES),
  style: keysOf(STYLES),
  atmosphere: keysOf(ATMOSPHERES),
  region: keysOf(REGIONS),
};

/** フォーム入力から語彙に存在するキーだけを残す */
export function pickKeys(kind: keyof typeof VALID, values: string[]) {
  return [...new Set(values.filter((v) => VALID[kind].has(v)))];
}
export function isKey(kind: keyof typeof VALID, v: string | null | undefined) {
  return !!v && VALID[kind].has(v);
}
