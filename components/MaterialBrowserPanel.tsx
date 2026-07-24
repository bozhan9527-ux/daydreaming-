import { useState } from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';

import { MATERIAL_TIER_LABELS, MATERIAL_TIERS, MaterialTier, TieredMaterialCounts } from '../game/materials';
import { useGameState } from '../hooks/useGameState';

// 技能書/強化石都各自有專屬的6階套色圖示(同一個造型依 MATERIAL_TIER_COLORS 套色,
// 保留原本明暗細節,只是色調不同)——不用再靠純色塊示意。
const SKILLBOOK_TIER_ICONS: Record<MaterialTier, ImageSourcePropType> = {
  0: require('../assets/sprites/materials/skillbook_tier0.png'),
  1: require('../assets/sprites/materials/skillbook_tier1.png'),
  2: require('../assets/sprites/materials/skillbook_tier2.png'),
  3: require('../assets/sprites/materials/skillbook_tier3.png'),
  4: require('../assets/sprites/materials/skillbook_tier4.png'),
  5: require('../assets/sprites/materials/skillbook_tier5.png'),
};

const ENHANCE_STONE_TIER_ICONS: Record<MaterialTier, ImageSourcePropType> = {
  0: require('../assets/sprites/materials/enhance_stone_tier0.png'),
  1: require('../assets/sprites/materials/enhance_stone_tier1.png'),
  2: require('../assets/sprites/materials/enhance_stone_tier2.png'),
  3: require('../assets/sprites/materials/enhance_stone_tier3.png'),
  4: require('../assets/sprites/materials/enhance_stone_tier4.png'),
  5: require('../assets/sprites/materials/enhance_stone_tier5.png'),
};

type SubView = 'skillbook' | 'enhanceStone';

const SUB_VIEWS: { id: SubView; label: string }[] = [
  { id: 'skillbook', label: '技能書' },
  { id: 'enhanceStone', label: '強化石' },
];

// 材料分頁改成分頁式(技能書/強化石各自一個子檢視),8欄網格跟裝備分頁的「已擁有」/
// 鑲嵌石分頁同一套版式規則——材料只有6階,不會真的塞滿8欄,但格子尺寸維持一致寬度,
// 三個分頁看起來是同一套系統。
export function MaterialBrowserPanel() {
  const skillBooks = useGameState((state) => state.skillBooks);
  const enhanceStones = useGameState((state) => state.enhanceStones);

  const [subView, setSubView] = useState<SubView>('skillbook');

  const counts: TieredMaterialCounts = subView === 'skillbook' ? skillBooks : enhanceStones;
  const icons = subView === 'skillbook' ? SKILLBOOK_TIER_ICONS : ENHANCE_STONE_TIER_ICONS;

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        初階只能靠擊敗怪物掉落或商店購買,更高階要去「工坊」分頁的合成子分頁用兩本前一階換一本。
      </Text>

      <View style={styles.subNav}>
        {SUB_VIEWS.map((view) => (
          <Pressable
            key={view.id}
            style={[styles.subNavButton, subView === view.id && styles.subNavButtonActive]}
            onPress={() => setSubView(view.id)}
          >
            <Text style={[styles.subNavLabel, subView === view.id && styles.subNavLabelActive]}>{view.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.grid}>
        {MATERIAL_TIERS.map((tier) => (
          <View key={tier} style={styles.tile}>
            <Image source={icons[tier]} style={styles.icon} resizeMode="contain" />
            <Text style={styles.countLabel}>{counts[tier]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 280,
    gap: 8,
  },
  hint: {
    color: '#8a8a95',
    fontSize: 11,
    textAlign: 'center',
  },
  // 分段切換器樣式跟 InventoryTab 的方形通欄分頁拉開差異(見 EquipmentPanel.tsx 同名樣式
  // 的說明),膠囊型、靠左、不佔滿寬度。
  subNav: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: 2,
    padding: 3,
    borderRadius: 999,
    backgroundColor: '#14141a',
  },
  subNavButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  subNavButtonActive: {
    backgroundColor: '#2a2440',
  },
  subNavLabel: {
    color: '#8a8a95',
    fontSize: 12,
  },
  subNavLabelActive: {
    color: '#f2f2f2',
    fontWeight: '700',
  },
  // 8欄密集網格:280寬容器扣掉間距後,每格約30px才塞得下8欄——雖然材料只有6階不會塞滿,
  // 格子寬度跟裝備分頁的「已擁有」/鑲嵌石分頁的密集網格保持一致。
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 4,
  },
  tile: {
    width: 30,
    height: 40,
    alignItems: 'center',
    gap: 1,
    paddingTop: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#59462b',
    backgroundColor: '#1c1c24',
  },
  icon: {
    width: 22,
    height: 22,
  },
  countLabel: {
    color: '#f2f2f2',
    fontSize: 10,
    fontWeight: '600',
  },
});
