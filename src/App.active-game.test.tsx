import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const { hostAction } = vi.hoisted(() => ({
  hostAction: vi.fn().mockResolvedValue({
    activeGame: { id: 'existing-game', phase: 'waiting', current_round: 0 },
    questions: [],
    chests: [],
    rewards: [],
    roundSettings: [],
  }),
}));

vi.mock('./lib/api', () => ({
  getStoredHostPin: () => '1234',
  setStoredHostPin: vi.fn(),
  clearStoredHostPin: vi.fn(),
  hostAction,
  playerAction: vi.fn(),
}));

import App from './App';

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/play');
});

describe('Host active-game recovery', () => {
  it('resumes the active lobby after refresh instead of offering to create another game', async () => {
    window.history.replaceState({}, '', '/host');
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'พร้อมเปิดเกมหรือยัง?' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'สร้างเกม' })).not.toBeInTheDocument();
  });
});
