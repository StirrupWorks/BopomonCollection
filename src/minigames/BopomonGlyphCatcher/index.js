export { default } from './BopomonGlyphCatcher.jsx';

export const metadata = {
  id: 'bopomon_glyph_catcher',
  name: 'Bopomon Glyph Catcher',
  inputs: {
    selected_bopomon: {
      schema: {
        type: 'object',
        properties: {
          content: {
            type: 'object',
            properties: {
              bpm_codex_id: { type: 'number' },
              pinyin: { type: 'string' },
              bopomofo: { type: 'string' },
              traditional_character: { type: 'string' },
              element: { type: 'string' },
              texture: { type: 'string' },
              rarity: { type: 'string' },
              png_tcg_asset_fn: { type: 'string' },
              glyphs: {
                type: 'object',
                properties: {
                  initial: { type: 'string' },
                  medial: { type: 'string' },
                  final: { type: 'string' },
                  tone: { type: 'string' }
                }
              }
            }
          },
          metadata: { type: 'object' }
        },
        required: ['content']
      },
      setter: 'setSelectedBopomon'
    }
  },
  outputs: {},
  internal_variables: {
    game_state: 'string - "idle" | "playing" | "ended"',
    score: 'number - Current score (can be negative)',
    time_remaining: 'number - Seconds remaining (0-30)',
    avatar_x: 'number - Avatar horizontal position (0-100 percent)',
    falling_glyphs: 'array - Array of { id, glyph, x, y, is_correct, glyph_type }',
    bopomon_data: 'object | null - Parsed Bopomon from input'
  }
};
