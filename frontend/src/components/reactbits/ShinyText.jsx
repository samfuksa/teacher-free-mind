import React from 'react';

export default function ShinyText({ text, disabled = false, speed = 5, className = '' }) {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`inline-block relative overflow-hidden bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 via-neutral-400 to-neutral-900 dark:from-white dark:via-neutral-400 dark:to-white ${className}`}
      style={{
        backgroundImage: 'linear-gradient(120deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.9) 50%, rgba(255, 255, 255, 0) 60%)',
        backgroundSize: '200% 100%',
        animation: disabled ? 'none' : `shine ${animationDuration} linear infinite`,
        WebkitBackgroundClip: 'text',
      }}
    >
      {text}
      <style>{`
        @keyframes shine {
          0% { background-position: 100% }
          100% { background-position: -100% }
        }
      `}</style>
    </span>
  );
}
