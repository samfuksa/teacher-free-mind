import React from 'react';

export default function DotPattern({
  width = 24,
  height = 24,
  cx = 1,
  cy = 1,
  cr = 1,
  className = '',
  ...props
}) {
  const id = 'dot-pattern-' + Math.random().toString(36).substring(2, 9);

  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full fill-neutral-400/25 [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)] ${className}`}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
          x={0}
          y={0}
        >
          <circle id="pattern-circle" cx={cx} cy={cy} r={cr} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth={0} fill={`url(#${id})`} />
    </svg>
  );
}
