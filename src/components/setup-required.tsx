import { Logo } from "./logo";

export function SetupRequired() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 md:px-6">
      <Logo />
      <h1 className="mt-10 font-display font-bold text-2xl">セットアップが必要です</h1>
      <p className="mt-4 text-sm text-ink-soft">
        Supabase の接続情報が見つかりません。プロジェクト直下の <code>.env.local</code> に
        <code> SUPABASE_URL</code>・<code>SUPABASE_SERVICE_ROLE_KEY</code> を設定し（<code>SESSION_SECRET</code> は任意）、
        <code> supabase/migrations</code> と <code>supabase/seed.sql</code> を実行してから再起動してください。手順は README にあります。
      </p>
    </main>
  );
}
