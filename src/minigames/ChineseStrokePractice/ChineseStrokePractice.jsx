import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createComponentStore } from './ChineseStrokePractice.store.js';
import './ChineseStrokePractice.styles.css';

export default function ChineseStrokePractice({ __sandtrout_register_store }) {
  const [{ useStore, storeInstance }] = useState(() => {
    const storeInstance = createComponentStore();
    return { useStore: storeInstance, storeInstance };
  });
  const store = useStore();
  const canvasRef = useRef(null);

  useEffect(() => {
    __sandtrout_register_store?.(storeInstance);
  }, [storeInstance, __sandtrout_register_store]);

  const getPointerPosition = useCallback((e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }, []);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getPointerPosition(e, canvas);
    store.startDrawing(pos);
  }, [store, getPointerPosition]);

  const handlePointerMove = useCallback((e) => {
    if (!store.is_drawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const pos = getPointerPosition(e, canvas);
    store.addPoint(pos);
  }, [store, getPointerPosition]);

  const handlePointerUp = useCallback(() => {
    if (!store.is_drawing) return;
    store.endDrawing();
  }, [store]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw reference path (ideal stroke) if grading is done
    const refPath = store.reference_path;
    if (refPath && refPath.length > 1 && store.grade_result) {
      ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)'; // Semi-transparent green
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(refPath[0].x, refPath[0].y);
      refPath.slice(1).forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }

    // Draw the user's stroke
    const points = store.current_stroke;
    if (points.length > 1) {
      // Color based on grade result
      if (store.grade_result) {
        if (store.grade_result.passed) {
          ctx.strokeStyle = '#1a1a1a'; // Black for pass (reference shows correct)
        } else {
          ctx.strokeStyle = '#c62828'; // Red for fail
        }
      } else {
        ctx.strokeStyle = '#1a1a1a'; // Black while drawing
      }

      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
  }, [store.current_stroke, store.grade_result, store.reference_path]);

  const currentStroke = store.getCurrentStroke();
  const strokes = store.getStrokes();
  const grade = store.grade_result;

  const getScoreClass = (score) => {
    if (score >= 90) return 'chinese-stroke-practice__score--excellent';
    if (score >= 75) return 'chinese-stroke-practice__score--good';
    if (score >= 60) return 'chinese-stroke-practice__score--pass';
    return 'chinese-stroke-practice__score--fail';
  };

  return (
    <div className="chinese-stroke-practice">
      <header className="chinese-stroke-practice__header">
        <h1 className="chinese-stroke-practice__title">Stroke Practice</h1>
        <div className="chinese-stroke-practice__stroke-tabs">
          {strokes.map((stroke, idx) => (
            <button
              key={stroke.id}
              className={`chinese-stroke-practice__stroke-tab ${
                store.current_item_index === idx ? 'chinese-stroke-practice__stroke-tab--active' : ''
              }`}
              onClick={() => store.goToStroke(idx)}
            >
              {stroke.name}
            </button>
          ))}
        </div>
      </header>

      <div className="chinese-stroke-practice__main">
        {currentStroke && (
          <div className="chinese-stroke-practice__info-panel">
            <div className="chinese-stroke-practice__stroke-name">
              <span className="chinese-stroke-practice__character">{currentStroke.name}</span>
              <span className="chinese-stroke-practice__pinyin">{currentStroke.pinyin}</span>
            </div>
            <div className="chinese-stroke-practice__meaning">{currentStroke.meaning}</div>
            <p className="chinese-stroke-practice__instruction">{currentStroke.instruction}</p>
          </div>
        )}

        {/* Grade display above canvas - always reserves space */}
        <div className={`chinese-stroke-practice__grade ${
          grade
            ? (grade.passed ? 'chinese-stroke-practice__grade--pass' : 'chinese-stroke-practice__grade--fail')
            : 'chinese-stroke-practice__grade--empty'
        }`}>
          {grade ? (
            <>
              <span className={`chinese-stroke-practice__score ${getScoreClass(grade.score)}`}>
                {grade.score}
              </span>
              <span className="chinese-stroke-practice__feedback">{grade.feedback}</span>
              {grade.issues.length > 1 && (
                <span className="chinese-stroke-practice__extra-issues">
                  +{grade.issues.length - 1} more
                </span>
              )}
            </>
          ) : (
            <span className="chinese-stroke-practice__grade-placeholder">Draw the stroke</span>
          )}
        </div>

        <div className="chinese-stroke-practice__canvas-container">
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className="chinese-stroke-practice__canvas"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
          {grade && (
            <div className="chinese-stroke-practice__canvas-hint">
              {grade.passed ? 'Green = ideal path' : 'Tap to try again'}
            </div>
          )}
        </div>

        <div className="chinese-stroke-practice__nav">
          <button
            className="chinese-stroke-practice__nav-btn"
            onClick={store.prevStroke}
            disabled={store.current_item_index === 0}
          >
            Previous
          </button>
          <span className="chinese-stroke-practice__progress">
            {store.current_item_index + 1} / {strokes.length}
          </span>
          <button
            className="chinese-stroke-practice__nav-btn"
            onClick={store.nextStroke}
            disabled={store.current_item_index >= strokes.length - 1}
          >
            Next
          </button>
        </div>
      </div>

      <footer className="chinese-stroke-practice__footer">
        <div className="chinese-stroke-practice__stats">
          Passed: {store.completed_count} / {strokes.length}
        </div>
      </footer>
    </div>
  );
}
