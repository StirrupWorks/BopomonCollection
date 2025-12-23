export { default } from './BopomonCollection.jsx';

export const metadata = {
  id: 'bopomon_collection',
  name: 'Bopomon Collection',
  inputs: {
    monster_database: {
      schema: {
        type: 'object',
        properties: {
          content: { type: 'array' },
          metadata: { type: 'object' }
        },
        required: ['content']
      },
      setter: 'setMonsterDatabase'
    }
  },
  outputs: {},
  internal_variables: {
    current_view: 'string - UI view state: "collection" | "glyphs" | "eggs"',
    selected_monster: 'object | null - Currently selected monster for detail modal',
    show_breed_confirm: 'object | null - Monster being confirmed for breeding',
    collection: 'Set<number> - Set of collected monster IDs',
    glyph_inventory: 'object - { [glyph: string]: count: number }',
    eggs: 'array - Array of egg objects with hatch timers',
    energy: 'number - Current energy amount (0-200)',
    monster_data: 'array - Parsed monster database from input'
  }
};
