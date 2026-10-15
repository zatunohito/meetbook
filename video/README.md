# MEET BOOK 紹介動画

第三者向けの約60秒の説明動画（1920x1080 / 30fps / MP4）。Remotion で作成。

```bash
cd video
npm install
npm run capture   # アプリ（http://localhost:3000）を自動操作してスクリーンショットを撮る。デモ用の読者・相談は撮影後に削除する
npm run studio    # ブラウザでプレビュー・調整
npm run render    # out/meetbook.mp4 を書き出す
```

- 画面はすべて開発中アプリの実際のスクリーンショット（`public/shots/`）。
- 構成は `src/Video.tsx` の `SCENES`。文言・尺はここで変更する。
- フォントは macOS のヒラギノを使用（他の環境では Noto Sans JP 等に置き換わる）。
