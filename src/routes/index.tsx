import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import xpBliss from "@/assets/xp-bliss.jpg";
import bootSound from "@/assets/Boot sound2.mp3";
import xpAlertSound from "@/assets/XP alert popup sound.mp3";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [phase, setPhase] = useState<"boot" | "popups">("boot");
  const [typed, setTyped] = useState("");
  const [visibleErrors, setVisibleErrors] = useState(0);
  const [dismissed, setDismissed] = useState<Record<number, boolean>>({});
  const bootPlayed = useRef(false);

  const playBootSound = () => {
    if (bootPlayed.current) return;
    bootPlayed.current = true;
    const a = new Audio(bootSound);
    a.preload = "auto";
    a.volume = 0.35;
    void a.play().catch(() => {});
  };

  const playXpPopupSound = (index: number) => {
    const a = new Audio(xpAlertSound);
    a.preload = "auto";
    a.volume = 0.32;
    a.playbackRate = 1 + ((index % 4) * 0.08);
    void a.play().catch(() => {});
  };

  const bootLog = [
    "TAPE_OS [Version 5.1.2600]",
    "(C) Copyright 1985-2026 Lo-Fi Systems.",
    "",
    "> POST ........................ OK",
    "> mounting /dev/cassette ...... OK",
    "> calibrating reels ........... OK",
    "> loading memories ............ FAIL",
    "> retrying ..... FAIL",
    "> retrying ..... FAIL",
    "",
    "press any key to continue_",
  ].join("\n");

  // Typewriter
  useEffect(() => {
    if (phase !== "boot") return;
    let i = 0;
    const id = setInterval(() => {
      if (i === 0) playBootSound();
      i += 2;
      setTyped(bootLog.slice(0, i));
      if (i >= bootLog.length) {
        clearInterval(id);
        setTimeout(() => setPhase("popups"), 700);
      }
    }, 18);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Cascade errors in
  useEffect(() => {
    if (phase !== "popups") return;
    let n = 0;
    const id = setInterval(() => {
      if (n < ERRORS.length) {
        playXpPopupSound(n);
        n += 1;
        setVisibleErrors(n);
      }
      if (n >= ERRORS.length) clearInterval(id);
    }, 220);
    return () => clearInterval(id);
  }, [phase]);

  const skip = () => {
    playBootSound();
    setPhase("popups");
    setVisibleErrors(ERRORS.length);
  };

  return (
    <main
      onClick={phase === "boot" ? skip : undefined}
      className="relative min-h-screen w-full overflow-hidden font-tahoma select-none"
      style={{
        backgroundImage: phase === "popups" ? `url(${xpBliss})` : undefined,
        backgroundColor: "#000",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Phase 1: CRT boot log */}
      {phase === "boot" && (
        <div className="absolute inset-0 bg-black">
          <div className="crt-lines pointer-events-none absolute inset-0 z-10" />
          {/* scanline flicker */}
          <div className="pointer-events-none absolute inset-0 z-20 animate-pulse opacity-30 mix-blend-overlay"
            style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)" }} />
          <pre
            className="relative z-0 m-0 whitespace-pre-wrap p-6 font-mono text-[13px] leading-[1.5] text-[#6cff6a] sm:p-10 sm:text-[15px]"
            style={{ textShadow: "0 0 6px rgba(108,255,106,0.7)" }}
          >
            {typed}
            <span className="inline-block h-[1em] w-[0.55em] translate-y-[2px] animate-pulse bg-[#6cff6a] align-middle" />
          </pre>
          <div className="absolute bottom-3 right-4 z-20 font-mono text-[10px] text-[#6cff6a]/60">
            click anywhere to skip ▸
          </div>
        </div>
      )}

      {/* Phase 2: chaotic overlapping XP error popups */}
      {phase === "popups" && (
        <div className="relative min-h-screen w-full">
          {ERRORS.slice(0, visibleErrors).map((e, i) =>
            dismissed[i] ? null : (
              <ErrorPopup
                key={i}
                index={i}
                spec={e}
                onClose={() => setDismissed((d) => ({ ...d, [i]: true }))}
              />
            )
          )}

          {/* The hero CTA dialog (always on top) */}
          {visibleErrors >= ERRORS.length && (
            <div
              className="absolute left-1/2 top-1/2 z-50 w-[320px] -translate-x-1/2 -translate-y-1/2 -rotate-[1.5deg] border-2 border-[#0054e3] bg-[#ece9d8] shadow-[8px_8px_0_rgba(0,0,0,0.5)] animate-scale-in"
            >
              <div className="flex h-7 items-center justify-between bg-gradient-to-r from-[#0054e3] via-[#2b7eee] to-[#27c1ff] px-1.5">
                <span className="font-tahoma text-[12px] font-bold text-white drop-shadow-[1px_1px_0_rgba(0,0,0,0.4)]">
                  Tape Wizard v1.0
                </span>
                <div className="flex gap-0.5">
                  <button className="grid h-5 w-6 place-items-center border border-white bg-[#ece9d8] text-[11px] font-bold">_</button>
                  <button className="grid h-5 w-6 place-items-center border border-white bg-[#ece9d8] text-[11px] font-bold">□</button>
                  <button className="grid h-5 w-6 place-items-center border border-white bg-[#e33d13] text-[11px] font-bold text-white">X</button>
                </div>
              </div>
              <div className="flex gap-3 p-5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-white bg-yellow-400 shadow">
                  <span className="text-xl font-black">!</span>
                </div>
                <div className="flex flex-1 flex-col gap-4">
                  <p className="font-tahoma text-[14px] leading-snug text-black">
                    someone wants you to tape them
                    <br />a memory <span className="text-red-500">♥</span>
                  </p>
                  <div className="flex justify-end gap-2">
                    <Link
                      to="/record"
                      className="border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 bg-[#ece9d8] px-5 py-1.5 font-tahoma text-[12px] font-bold text-black outline-1 outline-black -outline-offset-[5px]"
                    >
                      Record
                    </Link>
                    <button
                      onClick={() => setDismissed({})}
                      className="border-2 border-t-white border-l-white border-b-gray-600 border-r-gray-600 bg-[#ece9d8] px-5 py-1.5 font-tahoma text-[12px] text-black"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

type ErrSpec = {
  title: string;
  body: string;
  icon: "warn" | "error" | "info" | "trash";
  variant: "xp" | "pink" | "98";
  buttons: string[];
  top: string;
  left: string;
  rotate: number;
  width: number;
  stack?: number; // shadow copies
};

const ERRORS: ErrSpec[] = [
  { title: "System crash", body: "A system crash has occurred. The computer will restart now.", icon: "warn", variant: "pink", buttons: ["OK"], top: "8%", left: "6%", rotate: -2, width: 240, stack: 3 },
  { title: "Error", body: "Все тебя ненавидят", icon: "warn", variant: "pink", buttons: ["вать", "плакать", "покупать"], top: "10%", left: "30%", rotate: 1, width: 260 },
  { title: "Internet Explorer — Logoff Warning", body: "You have been on-line for 1 year.\nDo you wish to Log Off and get a Life?", icon: "warn", variant: "98", buttons: ["Yes", "No"], top: "22%", left: "38%", rotate: 0, width: 270 },
  { title: "Confirm File Delete", body: 'Do you want to delete "Your life"?', icon: "trash", variant: "98", buttons: ["Yes", "No"], top: "40%", left: "30%", rotate: -1, width: 280 },
  { title: "Error", body: "Fail", icon: "error", variant: "98", buttons: ["OK"], top: "12%", left: "62%", rotate: 2, width: 170, stack: 4 },
  { title: "user error", body: "Everybody hates you.", icon: "error", variant: "pink", buttons: ["idc", "cry", "eat"], top: "62%", left: "4%", rotate: -3, width: 230 },
  { title: "warning", body: "There is nowhere you can hide.", icon: "error", variant: "pink", buttons: ["OK"], top: "50%", left: "2%", rotate: 2, width: 220 },
  { title: "Attention", body: "Do you really want to delete all the memories?", icon: "warn", variant: "98", buttons: ["Yes", "Yes"], top: "60%", left: "40%", rotate: 1, width: 260, stack: 2 },
  { title: "Error", body: 'Cannot find "love of my life"', icon: "warn", variant: "98", buttons: ["Try again", "Cry", "Oh well"], top: "74%", left: "32%", rotate: -1, width: 290 },
  { title: "Error", body: "i tried and...", icon: "warn", variant: "pink", buttons: ["OK"], top: "28%", left: "14%", rotate: 3, width: 210 },
];

function ErrorPopup({ index, spec, onClose }: { index: number; spec: ErrSpec; onClose: () => void }) {
  const isPink = spec.variant === "pink";
  const titleBar = isPink
    ? "bg-gradient-to-r from-[#c060c0] via-[#d090e0] to-[#a040a0]"
    : "bg-gradient-to-r from-[#0a246a] via-[#3a6ea5] to-[#7ba7d9]";
  const body = isPink ? "bg-[#f0d8f0]" : "bg-[#ece9d8]";

  return (
    <>
      {/* shadow stack copies */}
      {Array.from({ length: spec.stack ?? 0 }).map((_, s) => (
        <div
          key={s}
          aria-hidden
          className="pointer-events-none absolute border-2 border-black/40"
          style={{
            top: spec.top, left: spec.left, width: spec.width,
            transform: `translate(${(s + 1) * 4}px, ${(s + 1) * 4}px) rotate(${spec.rotate}deg)`,
            background: isPink ? "#f0d8f0" : "#ece9d8",
            zIndex: 10 + index,
            opacity: 0.6 - s * 0.12,
            height: 110,
          }}
        />
      ))}

      <div
        className="absolute animate-scale-in border-2 border-black shadow-[4px_4px_0_rgba(0,0,0,0.5)]"
        style={{
          top: spec.top, left: spec.left, width: spec.width,
          transform: `rotate(${spec.rotate}deg)`,
          zIndex: 20 + index,
        }}
      >
        <div className={`flex h-6 items-center justify-between px-1.5 ${titleBar}`}>
          <span className="truncate font-tahoma text-[11px] font-bold text-white drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]">
            {spec.title}
          </span>
          <button
            onClick={() => {
              const a = new Audio(xpAlertSound);
              a.preload = "auto";
              a.volume = 0.18;
              a.playbackRate = 1.05;
              void a.play().catch(() => {});
              onClose();
            }}
            className="grid h-4 w-5 place-items-center border border-white bg-[#ece9d8] text-[10px] font-bold leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className={`flex gap-2 p-3 ${body}`}>
          <Icon kind={spec.icon} />
          <div className="flex flex-1 flex-col gap-3">
            <p className="whitespace-pre-line font-tahoma text-[12px] leading-snug text-black">
              {spec.body}
            </p>
            <div className="flex justify-end gap-1.5">
              {spec.buttons.map((b, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const a = new Audio(xpAlertSound);
                    a.preload = "auto";
                    a.volume = 0.18;
                    a.playbackRate = 1.05;
                    void a.play().catch(() => {});
                    onClose();
                  }}
                  className="min-w-[52px] border-2 border-t-white border-l-white border-b-gray-700 border-r-gray-700 bg-[#ece9d8] px-2 py-0.5 font-tahoma text-[11px] text-black active:border-t-gray-700 active:border-l-gray-700 active:border-b-white active:border-r-white"
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Icon({ kind }: { kind: ErrSpec["icon"] }) {
  if (kind === "warn") return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-yellow-400 text-[18px] font-black text-black border border-black/30">!</div>
  );
  if (kind === "error") return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-red-500 text-[16px] font-black text-white border border-black/40">✕</div>
  );
  if (kind === "trash") return (
    <div className="grid h-8 w-8 shrink-0 place-items-center text-[20px]">🗑️</div>
  );
  return <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-400 text-[16px] font-black text-white">i</div>;
}
