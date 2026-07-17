import { ImageSourcePropType } from 'react-native';

// 使用者提供的 UI 素材圖示,取代部分分頁原本的程式產生圖示(game/sprites/tabIcons.ts)。
// 只有素材裡剛好對得上分頁意義的才換(寵物坐騎=paw、副本=gate 的拱門造型很貼切),
// 其餘分頁沒有對應素材,維持原本的程式圖示,TabBar 會自動 fallback。
export const TAB_ICON_ART: Partial<Record<string, ImageSourcePropType>> = {
  companion: require('../assets/sprites/ui/icon_paw.png'),
  dungeon: require('../assets/sprites/ui/icon_gate.png'),
  achievement: require('../assets/sprites/ui/icon_star.png'),
};

// 分頁鎖住時疊在圖示上的鎖頭角標(取代原本純降低不透明度的做法,多一個明確的「鎖住」符號)。
export const TAB_LOCK_ICON: ImageSourcePropType = require('../assets/sprites/ui/icon_lock.png');
