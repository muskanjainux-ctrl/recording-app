import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { uploadTape, fmtTime } from "@/components/tape/tapeStore";
import recorderClickSound from "@/assets/recorder click sound.mp3";
import cameraShutterSound from "@/assets/camera shutter sound.mp3";

export const Route = createFileRoute("/record")({
  component: RecordPage,
});

type Status = "idle" | "recording" | "paused" | "stopped";

function RecordPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [title, setTitle] = useState("Untitled message");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef<number>(0);
  const accRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);

  const playClickSound = useCallback(() => {
    const a = new Audio(recorderClickSound);
    a.preload = "auto";
    a.volume = 0.35;
    void a.play().catch(() => {});
  }, []);

  const playShutterSound = useCallback(() => {
    const a = new Audio(cameraShutterSound);
    a.preload = "auto";
    a.volume = 0.4;
    void a.play().catch(() => {});
  }, []);
  const galleryFileRef = useRef<HTMLInputElement | null>(null);

  const startTick = useCallback(() => {
    startedAtRef.current = Date.now();
    tickRef.current = window.setInterval(() => {
      setElapsed(accRef.current + (Date.now() - startedAtRef.current) / 1000);
    }, 200);
  }, []);
  const stopTick = useCallback(() => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = null;
    accRef.current += (Date.now() - startedAtRef.current) / 1000;
  }, []);

  useEffect(() => () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  const handleRecord = async () => {
    playClickSound();
    setError(null);
    if (status === "recording") return;
    if (status === "paused" && recorderRef.current) {
      recorderRef.current.resume();
      setStatus("recording");
      startTick();
      return;
    }
    // fresh
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      accRef.current = 0;
      setElapsed(0);
      setAudioUrl(null);
      setAudioBlob(null);
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      rec.start();
      recorderRef.current = rec;
      setStatus("recording");
      startTick();
    } catch (err) {
      setError("Microphone access denied. Please allow microphone in your browser.");
      console.error(err);
    }
  };

  const handlePause = () => {
    playClickSound();
    if (status !== "recording" || !recorderRef.current) return;
    recorderRef.current.pause();
    stopTick();
    setStatus("paused");
  };

  const handleStop = () => {
    playClickSound();
    if (!recorderRef.current) return;
    if (status === "recording" || status === "paused") {
      recorderRef.current.stop();
      stopTick();
      setStatus("stopped");
    }
  };

  const handleDelete = () => {
    playClickSound();
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    chunksRef.current = [];
    accRef.current = 0;
    setElapsed(0);
    setAudioUrl(null);
    setAudioBlob(null);
    setStatus("idle");
    setShareLink(null);
    setStep(1);
  };

  const onPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      // downscale to ~640px JPEG to keep uploads small
      const img = new Image();
      img.onload = () => {
        const max = 640;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        c.toBlob((blob) => {
          if (!blob) return;
          setPhotoBlob(blob);
          setPhotoPreview(URL.createObjectURL(blob));
          playShutterSound();
        }, "image/jpeg", 0.82);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const goShare = async () => {
    playClickSound();
    if (!audioBlob) return;
    setError(null);
    setUploading(true);
    try {
      const tape = await uploadTape({
        audioBlob,
        photoBlob,
        title: title.trim() || "Untitled message",
        duration: elapsed,
        onProgress: setProgress,
      });
      const link = `${window.location.origin}/play/${tape.slug}`;
      setShareLink(link);
      setStep(2);
    } catch (e) {
      console.error(e);
      setError("Couldn't upload tape. Please try again.");
    } finally {
      setUploading(false);
      setProgress("");
    }
  };

  const copyShare = async () => {
    playClickSound();
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* noop */
    }
  };

  const tooLong = elapsed > 60 * 30; // 30 min cap

  const slug = shareLink?.split("/").pop() ?? "";

  const statusLabel =
    status === "recording" ? "RECORDING" :
    status === "paused"    ? "PAUSED" :
    status === "stopped"   ? "READY" : "IDLE";

  // Keyboard shortcuts R / P / S
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const k = e.key.toLowerCase();
      if (k === "r") handleRecord();
      else if (k === "p") { if (audioUrl) new Audio(audioUrl).play(); }
      else if (k === "s") handleStop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl, status]);

  return (
    <main className="bliss-bg relative min-h-screen w-full font-tahoma">
      <div className="relative mx-auto flex min-h-screen max-w-[340px] items-center justify-center px-3 py-6">
        <div className="xp-window w-full text-[10px]">
          {/* Titlebar */}
          <div className="xp-titlebar text-[11px]">
            <span className="xp-title-icon">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gradient-to-br from-blue-300 to-blue-600 ring-1 ring-white/60" />
            </span>
            <span className="truncate">Sound Recorder — Untitled.wav</span>
            <span className="xp-title-buttons">
              <button type="button" className="xp-title-btn" aria-label="Minimize">_</button>
              <button type="button" className="xp-title-btn" aria-label="Maximize">▢</button>
              <Link to="/" className="xp-title-btn close" aria-label="Close">✕</Link>
            </span>
          </div>

          {/* Menu bar */}
          <div className="flex items-center gap-3 border-b border-[#aca899] bg-[#ece9d8] px-2 py-0.5 text-[10px] text-[#1b1b1b]">
            <span><u>F</u>ile</span>
            <span><u>E</u>dit</span>
            <span>E<u>f</u>fects</span>
            <span><u>H</u>elp</span>
          </div>

          {/* CRT console */}
          <div className="crt-lines relative m-2 overflow-hidden border-2 border-[#1b1b1b] bg-black p-2 font-mono text-[9px] leading-[1.3] text-[#6cff6a]"
               style={{ textShadow: "0 0 6px rgba(108,255,106,0.55)" }}>
            <div className="scanlines pointer-events-none absolute inset-0" />

            <pre className="whitespace-pre-wrap">{`RECORDER_OS [Version 5.1.2600]
(C) Copyright 1985-2001 Microsoft Corp.

> initializing audio subsystem... OK
> sample rate 44100Hz... OK`}</pre>

            {/* ASCII reels + LCD */}
            <div className="mt-2 rounded-sm border border-[#6cff6a]/60 p-1.5">
              <div className="flex items-center justify-around">
                <Reel spinning={status === "recording"} />
                <Reel spinning={status === "recording"} />
              </div>
              <div className="mt-1.5 flex items-center justify-center gap-2">
                <span className="opacity-80">{"<+>"}</span>
                <span className="rounded-sm border border-[#6cff6a]/60 px-2 py-0.5 text-[11px] tracking-[2px]">
                  {fmtTime(elapsed)}
                </span>
                <span className="opacity-80">{"<+>"}</span>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span>&gt; STATUS: {statusLabel}</span>
              <span>{status === "recording" ? "-12 dB" : "-INF"}</span>
            </div>

            {/* blinking cursor */}
            <div className="mt-1">
              <span className="inline-block h-2.5 w-1.5 animate-pulse bg-[#6cff6a]" />
            </div>
          </div>

          {/* Transport row */}
          <div className="flex flex-wrap items-center gap-1 border-t border-[#aca899] bg-[#ece9d8] px-2 py-1.5 text-[10px] text-[#1b1b1b]">
            <span className="font-bold text-[9px]">XPORT:</span>
            <TButton onClick={handleRecord} disabled={status === "recording"} color="#c00">[R] Rec</TButton>
            <TButton onClick={() => { playClickSound(); if (audioUrl) new Audio(audioUrl).play(); }} disabled={!audioUrl} color="#0a47c2">[P] Play</TButton>
            <TButton onClick={handleStop} disabled={status !== "recording" && status !== "paused"} color="#0a47c2">[S] Stop</TButton>
            <button
              className="xp-btn"
              onClick={handleDelete}
              disabled={status === "idle" && !audioUrl}
              style={{ padding: "2px 6px", fontSize: 10 }}
            >
              Reset
            </button>
            <input
              ref={galleryFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]; if (f) onPhoto(f);
              }}
            />
          </div>

          {/* Optional title + share state */}
          {(audioUrl || error || progress || shareLink || photoPreview) && (
            <div className="space-y-2 border-t border-[#aca899] bg-[#ece9d8] px-2 py-2 text-[10px] text-[#1b1b1b]">
              {audioUrl && !shareLink && (
                <>
                  {/* Tape preview card */}
                  <div className="flex items-stretch gap-2 border border-[#aca899] bg-white p-1.5 shadow-[inset_1px_1px_0_#fff]">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Polaroid" className="h-14 w-14 shrink-0 border border-[#aca899] object-cover" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound();
                          galleryFileRef.current?.click();
                        }}
                        className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-sm border border-dashed border-[#7c7a6f] bg-[#f7f5ec] px-1 text-[9px] text-[#555] hover:bg-white"
                      >
                        🖼 Gallery
                        <span className="mt-0.5 leading-none">Add</span>
                      </button>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={80}
                        placeholder="Tape title…"
                        className="border border-[#aca899] bg-white px-1 py-0.5 font-tahoma text-[11px] shadow-[inset_1px_1px_0_#7c7a6f]"
                      />
                      <audio src={audioUrl} controls className="h-7 w-full" />
                      <div className="flex items-center justify-between text-[9px] text-[#555]">
                        <span>⏱ {fmtTime(elapsed)}</span>
                        {photoPreview && (
                          <button className="underline" onClick={() => { setPhotoBlob(null); setPhotoPreview(null); }}>
                            remove photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    className="xp-btn w-full font-bold"
                    onClick={goShare}
                    disabled={!audioBlob || uploading}
                    style={{ padding: "5px 10px", fontSize: 11 }}
                  >
                    {uploading ? "Sending…" : "✉  Send Tape"}
                  </button>
                </>
              )}
              {error && <div className="border border-red-500 bg-red-50 p-1 text-red-700">{error}</div>}
              {uploading && <div className="border border-[#7f9db9] bg-[#eaf2ff] p-1">{progress || "Uploading…"}</div>}
              {tooLong && <div className="border border-amber-500 bg-amber-50 p-1 text-amber-800">Side A is full (~30 min).</div>}
              {shareLink && (
                <div className="space-y-1">
                  <div className="font-bold">Shareable link:</div>
                  <input
                    readOnly
                    value={shareLink}
                    className="w-full border border-[#aca899] bg-white p-1 font-mono text-[10px]"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <div className="flex gap-1.5">
                    <button className="xp-btn flex-1" onClick={copyShare} style={{ padding: "4px 8px", fontSize: 10 }}>{copied ? "Copied!" : "Copy"}</button>
                    <button className="xp-btn flex-1" onClick={() => navigate({ to: "/play/$slug", params: { slug } })} style={{ padding: "4px 8px", fontSize: 10 }}>Preview</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status bar */}
          <div className="flex items-center justify-between border-t border-[#aca899] bg-[#ece9d8] px-2 py-0.5 text-[9px] text-[#1b1b1b]">
            <span>TC-87 PRO</span>
            <span>Ch 01</span>
            <span>{fmtTime(elapsed)}</span>
          </div>
        </div>
      </div>
    </main>
  );
}

function TButton({
  onClick, disabled, color, children,
}: { onClick: () => void; disabled?: boolean; color: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="border border-[#aca899] bg-white px-1.5 py-0.5 font-mono text-[10px] shadow-[inset_1px_1px_0_#fff] disabled:opacity-50"
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