export const inputValidators = {
  word_bank_input(value) {
    if (value == null) return null; // Optional - will use default word bank
    if (!value.content) return 'Word bank input must have content property';
    if (!Array.isArray(value.content)) return 'Word bank content must be an array';
    if (value.content.length === 0) return null; // Empty array is valid - will use default

    for (let i = 0; i < value.content.length; i++) {
      const word = value.content[i];
      if (!word.character) return `Word at index ${i} missing character property`;
      if (!word.pinyin) return `Word at index ${i} missing pinyin property`;
      if (!word.translation) return `Word at index ${i} missing translation property`;
    }
    return null; // Valid
  }
};

export const outputValidators = {
  session_misses(value) {
    if (!value) return 'No session misses provided';
    if (!value.content) return 'Session misses must have content property';
    if (!Array.isArray(value.content)) return 'Session misses content must be an array';
    if (!value.metadata) return 'Session misses must have metadata property';
    if (typeof value.metadata.wrong_click_count !== 'number') return 'Metadata missing wrong_click_count';
    if (typeof value.metadata.expired_count !== 'number') return 'Metadata missing expired_count';
    if (typeof value.metadata.total_miss_count !== 'number') return 'Metadata missing total_miss_count';
    return null; // Valid
  }
};
