import { ImageSourcePropType } from 'react-native';

import { ItemRarity } from '../game/equipment';

// 使用者提供的裝備稀有度外框美術圖(直接裁切自參考UI設計圖,不是程式重繪),取代原本純
// StyleSheet borderColor 畫的邊框。原生尺寸接近正方形但非 1:1,套用時用 resizeMode="stretch"
// 貼滿插槽方形區域,插槽夠小(48px 上下)拉伸造成的邊角變形不明顯。
export const RARITY_FRAME_ART: Record<ItemRarity, ImageSourcePropType> = {
  common: require('../assets/sprites/ui/frames/frame_common.png'),
  rare: require('../assets/sprites/ui/frames/frame_rare.png'),
  epic: require('../assets/sprites/ui/frames/frame_epic.png'),
  legendary: require('../assets/sprites/ui/frames/frame_legendary.png'),
};
