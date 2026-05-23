import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export function CassetteIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <rect x="0.5" y="2.5" width="15" height="11" rx="1.5" fill="#1b1b1b" stroke="#000" />
      <circle cx="5" cy="7.5" r="1.6" fill="#ddd" />
      <circle cx="11" cy="7.5" r="1.6" fill="#ddd" />
      <rect x="2" y="10" width="12" height="2" fill="#3a3a3a" />
    </svg>
  );
}

export default function XPWindow({
  title,
  icon,
  children,
  closeHref = "/",
  maxWidth = 640,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  closeHref?: string;
  maxWidth?: number;
}) {
  return (
    <div className="xp-window w-full" style={{ maxWidth }}>
      <div className="xp-titlebar">
        <span className="xp-title-icon">{icon ?? <CassetteIcon />}</span>
        <span className="truncate">{title}</span>
        <span className="xp-title-buttons">
          <button type="button" className="xp-title-btn" aria-label="Minimize">_</button>
          <button type="button" className="xp-title-btn" aria-label="Maximize">▢</button>
          <Link to={closeHref} className="xp-title-btn close" aria-label="Close">✕</Link>
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}