# Tighten /record screen

The current `/record` page matches the uploaded reference structurally (XP wizard window, tabs, LCD, transport buttons, Tracks list, blurred "RECORD TAPE" title), but everything renders oversized on a 390px viewport — buttons feel huge, type is chunky, the inner panel is loose. Goal: keep the exact same layout and components, just shrink the visual scale so it feels like the screenshot.

## Target layout (390px viewport)

```text
┌──────────────────────────────────────┐
│ 12:43                       ▮▮ 76%  │
│                                      │
│            ░ RECORD TAPE ░           │  ← smaller, softer blur
│                                      │
│  ┌────────────────────────────────┐  │
│  │ ▭ Tape Recorder Wizard      ✕ │  │  ← titlebar
│  ├────────────────────────────────┤
│  │ ▭ [1.Record] [2.Share]         │  ← tighter tabs
│  │                                │
│  │ Record your message            │  ← text-lg (was 2xl)
│  │ Click Record when ready…       │  ← text-xs (was lg)
│  │ ┌──────────────────────────┐  │
│  │ │ [▭] Untitled message     │  │  ← thumb 40×48 (was 56×64)
│  │ │     You · analog warmth  │  │
│  │ │ ┌──────────────────────┐ │  │
│  │ │ │     0:00 / 0:00      │ │  │  ← LCD, tighter
│  │ │ └──────────────────────┘ │  │
│  │ │ ▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭│  │  ← progress
│  │ │ [■][↺][▶][●][✉]          │  │  ← 44–48px (was ~64px)
│  │ │ Tracks (1)                │  │
│  │ │  1. ▭ Your message  0:00 │  │
│  │ └──────────────────────────┘  │
│  │              Ready? Hit Share ✉│  ← text-xs
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

## Changes (all in `src/routes/record.tsx`, no behavior changes)

1. **Transport buttons** — reduce `.xp-btn.icon` footprint
   - 5 transport buttons (Stop, Reset, Preview, Record, Share) currently ~64px squares → ~44–48px. Inner glyph SVGs 22px → 16–18px; record dot 16px → 12px.
   - Button row gap `gap-2` → `gap-1.5`.

2. **Typography scale inside the wizard**
   - Heading "Record your message": `text-2xl` → `text-lg`
   - Helper line: `text-lg` → `text-xs`
   - "Ready to send? Hit Share ✉" footer: `text-base` → `text-xs`
   - LCD: tighter padding, keep mono green
   - Tracks header/row: keep 12px

3. **Inner panel density**
   - Panel padding `p-3` → `p-2.5`
   - Section spacing `mt-3` → `mt-2`
   - Cassette thumb tile `h-14 w-16` → `h-10 w-12`, inner `CassetteIcon size=28` → `size=20`

4. **Wizard window**
   - Container `pt-40` → `pt-24` so the window sits closer to the blurred title
   - `maxWidth={640}` → `maxWidth={420}`, keep `mx-auto`

5. **Tab chips**
   - `px-3 py-1 text-[12px]` → `px-2 py-0.5 text-[11px]`; row `gap-2` → `gap-1.5`

6. **Blurred title**
   - `text-[28px]` → `text-[22px]`, `top-12` → `top-8`, blur `6px` → `4px`

## Non-goals

- No changes to recording logic, upload flow, share step, or `tapeStore.ts`.
- No changes to global `.xp-*` classes in `src/styles.css` — only Tailwind utility tweaks and small inline size overrides in the route file.
- Landing page (`src/routes/index.tsx`) untouched.

After the edit I'll screenshot at 390×652 to confirm it matches the reference proportions.
