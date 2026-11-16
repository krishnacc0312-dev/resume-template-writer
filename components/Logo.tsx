/** Logo mark: an old page turning into a new one (before → after). */
export default function LogoMark({ size = 30, title }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <rect width="64" height="64" rx="15" fill="#1f4fd6" />
      <rect x="11" y="15" width="24" height="32" rx="3" fill="#fff" opacity=".45" transform="rotate(-8 23 31)" />
      <rect x="27" y="14" width="25" height="34" rx="3" fill="#fff" />
      <rect x="31" y="20" width="12" height="3" rx="1.5" fill="#1f4fd6" />
      <rect x="31" y="27" width="17" height="2.6" rx="1.3" fill="#1f4fd6" opacity=".35" />
      <rect x="31" y="32" width="15" height="2.6" rx="1.3" fill="#1f4fd6" opacity=".35" />
      <rect x="31" y="37" width="17" height="2.6" rx="1.3" fill="#1f4fd6" opacity=".35" />
      <path d="M14 52h14m0 0l-4-4m4 4l-4 4" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
