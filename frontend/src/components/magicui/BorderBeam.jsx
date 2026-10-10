/**
 * Magic UI — BorderBeam Component
 * Creates an animated glowing light beam that travels along card borders.
 */
export function BorderBeam({
  size = 220,
  duration = 7,
  borderWidth = 2,
  colorFrom = "#1D4ED8",
  colorTo = "#60A5FA",
  className = "",
  style = {},
}) {
  return (
    <div
      className={`magic-border-beam ${className}`}
      style={{
        "--size": `${size}px`,
        "--duration": `${duration}s`,
        "--border-width": `${borderWidth}px`,
        "--color-from": colorFrom,
        "--color-to": colorTo,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
