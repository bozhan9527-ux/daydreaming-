import { ItemRarity } from '../game/equipment';
import { NineSliceParts } from './NineSliceFrame';

// 使用者提供的裝備稀有度外框美術圖(直接裁切自參考UI設計圖),拆成9宮格(4角+4邊,見
// NineSliceFrame.tsx)套用,不是整張圖硬拉伸——插槽是長方形(圖示+文字標籤),長寬比跟
// 原圖差很多,整張拉伸會讓角落花紋變形、邊框粗細跑掉。
export const EQUIPMENT_FRAME_CORNER = 24;
export const EQUIPMENT_FRAME_EDGE = 14;

function partsFor(rarity: string): NineSliceParts {
  return {
    topLeft: EQUIPMENT_FRAME_IMAGES[rarity].tl,
    topRight: EQUIPMENT_FRAME_IMAGES[rarity].tr,
    bottomLeft: EQUIPMENT_FRAME_IMAGES[rarity].bl,
    bottomRight: EQUIPMENT_FRAME_IMAGES[rarity].br,
    top: EQUIPMENT_FRAME_IMAGES[rarity].top,
    bottom: EQUIPMENT_FRAME_IMAGES[rarity].bottom,
    left: EQUIPMENT_FRAME_IMAGES[rarity].left,
    right: EQUIPMENT_FRAME_IMAGES[rarity].right,
  };
}

const EQUIPMENT_FRAME_IMAGES: Record<string, Record<'tl' | 'tr' | 'bl' | 'br' | 'top' | 'bottom' | 'left' | 'right', number>> = {
  common: {
    tl: require('../assets/sprites/ui/frames/equipment/common_tl.png'),
    tr: require('../assets/sprites/ui/frames/equipment/common_tr.png'),
    bl: require('../assets/sprites/ui/frames/equipment/common_bl.png'),
    br: require('../assets/sprites/ui/frames/equipment/common_br.png'),
    top: require('../assets/sprites/ui/frames/equipment/common_top.png'),
    bottom: require('../assets/sprites/ui/frames/equipment/common_bottom.png'),
    left: require('../assets/sprites/ui/frames/equipment/common_left.png'),
    right: require('../assets/sprites/ui/frames/equipment/common_right.png'),
  },
  rare: {
    tl: require('../assets/sprites/ui/frames/equipment/rare_tl.png'),
    tr: require('../assets/sprites/ui/frames/equipment/rare_tr.png'),
    bl: require('../assets/sprites/ui/frames/equipment/rare_bl.png'),
    br: require('../assets/sprites/ui/frames/equipment/rare_br.png'),
    top: require('../assets/sprites/ui/frames/equipment/rare_top.png'),
    bottom: require('../assets/sprites/ui/frames/equipment/rare_bottom.png'),
    left: require('../assets/sprites/ui/frames/equipment/rare_left.png'),
    right: require('../assets/sprites/ui/frames/equipment/rare_right.png'),
  },
  epic: {
    tl: require('../assets/sprites/ui/frames/equipment/epic_tl.png'),
    tr: require('../assets/sprites/ui/frames/equipment/epic_tr.png'),
    bl: require('../assets/sprites/ui/frames/equipment/epic_bl.png'),
    br: require('../assets/sprites/ui/frames/equipment/epic_br.png'),
    top: require('../assets/sprites/ui/frames/equipment/epic_top.png'),
    bottom: require('../assets/sprites/ui/frames/equipment/epic_bottom.png'),
    left: require('../assets/sprites/ui/frames/equipment/epic_left.png'),
    right: require('../assets/sprites/ui/frames/equipment/epic_right.png'),
  },
  legendary: {
    tl: require('../assets/sprites/ui/frames/equipment/legendary_tl.png'),
    tr: require('../assets/sprites/ui/frames/equipment/legendary_tr.png'),
    bl: require('../assets/sprites/ui/frames/equipment/legendary_bl.png'),
    br: require('../assets/sprites/ui/frames/equipment/legendary_br.png'),
    top: require('../assets/sprites/ui/frames/equipment/legendary_top.png'),
    bottom: require('../assets/sprites/ui/frames/equipment/legendary_bottom.png'),
    left: require('../assets/sprites/ui/frames/equipment/legendary_left.png'),
    right: require('../assets/sprites/ui/frames/equipment/legendary_right.png'),
  },
};

export const RARITY_FRAME_PARTS: Record<ItemRarity, NineSliceParts> = {
  common: partsFor('common'),
  rare: partsFor('rare'),
  epic: partsFor('epic'),
  legendary: partsFor('legendary'),
};
