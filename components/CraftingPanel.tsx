import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  canCraftMaterialTier,
  MATERIAL_TIER_LABELS,
  MATERIAL_TIERS,
  MaterialTier,
  TieredMaterialCounts,
} from '../game/materials';
import { useGameState } from '../hooks/useGameState';
import { useToast } from '../hooks/useToast';

// 技能書/強化石分階合成:兩本前一階換一本下一階,初階(0)不能合成,只能靠掉落取得——
// 兩種材料的畫面結構一模一樣(6階直條,每階顯示數量+合成按鈕),用同一個小元件畫兩份,
// 差別只在資料來源跟呼叫的 action。
interface MaterialCraftListProps {
  title: string;
  hint: string;
  counts: TieredMaterialCounts;
  onCraft: (tier: MaterialTier) => void;
}

function MaterialCraftList({ title, hint, counts, onCraft }: MaterialCraftListProps) {
  const showToast = useToast((state) => state.show);

  function handleCraft(tier: MaterialTier) {
    if (!canCraftMaterialTier(tier, counts)) {
      showToast(`${MATERIAL_TIER_LABELS[(tier - 1) as MaterialTier]}不夠,需要2本才能合成`);
      return;
    }
    onCraft(tier);
    showToast(`合成成功:${MATERIAL_TIER_LABELS[tier]}${title} +1`);
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.hint}>{hint}</Text>
      {MATERIAL_TIERS.map((tier) => {
        if (tier === 0) return null;
        const prevTier = (tier - 1) as MaterialTier;
        const canCraft = canCraftMaterialTier(tier, counts);
        return (
          <View key={tier} style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>
                {MATERIAL_TIER_LABELS[tier]}{title}
              </Text>
              <Text style={styles.rowCount}>
                持有 {counts[tier]} 本(消耗 2 本{MATERIAL_TIER_LABELS[prevTier]}{title},目前 {counts[prevTier]} 本)
              </Text>
            </View>
            <Pressable
              style={[styles.craftButton, !canCraft && styles.craftButtonDisabled]}
              onPress={() => handleCraft(tier)}
              disabled={!canCraft}
            >
              <Text style={styles.craftButtonLabel}>合成</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

export function CraftingPanel() {
  const skillBooks = useGameState((state) => state.skillBooks);
  const enhanceStones = useGameState((state) => state.enhanceStones);
  const craftSkillBookTier = useGameState((state) => state.craftSkillBookTier);
  const craftEnhanceStoneTier = useGameState((state) => state.craftEnhanceStoneTier);

  return (
    <View style={styles.container}>
      <Text style={styles.pageHint}>
        兩本前一階換一本下一階,初階沒辦法合成,只能靠擊敗怪物掉落或商店購買取得。
      </Text>
      <MaterialCraftList title="技能書" hint="升級技能用" counts={skillBooks} onCraft={craftSkillBookTier} />
      <MaterialCraftList title="強化石" hint="強化裝備用" counts={enhanceStones} onCraft={craftEnhanceStoneTier} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 280,
    gap: 12,
  },
  pageHint: {
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
  hint: {
    color: '#8a8a95',
    fontSize: 11,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    color: '#f2f2f2',
    fontSize: 12,
  },
  rowCount: {
    color: '#8a8a95',
    fontSize: 11,
  },
  craftButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#4a4456',
  },
  craftButtonDisabled: {
    opacity: 0.4,
  },
  craftButtonLabel: {
    color: '#f2f2f2',
    fontSize: 12,
  },
});
