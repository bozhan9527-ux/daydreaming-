import { Pressable, StyleSheet, Text, View } from 'react-native';

import { canUpgradeSkill, SkillId, skillUpgradeCoinCost, skillUpgradeCost, SKILL_IDS } from '../game/skills';
import { useGameState } from '../hooks/useGameState';

const SKILL_LABELS: Record<SkillId, string> = {
  practice: '熟能生巧',
  diligence: '勤能補拙',
  mastery: '融會貫通',
  foresight: '未雨綢繆',
  focus: '一心一意',
};

export function SkillPanel() {
  const skills = useGameState((state) => state.skills);
  const bankedExp = useGameState((state) => state.level.bankedExp);
  const coins = useGameState((state) => state.coins);
  const upgradeSkill = useGameState((state) => state.upgradeSkill);

  return (
    <View style={styles.container}>
      {SKILL_IDS.map((id) => {
        const skillLevel = skills[id];
        const cost = skillUpgradeCost(skillLevel);
        const coinCost = skillUpgradeCoinCost(skillLevel);
        const canUpgrade = canUpgradeSkill(skillLevel, bankedExp, coins);
        return (
          <Pressable
            key={id}
            style={styles.row}
            onPress={() => upgradeSkill(id)}
            disabled={!canUpgrade}
          >
            <Text style={styles.label}>
              {SKILL_LABELS[id]} Lv.{skillLevel}
            </Text>
            <Text style={styles.cost}>
              {cost} 經驗 / {coinCost} 金幣
            </Text>
          </Pressable>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
  },
  label: {
    color: '#f2f2f2',
    fontSize: 12,
  },
  cost: {
    color: '#8a8a95',
    fontSize: 12,
  },
});
