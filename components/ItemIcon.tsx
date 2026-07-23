import { Image } from 'react-native';

import { EquipmentItem } from '../game/equipment';
import { getItemIcon } from '../game/sprites/equipmentIcons';
import { getEquipmentIconForItem } from './equipmentIcons';
import { PixelSprite } from './PixelSprite';
import { getWeaponIconForItem } from './weaponIcons';

interface ItemIconProps {
  item: EquipmentItem;
  color: string;
  pixelSize: number;
  // AI 圖示的顯示高度(px)——沒有 AI 圖示時忽略這個 prop,退回程式產生圖示走 pixelSize。
  aiHeight: number;
}

// 裝備/背包清單共用的圖示元件:主手武器查 components/weaponIcons.ts,其餘8槽查
// components/equipmentIcons.ts,兩邊都是「有 AI 圖示就顯示 AI 圖」,查不到才 fallback 回
// game/sprites/equipmentIcons.ts 的程式產生圖示。
export function ItemIcon({ item, color, pixelSize, aiHeight }: ItemIconProps) {
  const aiIcon = getWeaponIconForItem(item) ?? getEquipmentIconForItem(item);
  if (aiIcon) {
    return <Image source={aiIcon.source} style={{ height: aiHeight, width: aiHeight * aiIcon.aspectRatio }} resizeMode="contain" />;
  }
  const icon = getItemIcon(item);
  return <PixelSprite frame={icon.frame} palette={{ [icon.fillKey]: color }} pixelSize={pixelSize} />;
}
