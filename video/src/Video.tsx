import React from "react";
import type { ReactNode } from "react";
import { AbsoluteFill, Easing, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// MEET BOOK 紹介動画（約60秒・1920x1080・30fps）
// 画面はすべて実際のアプリ（ローカルの開発版）のスクリーンショット。

const INK = "#111111";
const PAPER = "#f4f3f0";
const ACCENT = "#ea5b25";
const JP = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';
const LATIN = '"Avenir Next", "Helvetica Neue", Arial, sans-serif';

const S = 30; // 1秒のフレーム数
type Scene = { from: number; dur: number; node: ReactNode };

const fadeInOut = (frame: number, dur: number) =>
  interpolate(frame, [0, 10, dur - 10, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

function useRise(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return { opacity: p, transform: `translateY(${(1 - p) * 40}px)` };
}

/** スマホの枠に入ったスクリーンショット。scroll を指定するとゆっくり縦にスクロールする */
function Phone({ src, delay = 0, scroll = 0, height = 860, tilt = 0 }: { src: string; delay?: number; scroll?: number; height?: number; tilt?: number }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 18, mass: 0.8 } });
  const width = height * (390 / 844);
  const y = interpolate(frame, [delay + 20, durationInFrames - 10], [0, scroll], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  return (
    <div
      style={{
        width: width + 24,
        height: height + 24,
        padding: 12,
        borderRadius: 56,
        background: "#0b0b0b",
        boxShadow: "0 40px 80px rgba(0,0,0,0.35), 0 0 0 2px #2a2a2a inset",
        opacity: p,
        transform: `translateY(${(1 - p) * 120}px) rotate(${tilt}deg)`,
        flexShrink: 0,
      }}
    >
      <div style={{ width, height, borderRadius: 44, overflow: "hidden", background: PAPER, position: "relative" }}>
        <Img src={staticFile(`shots/${src}.png`)} style={{ width, position: "absolute", top: -y }} />
      </div>
    </div>
  );
}

function Caption({ step, title, body, dark = false }: { step?: string; title: ReactNode; body?: ReactNode; dark?: boolean }) {
  const a = useRise(4);
  const b = useRise(12);
  const c = useRise(20);
  return (
    <div style={{ width: 700, flexShrink: 0, color: dark ? "#fff" : INK }}>
      {step && (
        <div style={{ ...a, fontFamily: LATIN, fontSize: 26, fontWeight: 700, letterSpacing: 6, color: ACCENT, marginBottom: 24 }}>{step}</div>
      )}
      <div style={{ ...b, fontFamily: JP, fontSize: 76, fontWeight: 800, lineHeight: 1.25, letterSpacing: -1 }}>{title}</div>
      {body && <div style={{ ...c, fontFamily: JP, fontSize: 32, lineHeight: 1.7, marginTop: 32, color: dark ? "rgba(255,255,255,0.72)" : "#3a3a3a" }}>{body}</div>}
    </div>
  );
}

function Stage({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: dark ? INK : PAPER, opacity: fadeInOut(frame, durationInFrames) }}>
      <AbsoluteFill style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: "0 140px" }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
}

function Logo({ size = 40, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.35, fontFamily: LATIN, fontWeight: 700, fontSize: size, color: dark ? "#fff" : INK }}>
      <div style={{ width: size * 1.2, height: size * 1.2, borderRadius: size * 0.25, background: dark ? "#fff" : INK, color: dark ? INK : "#fff", display: "grid", placeItems: "center", fontSize: size * 0.45 }}>MB</div>
      <span>
        MEET BOOK<span style={{ color: ACCENT }}>.</span>
      </span>
    </div>
  );
}

// ---------------- シーン ----------------

function Title() {
  const a = useRise(6);
  const b = useRise(18);
  const c = useRise(34);
  return (
    <Stage dark>
      <div>
        <div style={a}>
          <Logo size={44} dark />
        </div>
        <div style={{ ...b, fontFamily: JP, fontWeight: 800, fontSize: 104, lineHeight: 1.2, color: "#fff", marginTop: 56, letterSpacing: -2 }}>
          本を探すのではなく、
          <br />
          まだ知らない一冊と出会う<span style={{ color: ACCENT }}>。</span>
        </div>
        <div style={{ ...c, fontFamily: LATIN, fontSize: 28, letterSpacing: 8, color: "rgba(255,255,255,0.5)", marginTop: 48 }}>NAGASAKI BOOK MEETING</div>
      </div>
    </Stage>
  );
}

function Concept() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nodes = [
    { label: "読者", sub: "Readers" },
    { label: "本屋", sub: "Bookstores" },
    { label: "出版社", sub: "Publishers" },
  ];
  const stats = [
    { n: 10, label: "長崎の本屋" },
    { n: 13, label: "地域の出版社" },
    { n: 104, label: "実在する本" },
  ];
  return (
    <Stage>
      <Caption step="CONCEPT" title={<>長崎の読書文化を、<br />つなぎ直す。</>} body="読者・本屋・小さな出版社をひとつにつなぎ、本をきっかけに人や場所と出会えるプラットフォームです。" />
      <div style={{ display: "flex", flexDirection: "column", gap: 56, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {nodes.map((n, i) => {
            const p = spring({ frame: frame - 10 - i * 8, fps, config: { damping: 14 } });
            return (
              <div key={n.label} style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 190, height: 190, borderRadius: 999, background: i === 1 ? ACCENT : INK, color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `scale(${p})` }}>
                  <div style={{ fontFamily: JP, fontWeight: 800, fontSize: 48 }}>{n.label}</div>
                  <div style={{ fontFamily: LATIN, fontSize: 18, opacity: 0.7, letterSpacing: 2 }}>{n.sub}</div>
                </div>
                {i < 2 && <div style={{ fontFamily: LATIN, fontSize: 44, color: "#999", opacity: p }}>⇄</div>}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 64 }}>
          {stats.map((s, i) => {
            const v = Math.round(interpolate(frame, [30 + i * 6, 70 + i * 6], [0, s.n], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
            return (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: LATIN, fontWeight: 700, fontSize: 88, color: INK, lineHeight: 1 }}>{v}</div>
                <div style={{ fontFamily: JP, fontSize: 24, color: "#7a7a7a", marginTop: 10 }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Stage>
  );
}

function StepScene({ step, title, body, phones }: { step: string; title: ReactNode; body: ReactNode; phones: { src: string; scroll?: number; tilt?: number }[] }) {
  return (
    <Stage>
      <Caption step={step} title={title} body={body} />
      <div style={{ display: "flex", gap: phones.length > 2 ? 24 : 36, alignItems: "center" }}>
        {phones.map((p, i) => (
          <Phone key={p.src} src={p.src} delay={6 + i * 10} scroll={p.scroll} tilt={p.tilt} height={phones.length > 2 ? 640 : 860} />
        ))}
      </div>
    </Stage>
  );
}

function Closing() {
  const a = useRise(6);
  const b = useRise(20);
  const c = useRise(34);
  return (
    <Stage dark>
      <div style={{ width: "100%", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={a}>
          <Logo size={64} dark />
        </div>
        <div style={{ ...b, fontFamily: JP, fontWeight: 800, fontSize: 80, color: "#fff", marginTop: 56, lineHeight: 1.3 }}>
          長崎の本屋で、
          <br />
          まだ知らない一冊と<span style={{ color: ACCENT }}>。</span>
        </div>
        <div style={{ ...c, fontFamily: JP, fontSize: 28, color: "rgba(255,255,255,0.55)", marginTop: 48 }}>
          長崎の読者・本屋・出版社をつなぐ読書プラットフォーム
        </div>
      </div>
    </Stage>
  );
}

// ---------------- 構成 ----------------

const SCENES: Scene[] = (() => {
  const list: { dur: number; node: ReactNode }[] = [
    { dur: 5 * S, node: <Title /> },
    { dur: 6 * S, node: <Concept /> },
    {
      dur: 6 * S,
      node: <StepScene step="STEP 1" title={<>7つの質問で、<br />あなたを知る。</>} body="興味のあるテーマ、最近考えていること、好きな本屋の雰囲気。アカウント登録なしで、すぐに始められます。" phones={[{ src: "02-onboarding" }]} />,
    },
    {
      dur: 7 * S,
      node: <StepScene step="STEP 2" title={<>今日の一冊が、<br />理由と一緒に届く。</>} body="回答と、長崎の出版社・書店の実データを掛け合わせて推薦。「なぜこの本なのか」を必ず添えます。" phones={[{ src: "03-home" }, { src: "06-meet" }]} />,
    },
    {
      dur: 6 * S,
      node: <StepScene step="SERENDIPITY" title={<>普段は選ばない、<br />偶然の一冊。</>} body="好みのすぐ隣にある、まだ読んだことのないジャンルから。あなたの興味との接点を説明します。" phones={[{ src: "04-home-serendipity" }]} />,
    },
    {
      dur: 7 * S,
      node: <StepScene step="BOOKSTORES" title={<>相性のいい<br />本屋と出会う。</>} body="得意ジャンル・雰囲気・過ごし方から相性を計算。写真、店主のことば、アクセスまで、足を運びたくなる情報を。" phones={[{ src: "07-stores" }, { src: "08-store-detail" }]} />,
    },
    {
      dur: 6 * S,
      node: <StepScene step="BOOKS" title={<>一冊から、<br />世界が広がる。</>} body="本の詳細と関係性マップ。同じ著者・出版社・同じ棚の本へと、出会いがつながっていきます。" phones={[{ src: "10-book" }, { src: "11-book-map" }]} />,
    },
    {
      dur: 7 * S,
      node: <StepScene step="CONSULT" title={<>気になったら、<br />本屋に相談。</>} body="在庫の確認や似た本の相談を、アプリから直接。書店の受信箱に届き、会話を続けられます。" phones={[{ src: "12-consult" }, { src: "13-thread" }, { src: "14-store-inbox" }]} />,
    },
    {
      dur: 6 * S,
      node: <StepScene step="FOR STORES & PUBLISHERS" title={<>書店と出版社も、<br />自分で発信できる。</>} body="写真や店主のことば、今週の本、イベント、刊行本を登録。管理画面で情報を一元管理します。" phones={[{ src: "15-store-photos" }, { src: "16-publisher" }]} />,
    },
    { dur: 4 * S, node: <Closing /> },
  ];
  let t = 0;
  return list.map((s) => {
    const scene = { from: t, dur: s.dur, node: s.node };
    t += s.dur;
    return scene;
  });
})();

export const TOTAL_FRAMES = SCENES.reduce((n, s) => n + s.dur, 0);

export function MeetBookVideo() {
  const frame = useCurrentFrame();
  const progress = frame / TOTAL_FRAMES;
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      {SCENES.map((s, i) => (
        <Sequence key={i} from={s.from} durationInFrames={s.dur}>
          {s.node}
        </Sequence>
      ))}
      {/* 進行バーと注記 */}
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 6, width: `${progress * 100}%`, background: ACCENT }} />
      <div style={{ position: "absolute", right: 48, bottom: 28, fontFamily: JP, fontSize: 18, color: "#9a9a9a" }}>※ 画面は開発中のものです</div>
    </AbsoluteFill>
  );
}
