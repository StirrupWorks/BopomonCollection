import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createComponentStore, FALLBACK_BOPOMON, ALL_GLYPHS } from './BopomonGlyphCatcher.store.js';
import { GlyphData, numberedToAccented } from './pinyinConverter.js';
import './BopomonGlyphCatcher.styles.css';

const GAME_DURATION = 60;
const GLYPH_FALL_SPEED = 0.25;
const SPAWN_INTERVAL = 1600; // Half the glyphs (doubled interval)
const CORRECT_GLYPH_CHANCE = 0.25;
const AVATAR_WIDTH = 15;
const AVATAR_MOVE_SPEED = 10; // 100% faster than original 5

export default function BopomonGlyphCatcher({ __sandtrout_register_store }) {
  // Sandtrout store - only for external I/O
  const [{ useStore, storeInstance }] = useState(() => {
    const storeInstance = createComponentStore();
    return { useStore: storeInstance, storeInstance };
  });
  const sandtroutStore = useStore();

  useEffect(() => {
    __sandtrout_register_store?.(storeInstance);
  }, [storeInstance, __sandtrout_register_store]);

  // Get effective Bopomon (from Sandtrout input or fallback)
  const bopomon = sandtroutStore.getEffectiveBopomon();

  // Game state - managed by React
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'ended'
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
  const [avatarX, setAvatarX] = useState(50);
  const [fallingGlyphs, setFallingGlyphs] = useState([]);
  const [gameDuration, setGameDuration] = useState(GAME_DURATION);
  const [gameMode, setGameMode] = useState('timed'); // 'timed' | 'lives'
  const [lives, setLives] = useState(3);

  // Refs for game loop
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const lastTickRef = useRef(0);
  const glyphIdRef = useRef(0);
  const scoreRef = useRef(0); // Track score in ref to avoid stale closure
  const avatarXRef = useRef(50); // Track avatar position in ref for collision detection
  const gameAreaRef = useRef(null);
  const pointerDownRef = useRef(false);
  const livesRef = useRef(3);
  const gameModeRef = useRef('timed');

  // Helper: check if glyph is a target
  const isTargetGlyph = useCallback((glyph) => {
    if (!bopomon?.glyphs) return false;
    const glyphs = bopomon.glyphs;
    return glyph === glyphs.initial ||
           glyph === glyphs.medial ||
           glyph === glyphs.final ||
           glyph === glyphs.tone;
  }, [bopomon]);

  // Helper: get target glyphs
  const getTargetGlyphs = useCallback(() => {
    if (!bopomon?.glyphs) return [];
    const glyphs = bopomon.glyphs;
    const targets = [];
    if (glyphs.initial) targets.push({ glyph: glyphs.initial, type: 'initial' });
    if (glyphs.medial) targets.push({ glyph: glyphs.medial, type: 'medial' });
    if (glyphs.final) targets.push({ glyph: glyphs.final, type: 'final' });
    if (glyphs.tone) targets.push({ glyph: glyphs.tone, type: 'tone' });
    return targets;
  }, [bopomon]);

  // Spawn a new glyph
  const spawnGlyph = useCallback(() => {
    const targetGlyphs = getTargetGlyphs();
    const shouldBeCorrect = Math.random() < CORRECT_GLYPH_CHANCE && targetGlyphs.length > 0;

    let glyphData;
    if (shouldBeCorrect) {
      glyphData = targetGlyphs[Math.floor(Math.random() * targetGlyphs.length)];
    } else {
      const nonTargets = ALL_GLYPHS.filter(g => !isTargetGlyph(g.glyph));
      if (nonTargets.length > 0) {
        glyphData = nonTargets[Math.floor(Math.random() * nonTargets.length)];
      } else if (ALL_GLYPHS.length > 0) {
        glyphData = ALL_GLYPHS[Math.floor(Math.random() * ALL_GLYPHS.length)];
      }
    }

    if (!glyphData) return null;

    return {
      id: ++glyphIdRef.current,
      glyph: glyphData.glyph,
      glyph_type: glyphData.type,
      x: Math.random() * 80 + 10,
      y: 0,
      is_correct: isTargetGlyph(glyphData.glyph)
    };
  }, [getTargetGlyphs, isTargetGlyph]);

  // Game loop using requestAnimationFrame
  const gameLoop = useCallback((timestamp) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    if (!lastSpawnRef.current) lastSpawnRef.current = timestamp;
    if (!lastTickRef.current) lastTickRef.current = timestamp;

    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    // Spawn glyphs
    if (timestamp - lastSpawnRef.current >= SPAWN_INTERVAL) {
      lastSpawnRef.current = timestamp;
      const newGlyph = spawnGlyph();
      if (newGlyph) {
        setFallingGlyphs(prev => [...prev, newGlyph]);
      }
    }

    // Update timer (every second)
    if (timestamp - lastTickRef.current >= 1000) {
      lastTickRef.current = timestamp;
      if (gameModeRef.current === 'timed') {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setGameState('ended');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setTimeRemaining(prev => prev + 1);
      }
    }

    // Update glyph positions and check collisions
    setFallingGlyphs(prev => {
      const avatarY = 85;
      const glyphSize = 8;
      const currentAvatarX = avatarXRef.current;
      const avatarLeft = currentAvatarX - AVATAR_WIDTH / 2;
      const avatarRight = currentAvatarX + AVATAR_WIDTH / 2;

      const updated = [];
      for (const glyph of prev) {
        const newY = glyph.y + GLYPH_FALL_SPEED * (deltaTime / 16); // Normalize to ~60fps

        // Check collision with avatar
        const isHorizontallyAligned = glyph.x >= avatarLeft && glyph.x <= avatarRight;
        const isAtAvatarLevel = newY >= avatarY - glyphSize && newY <= avatarY + 5;

        if (isHorizontallyAligned && isAtAvatarLevel) {
          if (glyph.is_correct) {
            // Correct glyphs disappear when caught, add score
            if (!glyph.scored) {
              scoreRef.current += 1;
              setScore(scoreRef.current);
            }
            continue; // Remove the glyph
          } else if (!glyph.scored) {
            // Incorrect glyphs fall through but mark as scored and deduct
            scoreRef.current -= 1;
            setScore(scoreRef.current);
            livesRef.current -= 1;
            setLives(livesRef.current);
            if (gameModeRef.current === 'lives' && livesRef.current <= 0) {
              setGameState('ended');
            }
            updated.push({ ...glyph, y: newY, scored: true });
            continue;
          }
        }

        // Remove if off screen
        if (newY > 105) {
          continue;
        }

        updated.push({ ...glyph, y: newY });
      }
      return updated;
    });

    // Continue loop if still playing
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [spawnGlyph]);

  // Start game
  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    scoreRef.current = 0;
    setTimeRemaining(gameMode === 'timed' ? gameDuration : 0);
    gameModeRef.current = gameMode;
    setLives(3);
    livesRef.current = 3;
    setAvatarX(50);
    avatarXRef.current = 50;
    setFallingGlyphs([]);
    lastTimeRef.current = 0;
    lastSpawnRef.current = 0;
    lastTickRef.current = 0;

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop, gameMode, gameDuration]);

  // Stop game loop when game ends
  useEffect(() => {
    if (gameState !== 'playing' && animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [gameState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setAvatarX(prev => {
          const newX = Math.max(10, prev - AVATAR_MOVE_SPEED);
          avatarXRef.current = newX;
          return newX;
        });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setAvatarX(prev => {
          const newX = Math.min(90, prev + AVATAR_MOVE_SPEED);
          avatarXRef.current = newX;
          return newX;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Pointer/touch controls for mobile
  const handlePointerDown = useCallback((e) => {
    if (gameState !== 'playing') return;
    pointerDownRef.current = true;
    e.preventDefault();
    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const clampedX = Math.max(10, Math.min(90, x));
    setAvatarX(clampedX);
    avatarXRef.current = clampedX;
  }, [gameState]);

  const handlePointerMove = useCallback((e) => {
    if (!pointerDownRef.current || gameState !== 'playing') return;
    e.preventDefault();
    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const clampedX = Math.max(10, Math.min(90, x));
    setAvatarX(clampedX);
    avatarXRef.current = clampedX;
  }, [gameState]);

  const handlePointerUp = useCallback(() => {
    pointerDownRef.current = false;
  }, []);

  // Reset to idle
  const resetGame = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setGameState('idle');
    setScore(0);
    scoreRef.current = 0;
    setTimeRemaining(gameDuration);
    setLives(3);
    livesRef.current = 3;
    setAvatarX(50);
    avatarXRef.current = 50;
    setFallingGlyphs([]);
  };

  const targetGlyphs = getTargetGlyphs();

  return (
    <div className="glyph-catcher">
      <div className="glyph-catcher__game-container">
        {/* Game Area */}
        <div
          className="glyph-catcher__game-area"
          ref={gameAreaRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ touchAction: 'none' }}
        >
          {gameState === 'idle' && (
            <div className="glyph-catcher__start-screen">
              <h2 className="glyph-catcher__start-title">Glyph Catcher</h2>
              <p className="glyph-catcher__start-instructions">
                Catch the glyphs that belong to <strong>{numberedToAccented(bopomon.pinyin)}</strong>!
              </p>
              <p className="glyph-catcher__start-hint">
                Use arrow keys or touch to move. Correct glyphs: +1, Wrong glyphs: -1
              </p>
              <div className="glyph-catcher__settings">
                <div className="glyph-catcher__setting-row">
                  <span className="glyph-catcher__setting-label">Mode</span>
                  <div className="glyph-catcher__mode-buttons">
                    <button
                      className={`glyph-catcher__mode-button${gameMode === 'timed' ? ' glyph-catcher__mode-button--active' : ''}`}
                      onClick={() => setGameMode('timed')}
                    >
                      Timed
                    </button>
                    <button
                      className={`glyph-catcher__mode-button${gameMode === 'lives' ? ' glyph-catcher__mode-button--active' : ''}`}
                      onClick={() => setGameMode('lives')}
                    >
                      3 Lives
                    </button>
                  </div>
                </div>
                {gameMode === 'timed' && (
                  <div className="glyph-catcher__setting-row">
                    <span className="glyph-catcher__setting-label">Duration</span>
                    <div className="glyph-catcher__duration-input">
                      <input
                        type="number"
                        className="glyph-catcher__setting-input"
                        value={gameDuration}
                        onChange={(e) => setGameDuration(Math.max(1, Math.min(600, parseInt(e.target.value) || 1)))}
                        min={1}
                        max={600}
                      />
                      <span className="glyph-catcher__setting-unit">sec</span>
                    </div>
                  </div>
                )}
              </div>
              <button
                className="glyph-catcher__start-button"
                onClick={startGame}
              >
                Start Game
              </button>
            </div>
          )}

          {gameState === 'playing' && (
            <>
              {/* Falling Glyphs */}
              {fallingGlyphs.map((glyph) => (
                <div
                  key={glyph.id}
                  className={`glyph-catcher__falling-glyph glyph-catcher__falling-glyph--${glyph.glyph_type}${glyph.scored ? ' glyph-catcher__falling-glyph--scored' : ''}`}
                  style={{
                    left: `${glyph.x}%`,
                    top: `${glyph.y}%`
                  }}
                >
                  {glyph.glyph}
                </div>
              ))}

              {/* Avatar */}
              <div
                className="glyph-catcher__avatar"
                style={{ left: `${avatarX}%` }}
              >
                <div className="glyph-catcher__avatar-body"></div>
              </div>
            </>
          )}

          {gameState === 'ended' && (
            <div className="glyph-catcher__end-screen">
              <h2 className="glyph-catcher__end-title">
                {gameMode === 'lives' && lives <= 0 ? 'Out of Lives!' : "Time's Up!"}
              </h2>
              {gameMode === 'lives' && (
                <p className="glyph-catcher__end-time">Survived for {timeRemaining}s</p>
              )}
              <div className="glyph-catcher__final-score">
                <span className="glyph-catcher__final-score-label">Final Score</span>
                <span className={`glyph-catcher__final-score-value ${score >= 0 ? 'glyph-catcher__final-score-value--positive' : 'glyph-catcher__final-score-value--negative'}`}>
                  {score}
                </span>
              </div>
              <button
                className="glyph-catcher__play-again-button"
                onClick={startGame}
              >
                Play Again
              </button>
              <button
                className="glyph-catcher__back-button"
                onClick={resetGame}
              >
                Back to Start
              </button>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="glyph-catcher__side-panel">
          {/* Timer and Score */}
          <div className="glyph-catcher__stats">
            <div className="glyph-catcher__stat-item">
              <span className="glyph-catcher__stat-label">Time</span>
              <span className={`glyph-catcher__stat-value glyph-catcher__stat-value--time ${gameMode === 'timed' && timeRemaining <= 10 ? 'glyph-catcher__stat-value--warning' : ''}`}>
                {timeRemaining}s
              </span>
            </div>
            <div className="glyph-catcher__stat-item">
              <span className="glyph-catcher__stat-label">Score</span>
              <span className={`glyph-catcher__stat-value ${score >= 0 ? 'glyph-catcher__stat-value--positive' : 'glyph-catcher__stat-value--negative'}`}>
                {score}
              </span>
            </div>
            <div className="glyph-catcher__stat-item">
              <span className="glyph-catcher__stat-label">Lives</span>
              <span className="glyph-catcher__stat-value glyph-catcher__lives">
                {[1, 2, 3].map(i => (
                  <span key={i} className={`glyph-catcher__life${i > lives ? ' glyph-catcher__life--lost' : ''}`} />
                ))}
              </span>
            </div>
          </div>

          {/* Bopomon Card */}
          <div className="glyph-catcher__bopomon-card">
            <div className="glyph-catcher__card-header">
              <div className="glyph-catcher__card-pinyin">{numberedToAccented(bopomon.pinyin).toUpperCase()}</div>
              <div className="glyph-catcher__card-bopomofo">{bopomon.bopomofo}</div>
              <div className="glyph-catcher__card-character">{bopomon.traditional_character || ''}</div>
            </div>

            <div className="glyph-catcher__card-image" key={bopomon.png_tcg_asset_fn}>
              <img
                src={`/assets/bopomon/${bopomon.png_tcg_asset_fn}.png`}
                alt={bopomon.pinyin}
                className="glyph-catcher__card-image-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="glyph-catcher__card-image-placeholder" style={{ display: 'none' }}>
                {bopomon.bopomofo}
              </div>
            </div>

            <div className="glyph-catcher__card-body">
              <div className="glyph-catcher__card-stats">
                <div className="glyph-catcher__card-stat-row">
                  <span className="glyph-catcher__card-glyph">{bopomon.glyphs?.initial || '∅'}</span>
                  <span className="glyph-catcher__card-stat-value">
                    {GlyphData.initials[bopomon.glyphs?.initial]?.name || 'Unknown'}
                  </span>
                </div>
                <div className="glyph-catcher__card-stat-row">
                  <span className="glyph-catcher__card-glyph">{bopomon.glyphs?.medial || '∅'}</span>
                  <span className="glyph-catcher__card-stat-value">
                    {GlyphData.medials[bopomon.glyphs?.medial]?.name || 'Unknown'}
                  </span>
                </div>
                <div className="glyph-catcher__card-stat-row">
                  <span className="glyph-catcher__card-glyph">{bopomon.glyphs?.final || '∅'}</span>
                  <span className="glyph-catcher__card-stat-value">{bopomon.element}</span>
                </div>
                <div className="glyph-catcher__card-stat-row">
                  <span className="glyph-catcher__card-glyph">{bopomon.glyphs?.tone}</span>
                  <span className="glyph-catcher__card-stat-value">{bopomon.texture}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Target Glyphs */}
          <div className="glyph-catcher__targets">
            <h3 className="glyph-catcher__targets-title">Target Glyphs</h3>
            <div className="glyph-catcher__targets-list">
              {targetGlyphs.map((target, index) => (
                <div key={index} className={`glyph-catcher__target-glyph glyph-catcher__target-glyph--${target.type}`}>
                  {target.glyph}
                </div>
              ))}
            </div>
          </div>

          {/* Controls Hint */}
          <div className="glyph-catcher__controls-hint">
            <span className="glyph-catcher__key">←</span>
            <span className="glyph-catcher__key">→</span>
            <span className="glyph-catcher__controls-text">to move</span>
          </div>
        </div>
      </div>
    </div>
  );
}
