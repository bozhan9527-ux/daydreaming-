import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';

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

interface MaterialRowProps {
  title: string;
  counts: TieredMaterialCounts;
  icons: Record<MaterialTier, ImageSourcePropType>;
}

function MaterialRow({ title, counts, icons }: MaterialRowProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.grid}>
        {MATERIAL_TIERS.map((tier) => (
          <View key={tier} style={styles.tile}>
            <View style={styles.swatch}>
              <Image source={icons[tier]} style={styles.icon} resizeMode="contain" />
            </View>
            <Text style={styles.tierLabel}>{MATERIAL_TIER_LABELS[tier]}</Text>
            <Text style={styles.countLabel}>{counts[tier]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function MaterialBrowserPanel() {
  const skillBooks = useGameState((state) => state.skillBooks);
  const enhanceStones = useGameState((state) => state.enhanceStones);

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        初階只能靠擊敗怪物掉落或商店購買,更高階要去「工坊」分頁的合成子分頁用兩本前一階換一本。
      </Text>
      <MaterialRow title="技能書" counts={skillBooks} icons={SKILLBOOK_TIER_ICONS} />
      <MaterialRow title="強化石" counts={enhanceStones} icons={ENHANCE_STONE_TIER_ICONS} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 280,
    gap: 12,
  },
  hint: {
    color: '#8a8a95',
    fontSize: 11,
    textAlign: 'center',
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    color: '#c9a94f',
    fontSize: 13,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tile: {
    alignItems: 'center',
    gap: 2,
    width: 56,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    // 兩種材料圖示都已經套好階級色,這裡的深色底框只是維持格子邊界的視覺一致性。
    backgroundColor: '#1c1c24',
  },
  icon: {
    width: 36,
    height: 36,
  },
  tierLabel: {
    color: '#f2f2f2',
    fontSize: 10,
  },
  countLabel: {
    color: '#8a8a95',
    fontSize: 11,
    fontWeight: '600',
  },
});
