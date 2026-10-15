-- 初期データ：書店10店・出版社13社
-- 出典：開発指示書の対象リスト、および MEET BOOK 試作版（muscular-meet-book-flow.base44.app）に登録されていた店舗・出版社情報。
--
-- 方針
--  * 試作版の文面のうち、調査メモ（「※要確認」「〜の候補」など）は読者向けの紹介文に載せず admin_note に残す。
--  * 店員メッセージは、話し手の名前がある取材済みの2店（BOOKSライデン・ひとやすみ書店）のみ掲載。
--  * 試作版にあった書籍4冊は ISBN がなく実在を確認できないため登録しない。
--  * 得意ジャンル・雰囲気・過ごし方・地域（マッチング用キー）は、試作版の特徴・タグの記述から対応づけたもの。
--  * 何度流しても安全。既存の行は「空の項目だけ」補完し、管理画面で入力済みの値は上書きしない。

-- ---------------------------------------------------------------
-- 書店
-- 住所・営業時間・電話・公式URLは Web 調査（docs/research/stores-2026-10.md）で出典を確認したもの。出典は sources に保存。
-- ---------------------------------------------------------------
insert into public.stores
  (slug, name, area, region, address, phone, description, features, tags,
   specialty_genres, atmosphere_tags, style_tags,
   staff_name, staff_message, access, opening_hours, website_url, photo_urls, sources, admin_note, is_published)
values
  ('kobundo', '好文堂書店', '長崎・中心商店街', 'nagasaki_center', '長崎県長崎市浜町8-29（書店は地下1階）', '095-823-7171',
   '浜町アーケードにある創業100年以上の老舗書店。約3万冊の書籍・雑誌・コミックを扱い、長崎の郷土書や自費出版の本も充実。ジャンルごとの担当者が仕入れる、個性のある棚が並ぶ。3階には犬と猫の本やペット用品の「dogcatista」がある。',
   '{浜町アーケードの老舗,長崎の郷土書が充実,自費出版の本も扱う,担当者ごとに個性のある棚,3階に犬猫の本とペット用品の店}', '{一般書,郷土書,幅広いジャンル}',
   '{local,history}', '{spacious,local_focus}', '{browse,talk_staff}',
   '山下店長（「浜んまち」2022年の取材より）',
   'お互い本で盛り上がっていけたら', '長崎電気軌道「思案橋」電停から徒歩約2分', E'月〜土 10:30〜19:00\n日 10:30〜18:00', 'http://www.koubundo.net/', '{}',
   '{http://www.koubundo.net/,https://www.hamanmachi.com/merchant/280/,https://www.hamanmachi.com/1297/,https://www.ekiten.jp/shop_2025839/}', null, true),

  ('metro-honten', 'メトロ書店 本店', '長崎駅・アミュプラザ', 'nagasaki_station', '長崎県長崎市 アミュプラザ長崎 本館3階（JR長崎駅ビル）', '095-821-5400',
   '長崎駅ビルの商業施設にある書店。駅を利用する人や買い物客が立ち寄りやすい。',
   '{JR長崎駅ビル内,商業施設内}', '{一般書,駅周辺}',
   '{}', '{spacious}', '{quick,browse}',
   null, null, 'JR長崎駅ビル内', '10:00〜20:00', 'https://metrobooks.co.jp/mbs/', '{}',
   '{https://metrobooks.co.jp/mbs/pages/store/,https://www.amu-n.co.jp/floor/detail/?cd=000142}', null, true),

  ('maiguma', '毎熊書店', '長崎・浜口町', 'nagasaki_station', '長崎県長崎市浜口町7-8', '095-844-0809',
   '浜口町にある地域の書店。地域の人と本との接点を大切にしている。',
   '{地域密着,リピーターとのつながり}', '{地域の読者,暮らし}',
   '{life}', '{}', '{}',
   null, null, '長崎電気軌道「大学病院」電停から徒歩約2分', null, null, '{}',
   '{http://www.tokyo-shoten.or.jp/seinenbu/shop/nagasaki/85843}', '営業時間は媒体により10〜20時／10〜21時と食い違うため未登録。店舗に確認すること。', true),

  ('tsutaya-cocowalk', 'TSUTAYA BOOKSTORE MIRAI NAGASAKI COCOWALK', '長崎・ココウォーク', 'nagasaki_station', '長崎県長崎市茂里町1-55 みらい長崎ココウォーク 5階', '095-842-5509',
   '2018年に開業した BOOK&CAFE。約200席のカフェでは、売場の本を持ち込んで読むことができる。暮らし・食・旅・学びの本に力を入れている。',
   '{約200席のカフェ,売場の本をカフェで読める,本・雑貨・音楽,商業施設内}', '{カフェ,暮らし,旅}',
   '{life,travel}', '{cafe,lively,modern,spacious}', '{cafe,browse}',
   null, null, 'みらい長崎ココウォーク 5階', '10:00〜21:00', 'https://cocowalk.jp/shop/tsutaya-bookstore', '{}',
   '{https://cocowalk.jp/shop/tsutaya-bookstore,https://store-tsutaya.tsite.jp/store/detail?storeId=7812,https://prtimes.jp/main/html/rd/p/000000574.000018760.html}', null, true),

  ('shirokiji', 'Shirokiji Books 本とちいさな喫茶', '長崎・御船蔵町', 'nagasaki_station', '長崎県長崎市御船蔵町3-1 太田ビル202（Nail&Beauty ウィズ内）', null,
   '2026年5月にオープンした喫茶併設の書店。長年本に携わる仕事をしてきた店主が、木のぬくもりを感じる本棚に選りすぐりの本を並べる。7席の喫茶では手作りのスイーツとコーヒーを楽しめる。',
   '{2026年5月オープン,喫茶7席,店主手作りのスイーツ,選りすぐりの本}', '{カフェ,読書スペース,暮らし}',
   '{life}', '{cafe,quiet,cozy}', '{cafe,quiet_read}',
   '渡邉美穂さん・店主（ながさきプレスの取材より）',
   '本っていいなと思ってもらえたら', '駐車場なし', E'11:00〜17:00\n定休日：水・木', 'https://www.instagram.com/shirokiji_books/', '{}',
   '{https://www.nagasaki-press.com/gourmet/gourmet-kihon/cafe-gourmet/cafe-gourmet-area1/post-195331/}', '営業時間は ながさきプレス 2026年8月号時点の情報。最新は Instagram で確認。', true),

  ('kinokuniya', '紀伊國屋書店 長崎店', '長崎・ゆめタウン夢彩都', 'nagasaki_center', '長崎県長崎市元船町10-1 ゆめタウン夢彩都 4階', '095-811-4919',
   '大手書店ならではの幅広い品ぞろえと、さまざまなジャンルの本を探せる環境。',
   '{大手書店,幅広い品ぞろえ,さまざまなジャンル}', '{一般書,幅広い品ぞろえ}',
   '{}', '{spacious}', '{browse}',
   null, null, 'ゆめタウン夢彩都 4階', '9:30〜20:00', 'https://store.kinokuniya.co.jp/store/nagasaki-store/', '{}',
   '{https://store.kinokuniya.co.jp/store/nagasaki-store/}', null, true),

  ('kusano-sumiyoshi', 'くさの書店 住吉店', '長崎・住吉', 'nagasaki_north', '長崎県長崎市中園町6-19', '095-847-5782',
   '住吉エリアの地域住民が本を購入する場所。地域に密着した書店。',
   '{住吉エリアの地域書店,地域住民の本屋}', '{地域,暮らし}',
   '{life}', '{}', '{}',
   null, null, null, null, null, '{}',
   '{http://seinenbu.tokyo-shoten.or.jp/shop/nagasaki/85837,https://www.mapion.co.jp/phonebook/M02006/42201/24230292581/}', '営業時間は媒体により10:00〜20:50／10〜19時と食い違うため未登録。店舗に確認すること。', true),

  ('leiden', 'BOOKSライデン', '長崎・出島', 'nagasaki_center', '長崎県長崎市出島町2-18-201', null,
   '2021年11月、出島の近くに開いた小さな書店。約40㎡の店内の半分に新刊と古本あわせて約3000冊、もう半分がカフェ。哲学書を中心とした大人向けの本を揃え、読書会や哲学カフェも開く。午前は「読書喫茶ネーデル」として、お喋りをせずに本を読む時間を提供している。店名はシーボルトゆかりのオランダの街から。',
   '{カフェ併設,読書喫茶ネーデル（9:00-12:00）,哲学書の品揃え,新刊と古本,読書会・哲学カフェ,オンラインショップあり}', '{心と体,暮らし,地域の未来,歴史}',
   '{philosophy,history,life}', '{cafe,cozy,quiet}', '{cafe,quiet_read,events}',
   '前田さん（店主）',
   '「読む時間」は自分の時間を取り戻す時間です。本当に自分にとっての主体的な時間をもう一度獲得する、そんなきっかけとなる時間。だからどんどんやろう！どんどん！大丈夫、僕が旗振るので！僕たちの長崎にはそれをするに相応しい美しい場所もたくさんあります。他県の人たちが羨むような場所でどんどんやってやりましょう！',
   '長崎電気軌道「出島」「メディカルセンター」電停から徒歩2分／新地中華街・出島から徒歩10分',
   E'13:00〜20:00（読書喫茶ネーデル 9:00〜12:00）\n定休日：火・水＋α', 'https://books-leiden.com',
   '{}',
   '{https://books-leiden.com,https://books-leiden.tumblr.com/,https://www.mishimaga.com/books/hajimemashita/004835.html,https://stlocal.net/nagasaki/article/2220}',
   '試作版にあった写真URLは参照できなくなっていたため未登録。店舗から写真を提供してもらうこと。', true),

  ('hitoyasumi', 'ひとやすみ書店', '長崎・眼鏡橋', 'nagasaki_center', '長崎県長崎市諏訪町5-3-301', null,
   E'眼鏡橋のすぐそば、川沿いのレトロな道に建つ書店。「BOOK」と書かれた黒板の看板が目印で、黒板には毎日、心に留まった本の一節が書かれている。細い階段を登った建物3階にあり、木の温もりを感じる空間に様々な本が並ぶ。カフェを併設し、店主の城下さんが幼い頃に遊んだ諏訪町で7年、あたたかみがあって居心地の良い本屋さん。',
   '{眼鏡橋のすぐそば,建物3階の隠れ家書店,黒板に毎日本の一節,カフェ併設,木の温もりある空間,自由に楽しめる居心地}', '{レトロな街,地域の歴史,暮らし,居心地,本との出会い}',
   '{local,history,life}', '{cafe,cozy,retro,hideaway}', '{cafe,browse}',
   '城下さん（店主）',
   '喫茶スペースはご利用頂かなくても、もちろん本とともにコーヒーを楽しんでいただいても、コーヒーのみを楽しんでいただいても構いません。自由に楽しんでください。',
   '眼鏡橋のすぐそば、川沿いの道。建物の3階（細い階段を上がります）／長崎電気軌道「市役所」電停から約180m',
   E'13:00〜18:00（土曜は16:00まで）\n定休日は Instagram でお知らせ', 'https://www.instagram.com/hitoyasumi_bookstore/',
   '{https://media.base44.com/images/public/6ac39c7c99bc60319dd416e9/0bfba3729_IMG_7206.jpeg,https://media.base44.com/images/public/6ac39c7c99bc60319dd416e9/bc2f6a5ec_IMG_7207.jpeg,https://media.base44.com/images/public/6ac39c7c99bc60319dd416e9/bcea8b7a4_IMG_7199.jpeg,https://media.base44.com/images/public/6ac39c7c99bc60319dd416e9/36b6a9e2a_IMG_7210.jpeg,https://media.base44.com/images/public/6ac39c7c99bc60319dd416e9/794376f20_IMG_7214.jpeg,https://media.base44.com/images/public/6ac39c7c99bc60319dd416e9/5743c03df_IMG_1069.jpeg,https://media.base44.com/images/public/6ac39c7c99bc60319dd416e9/bafb4c414_IMG_7213.jpeg}',
   '{https://andpremium.jp/selector/hitoyasumi-bookstore/,https://tabelog.com/nagasaki/A4201/A420101/42008568/}',
   '営業時間は &Premium 掲載の情報（媒体により11〜20時などの記載もあり）。最新は Instagram で確認。写真は試作版（base44）のストレージを参照中。', true)
on conflict (slug) do update set
  area             = coalesce(stores.area, excluded.area),
  region           = coalesce(stores.region, excluded.region),
  address          = coalesce(stores.address, excluded.address),
  phone            = coalesce(stores.phone, excluded.phone),
  description      = coalesce(stores.description, excluded.description),
  features         = case when cardinality(stores.features) = 0 then excluded.features else stores.features end,
  tags             = case when cardinality(stores.tags) = 0 then excluded.tags else stores.tags end,
  specialty_genres = case when cardinality(stores.specialty_genres) = 0 then excluded.specialty_genres else stores.specialty_genres end,
  atmosphere_tags  = case when cardinality(stores.atmosphere_tags) = 0 then excluded.atmosphere_tags else stores.atmosphere_tags end,
  style_tags       = case when cardinality(stores.style_tags) = 0 then excluded.style_tags else stores.style_tags end,
  staff_name       = coalesce(stores.staff_name, excluded.staff_name),
  staff_message    = coalesce(stores.staff_message, excluded.staff_message),
  access           = coalesce(stores.access, excluded.access),
  opening_hours    = coalesce(stores.opening_hours, excluded.opening_hours),
  website_url      = coalesce(stores.website_url, excluded.website_url),
  photo_urls       = case when cardinality(stores.photo_urls) = 0 then excluded.photo_urls else stores.photo_urls end,
  sources          = case when cardinality(stores.sources) = 0 then excluded.sources else stores.sources end,
  admin_note       = coalesce(stores.admin_note, excluded.admin_note);

-- ---------------------------------------------------------------
-- 出版社
-- ---------------------------------------------------------------
insert into public.publishers (slug, name, location, description, genres, tags, mission, seeking, admin_note) values
  ('ace-nagasaki', 'エース出版長崎', '長崎県', null,
   '{}', '{地域出版}', '地域に向けた情報発信', '地域の読者に届く書店',
   '試作版メモ：長崎県内に拠点を持つ出版関連事業者。出版物の販売先や読者への届け方について調査候補。刊行物は要確認。'),
  ('n-henshushitsu', '株式会社えぬ編集室', null, null,
   '{}', '{編集,企画}', '企画から読者までを考える', '企画段階から関われる書店',
   '試作版メモ：編集に関する事業者。本の企画段階から読者に届けるまでの流れを考える参考。事業内容は要確認。'),
  ('eibunken', '英文研出版', null, null,
   '{}', '{専門テーマ,小規模出版}', '専門テーマを本で届ける', '専門書を扱う書店',
   '試作版メモ：専門的なテーマを扱う出版活動の候補。小規模出版事業者の販路や読者開拓の課題を聞く候補。現状は要確認。'),
  ('dowakan', '童話館出版', null, '児童書・絵本に強みをもつ出版社。子どもと本との出会いを支えている。',
   '{picturebook}', '{子どもと本,年齢別}', '子どもと本の出会いを支える', '親子で楽しめる本を扱う書店',
   null),
  ('nagasaki-bunken', '長崎文献社', '長崎', '長崎の歴史・文化を中心に出版点数400点近く。個人読者との交流を目的とした友の会も設けている。',
   '{local,history}', '{地域の歴史,長崎文化}', '地域の歴史・文化を本で残す', '地域の歴史に関心のある書店',
   null),
  ('nagasaki-press', 'ながさきプレス', '長崎', '月刊誌や地域ガイドで長崎の店舗や文化、地域の魅力を発信。ウェブ制作も手がける。',
   '{local,travel}', '{地域情報,ウェブ制作}', '地域の魅力を発信する', '地域情報と書店を結ぶ場所',
   null),
  ('seibo-no-kishi', '聖母の騎士社', null, '宗教や精神文化など、テーマ性のある書籍を手がける。',
   '{religion}', '{テーマ性,価値観}', '精神文化を本で伝える', 'テーマ性の強い本を置く書店',
   '試作版メモ：刊行状況は要確認。'),
  ('eesworks', 'イーズワークス', '長崎市', '長崎市内で出版・情報発信を行う企業（長崎バスグループ）。',
   '{}', '{情報発信,出版}', '新たな文化の発信', '地域文化を発信できる書店',
   '試作版メモ：出版物は事前確認が必要。'),
  ('shippo-bunko', 'しっぽ文庫', null, '一人出版社。出版に加え、移動書店などの活動も行う。',
   '{}', '{一人出版社,移動書店,小規模出版}', '少人数で本を作り届ける', '新しい読者と出会える場所',
   null),
  ('showado', '昭和堂', null, null,
   '{}', '{印刷,制作}', '本を形にする工程を支える', '制作側と連携できる書店',
   '試作版メモ：印刷・制作の観点から書籍や冊子が形になるまでの工程を考える参考。出版社そのものとは限らないため事業範囲の確認が必要。'),
  ('suzuki-nagasaki', 'すずき出版長崎販売', null, null,
   '{}', '{販売,流通}', '本を書店に届ける', '流通先としての書店',
   '試作版メモ：書籍の販売・流通に関わる候補。独立した出版社ではなく販売関連事業者として分類するのが適切か確認が必要。'),
  ('todai-books', '灯台ブックス', null, 'ひとりの書き手から、本を灯す。一人出版社。',
   '{poetry,philosophy}', '{心と体,暮らし,歴史}', '暮らしと思考に寄り添う本をつくる。', 'ゆっくり話せる本屋さん。',
   '試作版に登録されていた刊行物（『路地裏の哲学』『珈琲と本のあいだ』）は ISBN がなく実在未確認のため未登録。'),
  ('nagasaki-hondana', '長崎の本棚', '長崎', '長崎の街と人を本にする、小さな出版社。',
   '{literature,poetry,society,local}', '{地域の歴史,暮らし,地域の未来}', '地域に根ざした物語を残すこと。', '街に本を置ける本屋さん。',
   '試作版に登録されていた刊行物（『眼鏡橋の灯』『長崎、本と暮らす』）は ISBN がなく実在未確認のため未登録。')
on conflict (slug) do update set
  location    = coalesce(publishers.location, excluded.location),
  description = coalesce(publishers.description, excluded.description),
  genres      = case when cardinality(publishers.genres) = 0 then excluded.genres else publishers.genres end,
  tags        = case when cardinality(publishers.tags) = 0 then excluded.tags else publishers.tags end,
  mission     = coalesce(publishers.mission, excluded.mission),
  seeking     = coalesce(publishers.seeking, excluded.seeking),
  admin_note  = coalesce(publishers.admin_note, excluded.admin_note);

-- ---------------------------------------------------------------
-- 追加の書店（Web 調査で紹介文まで確認できた店舗）
-- 出典：全国書店案内（東京都書店商業組合青年部）ほか。掲載情報が古い可能性があるため、営業時間は要確認。
-- 紹介文・得意ジャンルは出典に書かれていることだけを登録し、雰囲気などは空のまま（相性スコアは地域とジャンルのみで算出）。
-- ---------------------------------------------------------------
insert into public.stores
  (slug, name, area, region, address, phone, description, features, specialty_genres, atmosphere_tags, style_tags, opening_hours, website_url, sources, admin_note)
values
  ('inori-no-oka', '祈りの丘絵本美術館（こどもの本の店 童話館）', '長崎・南山手', 'nagasaki_center', '長崎県長崎市南山手町2-10', '095-828-0716',
   '1階は絵本・児童書の専門書店とミュージアムショップ（入場無料）、2〜3階は絵本の原画や長崎ゆかりの画家の作品を展示する美術館（有料）。',
   '{絵本・児童書の専門書店,美術館併設,ショップは入場無料}', '{picturebook,art}', '{}', '{browse}',
   E'10:00〜17:30（最終入館 17:00）\n定休日：月曜（祝日の場合は翌日）・展示替え日', null,
   '{https://www.walkerplus.com/spot/ar1042s62558/data.html,https://www.tokyo-shoten.or.jp/seinenbu/shop/nagasaki/85841}',
   '営業時間は2025年11月時点の掲載情報。')
on conflict (slug) do nothing;
