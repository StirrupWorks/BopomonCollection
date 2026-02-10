import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Stroke definitions with phase-based grading parameters
const STROKE_DEFINITIONS = {
  heng: {
    phases: [{ target_angle: 0, tolerance: 15 }],
    ideal_path: [{ x: 0, y: 0 }, { x: 1, y: -0.05 }],
  },
  shu: {
    phases: [{ target_angle: 90, tolerance: 15 }],
    ideal_path: [{ x: 0, y: 0 }, { x: 0, y: 1 }],
  },
  pie: {
    phases: [{ target_angle: 135, tolerance: 20 }],
    ideal_path: [
      { x: 0, y: 0 },
      { x: -0.3, y: 0.4 },
      { x: -0.7, y: 0.85 },
      { x: -0.85, y: 1 }
    ],
  },
  na: {
    phases: [{ target_angle: 45, tolerance: 20 }],
    ideal_path: [
      { x: 0, y: 0 },
      { x: 0.3, y: 0.35 },
      { x: 0.7, y: 0.75 },
      { x: 1, y: 1 }
    ],
  },
  dian: {
    phases: [{ target_angle: 75, tolerance: 30 }],
    ideal_path: [{ x: 0, y: 0 }, { x: 0.3, y: 1 }],
    max_length: 80,
  },
  ti: {
    phases: [{ target_angle: -35, tolerance: 20 }],
    ideal_path: [{ x: 0, y: 0 }, { x: 1, y: -0.7 }],
  },
  zhe: {
    phases: [
      { target_angle: 0, tolerance: 20 },   // Phase 1: horizontal
      { target_angle: 90, tolerance: 20 }   // Phase 2: vertical
    ],
    transition: { min_ratio: 0.3, max_ratio: 0.6, penalty: 15 },
    ideal_path: [
      { x: 0, y: 0 },
      { x: 0.6, y: 0 },
      { x: 0.6, y: 0.05 },
      { x: 0.6, y: 0.9 }
    ],
  },
  gou: {
    phases: [{ target_angle: 90, tolerance: 20 }],  // Main stroke: vertical
    hook: { min_ratio: 0.7 },  // Hook should start in last 30% of stroke
    ideal_path: [
      { x: 0, y: 0 },
      { x: 0, y: 0.85 },
      { x: -0.15, y: 0.75 }
    ],
  }
};

// The 8 basic Chinese strokes
const BASIC_STROKES = [
  { id: 'heng', name: '横', pinyin: 'héng', meaning: 'Horizontal', instruction: 'Draw left to right, keep it level' },
  { id: 'shu', name: '竖', pinyin: 'shù', meaning: 'Vertical', instruction: 'Draw straight down' },
  { id: 'pie', name: '撇', pinyin: 'piě', meaning: 'Left-falling', instruction: 'Draw diagonally down-left (~45°)' },
  { id: 'na', name: '捺', pinyin: 'nà', meaning: 'Right-falling', instruction: 'Draw diagonally down-right (~45°)' },
  { id: 'dian', name: '点', pinyin: 'diǎn', meaning: 'Dot', instruction: 'Quick short downward tap' },
  { id: 'ti', name: '提', pinyin: 'tí', meaning: 'Rising', instruction: 'Draw diagonally up-right' },
  { id: 'zhe', name: '折', pinyin: 'zhé', meaning: 'Turning', instruction: 'Draw right, then turn sharply down (90°)' },
  { id: 'gou', name: '钩', pinyin: 'gōu', meaning: 'Hook', instruction: 'Draw down, then hook up at the end' },
];

// Resample stroke to fixed number of evenly-spaced points along path
const resampleStroke = (points, numSamples = 20) => {
  if (points.length < 2) return points;
  if (numSamples < 2) return [points[0], points[points.length - 1]];

  // Step 1: Calculate cumulative distance at each point
  const cumDist = [0];
  for (let i = 1; i < points.length; i++) {
    const d = Math.hypot(
      points[i].x - points[i-1].x,
      points[i].y - points[i-1].y
    );
    cumDist.push(cumDist[i-1] + d);
  }

  const totalLength = cumDist[cumDist.length - 1];
  if (totalLength === 0) return [points[0]];

  // Step 2: Sample at evenly spaced distances along path
  const resampled = [];
  for (let s = 0; s < numSamples; s++) {
    const targetDist = (s / (numSamples - 1)) * totalLength;

    // Find which segment contains this distance
    let i = 1;
    while (i < cumDist.length && cumDist[i] < targetDist) {
      i++;
    }

    if (i >= cumDist.length) {
      // Past the end, use last point
      resampled.push({ ...points[points.length - 1] });
    } else {
      // Interpolate between points[i-1] and points[i]
      const segStart = cumDist[i-1];
      const segEnd = cumDist[i];
      const segLength = segEnd - segStart;

      if (segLength === 0) {
        resampled.push({ ...points[i-1] });
      } else {
        const t = (targetDist - segStart) / segLength;
        resampled.push({
          x: points[i-1].x + t * (points[i].x - points[i-1].x),
          y: points[i-1].y + t * (points[i].y - points[i-1].y)
        });
      }
    }
  }

  return resampled;
};

// Grading helpers
const getBoundingBox = (points) => {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  };
};

// Calculate angle of a segment in degrees (screen coords: 0=right, 90=down)
const getSegmentAngle = (p1, p2) => {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
};

// Calculate angle difference, handling wraparound
const angleDifference = (a1, a2) => {
  let diff = Math.abs(a1 - a2);
  if (diff > 180) diff = 360 - diff;
  return diff;
};

// Calculate penalty for angle deviation
const calculatePenalty = (deviation, tolerance) => {
  if (deviation <= tolerance) return 0;
  return 3 + (deviation - tolerance) / 5;
};

// Find transition point in multi-phase stroke (where angle changes most)
const findTransitionPoint = (points, phase1Angle, phase2Angle) => {
  if (points.length < 4) return null;

  let bestIndex = -1;
  let bestScore = -Infinity;

  // Look for the point where we transition from phase1 angle to phase2 angle
  for (let i = 2; i < points.length - 1; i++) {
    // Average angle before this point
    let beforeAngles = [];
    for (let j = 1; j <= i; j++) {
      beforeAngles.push(getSegmentAngle(points[j-1], points[j]));
    }
    const avgBefore = beforeAngles.reduce((a, b) => a + b, 0) / beforeAngles.length;

    // Average angle after this point
    let afterAngles = [];
    for (let j = i + 1; j < points.length; j++) {
      afterAngles.push(getSegmentAngle(points[j-1], points[j]));
    }
    if (afterAngles.length === 0) continue;
    const avgAfter = afterAngles.reduce((a, b) => a + b, 0) / afterAngles.length;

    // Score: how well does before match phase1 and after match phase2?
    const phase1Match = -angleDifference(avgBefore, phase1Angle);
    const phase2Match = -angleDifference(avgAfter, phase2Angle);
    const score = phase1Match + phase2Match;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex >= 0 ? { index: bestIndex, ratio: bestIndex / (points.length - 1) } : null;
};

// Main grading function using resampled points and phase-based checking
const gradeStroke = (userPoints, strokeId) => {
  if (!userPoints || userPoints.length < 5) {
    return { score: 0, passed: false, feedback: 'Stroke too short', issues: ['Draw a longer stroke'] };
  }

  const def = STROKE_DEFINITIONS[strokeId];
  if (!def) {
    return { score: 0, passed: false, feedback: 'Unknown stroke type', issues: [] };
  }

  // Resample to 20 evenly-spaced points
  const points = resampleStroke(userPoints, 20);
  if (points.length < 2) {
    return { score: 0, passed: false, feedback: 'Stroke too short', issues: [] };
  }

  let totalPenalty = 0;
  const issues = [];

  // Check for max_length (dian)
  if (def.max_length) {
    const bbox = getBoundingBox(userPoints);
    const diagonal = Math.hypot(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY);
    if (diagonal > def.max_length) {
      totalPenalty += 15;
      issues.push('Dot should be shorter');
    }
  }

  // Single-phase strokes (skip if has hook - handled separately)
  if (def.phases.length === 1 && !def.hook) {
    const { target_angle, tolerance } = def.phases[0];

    for (let i = 1; i < points.length; i++) {
      const segmentAngle = getSegmentAngle(points[i-1], points[i]);
      const deviation = angleDifference(segmentAngle, target_angle);
      const penalty = calculatePenalty(deviation, tolerance);

      if (penalty > 0) {
        totalPenalty += penalty;
      }
    }

    // Add issue if average deviation is high
    const avgPenalty = totalPenalty / (points.length - 1);
    if (avgPenalty > 3) {
      issues.push(`Angle off from ideal ${target_angle}°`);
    } else if (avgPenalty > 1) {
      issues.push('Angle slightly off');
    }
  }

  // Multi-phase stroke: zhe (turn)
  if (def.phases.length === 2 && def.transition) {
    const phase1 = def.phases[0];
    const phase2 = def.phases[1];
    const transition = def.transition;

    // Find transition point
    const transitionPoint = findTransitionPoint(points, phase1.target_angle, phase2.target_angle);

    if (!transitionPoint) {
      totalPenalty += 30;
      issues.push('Could not detect turn');
    } else {
      // Check transition timing
      if (transitionPoint.ratio < transition.min_ratio) {
        totalPenalty += transition.penalty;
        issues.push('Turn too early');
      } else if (transitionPoint.ratio > transition.max_ratio) {
        totalPenalty += transition.penalty;
        issues.push('Turn too late');
      }

      // Grade phase 1 segments
      for (let i = 1; i <= transitionPoint.index; i++) {
        const segmentAngle = getSegmentAngle(points[i-1], points[i]);
        const deviation = angleDifference(segmentAngle, phase1.target_angle);
        totalPenalty += calculatePenalty(deviation, phase1.tolerance);
      }

      // Grade phase 2 segments
      for (let i = transitionPoint.index + 1; i < points.length; i++) {
        const segmentAngle = getSegmentAngle(points[i-1], points[i]);
        const deviation = angleDifference(segmentAngle, phase2.target_angle);
        totalPenalty += calculatePenalty(deviation, phase2.tolerance);
      }
    }
  }

  // Special case: gou (hook) - main stroke + hook at end
  if (def.hook) {
    const phase1 = def.phases[0];
    const hookMinRatio = def.hook.min_ratio;
    const hookStartIndex = Math.floor(points.length * hookMinRatio);

    // Grade main stroke (up to hook region)
    for (let i = 1; i < hookStartIndex; i++) {
      const segmentAngle = getSegmentAngle(points[i-1], points[i]);
      const deviation = angleDifference(segmentAngle, phase1.target_angle);
      totalPenalty += calculatePenalty(deviation, phase1.tolerance);
    }

    // Check for hook: last segment must go up (dy < 0) and left (dx < 0)
    const lastPoint = points[points.length - 1];
    const secondLastPoint = points[points.length - 2];
    const hookDx = lastPoint.x - secondLastPoint.x;
    const hookDy = lastPoint.y - secondLastPoint.y;

    const hasHook = hookDx < 0 && hookDy < 0;

    if (!hasHook) {
      totalPenalty += 25;
      issues.push('Hook should flick up and left');
    }
  }

  const finalScore = Math.max(0, Math.round(100 - totalPenalty));

  let feedback = 'Excellent!';
  if (finalScore < 90) feedback = 'Good job!';
  if (finalScore < 75) feedback = 'Getting there';
  if (finalScore < 60) feedback = 'Keep practicing';
  if (finalScore < 40) feedback = 'Try again';
  if (issues.length > 0) feedback = issues[0];

  return {
    score: finalScore,
    passed: finalScore >= 60,
    feedback,
    issues
  };
};

// Generate ideal reference path based on user's start point and stroke size
const generateReferencePath = (strokeId, startPoint, userPoints) => {
  const def = STROKE_DEFINITIONS[strokeId];
  if (!def || !def.ideal_path || !startPoint || !userPoints || userPoints.length < 2) {
    return null;
  }

  const bbox = getBoundingBox(userPoints);
  const userWidth = bbox.maxX - bbox.minX;
  const userHeight = bbox.maxY - bbox.minY;

  // Use the larger dimension as scale factor
  const scale = Math.max(userWidth, userHeight, 50); // minimum 50px

  // Transform ideal path to start from user's start point at user's scale
  return def.ideal_path.map(p => ({
    x: startPoint.x + p.x * scale,
    y: startPoint.y + p.y * scale
  }));
};

export const createComponentStore = () => create(
  subscribeWithSelector((set, get) => ({
    // External inputs
    lesson_config: null,

    // External outputs
    practice_result: null,

    // Internal state
    current_item_index: 0,
    is_drawing: false,
    current_stroke: [],
    has_drawn: false,
    grade_result: null,
    reference_path: null,    // Ideal stroke overlay
    completed_count: 0,
    practice_start_time: null,

    // Getters
    getStrokes: () => BASIC_STROKES,

    getCurrentStroke: () => {
      return BASIC_STROKES[get().current_item_index] || null;
    },

    // Setters
    setLessonConfig: (config) => {
      set({
        lesson_config: config,
        current_item_index: 0,
        completed_count: 0,
        practice_start_time: Date.now()
      });
    },

    setPracticeResult: (result) => {
      set({ practice_result: result });
    },

    // Drawing actions
    startDrawing: (point) => {
      const { has_drawn } = get();

      if (has_drawn) {
        set({
          current_stroke: [point],
          has_drawn: false,
          grade_result: null,
          reference_path: null,
          is_drawing: true
        });
      } else {
        if (!get().practice_start_time) {
          set({ practice_start_time: Date.now() });
        }
        set({
          is_drawing: true,
          current_stroke: [point]
        });
      }
    },

    addPoint: (point) => {
      if (!get().is_drawing) return;
      set((state) => ({
        current_stroke: [...state.current_stroke, point]
      }));
    },

    endDrawing: () => {
      const { is_drawing, current_stroke } = get();
      if (!is_drawing) return;

      set({ is_drawing: false, has_drawn: true });

      const currentStroke = get().getCurrentStroke();
      if (currentStroke && current_stroke.length >= 5) {
        const result = gradeStroke(current_stroke, currentStroke.id);

        // Generate reference path from user's start point
        const refPath = generateReferencePath(
          currentStroke.id,
          current_stroke[0],
          current_stroke
        );

        set({ grade_result: result, reference_path: refPath });

        if (result.passed) {
          set((state) => ({ completed_count: state.completed_count + 1 }));
        }

        get().updatePracticeResult();
      } else {
        set({
          grade_result: { score: 0, passed: false, feedback: 'Stroke too short', issues: [] },
          reference_path: null
        });
      }
    },

    clearStroke: () => {
      set({
        current_stroke: [],
        has_drawn: false,
        grade_result: null,
        reference_path: null
      });
    },

    // Navigation
    nextStroke: () => {
      const { current_item_index } = get();
      if (current_item_index < BASIC_STROKES.length - 1) {
        set({
          current_item_index: current_item_index + 1,
          current_stroke: [],
          has_drawn: false,
          grade_result: null,
          reference_path: null
        });
      }
    },

    prevStroke: () => {
      const { current_item_index } = get();
      if (current_item_index > 0) {
        set({
          current_item_index: current_item_index - 1,
          current_stroke: [],
          has_drawn: false,
          grade_result: null,
          reference_path: null
        });
      }
    },

    goToStroke: (index) => {
      if (index >= 0 && index < BASIC_STROKES.length) {
        set({
          current_item_index: index,
          current_stroke: [],
          has_drawn: false,
          grade_result: null,
          reference_path: null
        });
      }
    },

    updatePracticeResult: () => {
      const { completed_count, practice_start_time } = get();
      set({
        practice_result: {
          content: {
            completed_strokes: completed_count,
            total_strokes: BASIC_STROKES.length,
            total_practice_time_ms: Date.now() - (practice_start_time || Date.now())
          },
          metadata: {
            last_updated: new Date().toISOString(),
            source_component: 'chinese_stroke_practice'
          }
        }
      });
    }
  }))
);
