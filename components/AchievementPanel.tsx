import { StyleSheet, Text, View } from 'react-native';

import {
  ACHIEVEMENTS,
  AchievementCategory,
  AchievementDef,
  getAchievementProgressDisplay,
} from '../game/achievements';
import { GemType } from '../game/equipment';
import { computeAchievementProgress, useGameState } from '../hooks/useGameState';

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  kills: '擊殺數',
  level: '等級里程碑',
  equipment: '裝備收集',
  enhance: '強化鑲嵌',
  companion: '寵物坐騎',
  transfer: '轉職',
};

const CATEGORY_ORDER: AchievementCategory[] = ['kills', 'level', 'equipment', 'enhance', 'companion', 'transfer'];

const GEM_LABELS: Record<GemType, string> = {
  expGem: '經驗石',
  coinGem: '金幣石',
  speedGem: '速度石',
};

function formatReward(def: AchievementDef): string {
  const parts = [`${def.reward.coins} 金幣`];
  if (def.reward.enhanceStones) parts.push(`強化石 x${def.reward.enhanceStones}`);
  if (def.reward.gems) {
    for (const [gemType, amount] of Object.entries(def.reward.gems) as [GemType, number][]) {
      if (amount) parts.push(`${GEM_LABELS[gemType]} x${amount}`);
    }
  }
  return parts.join(' / ');
}

export function AchievementPanel() {
  const killCount = useGameState((state) => state.killCount);
  const level = useGameState((state) => state.level);
  const unlockedItemIds = useGameState((state) => state.unlockedItemIds);
  const itemInstances = useGameState((state) => state.itemInstances);
  const companions = useGameState((state) => state.companions);
  const hasEverAssembledTransferProof = useGameState((state) => state.hasEverAssembledTransferProof);
  const hasEverSwitchedJob = useGameState((state) => state.hasEverSwitchedJob);
  const unlockedAchievementIds = useGameState((state) => state.unlockedAchievementIds);

  const progress = computeAchievementProgress({
    killCount,
    level,
    unlockedItemIds,
    itemInstances,
    companions,
    hasEverAssembledTransferProof,
    hasEverSwitchedJob,
  });

  const unlockedCount = unlockedAchievementIds.length;
  const totalCount = Object.keys(ACHIEVEMENTS).length;

  return (
    <View style={styles.container}>
      <Text style={styles.totalsText}>
        已解鎖 {unlockedCount}/{totalCount}
      </Text>

      {CATEGORY_ORDER.map((category) => {
        const defs = Object.values(ACHIEVEMENTS).filter((def) => def.category === category);
        return (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{CATEGORY_LABELS[category]}</Text>
            {defs.map((def) => {
              const unlocked = unlockedAchievementIds.includes(def.id);
              const display = getAchievementProgressDisplay(def.id, progress);
              return (
                <View key={def.id} style={[styles.card, unlocked && styles.cardUnlocked]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.title, unlocked && styles.titleUnlocked]}>
                      {unlocked ? '✓ ' : ''}
                      {def.title}
                    </Text>
                    {unlocked && <Text style={styles.unlockedBadge}>已解鎖</Text>}
                  </View>
                  <Text style={styles.description}>{def.description}</Text>
                  {unlocked ? (
                    <Text style={styles.rewardText}>獎勵:{formatReward(def)}</Text>
                  ) : display ? (
                    <Text style={styles.progressText}>
                      {display.current}/{display.target}
                    </Text>
                  ) : (
                    <Text style={styles.lockedText}>尚未解鎖</Text>
                  )}
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 280,
    gap: 4,
  },
  totalsText: {
    color: '#c9a94f',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 4,
  },
  categorySection: {
    gap: 6,
    marginBottom: 10,
  },
  categoryTitle: {
    color: '#8a8a95',
    fontSize: 12,
  },
  card: {
    gap: 3,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
  },
  cardUnlocked: {
    backgroundColor: '#3a3320',
    borderWidth: 1,
    borderColor: '#c9a94f',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#f2f2f2',
    fontSize: 13,
    fontWeight: '600',
  },
  titleUnlocked: {
    color: '#f2c230',
  },
  unlockedBadge: {
    color: '#c9a94f',
    fontSize: 10,
  },
  description: {
    color: '#8a8a95',
    fontSize: 11,
  },
  rewardText: {
    color: '#c9a94f',
    fontSize: 11,
  },
  progressText: {
    color: '#6a7078',
    fontSize: 11,
  },
  lockedText: {
    color: '#5a5a62',
    fontSize: 11,
  },
});
