export { default } from './BopomonCharacterFind.jsx';

export const metadata = {
  id: 'bopomon_character_find',
  name: 'Bopomon Character Find',
  inputs: {
    word_bank_input: {
      schema: {
        type: 'object',
        properties: {
          content: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                character: { type: 'string' },
                pinyin: { type: 'string' },
                translation: { type: 'string' }
              },
              required: ['character', 'pinyin', 'translation']
            }
          },
          metadata: { type: 'object' }
        },
        required: ['content']
      },
      setter: 'setWordBankInput'
    }
  },
  outputs: {
    session_misses: {
      schema: {
        type: 'object',
        properties: {
          content: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                miss_type: { type: 'string', enum: ['wrong_click', 'expired'] },
                timestamp: { type: 'string' },
                bubble_display: { type: 'string' },
                targets: { type: 'array' },
                target: { type: 'object' }
              },
              required: ['miss_type', 'timestamp', 'bubble_display']
            }
          },
          metadata: {
            type: 'object',
            properties: {
              session_start_timestamp: { type: 'string' },
              wrong_click_count: { type: 'number' },
              expired_count: { type: 'number' },
              total_miss_count: { type: 'number' }
            }
          }
        },
        required: ['content', 'metadata']
      }
    }
  },
  internal_variables: {
    game_state: 'string - "idle" | "playing" | "ended"',
    score: 'number - Current score',
    lives: 'number - Current lives remaining',
    correct_count: 'number - Consecutive correct matches toward next life (0-4)',
    targets: 'array - Active target objects with character, pinyin, translation, showAs',
    bubbles: 'array - Bubble objects with character, slotIndex, progress, state',
  }
};
