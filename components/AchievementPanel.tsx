import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ACHIEVEMENTS,
  AchievementCategory,
  AchievementDef,
  getAchievementBonusMultiplier,
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
  stage: '關卡里程碑',
};

const CATEGORY_ORDER: AchievementCategory[] = [
  'kills',
  'level',
  'equipment',
  'enhance',
  'companion',
  'transfer',
  'stage',
];

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
  const totalStagesCleared = useGameState((state) => state.totalStagesCleared);
  const unlockedAchievementIds = useGameState((state) => state.unlockedAchievementIds);
  const claimedAchievementIds = useGameState((state) => state.claimedAchievementIds);
  const claimAchievement = useGameState((state) => state.claimAchievement);
  const claimAllAchievements = useGameState((state) => state.claimAllAchievements);

  const progress = computeAchievementProgress({
    killCount,
    level,
    unlockedItemIds,
    itemInstances,
    companions,
    hasEverAssembledTransferProof,
    hasEverSwitchedJob,
    totalStagesCleared,
  });

  const claimableIds = unlockedAchievementIds.filter((id) => !claimedAchievementIds.includes(id));
  const unlockedCount = unlockedAchievementIds.length;
  const totalCount = Object.keys(ACHIEVEMENTS).length;
  // 每領取1個成就永久+0.1%經驗/金幣(見 game/achievements.ts),讓玩家看得到「已領取的成就
  // 數」本身也是一項持續累積的數值,不只是單純的一次性貨幣獎勵清單。
  const bonusPct = Math.round(getAchievementBonusMultiplier(claimedAchievementIds.length) * 1000) / 10;

  return (
    <View style={styles.container}>
      <Text style={styles.totalsText}>
        已解鎖 {unlockedCount}/{totalCount}
      </Text>
      <Text style={styles.bonusText}>已領取成就永久加成:經驗/金幣 +{bonusPct}%</Text>

      {claimableIds.length > 0 && (
        <Pressable style={styles.claimAllButton} onPress={() => claimAllAchievements()}>
          <Text style={styles.claimAllButtonText}>一鍵領取全部({claimableIds.length})</Text>
        </Pressable>
      )}

      {CATEGORY_ORDER.map((category) => {
        const defs = Object.values(ACHIEVEMENTS).filter((def) => def.category === category);
        return (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{CATEGORY_LABELS[category]}</Text>
            {defs.map((def) => {
              // 三態:未達成(unlocked=false)/已達成未領取(unlocked但!claimed)/已領取(claimed)。
              const unlocked = unlockedAchievementIds.includes(def.id);
              const claimed = claimedAchievementIds.includes(def.id);
              const display = getAchievementProgressDisplay(def.id, progress);
              return (
                <View
                  key={def.id}
                  style={[styles.card, claimed && styles.cardUnlocked, unlocked && !claimed && styles.cardClaimable]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.title, claimed && styles.titleUnlocked]}>
                      {claimed ? '✓ ' : ''}
                      {def.title}
                    </Text>
                    {claimed && <Text style={styles.unlockedBadge}>已解鎖</Text>}
                  </View>
                  <Text style={styles.description}>{def.description}</Text>
                  {claimed ? (
                    <Text style={styles.rewardText}>獎勵:{formatReward(def)}</Text>
                  ) : unlocked ? (
                    <View style={styles.claimRow}>
                      <Text style={styles.rewardText}>獎勵:{formatReward(def)}</Text>
                      <Pressable style={styles.claimButton} onPress={() => claimAchievement(def.id)}>
                        <Text style={styles.claimButtonText}>領取</Text>
                      </Pressable>
                    </View>
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
  bonusText: {
    color: '#8fd4a8',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 4,
  },
  claimAllButton: {
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#c9a94f',
    marginBottom: 8,
  },
  claimAllButtonText: {
    color: '#1c1c24',
    fontSize: 12,
    fontWeight: '700',
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
  cardClaimable: {
    backgroundColor: '#2a2412',
    borderWidth: 1,
    borderColor: '#8a7020',
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
    fontSize: 11,
  },
  description: {
    color: '#8a8a95',
    fontSize: 11,
  },
  rewardText: {
    color: '#c9a94f',
    fontSize: 11,
  },
  claimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  claimButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#c9a94f',
  },
  claimButtonText: {
    color: '#1c1c24',
    fontSize: 11,
    fontWeight: '700',
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
