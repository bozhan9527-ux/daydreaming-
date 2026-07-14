import { useEffect } from 'react';
import { Platform } from 'react-native';

import { unlockMusicOnInteraction } from '../lib/sounds';

// BGM 用「靜音自動播放+互動後解除靜音」的策略(見 lib/sounds.ts 的 startMusic/
// unlockMusicOnInteraction 說明):load()當下已經在背景用靜音狀態播放,這裡要做的只是
// 在玩家第一次跟頁面互動時解除靜音。原本只靠點擊勇者(hooks/useGameState.ts的
// boostCurrentFight)觸發,但這是放置遊戲——很多玩家(尤其手機上)只是切分頁/看畫面,
// 根本不會去點勇者本體。改成監聽整個頁面「任何一次」互動(點擊/觸控/按鍵,不限定要點
// 哪裡),觸發後就解除監聽,不用每次互動都重新綁定。
export function useMusicUnlock(): void {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const unlock = () => {
      unlockMusicOnInteraction();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchend', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('touchend', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchend', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);
}
