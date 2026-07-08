export type EquipmentSlot =
  | 'back'
  | 'bottom'
  | 'top'
  | 'belt'
  | 'headwear'
  | 'face'
  | 'gloves'
  | 'offhand'
  | 'mainhand';

export interface EquipmentItem {
  id: string;
  slot: EquipmentSlot;
  name: string;
  twoHanded?: boolean;
}

// 每個插槽先放 2 個佔位項目,證明架構可行;實際素材/數量是後續內容任務。
export const EQUIPMENT_ITEMS: EquipmentItem[] = [
  { id: 'back-01', slot: 'back', name: '素色披風' },
  { id: 'back-02', slot: 'back', name: '厚重斗篷' },
  { id: 'bottom-01', slot: 'bottom', name: '粗布長褲' },
  { id: 'bottom-02', slot: 'bottom', name: '皮革護腿' },
  { id: 'top-01', slot: 'top', name: '亞麻上衣' },
  { id: 'top-02', slot: 'top', name: '皮甲背心' },
  { id: 'belt-01', slot: 'belt', name: '麻繩腰帶' },
  { id: 'belt-02', slot: 'belt', name: '鉚釘皮帶' },
  { id: 'headwear-01', slot: 'headwear', name: '布帽' },
  { id: 'headwear-02', slot: 'headwear', name: '鐵盔' },
  { id: 'face-01', slot: 'face', name: '眼罩' },
  { id: 'face-02', slot: 'face', name: '護目鏡' },
  { id: 'gloves-01', slot: 'gloves', name: '布手套' },
  { id: 'gloves-02', slot: 'gloves', name: '皮革手套' },
  { id: 'offhand-01', slot: 'offhand', name: '木盾' },
  { id: 'offhand-02', slot: 'offhand', name: '厚重書冊' },
  { id: 'mainhand-01', slot: 'mainhand', name: '短劍' },
  { id: 'mainhand-02', slot: 'mainhand', name: '雙手大劍', twoHanded: true },
];

export type EquipmentLoadout = Partial<Record<EquipmentSlot, string>>;

export function createEmptyLoadout(): EquipmentLoadout {
  return {};
}

export function getItemById(id: string): EquipmentItem | undefined {
  return EQUIPMENT_ITEMS.find((item) => item.id === id);
}

export function getItemsForSlot(slot: EquipmentSlot): EquipmentItem[] {
  return EQUIPMENT_ITEMS.filter((item) => item.slot === slot);
}

// 雙手武器裝備時副手鎖死清空;反過來裝備副手時,若目前主手是雙手武器也一併清空。
export function equipItem(loadout: EquipmentLoadout, itemId: string): EquipmentLoadout {
  const item = getItemById(itemId);
  if (!item) return loadout;

  const next: EquipmentLoadout = { ...loadout, [item.slot]: item.id };

  if (item.slot === 'mainhand' && item.twoHanded) {
    delete next.offhand;
  }

  if (item.slot === 'offhand') {
    const currentMainhand = next.mainhand ? getItemById(next.mainhand) : undefined;
    if (currentMainhand?.twoHanded) delete next.mainhand;
  }

  return next;
}

export function unequipSlot(loadout: EquipmentLoadout, slot: EquipmentSlot): EquipmentLoadout {
  const next = { ...loadout };
  delete next[slot];
  return next;
}
