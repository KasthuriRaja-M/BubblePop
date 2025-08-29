import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function useAnimationFrame(callback) {
  const requestRef = useRef();
  const previousTimeRef = useRef();

  useEffect(() => {
    const animate = (time) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTimeMs = time - previousTimeRef.current;
        callback(deltaTimeMs / 1000);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [callback]);
}

function App() {
  const playfieldRef = useRef(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bubbles, setBubbles] = useState([]);

  const maxBubbles = 25;
  const spawnIntervalMs = 700;
  const bubbleLifetimeSec = 12;

  // Precompute possible colors
  const bubbleColors = useMemo(
    () => ['#4cc9f0', '#4895ef', '#4361ee', '#b5179e', '#f72585', '#3a0ca3', '#80ffdb', '#72efdd'],
    []
  );

  // Timer countdown
  useEffect(() => {
    if (!isPlaying) return;
    if (timeLeft <= 0) {
      setIsPlaying(false);
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [isPlaying, timeLeft]);

  // Spawn bubbles while playing
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setBubbles((prev) => {
        if (prev.length >= maxBubbles) return prev;
        const container = playfieldRef.current;
        if (!container) return prev;
        const rect = container.getBoundingClientRect();
        const size = getRandomInt(30, 80);
        const x = getRandomInt(0, Math.max(0, rect.width - size));
        const y = rect.height + size; // spawn below and rise up
        const speed = getRandomInt(40, 120); // px per second upwards
        const createdAt = performance.now() / 1000;
        const id = crypto.randomUUID ? crypto.randomUUID() : `${createdAt}-${Math.random()}`;
        const color = bubbleColors[getRandomInt(0, bubbleColors.length - 1)];
        const newBubble = { id, x, y, size, speed, createdAt, color };
        return [...prev, newBubble];
      });
    }, spawnIntervalMs);
    return () => clearInterval(id);
  }, [isPlaying, bubbleColors]);

  // Move bubbles upwards and cull old ones
  useAnimationFrame((dt) => {
    if (!isPlaying) return;
    setBubbles((prev) => {
      const now = performance.now() / 1000;
      const next = prev
        .map((b) => ({ ...b, y: b.y - b.speed * dt }))
        .filter((b) => now - b.createdAt <= bubbleLifetimeSec && b.y + b.size > -20);
      return next;
    });
  });

  function handlePop(bubbleId) {
    setBubbles((prev) => prev.filter((b) => b.id !== bubbleId));
    setScore((s) => s + 1);
  }

  function handleStart() {
    setScore(0);
    setTimeLeft(60);
    setBubbles([]);
    setIsPlaying(true);
  }

  return (
    <div className="game-container">
      <div className="hud">
        <div className="hud-item">Score: <strong>{score}</strong></div>
        <div className="hud-item">Time: <strong>{timeLeft}s</strong></div>
        <button className="primary" onClick={handleStart} disabled={isPlaying}>
          {isPlaying ? 'Playing…' : 'Start'}
        </button>
      </div>

      <div className="playfield" ref={playfieldRef}>
        {!isPlaying && (
          <div className="overlay">
            <h1>BubblePop</h1>
            <p>Pop as many bubbles as you can in 60 seconds.</p>
            <button className="primary" onClick={handleStart}>Play</button>
          </div>
        )}

        {bubbles.map((b) => (
          <button
            key={b.id}
            className="bubble"
            style={{ left: b.x, top: b.y, width: b.size, height: b.size, backgroundColor: b.color }}
            onClick={() => handlePop(b.id)}
            aria-label="Pop bubble"
          />
        ))}
      </div>
    </div>
  );
}

export default App;
