export const inputValidators = {
  selected_bopomon(value) {
    if (!value) return 'No Bopomon selected';
    if (!value.content) return 'Selected Bopomon must have content property';
    if (!value.content.glyphs) return 'Bopomon must have glyphs property';

    const glyphs = value.content.glyphs;
    const hasAtLeastOneGlyph = glyphs.initial || glyphs.medial || glyphs.final || glyphs.tone;
    if (!hasAtLeastOneGlyph) return 'Bopomon must have at least one glyph';

    return null;
  }
};

export const outputValidators = {};
