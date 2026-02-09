import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createComponentStore } from './BopomonCharacterFind.store.js';
import './BopomonCharacterFind.styles.css';

// ── Options (adjust these) ──
const BUBBLE_COUNT = 9;       // number of characters on the field (multiples of 3)
const TARGET_COUNT = 1;       // number of targets to find at once
const INITIAL_LIVES = 3;
const CORRECT_FOR_LIFE = 5;
const BUBBLE_DURATION = 30000; // ms per bubble

const TIMER_RADIUS = 33;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

// Grid: 3 columns, rows derived from BUBBLE_COUNT
const SLOT_POSITIONS = (() => {
  const cols = 3;
  const rows = BUBBLE_COUNT / cols;
  const positions = [];
  const yStart = rows > 1 ? 13 : 50;
  const ySpacing = rows > 1 ? 74 / (rows - 1) : 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      positions.push({
        x: 20 + col * 30,
        y: yStart + row * ySpacing,
      });
    }
  }
  return positions;
})();

let nextId = 0;

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getTimerColor(progress) {
  if (progress < 0.5) return '#10b981';
  if (progress < 0.75) return '#eab308';
  return '#ef4444';
}

export default function BopomonCharacterFind({ __sandtrout_register_store }) {
  // Initialize store once
  const [{ useStore, storeInstance }] = useState(() => {
    const storeInstance = createComponentStore();
    return { useStore: storeInstance, storeInstance };
  });
  const store = useStore();

  // Register store for orchestration
  useEffect(() => {
    __sandtrout_register_store?.(storeInstance);
  }, [storeInstance, __sandtrout_register_store]);

  const [gameState, setGameState] = useState('idle');
  const [bubbles, setBubbles] = useState([]);
  const [targets, setTargets] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const animRef = useRef(null);
  const bubblesRef = useRef([]);
  const targetsRef = useRef([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(INITIAL_LIVES);
  const correctCountRef = useRef(0);
  const gameStateRef = useRef('idle');

  // Helper functions that use store's word bank
  const getRandomWord = useCallback((excludeCharacters) => {
    const wordBank = store.getActiveWordBank();
    const available = wordBank.filter(w => !excludeCharacters.includes(w.character));
    return available.length > 0 ? pickRandom(available) : pickRandom(wordBank);
  }, [store]);

  const getFieldCharacters = useCallback((bubblesList, excludeIndex) => {
    return bubblesList
      .filter((b, i) => i !== excludeIndex && b.state !== 'popping' && b.state !== 'expiring')
      .map(b => b.character);
  }, []);

  const createTarget = useCallback((existingTargets) => {
    const exclude = existingTargets.map(t => t.character);
    const word = getRandomWord(exclude);
    return {
      id: ++nextId,
      character: word.character,
      pinyin: word.pinyin,
      translation: word.translation,
      showAs: Math.random() > 0.5 ? 'pinyin' : 'translation',
    };
  }, [getRandomWord]);

  const createBubbleForSlot = useCallback((slotIndex, timestamp, targetsList, fieldChars) => {
    const exclude = fieldChars || [];
    const isTarget = targetsList && targetsList.length > 0 && Math.random() < 0.35;
    let word;
    if (isTarget) {
      const available = targetsList.filter(t => !exclude.includes(t.character));
      word = available.length > 0 ? pickRandom(available) : getRandomWord(exclude);
    } else {
      word = getRandomWord(exclude);
    }
    return {
      id: ++nextId,
      slotIndex,
      character: word.character,
      pinyin: word.pinyin,
      translation: word.translation,
      spawnTime: timestamp,
      progress: 0,
      state: 'normal',
      animStartTime: 0,
    };
  }, [getRandomWord]);

  // Make sure at least one bubble exists per target (no duplicates)
  const ensureTargetCoverage = useCallback(() => {
    const ct = targetsRef.current;
    const cb = bubblesRef.current;
    ct.forEach(target => {
      const has = cb.some(b => b.character === target.character && b.state === 'normal');
      if (!has) {
        const idx = cb.findIndex(
          b => b.state === 'normal' && !ct.some(t => t.character === b.character)
        );
        if (idx >= 0) {
          cb[idx] = {
            ...cb[idx],
            character: target.character,
            pinyin: target.pinyin,
            translation: target.translation,
          };
        }
      }
    });
  }, []);

  const loseLife = useCallback(() => {
    livesRef.current -= 1;
    setLives(livesRef.current);
    if (livesRef.current <= 0) {
      gameStateRef.current = 'ended';
      setGameState('ended');
    }
  }, []);

  // Main game loop
  const gameLoop = useCallback((timestamp) => {
    if (gameStateRef.current !== 'playing') return;

    let targetsChanged = false;

    bubblesRef.current = bubblesRef.current.map((bubble, i) => {
      // Popping → respawn
      if (bubble.state === 'popping') {
        if (timestamp - bubble.animStartTime > 350) {
          const fc = getFieldCharacters(bubblesRef.current, i);
          return createBubbleForSlot(bubble.slotIndex, timestamp, targetsRef.current, fc);
        }
        return bubble;
      }
      // Shaking → back to normal
      if (bubble.state === 'shaking') {
        if (timestamp - bubble.animStartTime > 500) {
          return { ...bubble, state: 'normal' };
        }
        return bubble;
      }
      // Expiring → respawn
      if (bubble.state === 'expiring') {
        if (timestamp - bubble.animStartTime > 400) {
          const fc = getFieldCharacters(bubblesRef.current, i);
          return createBubbleForSlot(bubble.slotIndex, timestamp, targetsRef.current, fc);
        }
        return bubble;
      }

      // Normal — advance timer
      const elapsed = timestamp - bubble.spawnTime;
      const progress = Math.max(0, Math.min(elapsed / BUBBLE_DURATION, 1));

      if (progress >= 1) {
        // Expired — if it matches a target, lose a life and replace the target
        const match = targetsRef.current.find(t => t.character === bubble.character);
        if (match) {
          // Record the expired miss
          store.recordExpired(bubble.character, match);
          loseLife();
          targetsRef.current = targetsRef.current.map(t =>
            t.id === match.id ? createTarget(targetsRef.current) : t
          );
          targetsChanged = true;
        }
        return { ...bubble, state: 'expiring', animStartTime: timestamp, progress: 1 };
      }

      return { ...bubble, progress };
    });

    ensureTargetCoverage();
    if (targetsChanged) setTargets([...targetsRef.current]);
    setBubbles([...bubblesRef.current]);

    if (gameStateRef.current === 'playing') {
      animRef.current = requestAnimationFrame(gameLoop);
    }
  }, [ensureTargetCoverage, loseLife, createTarget, createBubbleForSlot, getFieldCharacters, store]);

  // Handle clicking a bubble
  const handleBubbleClick = useCallback((bubbleId) => {
    if (gameStateRef.current !== 'playing') return;

    const idx = bubblesRef.current.findIndex(b => b.id === bubbleId);
    if (idx === -1) return;
    const bubble = bubblesRef.current[idx];
    if (bubble.state !== 'normal') return;

    const pos = SLOT_POSITIONS[bubble.slotIndex];
    const now = performance.now();
    const matchingTarget = targetsRef.current.find(t => t.character === bubble.character);

    if (matchingTarget) {
      // --- Correct ---
      scoreRef.current += 1;
      correctCountRef.current += 1;
      setScore(scoreRef.current);
      setCorrectCount(correctCountRef.current);
      setFeedback({ type: 'correct', x: pos.x, y: pos.y, id: ++nextId });

      // Every 5 correct → gain a life
      if (correctCountRef.current >= CORRECT_FOR_LIFE) {
        livesRef.current += 1;
        setLives(livesRef.current);
        correctCountRef.current = 0;
        setCorrectCount(0);
      }

      // Replace matched target (always keep TARGET_COUNT)
      const newTargets = targetsRef.current.map(t =>
        t.id === matchingTarget.id ? createTarget(targetsRef.current) : t
      );
      targetsRef.current = newTargets;
      setTargets([...newTargets]);

      bubblesRef.current[idx] = { ...bubble, state: 'popping', animStartTime: now };

    } else {
      // --- Wrong → lose a life ---
      // Record the wrong click miss (bubble.character is currently displayed)
      store.recordWrongClick(bubble.character, targetsRef.current);
      setFeedback({ type: 'wrong', x: pos.x, y: pos.y, id: ++nextId });
      bubblesRef.current[idx] = { ...bubble, state: 'shaking', animStartTime: now };
      loseLife();
    }

    setTimeout(() => setFeedback(null), 800);
  }, [loseLife, createTarget, store]);

  // Start / restart
  const startGame = useCallback(() => {
    nextId = 0;
    const now = performance.now();

    // Initialize session tracking in store
    store.startSession();

    const initialTargets = [];
    for (let i = 0; i < TARGET_COUNT; i++) {
      initialTargets.push(createTarget(initialTargets));
    }

    // Build bubbles with unique characters
    const initialBubbles = [];
    const usedChars = [];
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const bubble = createBubbleForSlot(i, now, initialTargets, usedChars);
      bubble.spawnTime = now - Math.random() * 10000; // stagger over first 10s of 30s
      usedChars.push(bubble.character);
      initialBubbles.push(bubble);
    }

    // Guarantee at least one bubble per target
    initialTargets.forEach(target => {
      const has = initialBubbles.some(b => b.character === target.character);
      if (!has) {
        const idx = initialBubbles.findIndex(
          b => !initialTargets.some(t => t.character === b.character)
        );
        if (idx >= 0) {
          initialBubbles[idx].character = target.character;
          initialBubbles[idx].pinyin = target.pinyin;
          initialBubbles[idx].translation = target.translation;
        }
      }
    });

    bubblesRef.current = initialBubbles;
    targetsRef.current = initialTargets;
    scoreRef.current = 0;
    livesRef.current = INITIAL_LIVES;
    correctCountRef.current = 0;

    setBubbles(initialBubbles);
    setTargets(initialTargets);
    setScore(0);
    setLives(INITIAL_LIVES);
    setCorrectCount(0);
    setFeedback(null);
    setGameState('playing');
    gameStateRef.current = 'playing';
    animRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop, createTarget, createBubbleForSlot, store]);

  useEffect(() => {
    if (gameState !== 'playing' && animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, [gameState]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ─── Idle screen ───
  if (gameState === 'idle') {
    return (
      <div className="bopomon-character-find">
        <div className="bopomon-character-find__game-container">
          <div className="bopomon-character-find__game-area">
            <div className="bopomon-character-find__start-screen">
              <h2 className="bopomon-character-find__start-title">Character Find</h2>
              <p className="bopomon-character-find__start-instructions">
                Match characters to their pinyin or translation before they expire
              </p>
              <div className="bopomon-character-find__rules">
                <div className="bopomon-character-find__rule">
                  <span className="bopomon-character-find__rule-icon">&#10003;</span>
                  <span>Tap the right character &rarr; new target</span>
                </div>
                <div className="bopomon-character-find__rule">
                  <span className="bopomon-character-find__rule-icon bopomon-character-find__rule-icon--bad">&#10007;</span>
                  <span>Wrong tap or bubble expires &rarr; lose a life</span>
                </div>
                <div className="bopomon-character-find__rule">
                  <span className="bopomon-character-find__rule-icon bopomon-character-find__rule-icon--streak">5</span>
                  <span>Every 5 correct &rarr; gain a life</span>
                </div>
              </div>
              <button className="bopomon-character-find__start-button" onClick={startGame}>
                Start Game
              </button>
            </div>
          </div>
          <div className="bopomon-character-find__side-panel">
            <div className="bopomon-character-find__panel-placeholder">
              Targets will appear here
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── End screen ───
  if (gameState === 'ended') {
    return (
      <div className="bopomon-character-find">
        <div className="bopomon-character-find__game-container">
          <div className="bopomon-character-find__game-area">
            <div className="bopomon-character-find__end-screen">
              <h2 className="bopomon-character-find__end-title">Game Over</h2>
              <div className="bopomon-character-find__final-score">
                <span className="bopomon-character-find__final-score-label">Final Score</span>
                <span className="bopomon-character-find__final-score-value">{score}</span>
              </div>
              <button className="bopomon-character-find__play-again-button" onClick={startGame}>
                Play Again
              </button>
            </div>
          </div>
          <div className="bopomon-character-find__side-panel" />
        </div>
      </div>
    );
  }

  // ─── Playing ───
  return (
    <div className="bopomon-character-find">
      <div className="bopomon-character-find__game-container">
        <div className="bopomon-character-find__game-area">
          {bubbles.map(bubble => {
            const pos = SLOT_POSITIONS[bubble.slotIndex];
            const progress = bubble.progress || 0;
            const dashOffset = TIMER_CIRCUMFERENCE * (1 - progress);
            const color = getTimerColor(progress);
            const isDanger = bubble.state === 'normal' && progress > 0.75;

            return (
              <button
                key={bubble.id}
                className={
                  'bopomon-character-find__bubble' +
                  (isDanger ? ' bopomon-character-find__bubble--danger' : '') +
                  (bubble.state === 'popping' ? ' bopomon-character-find__bubble--pop' : '') +
                  (bubble.state === 'shaking' ? ' bopomon-character-find__bubble--shake' : '') +
                  (bubble.state === 'expiring' ? ' bopomon-character-find__bubble--expire' : '')
                }
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                onClick={() => handleBubbleClick(bubble.id)}
              >
                <svg className="bopomon-character-find__timer-ring" viewBox="0 0 72 72">
                  <circle
                    cx="36"
                    cy="36"
                    r={TIMER_RADIUS}
                    fill="none"
                    stroke={color}
                    strokeWidth="3.5"
                    strokeDasharray={TIMER_CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    transform="rotate(-90 36 36)"
                  />
                </svg>
                <span className="bopomon-character-find__bubble-char">{bubble.character}</span>
              </button>
            );
          })}
          {feedback && (
            <div
              key={feedback.id}
              className={`bopomon-character-find__feedback bopomon-character-find__feedback--${feedback.type}`}
              style={{ left: `${feedback.x}%`, top: `${feedback.y}%` }}
            >
              {feedback.type === 'correct' ? '+1' : '\u2717'}
            </div>
          )}
        </div>

        <div className="bopomon-character-find__side-panel">
          <div className="bopomon-character-find__stats">
            <div className="bopomon-character-find__stat-item">
              <span className="bopomon-character-find__stat-label">Score</span>
              <span className="bopomon-character-find__stat-value bopomon-character-find__stat-value--score">{score}</span>
            </div>
            <div className="bopomon-character-find__stat-item">
              <span className="bopomon-character-find__stat-label">Lives</span>
              <div className="bopomon-character-find__lives">
                {Array.from({ length: lives }).map((_, i) => (
                  <span key={i} className="bopomon-character-find__life" />
                ))}
              </div>
            </div>
            <div className="bopomon-character-find__stat-item">
              <span className="bopomon-character-find__stat-label">Next Life</span>
              <div className="bopomon-character-find__streak-pips">
                {Array.from({ length: CORRECT_FOR_LIFE }).map((_, i) => (
                  <span
                    key={i}
                    className={
                      'bopomon-character-find__streak-pip' +
                      (i < correctCount ? ' bopomon-character-find__streak-pip--filled' : '')
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bopomon-character-find__targets">
            <h3 className="bopomon-character-find__targets-title">Find These</h3>
            <div className="bopomon-character-find__targets-list">
              {targets.map(target => (
                <div key={target.id} className="bopomon-character-find__target-card">
                  <span className="bopomon-character-find__target-hint">
                    {target.showAs === 'pinyin' ? target.pinyin : target.translation}
                  </span>
                  <span className="bopomon-character-find__target-type">
                    {target.showAs}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bopomon-character-find__hint">
            Click or tap the matching character
          </div>
        </div>
      </div>
    </div>
  );
}
