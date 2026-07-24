import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CompanionShopSection } from './CompanionShopSection';
import { EnhanceStoneShopSection } from './EnhanceStoneShopSection';
import { EquipmentPanel } from './EquipmentPanel';
import { GemShopSection } from './GemShopSection';

type ShopCategory = 'clothing' | 'companion' | 'enhanceStone' | 'gem';

const CATEGORIES: { id: ShopCategory; label: string }[] = [
  { id: 'clothing', label: '服飾' },
  { id: 'companion', label: '寵物坐騎' },
  { id: 'enhanceStone', label: '強化石' },
  { id: 'gem', label: '鑲嵌石' },
];

// 商店獨立成頂層分頁後,進一步把散落在寵物坐騎面板(見 CompanionPanel.tsx 原本的
// 「商店」子檢視)、工坊強化/鑲嵌分頁(見 EnhancementPanel.tsx/SocketPanel.tsx 原本內嵌的
// 購買列)裡各自的「花金幣購買」區塊統一收進這裡當四個分類——玩家只要記得「要花錢就找
// 商店」這一條規則,不用分別記住寵物要去寵物坐騎分頁裡買、強化石鑲嵌石要去工坊裡買。
// 各分類買到手之後的「使用」操作(裝備寵物/強化裝備/鑲入寶石)還是留在原本的分頁,
// 商店只負責「花錢換到手」這一段。
export function ShopTab() {
  const [category, setCategory] = useState<ShopCategory>('clothing');

  return (
    <View style={styles.container}>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c.id}
            style={[styles.categoryChip, category === c.id && styles.categoryChipActive]}
            onPress={() => setCategory(c.id)}
          >
            <Text style={styles.categoryLabel} numberOfLines={1}>
              {c.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {category === 'clothing' && <EquipmentPanel mode="shop" />}
      {category === 'companion' && <CompanionShopSection />}
      {category === 'enhanceStone' && <EnhanceStoneShopSection />}
      {category === 'gem' && <GemShopSection />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 280,
    gap: 6,
  },
  // 固定寬度4欄網格:呼應 EquipmentPanel.tsx 部位篩選列/DungeonPanel.tsx 分頁列的同一種
  // 排版邏輯,4個分類剛好一排排滿,不用像 EquipmentPanel 的部位篩選那樣特意做2排。
  categoryRow: {
    flexDirection: 'row',
    gap: 4,
  },
  categoryChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#2a2a35',
    alignItems: 'center',
  },
  categoryChipActive: {
    backgroundColor: '#4a4456',
    borderColor: '#6ab0e0',
  },
  categoryLabel: {
    color: '#f2f2f2',
    fontSize: 11,
  },
});
