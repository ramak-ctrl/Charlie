import Link from "next/link";

interface Props {
  size?: "sm" | "md" | "lg";
  href?: string;
}

const sizes = {
  sm: { box: 26, radius: 6,  svg: [13, 11], text: 15 },
  md: { box: 32, radius: 8,  svg: [16, 13], text: 18 },
  lg: { box: 40, radius: 10, svg: [20, 16], text: 22 },
};

export default function CharlieLogo({ size = "md", href = "/" }: Props) {
  const s = sizes[size];
  return (
    <Link
      href={href}
      style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
    >
      <div style={{
        width: s.box, height: s.box, borderRadius: s.radius, flexShrink: 0,
        background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 0 1px rgba(124,58,237,0.6), 0 4px 16px rgba(124,58,237,0.25)",
      }}>
        <svg width={s.svg[0]} height={s.svg[1]} viewBox="0 0 20 14" fill="none">
          <path
            d="M1 7h3L5.5 1.5 8.5 12.5 11 5.5l2 3.5 1.5-2H19"
            stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>
      <span style={{ fontWeight: 800, fontSize: s.text, letterSpacing: "-0.4px", color: "#f0ede8" }}>
        Charlie
      </span>
    </Link>
  );
}
