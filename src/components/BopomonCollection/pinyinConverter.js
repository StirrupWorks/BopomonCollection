// Complete Pinyin to Bopomofo Converter

// Glyph attribute mappings
export const GlyphData = {
  initials: {
    "": { name: "Wolf", pinyin: "∅" },
    "ㄅ": { name: "Beetle", pinyin: "b" },
    "ㄆ": { name: "Elephant", pinyin: "p" },
    "ㄇ": { name: "Mouse", pinyin: "m" },
    "ㄈ": { name: "Frog", pinyin: "f" },
    "ㄉ": { name: "Stag", pinyin: "d" },
    "ㄊ": { name: "Turtle", pinyin: "t" },
    "ㄋ": { name: "Snail", pinyin: "n" },
    "ㄌ": { name: "Lion", pinyin: "l" },
    "ㄍ": { name: "Shark", pinyin: "g" },
    "ㄎ": { name: "Kangaroo", pinyin: "k" },
    "ㄏ": { name: "Horse", pinyin: "h" },
    "ㄐ": { name: "Monkey", pinyin: "j" },
    "ㄑ": { name: "Octopus", pinyin: "q" },
    "ㄒ": { name: "Crab", pinyin: "x" },
    "ㄓ": { name: "Wasp", pinyin: "zh" },
    "ㄔ": { name: "Chicken", pinyin: "ch" },
    "ㄕ": { name: "Snake", pinyin: "sh" },
    "ㄖ": { name: "Rabbit", pinyin: "r" },
    "ㄗ": { name: "Hawk", pinyin: "z" },
    "ㄘ": { name: "Butterfly", pinyin: "c" },
    "ㄙ": { name: "Spider", pinyin: "s" },
    // Historical/dialectal initials
    "ㄪ": { name: "Bat", pinyin: "v" },
    "ㄫ": { name: "Ostrich", pinyin: "ng" },
    "ㄬ": { name: "Starfish", pinyin: "gn" }
  },
  medials: {
    "": { name: "Natural", pinyin: "∅" },
    "ㄧ": { name: "Mechanical", pinyin: "i/y" },
    "ㄨ": { name: "Dream", pinyin: "u/w" },
    "ㄩ": { name: "Alien", pinyin: "ü/yu" }
  },
  finals: {
    "ㄚ": { element: "Acid", pinyin: "a" },
    "ㄛ": { element: "Rock", pinyin: "o" },
    "ㄜ": { element: "Dark", pinyin: "e" },
    "ㄝ": { element: "Sonic", pinyin: "ê" },
    "ㄞ": { element: "Ice", pinyin: "ai" },
    "ㄟ": { element: "Light", pinyin: "ei" },
    "ㄠ": { element: "Psychic", pinyin: "ao" },
    "ㄡ": { element: "Ghost", pinyin: "ou" },
    "ㄢ": { element: "Lightning", pinyin: "an" },
    "ㄣ": { element: "Earth", pinyin: "en" },
    "ㄤ": { element: "Water", pinyin: "ang" },
    "ㄥ": { element: "Fire", pinyin: "eng" },
    "ㄦ": { element: "Smoke", pinyin: "er" },
    // Medials can also serve as finals
    "ㄧ": { element: "Metal", pinyin: "i" },
    "ㄨ": { element: "Fairy", pinyin: "u" },
    "ㄩ": { element: "Space", pinyin: "ü" },
    // Special/fallback
    "ㄭ": { element: "Wind", pinyin: "ɿ/ʅ" }
  },
  tones: {
    "ˉ": { texture: "Normal", pinyin: "1st" },
    "ˊ": { texture: "Crystalline", pinyin: "2nd" },
    "ˇ": { texture: "Gelatinous", pinyin: "3rd" },
    "ˋ": { texture: "Fungal/Plant", pinyin: "4th" },
    "˙": { texture: "Ethereal", pinyin: "5th" }
  }
};

// Tone marks
const TONE_1 = "ˉ", TONE_2 = "ˊ", TONE_3 = "ˇ", TONE_4 = "ˋ", TONE_5 = "˙";

// Tone diacritics mapping (for parsing accented pinyin like māo, hǎo)
const TONE_DIACRITICS = {
  "ā": ["a", 1], "á": ["a", 2], "ǎ": ["a", 3], "à": ["a", 4],
  "ē": ["e", 1], "é": ["e", 2], "ě": ["e", 3], "è": ["e", 4],
  "ī": ["i", 1], "í": ["i", 2], "ǐ": ["i", 3], "ì": ["i", 4],
  "ō": ["o", 1], "ó": ["o", 2], "ǒ": ["o", 3], "ò": ["o", 4],
  "ū": ["u", 1], "ú": ["u", 2], "ǔ": ["u", 3], "ù": ["u", 4],
  "ǖ": ["ü", 1], "ǘ": ["ü", 2], "ǚ": ["ü", 3], "ǜ": ["ü", 4],
  "ê": ["ê", 1], "ê̄": ["ê", 1], "ế": ["ê", 2], "ê̌": ["ê", 3], "ề": ["ê", 4],
};

const TONES = {
  1: TONE_1,
  2: TONE_2,
  3: TONE_3,
  4: TONE_4,
  5: TONE_5
};

const INITIALS = {
  'b': 'ㄅ', 'p': 'ㄆ', 'm': 'ㄇ', 'f': 'ㄈ',
  'd': 'ㄉ', 't': 'ㄊ', 'n': 'ㄋ', 'l': 'ㄌ',
  'g': 'ㄍ', 'k': 'ㄎ', 'h': 'ㄏ',
  'j': 'ㄐ', 'q': 'ㄑ', 'x': 'ㄒ',
  'zh': 'ㄓ', 'ch': 'ㄔ', 'sh': 'ㄕ', 'r': 'ㄖ',
  'z': 'ㄗ', 'c': 'ㄘ', 's': 'ㄙ'
};

const FINALS = {
  'a': 'ㄚ', 'o': 'ㄛ', 'e': 'ㄜ', 'ê': 'ㄝ',
  'ai': 'ㄞ', 'ei': 'ㄟ', 'ao': 'ㄠ', 'ou': 'ㄡ',
  'an': 'ㄢ', 'en': 'ㄣ', 'ang': 'ㄤ', 'eng': 'ㄥ',
  'er': 'ㄦ',
  'i': 'ㄧ', 'ia': 'ㄧㄚ', 'ie': 'ㄧㄝ', 'iao': 'ㄧㄠ', 'iu': 'ㄧㄡ',
  'ian': 'ㄧㄢ', 'in': 'ㄧㄣ', 'iang': 'ㄧㄤ', 'ing': 'ㄧㄥ', 'iong': 'ㄩㄥ',
  'u': 'ㄨ', 'ua': 'ㄨㄚ', 'uo': 'ㄨㄛ', 'uai': 'ㄨㄞ', 'ui': 'ㄨㄟ',
  'uan': 'ㄨㄢ', 'un': 'ㄨㄣ', 'uang': 'ㄨㄤ', 'ong': 'ㄨㄥ', 'ueng': 'ㄨㄥ',
  'ü': 'ㄩ', 'üe': 'ㄩㄝ', 'üan': 'ㄩㄢ', 'ün': 'ㄩㄣ',
  // Alternate spellings for ü
  'v': 'ㄩ', 've': 'ㄩㄝ', 'van': 'ㄩㄢ', 'vn': 'ㄩㄣ'
};

// Apical vowels - syllables where "i" is a "buzz" sound with no separate final
const APICAL_VOWELS = {
  "zhi": "ㄓ", "chi": "ㄔ", "shi": "ㄕ", "ri": "ㄖ",
  "zi": "ㄗ", "ci": "ㄘ", "si": "ㄙ"
};

// Labial initials (b, p, m, f) - used for o -> uo conversion
const LABIALS = new Set(['b', 'p', 'm', 'f']);

// Medial bopomofo characters
const MEDIALS = new Set(['ㄧ', 'ㄨ', 'ㄩ']);

/**
 * Normalize a pinyin syllable - extract base and tone from various input formats
 * Supports: numbered tones (ma3), diacritic tones (mǎ), and v/u: for ü
 */
function normalizePinyin(input) {
  if (!input) return ['', 1];
  
  let s = input.toLowerCase().trim();
  
  // Check for numbered tone at end (e.g., "ma3", "ni0")
  const numberedMatch = s.match(/^([a-züêv:]+)([0-5])$/);
  if (numberedMatch) {
    let base = numberedMatch[1];
    let tone = parseInt(numberedMatch[2]);
    // Normalize ü spellings
    base = base.replace(/v/g, 'ü').replace(/u:/g, 'ü').replace(/:$/g, '');
    return [base, tone === 0 ? 5 : tone];
  }
  
  // Check for diacritic tones
  let tone = null;
  const chars = [];
  for (const ch of s) {
    if (ch in TONE_DIACRITICS) {
      const [base, t] = TONE_DIACRITICS[ch];
      chars.push(base);
      tone = t;
    } else {
      chars.push(ch === 'v' ? 'ü' : ch);
    }
  }
  
  const base = chars.join('');
  // Default to tone 1 if no tone specified
  return [base, tone === null ? 1 : tone];
}

/**
 * Handle y- and w- semi-vowel initials
 * y- becomes i- medial, w- becomes u- medial
 */
function handleSemiVowels(base) {
  let result = base.replace(/u:/g, 'ü').replace(/v/g, 'ü');
  
  if (result.startsWith('y')) {
    let stem = result.slice(1) || 'i';
    // yu, yue, yuan, yun → ü, üe, üan, ün
    // But ya, yao, you, etc. → ia, iao, iou (keep as i-)
    // The key patterns that use ü: yu, yue, yuan, yun (and yong → iong which uses ㄩ)
    if (stem === 'u' || stem === 'ue' || stem === 'uan' || stem === 'un' || stem === 'ong') {
      if (stem === 'ong') {
        // yong → iong (special case, uses ㄩㄥ)
        stem = 'iong';
      } else {
        stem = 'ü' + stem.slice(1);
      }
    } else if (!stem.startsWith('i')) {
      // ya, ye, yao, yan, yang, etc. → ia, ie, iao, ian, iang
      stem = 'i' + stem;
    }
    result = stem;
  } else if (result.startsWith('w')) {
    let stem = result.slice(1) || 'u';
    if (!stem.startsWith('u')) {
      stem = 'u' + stem;
    }
    result = stem;
  }
  
  return result;
}

/**
 * Split a base syllable into initial consonant and remainder
 */
function splitInitialRest(base) {
  const initials = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 
                    'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's'];
  
  let initial = '';
  let rest = base;
  
  for (const ini of initials) {
    if (base.startsWith(ini)) {
      initial = ini;
      rest = base.slice(ini.length);
      break;
    }
  }
  
  // j, q, x always use ü (written as u in standard pinyin)
  if (['j', 'q', 'x'].includes(initial) && rest.startsWith('u')) {
    rest = 'ü' + rest.slice(1);
  }
  
  return [initial, rest];
}

/**
 * Convert a pinyin syllable to decomposed bopomofo components
 * 
 * @param {string} pinyin - Input pinyin (e.g., "ma3", "mǎ", "ni3hao3")
 * @returns {Object} Decomposed result with bopomofo and attributes
 */
export function pinyinToBopomofo(pinyin) {
  if (!pinyin || !pinyin.trim()) {
    return {
      bopomofo: '',
      initial: '',
      medial: '',
      final: '',
      tone: '',
      toneNumber: 0,
      attributes: {
        exemplar: 'Unknown',
        worldPlane: 'Natural',
        element: 'Unknown',
        skinTexture: 'Normal'
      }
    };
  }
  
  // Normalize and extract tone
  const [rawBase, toneNum] = normalizePinyin(pinyin);
  const toneMark = TONES[toneNum] || TONE_1;
  
  // Handle erhua suffix (儿化)
  let erhua = false;
  let workingBase = rawBase;
  if (workingBase.length > 1 && workingBase.endsWith('r') && workingBase !== 'er') {
    erhua = true;
    workingBase = workingBase.slice(0, -1);
  }
  
  // Handle y- and w- semi-vowels
  workingBase = handleSemiVowels(workingBase);
  
  let initial = '';
  let medial = '';
  let final = '';
  
  // Check for apical vowels (zhi, chi, shi, ri, zi, ci, si)
  if (workingBase in APICAL_VOWELS) {
    initial = APICAL_VOWELS[workingBase];
    medial = '';
    final = '';
  } else {
    // Split into initial and remainder
    const [iniPinyin, rest] = splitInitialRest(workingBase);
    initial = INITIALS[iniPinyin] || '';
    
    if (!rest) {
      medial = '';
      final = '';
    } else {
      // Apply spelling normalizations
      const spellingFixes = { 'uen': 'un', 'iou': 'iu', 'uei': 'ui' };
      let fixedRest = spellingFixes[rest] || rest;
      
      // Handle labial + o → uo
      if (fixedRest === 'o' && LABIALS.has(iniPinyin)) {
        fixedRest = 'uo';
      }
      
      // Look up the final
      const finalBopomofo = FINALS[fixedRest] || '';
      
      if (!finalBopomofo) {
        // Unknown final - leave empty (could add error handling)
        medial = '';
        final = '';
      } else {
        // Split final bopomofo into medial + final
        if (MEDIALS.has(finalBopomofo[0])) {
          medial = finalBopomofo[0];
          final = finalBopomofo.slice(1);
        } else {
          medial = '';
          final = finalBopomofo;
        }
      }
    }
  }
  
  // Determine the final glyph for attribute lookup
  // If medial exists but no final was parsed, the medial doubles as the final
  // If it's an apical vowel (no medial, no final), use ㄭ (Wind element)
  if (medial && !final) {
    final = medial;
  } else if (!medial && !final && initial) {
    // Apical vowel case (zhi, chi, shi, ri, zi, ci, si)
    final = 'ㄭ';
  }
  
  // Add erhua suffix if present
  if (erhua) {
    final = final + 'ㄦ';
  }
  
  // Build bopomofo string with deduplication rules:
  // - If medial and final are the same (ㄧㄧ, ㄨㄨ, ㄩㄩ), only write once
  // - If final is ㄭ (apical vowel marker), omit it
  let writtenFinal = final;
  if (final === medial) {
    writtenFinal = ''; // Don't duplicate the medial
  } else if (final === 'ㄭ') {
    writtenFinal = ''; // Apical vowel is not written
  } else if (final.startsWith('ㄭ')) {
    writtenFinal = final.slice(1); // Remove ㄭ but keep erhua ㄦ if present
  }
  
  // Build bopomofo string (tone 5 goes at the beginning, others at end)
  let bopomofo;
  if (toneMark === TONE_5) {
    bopomofo = toneMark + initial + medial + writtenFinal;
  } else {
    bopomofo = initial + medial + writtenFinal + toneMark;
  }
  
  // Look up attributes
  // For erhua finals, look up the base final (without ㄦ) for element
  const baseFinal = final.replace('ㄦ', '');
  const initialData = GlyphData.initials[initial] || GlyphData.initials[''];
  const medialData = GlyphData.medials[medial] || GlyphData.medials[''];
  const finalData = GlyphData.finals[baseFinal] || GlyphData.finals['ㄭ'] || { element: 'Unknown' };
  const toneData = GlyphData.tones[toneMark] || GlyphData.tones['ˉ'];
  
  return {
    bopomofo,
    initial,
    medial,
    final,
    tone: toneMark,
    toneNumber: toneNum,
    attributes: {
      exemplar: initialData.name,
      worldPlane: medialData.name,
      element: finalData.element,
      skinTexture: toneData.texture
    }
  };
}

/**
 * Get attribute data for a specific bopomofo component
 */
export function getInitialData(initial) {
  return GlyphData.initials[initial] || GlyphData.initials[''];
}

export function getMedialData(medial) {
  return GlyphData.medials[medial] || GlyphData.medials[''];
}

export function getFinalData(final) {
  return GlyphData.finals[final] || null;
}

export function getToneData(tone) {
  return GlyphData.tones[tone] || GlyphData.tones['ˉ'];
}

// Mapping from base vowel + tone number to diacritic vowel
const TONE_MARKS = {
  'a': ['ā', 'á', 'ǎ', 'à', 'a'],
  'e': ['ē', 'é', 'ě', 'è', 'e'],
  'i': ['ī', 'í', 'ǐ', 'ì', 'i'],
  'o': ['ō', 'ó', 'ǒ', 'ò', 'o'],
  'u': ['ū', 'ú', 'ǔ', 'ù', 'u'],
  'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
  'v': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
};

/**
 * Convert numbered pinyin (e.g., "ma3", "nv3", "lü4") to diacritic pinyin (e.g., "mǎ", "nǚ", "lǜ")
 * 
 * Tone mark placement rules:
 * 1. If there's an 'a' or 'e', the mark goes on it
 * 2. If there's 'ou', the mark goes on the 'o'
 * 3. Otherwise, the mark goes on the last vowel
 * 
 * @param {string} numberedPinyin - Pinyin with tone number (e.g., "ma3", "zhong1", "nv3")
 * @returns {string} Pinyin with tone diacritic (e.g., "mǎ", "zhōng", "nǚ")
 */
export function numberedToAccented(numberedPinyin) {
  if (!numberedPinyin) return '';
  
  const input = numberedPinyin.trim().toLowerCase();
  
  // Extract tone number (1-5, or 0 for neutral which we treat as 5)
  const match = input.match(/^([a-züv:]+)([0-5])$/);
  if (!match) {
    // No tone number found, return as-is (but normalize ü)
    return input.replace(/v/g, 'ü').replace(/u:/g, 'ü');
  }
  
  let base = match[1].replace(/v/g, 'ü').replace(/u:/g, 'ü');
  let toneNum = parseInt(match[2]);
  if (toneNum === 0) toneNum = 5;
  
  // Tone 5 (neutral) has no diacritic
  if (toneNum === 5) {
    return base;
  }
  
  // Find which vowel to put the tone mark on
  const vowels = 'aeiouü';
  
  // Rule 1: 'a' or 'e' gets the tone mark
  let targetIndex = base.indexOf('a');
  if (targetIndex === -1) targetIndex = base.indexOf('e');
  
  // Rule 2: 'ou' - tone goes on 'o'
  if (targetIndex === -1 && base.includes('ou')) {
    targetIndex = base.indexOf('o');
  }
  
  // Rule 3: Otherwise, last vowel gets the tone mark
  if (targetIndex === -1) {
    for (let i = base.length - 1; i >= 0; i--) {
      if (vowels.includes(base[i])) {
        targetIndex = i;
        break;
      }
    }
  }
  
  // If no vowel found, return base as-is
  if (targetIndex === -1) {
    return base;
  }
  
  // Replace the vowel with its accented version
  const vowel = base[targetIndex];
  const toneMarks = TONE_MARKS[vowel];
  if (!toneMarks) {
    return base; // Unknown vowel, return as-is
  }
  
  const accentedVowel = toneMarks[toneNum - 1];
  return base.slice(0, targetIndex) + accentedVowel + base.slice(targetIndex + 1);
}

/**
 * Convert diacritic pinyin (e.g., "mǎ") to numbered pinyin (e.g., "ma3")
 * 
 * @param {string} accentedPinyin - Pinyin with tone diacritic
 * @returns {string} Pinyin with tone number
 */
export function accentedToNumbered(accentedPinyin) {
  if (!accentedPinyin) return '';
  
  const input = accentedPinyin.trim().toLowerCase();
  
  let tone = null;
  const chars = [];
  
  for (const ch of input) {
    if (ch in TONE_DIACRITICS) {
      const [base, t] = TONE_DIACRITICS[ch];
      chars.push(base);
      tone = t;
    } else {
      chars.push(ch === 'v' ? 'ü' : ch);
    }
  }
  
  const base = chars.join('');
  // If no tone found, assume tone 1
  return base + (tone || 1);
}