import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { fetchTapeBySlug, fmtTime, type Tape } from "@/components/tape/tapeStore";
import cameraShutterSound from "@/assets/camera shutter sound.mp3";

export const Route = createFileRoute("/play/$slug")({
  component: PlayPage,
});

function PlayPage() {
  const { slug } = Route.useParams();
  const [tape, setTape] = useState<Tape | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    if (printed && tape?.photoUrl) {
      const a = new Audio(cameraShutterSound);
      a.preload = "auto";
      a.volume = 0.35;
      void a.play().catch(() => {});
    }
  }, [printed, tape?.photoUrl]);

  useEffect(() => {
    let alive = true;
    fetchTapeBySlug(slug)
      .then((t) => { if (alive) setTape(t); })
      .catch(() => { if (alive) setTape(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => {
    if (!tape) return;
    const a = new Audio(tape.audioUrl);
    a.preload = "metadata";
    audioRef.current = a;
    const onTime = () => setNow(a.currentTime);
    const onLoaded = () => setDuration(isFinite(a.duration) ? a.duration : tape.duration);
    const onEnd = () => { setPlaying(false); setPrinted(true); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("ended", onEnd);
    return () => {
      a.pause();
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("ended", onEnd);
    };
  }, [tape]);

  const toggle = () => {
    const a = audioRef.current; if (!a) return;
    if (a.paused) { a.play(); setPlaying(true); }
    else { a.pause(); setPlaying(false); }
  };
  const stop = () => {
    const a = audioRef.current; if (!a) return;
    a.pause(); a.currentTime = 0; setPlaying(false);
  };
  const skip = (delta: number) => {
    const a = audioRef.current; if (!a) return;
    a.currentTime = Math.max(0, Math.min(duration || tape?.duration || 0, a.currentTime + delta));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const k = e.key.toLowerCase();
      if (k === "p" || k === " ") { e.preventDefault(); toggle(); }
      else if (k === "s") stop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tape]);

  const dur = duration || tape?.duration || 0;
  const pct = dur > 0 ? Math.min(100, (now / dur) * 100) : 0;
  const statusLabel = playing ? "PLAYING" : now > 0 ? "PAUSED" : "READY";

  if (loading || !tape) {
    return (
      <main className="bliss-bg relative min-h-screen w-full font-tahoma">
        <div className="relative mx-auto flex min-h-screen max-w-[340px] items-center justify-center px-3 py-6">
          <div className="xp-window w-full p-3 text-[10px]">
            {loading ? (
              <div className="font-mono text-[11px] text-[#1b1b1b]">&gt; loading tape…</div>
            ) : (
              <>
                <div className="font-bold">Tape not found</div>
                <div className="mt-1 text-[10px]">This cassette may have been eaten.</div>
                <div className="mt-2 flex gap-1">
                  <Link to="/" className="xp-btn" style={{ padding: "2px 6px", fontSize: 10 }}>Home</Link>
                  <Link to="/record" className="xp-btn" style={{ padding: "2px 6px", fontSize: 10 }}>Record</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bliss-bg relative min-h-screen w-full font-tahoma">
      <div className="relative mx-auto flex min-h-screen max-w-[340px] flex-col items-center justify-center px-3 py-6">
        <div className="xp-window w-full text-[10px]">
          {/* Titlebar */}
          <div className="xp-titlebar text-[11px]">
            <span className="xp-title-icon">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gradient-to-br from-blue-300 to-blue-600 ring-1 ring-white/60" />
            </span>
            <span className="truncate">Tape Player — {tape.title}</span>
            <span className="xp-title-buttons">
              <button type="button" className="xp-title-btn" aria-label="Minimize">_</button>
              <button type="button" className="xp-title-btn" aria-label="Maximize">▢</button>
              <Link to="/" className="xp-title-btn close" aria-label="Close">✕</Link>
            </span>
          </div>

          {/* Menu bar */}
          <div className="flex items-center gap-3 border-b border-[#aca899] bg-[#ece9d8] px-2 py-0.5 text-[10px] text-[#1b1b1b]">
            <span><u>F</u>ile</span>
            <span><u>P</u>lay</span>
            <span>E<u>f</u>fects</span>
            <span><u>H</u>elp</span>
          </div>

          {/* CRT console */}
          <div
            className="relative m-2 overflow-hidden border-2 border-[#1b1b1b] bg-black p-2 font-mono text-[9px] leading-[1.3] text-[#6cff6a]"
            style={{ textShadow: "0 0 6px rgba(108,255,106,0.55)" }}
          >
            <div className="scanlines pointer-events-none absolute inset-0" />

            <pre className="whitespace-pre-wrap">{`TAPE_OS [Version 5.1.2600]
> mounting cassette ${slug}... OK
> side A · ${fmtTime(dur)} runtime`}</pre>

            {/* ASCII reels + LCD */}
            <div className="mt-2 rounded-sm border border-[#6cff6a]/60 p-1.5">
              <div className="flex items-center justify-around">
                <Reel spinning={playing} />
                <Reel spinning={playing} />
              </div>
              <div className="mt-1.5 flex items-center justify-center gap-2">
                <span className="opacity-80">{"<+>"}</span>
                <span className="rounded-sm border border-[#6cff6a]/60 px-2 py-0.5 text-[11px] tracking-[2px]">
                  {fmtTime(now)} / {fmtTime(dur)}
                </span>
                <span className="opacity-80">{"<+>"}</span>
              </div>
              {/* Progress bar in CRT */}
              <div className="mt-1.5 h-1.5 border border-[#6cff6a]/60 bg-black">
                <div className="h-full bg-[#6cff6a]" style={{ width: `${pct}%`, boxShadow: "0 0 6px rgba(108,255,106,0.8)" }} />
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span>&gt; STATUS: {statusLabel}</span>
              <span>{playing ? "-6 dB" : "-INF"}</span>
            </div>

            <div className="mt-1">
              <span className="inline-block h-2.5 w-1.5 animate-pulse bg-[#6cff6a]" />
            </div>
          </div>

          {/* Transport row */}
          <div className="flex flex-wrap items-center gap-1 border-t border-[#aca899] bg-[#ece9d8] px-2 py-1.5 text-[10px] text-[#1b1b1b]">
            <span className="font-bold text-[9px]">XPORT:</span>
            <TButton onClick={() => skip(-10)} color="#0a47c2">[«] -10s</TButton>
            <TButton onClick={toggle} color="#0a47c2">{playing ? "[P] Pause" : "[P] Play"}</TButton>
            <TButton onClick={stop} color="#c00">[S] Stop</TButton>
            <TButton onClick={() => skip(10)} color="#0a47c2">[»] +10s</TButton>
          </div>

          {/* Tape card */}
          <div className="space-y-2 border-t border-[#aca899] bg-[#ece9d8] px-2 py-2 text-[10px] text-[#1b1b1b]">
            <div className="flex items-stretch gap-2 border border-[#aca899] bg-white p-1.5 shadow-[inset_1px_1px_0_#fff]">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="truncate font-bold text-[11px]">{tape.title}</div>
                <div className="text-[9px] text-[#555]">Side A · analog warmth</div>
                <div className="flex items-center justify-between text-[9px] text-[#555]">
                  <span>⏱ {fmtTime(dur)}</span>
                  <span>tape #{slug.slice(0, 6)}</span>
                </div>
              </div>
            </div>

            <Link
              to="/record"
              className="xp-btn block w-full text-center font-bold"
              style={{ padding: "5px 10px", fontSize: 11 }}
            >
              ✚  Record your own tape
            </Link>
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between border-t border-[#aca899] bg-[#ece9d8] px-2 py-0.5 text-[9px] text-[#1b1b1b]">
            <span>TC-87 PRO</span>
            <span>Ch 01</span>
            <span>{fmtTime(now)}</span>
          </div>
        </div>

        {/* Receipt slot — prints a polaroid out after the tape ends */}
        <div className="relative w-[220px]">
          {/* Printer slot lip */}
          <div
            className="relative z-20 mx-auto h-3 w-full rounded-b-[3px] border border-[#1b1b1b]/70"
            style={{
              background:
                "linear-gradient(180deg,#2a2a2a 0%,#0c0c0c 45%,#1a1a1a 100%)",
              boxShadow:
                "inset 0 -2px 0 rgba(255,255,255,0.08), inset 0 6px 8px rgba(0,0,0,0.7), 0 2px 0 rgba(0,0,0,0.4)",
            }}
          >
            <div className="absolute inset-x-2 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-black shadow-[inset_0_1px_2px_rgba(0,0,0,0.9)]" />
          </div>

          {/* Photo container — clipped, prints downward when `printed` */}
          <div className="relative mx-auto overflow-hidden" style={{ width: 180 }}>
            <div
              className="mx-auto origin-top bg-[#f6f1e6] p-2 pb-6 shadow-[0_18px_30px_-12px_rgba(0,0,0,0.55)] transition-transform duration-[1600ms] ease-[cubic-bezier(.22,.61,.36,1)]"
              style={{
                transform: printed ? "translateY(0)" : "translateY(-100%)",
                borderLeft: "1px solid rgba(0,0,0,0.08)",
                borderRight: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              {tape.photoUrl ? (
                <img
                  src={tape.photoUrl}
                  alt="Polaroid memory"
                  className="block aspect-square w-full object-cover grayscale-[15%] sepia-[10%]"
                />
              ) : (
                <div className="grid aspect-square w-full place-items-center bg-[#ece5d4] text-[36px]">
                  📼
                </div>
              )}
              <div className="mt-2 text-center font-tahoma text-[10px] tracking-wide text-[#5a4a2c]">
                — HAVE A NICE DAY! —
              </div>
              {/* zig-zag tear edge */}
              <div
                className="absolute inset-x-0 -bottom-[6px] h-[7px]"
                style={{
                  background:
                    "linear-gradient(135deg,#f6f1e6 25%,transparent 25%) -4px 0/8px 8px, linear-gradient(225deg,#f6f1e6 25%,transparent 25%) -4px 0/8px 8px",
                }}
              />
            </div>
          </div>

          {/* Soft glow under the slot */}
          <div
            className="pointer-events-none absolute left-1/2 top-2 -z-10 h-40 w-[260px] -translate-x-1/2 rounded-full opacity-70 blur-2xl transition-opacity duration-700"
            style={{
              background:
                "radial-gradient(closest-side, rgba(255,210,140,0.55), transparent 70%)",
              opacity: printed ? 0.8 : 0,
            }}
          />
        </div>
      </div>
    </main>
  );
}

function TButton({
  onClick, color, children,
}: { onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="border border-[#aca899] bg-white px-1.5 py-0.5 font-mono text-[10px] shadow-[inset_1px_1px_0_#fff]"
      style={{ color }}
    >
      {children}
    </button>
  );
}

function Reel({ spinning }: { spinning: boolean }) {
  return (
    <pre
      className={`text-[11px] leading-[1] ${spinning ? "animate-reel" : ""}`}
      style={{ textShadow: "0 0 6px rgba(108,255,106,0.7)" }}
    >{` _,-,_
(  o  )
 '-'-'`}</pre>
  );
}
