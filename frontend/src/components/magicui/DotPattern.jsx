/**
 * Magic UI — DotPattern Component
 * Subtle geometric grid background pattern.
 */
export function DotPattern({
  width = 24,
  height = 24,
  cx = 1.5,
  cy = 1.5,
  cr = 1.2,
  className = "",
  style = {},
  color = "rgba(29, 78, 216, 0.08)",
}) {
  const patternId = "magic-dot-pattern-taripa";
  return (
    <svg
      aria-hidden="true"
      className={`magic-dot-pattern ${className}`}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        ...style,
      }}
    >
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
        >
          <circle cx={cx} cy={cy} r={cr} fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${patternId})`} />
    </svg>
  );
}

