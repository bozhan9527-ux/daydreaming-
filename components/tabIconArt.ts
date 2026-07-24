import { ImageSourcePropType } from 'react-native';

// 使用者提供的 UI 素材圖示,取代底部導覽分頁原本的程式產生圖示(game/sprites/tabIcons.ts)。
// 這組圖是直接從參考圖裡「已經套用好的底部導覽列」原圖擷取,每個分頁都有對應的專屬圖示
// (不是像其他章節那樣只是示範用的通用圖示),所以全部替換(工坊原本借用裝備的盾牌圖示,
// 現在也補了自己的鐵鎚鐵砧圖示)。
// equipment 這個 id 現在對應的是獨立出來的「商店」頂層分頁(見 panelTabs.tsx),原本的
// 盾牌圖示換成使用者提供的「商」字紫金徽章圖示。
export const TAB_ICON_ART: Partial<Record<string, ImageSourcePropType>> = {
  job: require('../assets/sprites/ui/icon_tab_job.png'),
  equipment: require('../assets/sprites/ui/icon_tab_shop.png'),
  inventory: require('../assets/sprites/ui/icon_tab_backpack.png'),
  skill: require('../assets/sprites/ui/icon_tab_skill.png'),
  achievement: require('../assets/sprites/ui/icon_tab_achievement.png'),
  companion: require('../assets/sprites/ui/icon_tab_pet.png'),
  dungeon: require('../assets/sprites/ui/icon_tab_dungeon.png'),
  ascension: require('../assets/sprites/ui/icon_tab_ascension.png'),
  workshop: require('../assets/sprites/ui/icon_tab_workshop.png'),
};

// 分頁鎖住時疊在圖示上的鎖頭角標(取代原本純降低不透明度的做法,多一個明確的「鎖住」符號)。
export const TAB_LOCK_ICON: ImageSourcePropType = require('../assets/sprites/ui/icon_lock.png');
