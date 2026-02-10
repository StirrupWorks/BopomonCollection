export { default } from './ChineseStrokePractice.jsx';

export const metadata = {
  id: 'chinese_stroke_practice',
  name: 'Chinese Stroke Practice',
  inputs: {
    lesson_config: {
      schema: {
        type: 'object',
        properties: {
          content: {
            type: 'object',
            properties: {
              start_index: { type: 'number' }
            }
          },
          metadata: { type: 'object' }
        },
        required: ['content']
      },
      setter: 'setLessonConfig'
    }
  },
  outputs: {
    practice_result: {
      schema: {
        type: 'object',
        properties: {
          content: {
            type: 'object',
            properties: {
              completed_strokes: { type: 'number' },
              total_strokes: { type: 'number' },
              total_practice_time_ms: { type: 'number' }
            }
          },
          metadata: { type: 'object' }
        },
        required: ['content']
      }
    }
  },
  internal_variables: {
    current_item_index: 'Index of the stroke being practiced (0-7)',
    is_drawing: 'Whether user is currently drawing',
    current_stroke: 'Array of {x, y} points for the current stroke attempt',
    has_drawn: 'Whether user has completed a stroke attempt',
    grade_result: 'Grading result: { score, passed, feedback, issues }',
    completed_count: 'Number of strokes passed'
  }
};
