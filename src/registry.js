/**
 * Minigame Registry
 *
 * To add a new minigame:
 * 1. Drop the Sandtrout component folder into src/minigames/
 * 2. Add an entry below with at minimum: id, name, description, component
 * 3. If the component needs store hydration, add initialData
 */

import { lazy } from 'react';

const BopomonCollection = lazy(() => import('./components/BopomonCollection'));
const BopomonGlyphCatcher = lazy(() => import('./minigames/BopomonGlyphCatcher'));
const BopomonCharacterFind = lazy(() => import('./minigames/BopomonCharacterFind'));
const ChineseStrokePractice = lazy(() => import('./minigames/ChineseStrokePractice'));


import { initialData as collectionData } from './components/BopomonCollection/data.js';

export const minigames = [
  {
    id: 'collection',
    name: 'Bopomon Collection',
    description: 'Browse and breed your Bopomon collection.',
    component: BopomonCollection,
    initialData: collectionData,
  },
  {
    id: 'glyph-catcher',
    name: 'Glyph Catcher',
    description: 'Catch falling bopomofo glyphs that match your target Bopomon!',
    component: BopomonGlyphCatcher,
  },
  {
    id: 'character-find',
    name: 'Character Find',
    description: 'Match Chinese characters to their pinyin or translation before time runs out!',
    component: BopomonCharacterFind,
  },
  {
    id: 'stroke-practice',
    name: 'Chinese Stroke Practice',
    description: 'Practice the 8 basic strokes!',
    component: ChineseStrokePractice,
  },
];
