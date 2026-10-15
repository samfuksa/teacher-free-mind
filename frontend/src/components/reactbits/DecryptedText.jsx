import React, { useEffect, useState } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function DecryptedText({
  text = '',
  speed = 15,
  className = '',
}) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let frame = 0;
    const totalFrames = 10; // Rychlé dokončení během cca 150-200ms

    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const revealedLength = Math.floor(progress * text.length);

      const randomized = text
        .split('')
        .map((char, i) => {
          if (char === ' ' || char === '-') return char;
          if (i <= revealedLength) return text[i];
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join('');

      setDisplayText(randomized);

      if (frame >= totalFrames) {
        clearInterval(interval);
        setDisplayText(text);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <span className={className}>{displayText || text}</span>;
}
