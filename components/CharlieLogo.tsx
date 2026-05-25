import Link from "next/link";

interface Props {
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
}

const sizes = {
  sm: { text: 15, iW: 15, iH: 17 },
  md: { text: 18, iW: 18, iH: 21 },
  lg: { text: 22, iW: 22, iH: 25 },
  xl: { text: 24, iW: 24, iH: 28 },
};

const COLOR = "#e8dfc8";

export default function CharlieLogo({ size = "md", href = "/" }: Props) {
  const s = sizes[size];
  return (
    <Link
      href={href}
      style={{ display: "flex", alignItems: "center", textDecoration: "none", gap: 0 }}
    >
      <span style={{ fontWeight: 800, fontSize: s.text, letterSpacing: "-0.4px", color: COLOR, lineHeight: 1 }}>
        Ch
      </span>

      {/* Chat bubble replacing the "a" */}
      <svg
        width={s.iW}
        height={s.iH}
        viewBox="0 0 40 46"
        fill="none"
        style={{ display: "block", margin: "0 1px", flexShrink: 0 }}
        aria-hidden="true"
      >
        {/* Bubble body */}
        <rect x="1.5" y="1.5" width="37" height="30" rx="8" fill={COLOR} fillOpacity="0.15" stroke={COLOR} strokeWidth="2" />
        {/* Tail bottom-left */}
        <path d="M8 31.5 L5 42 L19 31.5Z" fill={COLOR} />
        {/* Heartbeat waveform */}
        <path
          d="M7 16.5 L12 16.5 L14.5 9 L18.5 24 L21 13 L23 18 L25 16.5 L33 16.5"
          stroke={COLOR}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <span style={{ fontWeight: 800, fontSize: s.text, letterSpacing: "-0.4px", color: COLOR, lineHeight: 1 }}>
        rlie
      </span>
    </Link>
  );
}
