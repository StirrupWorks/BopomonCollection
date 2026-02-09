import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { wordBank as defaultWordBank } from './wordBank.js';

const MAX_MISSES = 100;

export const createComponentStore = () => create(
  subscribeWithSelector((set, get) => ({
    // External input
    word_bank_input: null,

    // External output
    session_misses: null,

    // Internal state
    active_word_bank: defaultWordBank,
    session_start_timestamp: null,
    miss_records: [],

    // Setters for orchestration
    setWordBankInput: (input) => {
      const wordBank = input?.content?.length > 0 ? input.content : defaultWordBank;
      set({
        word_bank_input: input,
        active_word_bank: wordBank
      });
    },

    // Internal methods
    getActiveWordBank: () => {
      return get().active_word_bank;
    },

    startSession: () => {
      const timestamp = new Date().toISOString();
      set({
        session_start_timestamp: timestamp,
        miss_records: [],
        session_misses: {
          content: [],
          metadata: {
            session_start_timestamp: timestamp,
            wrong_click_count: 0,
            expired_count: 0,
            total_miss_count: 0
          }
        }
      });
    },

    recordWrongClick: (bubbleDisplay, targets) => {
      const { miss_records, session_start_timestamp } = get();
      if (miss_records.length >= MAX_MISSES) return;

      const record = {
        miss_type: 'wrong_click',
        timestamp: new Date().toISOString(),
        bubble_display: bubbleDisplay,
        targets: targets.map(t => ({
          character: t.character,
          pinyin: t.pinyin,
          translation: t.translation,
          hint_shown: t.showAs
        }))
      };

      const newRecords = [...miss_records, record];
      const wrongClickCount = newRecords.filter(r => r.miss_type === 'wrong_click').length;
      const expiredCount = newRecords.filter(r => r.miss_type === 'expired').length;

      set({
        miss_records: newRecords,
        session_misses: {
          content: newRecords,
          metadata: {
            session_start_timestamp: session_start_timestamp,
            wrong_click_count: wrongClickCount,
            expired_count: expiredCount,
            total_miss_count: newRecords.length
          }
        }
      });
    },

    recordExpired: (bubbleDisplay, target) => {
      const { miss_records, session_start_timestamp } = get();
      if (miss_records.length >= MAX_MISSES) return;

      const record = {
        miss_type: 'expired',
        timestamp: new Date().toISOString(),
        bubble_display: bubbleDisplay,
        target: {
          character: target.character,
          pinyin: target.pinyin,
          translation: target.translation,
          hint_shown: target.showAs
        }
      };

      const newRecords = [...miss_records, record];
      const wrongClickCount = newRecords.filter(r => r.miss_type === 'wrong_click').length;
      const expiredCount = newRecords.filter(r => r.miss_type === 'expired').length;

      set({
        miss_records: newRecords,
        session_misses: {
          content: newRecords,
          metadata: {
            session_start_timestamp: session_start_timestamp,
            wrong_click_count: wrongClickCount,
            expired_count: expiredCount,
            total_miss_count: newRecords.length
          }
        }
      });
    }
  }))
);
