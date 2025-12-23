import React, { useEffect, useState } from 'react';
import { createComponentStore } from './BopomonCollection.store.js';
import { GlyphData, numberedToAccented } from './pinyinConverter.js';
import './BopomonCollection.styles.css';

const HATCH_TIME = 3000; // 3 seconds

export default function BopomonCollection({ __sandtrout_register_store }) {
  const [{ useStore, storeInstance }] = useState(() => {
    const storeInstance = createComponentStore();
    return { useStore: storeInstance, storeInstance };
  });
  const store = useStore();

  useEffect(() => {
    __sandtrout_register_store?.(storeInstance);
  }, [storeInstance, __sandtrout_register_store]);

  const getMonster = (monsterId) => {
    return store.monster_data.find(m => m.bpm_codex_id === monsterId);
  };

  const formatTime = (ms) => {
    const seconds = Math.ceil(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (egg) => {
    const now = Date.now();
    const total = 10000;
    const elapsed = total - (egg.hatch_time - now);
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  // Filter monsters based on selected glyphs
  const getFilteredMonsters = () => {
    return store.monster_data.filter(monster => {
      const owned = store.collection.has(monster.bpm_codex_id);
      if (!owned) return false;
      
      if (store.filter_initial && monster.glyphs.initial !== store.filter_initial) return false;
      if (store.filter_medial && monster.glyphs.medial !== store.filter_medial) return false;
      if (store.filter_final && monster.glyphs.final !== store.filter_final) return false;
      if (store.filter_tone && monster.glyphs.tone !== store.filter_tone) return false;
      
      return true;
    });
  };

  return (
    <div className="bopomon-collection">
      <header className="bopomon-collection__header">
        <h1 className="bopomon-collection__title">Bopomon Collection</h1>
        <div className="bopomon-collection__header-stats">
          <div className="bopomon-collection__stat">
            <span className="bopomon-collection__stat-label">Collection:</span>
            <span className="bopomon-collection__stat-value">{store.collection.size}/{store.monster_data.length}</span>
          </div>
        </div>
      </header>

      <nav className="bopomon-collection__nav">
        <button 
          className={`bopomon-collection__nav-button ${store.current_view === 'collection' ? 'bopomon-collection__nav-button--active' : ''}`}
          onClick={() => store.setCurrentView('collection')}
        >
          📖 Codex
        </button>
        <button 
          className={`bopomon-collection__nav-button ${store.current_view === 'glyphs' ? 'bopomon-collection__nav-button--active' : ''}`}
          onClick={() => store.setCurrentView('glyphs')}
        >
          🔤 Glyphs
        </button>
      </nav>

      <main className="bopomon-collection__content">
        {store.current_view === 'collection' && (
          <div>
            <div className="bopomon-collection__codex-header">
              <h2 className="bopomon-collection__section-title">Monster Codex</h2>
              
              {/* Filter UI */}
              <div className="bopomon-collection__filters">
                <div className="bopomon-collection__filter-group">
                  <label className="bopomon-collection__filter-label">Lineage:</label>
                  <select 
                    className="bopomon-collection__filter-select"
                    value={store.filter_initial || ''}
                    onChange={(e) => store.setFilterInitial(e.target.value || null)}
                  >
                    <option value="">All</option>
                    {Object.entries(GlyphData.initials).map(([glyph, data]) => (
                      <option key={glyph} value={glyph}>{glyph || '∅'}</option>
                    ))}
                  </select>
                </div>
                
                <div className="bopomon-collection__filter-group">
                  <label className="bopomon-collection__filter-label">World:</label>
                  <select 
                    className="bopomon-collection__filter-select"
                    value={store.filter_medial || ''}
                    onChange={(e) => store.setFilterMedial(e.target.value || null)}
                  >
                    <option value="">All</option>
                    {Object.entries(GlyphData.medials).map(([glyph, data]) => (
                      <option key={glyph} value={glyph}>{glyph || '∅'}</option>
                    ))}
                  </select>
                </div>
                
                <div className="bopomon-collection__filter-group">
                  <label className="bopomon-collection__filter-label">Element:</label>
                  <select 
                    className="bopomon-collection__filter-select"
                    value={store.filter_final || ''}
                    onChange={(e) => store.setFilterFinal(e.target.value || null)}
                  >
                    <option value="">All</option>
                    {Object.entries(GlyphData.finals).map(([glyph, data]) => (
                      <option key={glyph} value={glyph}>{glyph}</option>
                    ))}
                  </select>
                </div>
                
                <div className="bopomon-collection__filter-group">
                  <label className="bopomon-collection__filter-label">Skin:</label>
                  <select 
                    className="bopomon-collection__filter-select"
                    value={store.filter_tone || ''}
                    onChange={(e) => store.setFilterTone(e.target.value || null)}
                  >
                    <option value="">All</option>
                    {Object.entries(GlyphData.tones).map(([glyph, data]) => (
                      <option key={glyph} value={glyph}>{glyph}</option>
                    ))}
                  </select>
                </div>
                
                {(store.filter_initial || store.filter_medial || store.filter_final || store.filter_tone) && (
                  <button 
                    className="bopomon-collection__clear-filters"
                    onClick={() => store.clearAllFilters()}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
            
            <div className="bopomon-collection__monster-grid">
              {getFilteredMonsters().map(monster => {
                return (
                  <div 
                    key={monster.bpm_codex_id}
                    className="bopomon-collection__monster-card bopomon-collection__monster-card--owned"
                    onClick={() => store.setSelectedMonster(monster)}
                  >
                    <div className="bopomon-collection__trading-card">
                        <div className="bopomon-collection__trading-card-inner">
                          {/* Card Header */}
                          <div className="bopomon-collection__card-header">
                            <div className="bopomon-collection__card-pinyin">{numberedToAccented(monster.pinyin).toUpperCase()}</div>
                            <div className="bopomon-collection__card-bopomofo">{monster.bopomofo}</div>
                            <div className="bopomon-collection__card-character">
                              {monster.traditional_character || ''}
                            </div>
                          </div>

                          {/* Card Image */}
                          <div className="bopomon-collection__card-image">
                            <img 
                              src={`/assets/bopomon/${monster.png_tcg_asset_fn}.png`}
                              alt={monster.name}
                              className="bopomon-collection__card-image-img"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="bopomon-collection__card-image-placeholder" style={{ display: 'none' }}>
                              {monster.bopomofo}
                            </div>
                          </div>

                          {/* Card Stats */}
                          <div className="bopomon-collection__card-body">
                            <div className="bopomon-collection__card-stats">
                              <div className="bopomon-collection__card-stat-row">
                                <span className="bopomon-collection__card-glyph">{monster.glyphs.initial || "∅"}</span>
                                <span className="bopomon-collection__card-stat-value">
                                  {GlyphData.initials[monster.glyphs.initial]?.name || 'Unknown'}
                                </span>
                              </div>
                              <div className="bopomon-collection__card-stat-row">
                                <span className="bopomon-collection__card-glyph">{monster.glyphs.medial || "∅"}</span>
                                <span className="bopomon-collection__card-stat-value">
                                  {GlyphData.medials[monster.glyphs.medial]?.name || 'Unknown'}
                                </span>
                              </div>
                              <div className="bopomon-collection__card-stat-row">
                                <span className="bopomon-collection__card-glyph">{monster.glyphs.final || "∅"}</span>
                                <span className="bopomon-collection__card-stat-value">{monster.element}</span>
                              </div>
                              <div className="bopomon-collection__card-stat-row">
                                <span className="bopomon-collection__card-glyph">{monster.glyphs.tone}</span>
                                <span className="bopomon-collection__card-stat-value">{monster.texture}</span>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer */}
                          <div className="bopomon-collection__card-footer">
                            <span className="bopomon-collection__card-footer-text">
                              BOPOMON TCG • {monster.glyphs.initial || "∅"}{monster.glyphs.medial || "∅"}{monster.glyphs.final || "∅"}{monster.glyphs.tone}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                );
              })}
            </div>
          </div>
        )}

        {store.current_view === 'glyphs' && (
          <div>
            <h2 className="bopomon-collection__section-title">Glyph Inventory</h2>
            <div className="bopomon-collection__glyph-categories">
              {[
                { title: 'Initials', glyphs: ["ㄅ", "ㄍ", "ㄌ", "ㄕ","ㄑ"] },
                { title: 'Medials', glyphs: ["ㄧ", "ㄨ", "ㄩ"] },
                { title: 'Finals', glyphs: ["ㄟ", "ㄥ", "ㄤ","ㄣ"] },
                { title: 'Tones', glyphs: ["ˉ", "ˊ","ˇ", "ˋ"] }
              ].map(category => (
                <div key={category.title} className="bopomon-collection__glyph-category">
                  <h3 className="bopomon-collection__category-title">{category.title}</h3>
                  <div className="bopomon-collection__glyph-list">
                    {category.glyphs.map(glyph => (
                      <div key={glyph} className="bopomon-collection__glyph-item">
                        <span className="bopomon-collection__glyph-symbol">{glyph}</span>
                        <span className="bopomon-collection__glyph-count">{store.glyph_inventory[glyph] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="bopomon-collection__breed-section">
              <h3 className="bopomon-collection__subsection-title">Breed Bopomon</h3>
              <div className="bopomon-collection__breed-grid">
                {store.monster_data.filter(monster => !store.collection.has(monster.bpm_codex_id)).map(monster => {
                  const canAfford = store.canAffordMonster(monster);
                  const costs = { common: 1, uncommon: 2, rare: 3 }[monster.rarity];
                  return (
                    <div 
                      key={monster.bpm_codex_id}
                      className={`bopomon-collection__breed-card ${canAfford ? 'bopomon-collection__breed-card--affordable' : 'bopomon-collection__breed-card--unaffordable'}`}
                    >
                      <div>
                        <h4 className="bopomon-collection__breed-name">{monster.name}</h4>
                        <div className="bopomon-collection__breed-glyphs">{monster.bopomofo}</div>
                        <div className="bopomon-collection__breed-cost">
                          Cost: {costs} per glyph
                        </div>
                      </div>
                      <button
                        className={`bopomon-collection__breed-button ${!canAfford ? 'bopomon-collection__breed-button--disabled' : ''}`}
                        disabled={!canAfford}
                        onClick={() => store.setShowBreedConfirm(monster)}
                      >
                        🥚 Breed
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {store.selected_monster && (
        <div className="bopomon-collection__modal-overlay" onClick={() => store.setSelectedMonster(null)}>
          <div className="bopomon-collection__modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="bopomon-collection__modal-close"
              onClick={() => store.setSelectedMonster(null)}
            >
              ×
            </button>
            {store.collection.has(store.selected_monster.bpm_codex_id) ? (
              <div className="bopomon-collection__monster-detail">
                <div className="bopomon-collection__detail-image">
                  <img 
                    src={`/assets/bopomon/${store.selected_monster.png_tcg_asset_fn}.png`}
                    alt={store.selected_monster.name}
                    className="bopomon-collection__detail-image-img"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="bopomon-collection__placeholder-monster-large" style={{ display: 'none' }}>
                    {store.selected_monster.bopomofo}
                  </div>
                </div>
                <h2 className="bopomon-collection__detail-title">{store.selected_monster.name}</h2>
                <button 
                  className="bopomon-collection__play-sound-button"
                  onClick={() => store.playSound(store.selected_monster.pinyin)}
                >
                  🔊 Play Sound
                </button>
                <div className="bopomon-collection__detail-stats">
                  <div className="bopomon-collection__stat-row">
                    <span>Pinyin:</span>
                    <span>{numberedToAccented(store.selected_monster.pinyin)}</span>
                  </div>
                  <div className="bopomon-collection__stat-row">
                    <span>Bopomofo:</span>
                    <span className="bopomon-collection__bopomofo-text">{store.selected_monster.bopomofo}</span>
                  </div>
                  {store.selected_monster.traditional_character && (
                    <div className="bopomon-collection__stat-row">
                      <span>Character:</span>
                      <span className="bopomon-collection__bopomofo-text">{store.selected_monster.traditional_character}</span>
                    </div>
                  )}
                  <div className="bopomon-collection__stat-row">
                    <span>Element:</span>
                    <span>{store.selected_monster.element}</span>
                  </div>
                  <div className="bopomon-collection__stat-row">
                    <span>Texture:</span>
                    <span>{store.selected_monster.texture}</span>
                  </div>
                  <div className="bopomon-collection__stat-row">
                    <span>Rarity:</span>
                    <span>{store.selected_monster.rarity}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bopomon-collection__locked-message">
                <p>This Bopomon hasn't been collected yet!</p>
                <p>Breed it in the Glyphs tab to discover its secrets.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {store.show_breed_confirm && (
        <div className="bopomon-collection__modal-overlay" onClick={() => store.setShowBreedConfirm(null)}>
          <div className="bopomon-collection__modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="bopomon-collection__modal-close"
              onClick={() => store.setShowBreedConfirm(null)}
            >
              ×
            </button>
            <div className="bopomon-collection__breed-confirm">
              <h2 className="bopomon-collection__confirm-title">Breed {store.show_breed_confirm.name}?</h2>
              <div className="bopomon-collection__confirm-glyphs">
                <div className="bopomon-collection__glyph-display">
                  {store.show_breed_confirm.bopomofo}
                </div>
              </div>
              <div className="bopomon-collection__confirm-cost">
                <h3 className="bopomon-collection__cost-title">Glyph Cost:</h3>
                <div className="bopomon-collection__cost-breakdown">
                  {Object.entries(store.show_breed_confirm.glyphs).map(([type, glyph]) => {
                    if (!glyph) return null;
                    const cost = { common: 1, uncommon: 2, rare: 3 }[store.show_breed_confirm.rarity];
                    const available = store.glyph_inventory[glyph] || 0;
                    return (
                      <div key={type} className="bopomon-collection__cost-item">
                        <span>{glyph} ({type})</span>
                        <span>{cost} (you have: {available})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bopomon-collection__confirm-actions">
                <button 
                  className="bopomon-collection__cancel-button"
                  onClick={() => store.setShowBreedConfirm(null)}
                >
                  Cancel
                </button>
                <button 
                  className="bopomon-collection__confirm-button"
                  onClick={() => store.breedMonster(store.show_breed_confirm)}
                >
                  Confirm Breed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {store.hatching_egg && (
        <div className="bopomon-collection__modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="bopomon-collection__modal-content" onClick={(e) => e.stopPropagation()}>
            {!store.hatching_egg.hatched ? (
              <div className="bopomon-collection__hatching-view">
                <h2 className="bopomon-collection__hatching-title">Breeding {store.hatching_egg.monster_name}...</h2>
                <div className="bopomon-collection__egg-visual-large">
                  <div className="bopomon-collection__placeholder-egg-large">🥚</div>
                </div>
                <button 
                  className="bopomon-collection__skip-button"
                  onClick={() => {
                    const newCollection = new Set(store.collection);
                    newCollection.add(store.hatching_egg.monster_id);
                    store.setCollection?.(newCollection);
                    store.closeHatchingModal();
                  }}
                >
                  Skip Animation →
                </button>
              </div>
            ) : (
              <div className="bopomon-collection__hatched-view">
                <button 
                  className="bopomon-collection__modal-close"
                  onClick={() => store.closeHatchingModal()}
                >
                  ×
                </button>
                <h2 className="bopomon-collection__hatched-title">Congratulations!</h2>
                <div className="bopomon-collection__hatched-monster">
                  <img 
                    src={`/assets/bopomon/${store.hatching_egg.monster.png_tcg_asset_fn}.png`}
                    alt={store.hatching_egg.monster_name}
                    className="bopomon-collection__hatched-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="bopomon-collection__hatched-placeholder" style={{ display: 'none' }}>
                    {store.hatching_egg.monster.bopomofo}
                  </div>
                </div>
                <h3 className="bopomon-collection__hatched-name">{store.hatching_egg.monster_name}</h3>
                <p className="bopomon-collection__hatched-message">has been added to your collection!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}