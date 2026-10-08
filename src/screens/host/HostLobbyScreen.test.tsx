import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import HostLobbyScreen from './HostLobbyScreen';
import { useGameStore } from '../../store/gameStore';

afterEach(() => {
  cleanup();
  useGameStore.setState({ game: null, playerConnected: false });
});

describe('HostLobbyScreen', () => {
  it('enables Start when the server says the Player already joined', async () => {
    const game = { id: 'game-1', phase: 'waiting', current_round: 0 };
    const action = vi.fn().mockResolvedValue({ ok: true, game, playerConnected: true });

    render(<HostLobbyScreen game={game} action={action} />);

    expect(await screen.findByText('Player เชื่อมต่อแล้ว')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'เริ่มเกม' })).toBeEnabled();
  });
});
