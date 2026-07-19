import { Image, StyleSheet, Text, View } from 'react-native';

import { MATERIAL_TIER_COLORS, MATERIAL_TIER_LABELS, MATERIAL_TIERS, TieredMaterialCounts } from '../game/materials';
import { useGameState } from '../hooks/useGameState';

const SKILLBOOK_ICON = require('../assets/sprites/ui/icon_skillbook.png');

// 技能書/強化石的分階庫存總覽——沒有專屬素材圖示區分6個階級,用色塊當底(見
// game/materials.ts 的 MATERIAL_TIER_COLORS)疊技能書圖示(技能書有現成素材可以直接套用,
// 強化石沒有,一樣用色塊代表,兩者用同一套視覺語言,不用另外畫兩套icon系統)。
interface MaterialRowProps {
  title: string;
  counts: TieredMaterialCounts;
  showBookIcon: boolean;
}

function MaterialRow({ title, counts, showBookIcon }: MaterialRowProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.grid}>
        {MATERIAL_TIERS.map((tier) => (
          <View key={tier} style={styles.tile}>
            <View style={[styles.swatch, { backgroundColor: MATERIAL_TIER_COLORS[tier] }]}>
              {showBookIcon && <Image source={SKILLBOOK_ICON} style={styles.icon} resizeMode="contain" />}
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
      <MaterialRow title="技能書" counts={skillBooks} showBookIcon />
      <MaterialRow title="強化石" counts={enhanceStones} showBookIcon={false} />
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
  },
  icon: {
    width: 26,
    height: 26,
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
