import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { useGameState } from './useGameState';

// App 冷啟動或從背景回到前景時,重新讀存檔並結算離線經驗(elapsedMs = 現在 - 上次寫檔時間)。
export function useOfflineProgress(): void {
  const load = useGameState((state) => state.load);

  useEffect(() => {
    load();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') load();
    });

    return () => subscription.remove();
  }, [load]);
}
