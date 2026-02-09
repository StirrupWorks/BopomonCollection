/**
 * Minigame Registry
 *
 * To add a new minigame:
 * 1. Drop the Sandtrout component folder into src/minigames/
 * 2. Add an entry below with at minimum: id, name, description, component
 * 3. If the component needs store hydration, add initialData
 */

import { lazy } from 'react';

const BopomonGlyphCatcher = lazy(() => import('./minigames/BopomonGlyphCatcher'));
const BopomonCollection = lazy(() => import('./components/BopomonCollection'));

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
];
