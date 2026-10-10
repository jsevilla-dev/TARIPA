import { useEffect, useState } from "react";

/**
 * Magic UI — NumberTicker Component
 * Smoothly animates numbers from 0 to target value with easing.
 */
export function NumberTicker({
  value = 0,
  duration = 1.0,
  delay = 0,
  decimalPlaces = 0,
  prefix = "",
  suffix = "",
  className = "",
  style = {},
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const target = Number(value) || 0;

  useEffect(() => {
    let startTimestamp = null;
    let animationFrameId;

    const timeout = setTimeout(() => {
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = (timestamp - startTimestamp) / (duration * 1000);
        const progress = Math.min(Math.max(elapsed, 0), 1);

        // Smooth easeOutExpo formula
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = target * ease;

        setDisplayValue(current);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setDisplayValue(target);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    }, delay * 1000);

    return () => {
      clearTimeout(timeout);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [target, duration, delay]);

  const formatted = displayValue.toLocaleString("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });

  return (
    <span className={`magic-number-ticker ${className}`} style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

