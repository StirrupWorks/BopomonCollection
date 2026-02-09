# Bopomon Minigames

A collection of Bopomon minigames built with React + Vite, deployed on Vercel. Features a simple menu hub with hardcoded auth gating.

## Stack

- React 18
- Zustand (state management)
- Vite 5
- Vercel (deployment)

## Project Structure

```
BopomonApp/
├── src/
│   ├── main.jsx                  # Entry point
│   ├── App.jsx                   # Hub: Header, Menu, GameView
│   ├── App.css                   # Hub styles
│   ├── registry.js               # Minigame registry
│   ├── SandtroutHarness.jsx      # Auth gate (login/session)
│   ├── SandtroutHarness.css      # Auth styles
│   ├── minigames/                # Drop-in minigame components
│   │   └── BopomonGlyphCatcher/
│   └── components/               # Persistent components
│       └── BopomonCollection/
├── vercel.json                   # SPA rewrite rules
├── package.json
└── vite.config.js
```

## How It Works

`App.jsx` uses a simple `useState` to track the active game — `null` shows the menu, a game ID shows that game. No router needed.

Games are lazy-loaded via `React.lazy` so each minigame is a separate chunk and only downloaded when the user selects it.

## Adding a New Minigame

### 1. Drop in the component

Copy your Sandtrout component folder into `src/minigames/`:

```
src/minigames/YourGame/
├── index.js              # Must have: export { default } from './YourGame.jsx'
├── YourGame.jsx          # Main component
├── YourGame.store.js     # Zustand store (optional)
├── YourGame.styles.css   # Styles
└── ...                   # Any other files the component needs
```

The component's `index.js` must have a default export of the React component.

### 2. Register it in `src/registry.js`

```js
import { lazy } from 'react';

const YourGame = lazy(() => import('./minigames/YourGame'));

export const minigames = [
  // ... existing entries
  {
    id: 'your-game',           // Unique ID
    name: 'Your Game',         // Display name on menu card
    description: 'A short description shown on the menu card.',
    component: YourGame,
  },
];
```

That's it. The game will appear as a card on the menu.

### 3. Store hydration (optional)

If your game needs data injected into its Zustand store on mount (e.g., a selected Bopomon), add an `initialData` field:

```js
import { initialData as yourGameData } from './minigames/YourGame/data.js';

{
  id: 'your-game',
  name: 'Your Game',
  description: '...',
  component: YourGame,
  initialData: yourGameData,
}
```

The `initialData` object should map keys to `{ setter, value }` pairs. `GameView` will call the matching setter on the component's Zustand store when it mounts:

```js
// data.js
export const initialData = {
  selectedItem: {
    setter: 'setSelectedItem',   // Must match a function name in the Zustand store
    value: { /* your data */ },
  },
};
```

This works via the `__sandtrout_register_store` prop that Sandtrout components accept.

## Authentication

`SandtroutHarness.jsx` provides a hardcoded auth gate. Credentials are stored in the component. Session is persisted in `localStorage`.

To use auth state elsewhere, import the hook:

```js
import { useAuth } from './SandtroutHarness.jsx';

const { isAuthenticated, isLoading, logout } = useAuth();
```

## Development Notes

- **No router**: Navigation is state-based (`useState`). No `react-router-dom` dependency.
- **Lazy loading**: All minigames are loaded with `React.lazy` and wrapped in `<Suspense>`.
- **Sandtrout compatibility**: Components using `__sandtrout_register_store` work as-is. The prop is optional — components should have fallback data if no store registration occurs.
- **Styles are scoped by convention**: Each component uses BEM-style class names to avoid collisions (e.g., `.glyph-catcher__avatar`).

## Deployment

Push to `main` and Vercel auto-deploys. The `vercel.json` handles SPA routing so all paths serve `index.html`.
