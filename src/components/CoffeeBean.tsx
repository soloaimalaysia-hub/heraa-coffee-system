export default function CoffeeBean({ size = 80 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <ellipse cx="50" cy="50" rx="36" ry="28" fill="#C8A882" stroke="#7A5230" strokeWidth="2" />
      <path
        d="M 50 23 Q 41 38 44 50 Q 41 62 50 77"
        fill="none"
        stroke="#7A5230"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <ellipse cx="37" cy="38" rx="9" ry="5" fill="white" opacity="0.25" transform="rotate(-20, 37, 38)" />
      <ellipse cx="60" cy="58" rx="7" ry="4" fill="white" opacity="0.15" transform="rotate(15, 60, 58)" />
    </svg>
  );
}
