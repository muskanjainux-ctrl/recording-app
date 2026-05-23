// Tape persistence — uploads audio + photo to Lovable Cloud storage
// and stores metadata in the `tapes` table. Shareable via short slug.

import { supabase } from "@/integrations/supabase/client";

export type Tape = {
  slug: string;
  audioUrl: string;
  photoUrl?: string;
  title: string;
  duration: number; // seconds
  createdAt: number;
};

function randomId(len = 8) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function extFromMime(mime: string, fallback: string) {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("png")) return "png";
  return fallback;
}

export async function uploadTape(args: {
  audioBlob: Blob;
  photoBlob?: Blob | null;
  title: string;
  duration: number;
  onProgress?: (label: string) => void;
}): Promise<Tape> {
  const folder = randomId(12);
  const audioExt = extFromMime(args.audioBlob.type, "webm");
  const audioPath = `${folder}/audio.${audioExt}`;

  args.onProgress?.("Uploading audio…");
  const audioUp = await supabase.storage
    .from("tapes")
    .upload(audioPath, args.audioBlob, {
      contentType: args.audioBlob.type || "audio/webm",
      upsert: false,
    });
  if (audioUp.error) throw audioUp.error;

  let photoPath: string | null = null;
  if (args.photoBlob) {
    args.onProgress?.("Uploading photo…");
    const photoExt = extFromMime(args.photoBlob.type, "jpg");
    photoPath = `${folder}/photo.${photoExt}`;
    const photoUp = await supabase.storage
      .from("tapes")
      .upload(photoPath, args.photoBlob, {
        contentType: args.photoBlob.type || "image/jpeg",
        upsert: false,
      });
    if (photoUp.error) throw photoUp.error;
  }

  args.onProgress?.("Saving tape…");
  const { data, error } = await supabase
    .from("tapes")
    .insert({
      title: args.title || "Untitled message",
      duration: Math.max(0, Math.round(args.duration)),
      audio_path: audioPath,
      photo_path: photoPath,
    })
    .select("slug, title, duration, audio_path, photo_path, created_at")
    .single();
  if (error) throw error;

  return rowToTape(data);
}

type TapeRow = {
  slug: string;
  title: string;
  duration: number;
  audio_path: string | null;
  photo_path: string | null;
  created_at: string;
};

function rowToTape(row: TapeRow): Tape {
  const audio = row.audio_path
    ? supabase.storage.from("tapes").getPublicUrl(row.audio_path).data.publicUrl
    : "";
  const photo = row.photo_path
    ? supabase.storage.from("tapes").getPublicUrl(row.photo_path).data.publicUrl
    : undefined;
  return {
    slug: row.slug,
    audioUrl: audio,
    photoUrl: photo,
    title: row.title,
    duration: row.duration,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function fetchTapeBySlug(slug: string): Promise<Tape | null> {
  const { data, error } = await supabase
    .from("tapes")
    .select("slug, title, duration, audio_path, photo_path, created_at")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return rowToTape(data);
}

export function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}