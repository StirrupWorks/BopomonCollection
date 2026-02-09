import { create } from 'zustand';
import { GlyphData, pinyinToBopomofo } from './pinyinConverter.js';

// Fallback Bopomon input: xie4 (寫 - write) - only non-derivable fields
const FALLBACK_INPUT = {
  bpm_codex_id: 0,
  pinyin: 'xie4',
  traditional_character: '寫',
  rarity: 'common',
  png_tcg_asset_fn: 'xie4 - write'
};

/**
 * Derive all Bopomon fields from pinyin + minimal input
 * This ensures glyphs, bopomofo, element, texture are always correct
 */
function deriveBopomon(input) {
  if (!input?.pinyin) return null;

  const parsed = pinyinToBopomofo(input.pinyin);

  return {
    // Pass through non-derivable fields
    bpm_codex_id: input.bpm_codex_id,
    pinyin: input.pinyin,
    traditional_character: input.traditional_character,
    rarity: input.rarity,
    png_tcg_asset_fn: input.png_tcg_asset_fn,
    // Derived fields
    bopomofo: parsed.bopomofo,
    element: parsed.attributes.element,
    texture: parsed.attributes.skinTexture,
    glyphs: {
      initial: parsed.initial,
      medial: parsed.medial,
      final: parsed.final,
      tone: parsed.tone
    }
  };
}

// Pre-derive fallback so it's ready to use
export const FALLBACK_BOPOMON = deriveBopomon(FALLBACK_INPUT);

// Build array of all available glyphs by type
const buildGlyphPool = () => {
  const pool = {
    initials: Object.keys(GlyphData.initials).filter(g => g),
    medials: Object.keys(GlyphData.medials).filter(g => g),
    finals: Object.keys(GlyphData.finals).filter(g => g),
    tones: Object.keys(GlyphData.tones).filter(g => g)
  };
  return pool;
};

const GLYPH_POOL = buildGlyphPool();
export const ALL_GLYPHS = [
  ...GLYPH_POOL.initials.map(g => ({ glyph: g, type: 'initial' })),
  ...GLYPH_POOL.medials.map(g => ({ glyph: g, type: 'medial' })),
  ...GLYPH_POOL.finals.map(g => ({ glyph: g, type: 'final' })),
  ...GLYPH_POOL.tones.map(g => ({ glyph: g, type: 'tone' }))
];

// Sandtrout store - only handles external I/O
export const createComponentStore = () => {
  return create((set, get) => ({
    // External input from Sandtrout orchestration (derived)
    bopomon_data: null,

    // Setter for orchestration - derives all fields from pinyin
    setSelectedBopomon: (input) => {
      const rawInput = input?.content || null;
      const bopomon = rawInput ? deriveBopomon(rawInput) : null;
      set({ bopomon_data: bopomon });
    },

    // Get effective Bopomon (uses fallback if none provided)
    getEffectiveBopomon: () => {
      const { bopomon_data } = get();
      return bopomon_data || FALLBACK_BOPOMON;
    }
  }));
};
