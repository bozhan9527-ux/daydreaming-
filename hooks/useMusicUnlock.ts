import { useEffect } from 'react';
import { Platform } from 'react-native';

import { startMusic } from '../lib/sounds';

// 瀏覽器的自動播放限制:load()當下呼叫的第一次播放嘗試(見 lib/sounds.ts 的 startMusic)
// 多半會被瀏覽器擋下,要等玩家真的跟頁面互動過一次才會放行。原本只靠點擊勇者
// (hooks/useGameState.ts的boostCurrentFight)重試,但這是放置遊戲——很多玩家(尤其
// 手機上)只是切分頁/看畫面,根本不會去點勇者本體。改成監聽整個頁面「任何一次」互動
// (點擊/觸控/按鍵,不限定要點哪裡),觸發後就解除監聽,不用每次互動都重新綁定。
export function useMusicUnlock(): void {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const unlock = () => {
      startMusic();
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
