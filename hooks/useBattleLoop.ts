import { useEffect } from 'react';

import { useGameState } from './useGameState';

// 前景時每 300ms 檢查一次戰鬥狀態(生成怪物/更新進度/發放擊殺獎勵),
// 300ms 夠讓進度條看起來流暢,又不會太頻繁浪費效能。
const TICK_INTERVAL_MS = 300;

export function useBattleLoop(): void {
  const tickBattle = useGameState((state) => state.tickBattle);
  const isLoaded = useGameState((state) => state.isLoaded);

  useEffect(() => {
    if (!isLoaded) return;
    const interval = setInterval(() => {
      tickBattle();
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [tickBattle, isLoaded]);
}
