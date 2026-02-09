import React, { Suspense, useCallback, useRef, useState } from 'react';
import SandtroutHarness, { useAuth } from './SandtroutHarness.jsx';
import { minigames } from './registry.js';

function Header({ onHome }) {
  const { logout } = useAuth();

  return (
    <header className="app-header">
      <button className="app-header__title" onClick={onHome}>Bopomon Minigames</button>
      <button className="app-header__logout" onClick={logout}>
        Logout
      </button>
    </header>
  );
}

function Menu({ onSelect }) {
  return (
    <div className="menu">
      <div className="menu__grid">
        {minigames.map((game) => (
          <button key={game.id} className="menu__card" onClick={() => onSelect(game.id)}>
            <h2 className="menu__card-name">{game.name}</h2>
            <p className="menu__card-desc">{game.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function GameView({ gameId, onBack }) {
  const game = minigames.find((g) => g.id === gameId);
  const hydratedRef = useRef(false);

  const handleRegisterStore = useCallback((store) => {
    if (!game?.initialData || hydratedRef.current) return;

    const state = store.getState ? store.getState() : store;
    Object.values(game.initialData).forEach(({ setter, value }) => {
      if (state[setter]) {
        state[setter](value);
      }
    });
    hydratedRef.current = true;
  }, [game]);

  if (!game) return null;

  const GameComponent = game.component;

  return (
    <div className="game-view">
      <button className="game-view__back" onClick={onBack}>&larr; Back to Games</button>
      <Suspense fallback={<div className="game-view__loading">Loading...</div>}>
        <GameComponent __sandtrout_register_store={handleRegisterStore} />
      </Suspense>
    </div>
  );
}

export default function App() {
  const [activeGame, setActiveGame] = useState(null);

  return (
    <SandtroutHarness>
      <Header onHome={() => setActiveGame(null)} />
      {activeGame
        ? <GameView gameId={activeGame} onBack={() => setActiveGame(null)} />
        : <Menu onSelect={setActiveGame} />
      }
    </SandtroutHarness>
  );
}
