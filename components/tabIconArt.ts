import { ImageSourcePropType } from 'react-native';

// 使用者提供的 UI 素材圖示,取代底部導覽 8 個分頁原本的程式產生圖示(game/sprites/tabIcons.ts)。
// 這組圖是直接從參考圖裡「已經套用好的底部導覽列」原圖擷取,8 個分頁都有對應的專屬圖示
// (不是像其他章節那樣只是示範用的通用圖示),所以 8 個分頁全部替換。
export const TAB_ICON_ART: Partial<Record<string, ImageSourcePropType>> = {
  job: require('../assets/sprites/ui/icon_tab_job.png'),
  equipment: require('../assets/sprites/ui/icon_tab_equipment.png'),
  inventory: require('../assets/sprites/ui/icon_tab_backpack.png'),
  skill: require('../assets/sprites/ui/icon_tab_skill.png'),
  achievement: require('../assets/sprites/ui/icon_tab_achievement.png'),
  companion: require('../assets/sprites/ui/icon_tab_pet.png'),
  dungeon: require('../assets/sprites/ui/icon_tab_dungeon.png'),
  ascension: require('../assets/sprites/ui/icon_tab_ascension.png'),
};

// 分頁鎖住時疊在圖示上的鎖頭角標(取代原本純降低不透明度的做法,多一個明確的「鎖住」符號)。
export const TAB_LOCK_ICON: ImageSourcePropType = require('../assets/sprites/ui/icon_lock.png');
