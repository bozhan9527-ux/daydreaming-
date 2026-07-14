import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ASCENSION_UPGRADES,
  ascensionUpgradeCost,
  AscensionUpgradeId,
  canUpgradeAscension,
  getCycleCount,
} from '../game/ascension';
import { getCycleDifficultyBonusPct, STAGE_COUNT } from '../game/stages';
import { useGameState } from '../hooks/useGameState';

export function AscensionPanel() {
  const totalStagesCleared = useGameState((state) => state.totalStagesCleared);
  const ascensionPoints = useGameState((state) => state.ascensionPoints);
  const ascensionUpgrades = useGameState((state) => state.ascensionUpgrades);
  const upgradeAscension = useGameState((state) => state.upgradeAscension);

  const cycleCount = getCycleCount(totalStagesCleared);
  const stagesIntoCurrentCycle = totalStagesCleared % STAGE_COUNT;

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>第 {cycleCount + 1} 輪</Text>
        <Text style={styles.summarySubtext}>
          {cycleCount === 0
            ? '尚未完成過輪迴,打贏第3000關的大魔王就能拿到第一筆轉生點數'
            : `已完成 ${cycleCount} 輪輪迴,這一輪清了 ${stagesIntoCurrentCycle} / ${STAGE_COUNT} 個大關`}
        </Text>
        <Text style={styles.pointsText}>轉生點數:{ascensionPoints}</Text>
        {cycleCount > 0 && (
          <Text style={styles.summarySubtext}>
            本輪關卡難度/獎勵:+{getCycleDifficultyBonusPct(cycleCount)}%(每輪 +3%,難度變高的同時經驗/金幣也同步變多)
          </Text>
        )}
      </View>

      <Text style={styles.sectionHint}>
        破完一整輪 3000 關(第300大關的大魔王)固定發放轉生點數,花在下面的永久加成樹——不受裝備/寵物坐騎更換影響,永久疊加。
      </Text>

      {ASCENSION_UPGRADES.map((upgrade) => {
        const currentLevel = ascensionUpgrades[upgrade.id] ?? 0;
        const atMax = currentLevel >= upgrade.maxLevel;
        const cost = ascensionUpgradeCost(currentLevel);
        const canUpgrade = canUpgradeAscension(upgrade.id as AscensionUpgradeId, ascensionUpgrades, ascensionPoints);
        // offlineCap 的單位是小時,不是像 exp/coins/speed 那樣的百分比——顯示文字要分開處理,
        // 不能套同一個「乘100取整數」的公式(那樣會把「+2小時」誤顯示成「+200%」)。
        const currentBonusAmount = currentLevel * upgrade.bonusPerLevel;
        const bonusDisplay = upgrade.id === 'offlineCap' ? `+${currentBonusAmount}小時` : `+${Math.round(currentBonusAmount * 100)}%`;
        return (
          <View key={upgrade.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{upgrade.label}</Text>
              <Text style={styles.level}>
                {currentLevel}/{upgrade.maxLevel}
              </Text>
            </View>
            <Text style={styles.description}>{upgrade.description}</Text>
            <Text style={styles.bonusText}>目前加成:{bonusDisplay}</Text>
            <Pressable
              style={[styles.upgradeButton, !canUpgrade && styles.upgradeButtonDisabled]}
              onPress={() => upgradeAscension(upgrade.id as AscensionUpgradeId)}
              disabled={!canUpgrade}
            >
              <Text style={styles.upgradeButtonText}>{atMax ? '已達上限' : `升級(需 ${cost} 點)`}</Text>
            </Pressable>
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
    gap: 8,
  },
  summaryCard: {
    gap: 4,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2a2432',
    alignItems: 'center',
  },
  summaryTitle: {
    color: '#c9a94f',
    fontSize: 16,
    fontWeight: '700',
  },
  summarySubtext: {
    color: '#c9c9d2',
    fontSize: 10,
    textAlign: 'center',
  },
  pointsText: {
    color: '#f2f2f2',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHint: {
    color: '#8a8a95',
    fontSize: 10,
    textAlign: 'center',
  },
  card: {
    gap: 4,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
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
  level: {
    color: '#8a8a95',
    fontSize: 11,
  },
  description: {
    color: '#8a8a95',
    fontSize: 10,
  },
  bonusText: {
    color: '#c9a94f',
    fontSize: 11,
  },
  upgradeButton: {
    marginTop: 4,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#c9a94f',
    alignItems: 'center',
  },
  upgradeButtonDisabled: {
    opacity: 0.4,
  },
  upgradeButtonText: {
    color: '#1c1c24',
    fontSize: 11,
    fontWeight: '700',
  },
});
