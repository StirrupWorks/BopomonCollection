import { create } from 'zustand';
import { pinyinToBopomofo, GlyphData } from './pinyinConverter.js';

const GLYPH_COSTS = {
  common: { initial: 1, medial: 1, final: 1, tone: 1 },
  uncommon: { initial: 2, medial: 2, final: 2, tone: 2 },
  rare: { initial: 3, medial: 3, final: 3, tone: 3 },
};

const HATCH_TIME = 3000;
const ENERGY_COST_INSTANT_HATCH = 50;
const ENERGY_REGEN_RATE = 1000;
const MAX_ENERGY = 200;

export const createComponentStore = () => create((set, get) => {
  const startHatchTimer = () => {
    // Check every 100ms for smoother progress updates
    setInterval(() => {
      set((state) => {
        if (state.hatching_egg && !state.hatching_egg.hatched) {
          const now = Date.now();
          if (state.hatching_egg.hatch_time <= now) {
            const newCollection = new Set(state.collection);
            newCollection.add(state.hatching_egg.monster_id);
            return {
              collection: newCollection,
              hatching_egg: { ...state.hatching_egg, hatched: true }
            };
          }
        }
        return state;
      });
    }, 100);
  };

  startHatchTimer();

  return {
    current_view: 'collection',
    selected_monster: null,
    show_breed_confirm: null,
    hatching_egg: null,
    collection: new Set(),
    glyph_inventory: {
      "ㄅ": 5, "ㄍ": 5, "ㄌ": 5, "ㄕ": 5, "ㄑ":5,
      "ㄧ": 10, "ㄨ": 10, "ㄩ": 10,
      "ㄟ": 5, "ㄥ": 5, "ㄤ": 5, "ㄣ":5,
      "ˉ": 10, "ˊ":10, "ˇ": 10, "ˋ": 5,
    },
    monster_data: [],
    
    // Filtering state
    filter_initial: null,
    filter_medial: null,
    filter_final: null,
    filter_tone: null,

    setMonsterDatabase: (input) => {
      const monsters = input?.content || [];
      const parsedMonsters = monsters.map(row => {
        const converted = pinyinToBopomofo(row.pinyin);
        
        // Derive element and texture from GlyphData
        const element = GlyphData.finals[converted.final]?.element || 'Unknown';
        const texture = GlyphData.tones[converted.tone]?.texture || 'Unknown';
        
        return {
          bpm_codex_id: parseInt(row.bpm_codex_id),
          name: row.name,
          pinyin: row.pinyin,
          bopomofo: converted.bopomofo,
          element: element,
          texture: texture,
          rarity: row.rarity,
          traditional_character: row.traditional_character || '',
          hatch_status: parseInt(row.hatch_status || 0),
          png_tcg_asset_fn: row.png_tcg_asset_fn || '',
          glyphs: {
            initial: converted.initial,
            medial: converted.medial,
            final: converted.final,
            tone: converted.tone
          }
        };
      });
      
      // Auto-add monsters with hatch_status == 1 to collection
      const newCollection = new Set(get().collection);
      parsedMonsters.forEach(monster => {
        if (monster.hatch_status === 1) {
          newCollection.add(monster.bpm_codex_id);
        }
      });
      
      set({ monster_data: parsedMonsters, collection: newCollection });
    },

    setCurrentView: (view) => set({ current_view: view }),
    setSelectedMonster: (monster) => set({ selected_monster: monster }),
    setShowBreedConfirm: (monster) => set({ show_breed_confirm: monster }),
    setCollection: (collection) => set({ collection }),
    
    setFilterInitial: (glyph) => set({ filter_initial: glyph }),
    setFilterMedial: (glyph) => set({ filter_medial: glyph }),
    setFilterFinal: (glyph) => set({ filter_final: glyph }),
    setFilterTone: (glyph) => set({ filter_tone: glyph }),
    clearAllFilters: () => set({ filter_initial: null, filter_medial: null, filter_final: null, filter_tone: null }),

    canAffordMonster: (monster) => {
      const state = get();
      const costs = GLYPH_COSTS[monster.rarity];
      const glyphs = monster.glyphs;
      
      if (glyphs.initial && (state.glyph_inventory[glyphs.initial] || 0) < costs.initial) return false;
      if (glyphs.medial && (state.glyph_inventory[glyphs.medial] || 0) < costs.medial) return false;
      if (glyphs.final && (state.glyph_inventory[glyphs.final] || 0) < costs.final) return false;
      if (glyphs.tone && (state.glyph_inventory[glyphs.tone] || 0) < costs.tone) return false;
      
      return true;
    },

    breedMonster: (monster) => {
      const state = get();
      if (!get().canAffordMonster(monster)) return;
      
      const costs = GLYPH_COSTS[monster.rarity];
      const glyphs = monster.glyphs;
      
      const newInventory = { ...state.glyph_inventory };
      if (glyphs.initial) newInventory[glyphs.initial] -= costs.initial;
      if (glyphs.medial) newInventory[glyphs.medial] -= costs.medial;
      if (glyphs.final) newInventory[glyphs.final] -= costs.final;
      if (glyphs.tone) newInventory[glyphs.tone] -= costs.tone;
      
      const hatchingEgg = {
        monster_id: monster.bpm_codex_id,
        monster_name: monster.name,
        monster: monster,
        hatch_time: Date.now() + HATCH_TIME,
        hatched: false,
      };
      
      set({ 
        glyph_inventory: newInventory,
        hatching_egg: hatchingEgg,
        show_breed_confirm: null
      });
    },

    closeHatchingModal: () => {
      set({ hatching_egg: null });
    },

    playSound: (pinyin) => {
      console.log(`Playing sound: ${pinyin}.mp3`);
    }
  };
});