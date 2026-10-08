import { useEffect, useState } from 'react';
import { useGameRealtime } from '../../hooks/useGameRealtime';
import { useGameStore } from '../../store/gameStore';
import type { GameSnapshot, HostActionCaller } from '../../domain/types';

interface HostLobbyScreenProps { game: GameSnapshot; action: HostActionCaller; onStarted?: (game: GameSnapshot) => void; }

export default function HostLobbyScreen({ game, action, onStarted }: HostLobbyScreenProps) {
  useGameRealtime(game.id);
  const playerConnected = useGameStore((state) => state.playerConnected);
  const setPlayerConnected = useGameStore((state) => state.setPlayerConnected);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await action<{ playerConnected?: boolean }>('get_lobby_status', { gameId: game.id });
        if (active) setPlayerConnected(Boolean(response.playerConnected));
      } catch {
        // Keep the last known status and retry; Realtime remains a best-effort fast path.
      }
    };

    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 1_800);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [action, game.id, setPlayerConnected]);

  const start = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const response = await action<{ game?: GameSnapshot }>('start_game', { gameId: game.id });
      onStarted?.(response.game ?? { ...game, phase: 'briefing' });
    } finally { setBusy(false); }
  };
  return <main className="host-screen lobby-screen"><p className="eyebrow">TREASURE QUIZ · LOBBY</p><h1>พร้อมเปิดเกมหรือยัง?</h1><div className="lobby-card"><div className="connection-dot" data-online={playerConnected} /><div><strong>{playerConnected ? 'Player เชื่อมต่อแล้ว' : 'รอ Player เข้าห้อง'}</strong><p>{playerConnected ? 'กดเริ่มเมื่อพร้อมได้เลย' : 'ให้ Player เปิด /play แล้วใส่ Player PIN'}</p></div></div><button className="primary-button" onClick={start} disabled={!playerConnected || busy}>เริ่มเกม</button></main>;
}
