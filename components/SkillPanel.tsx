import { Pressable, StyleSheet, Text, View } from 'react-native';

import { canUpgradeSkill, SKILL_IDS, SKILL_LABELS, skillUpgradeCoinCost, skillUpgradeCost } from '../game/skills';
import { getSkillIcon } from '../game/sprites/skillIcons';
import { useGameState } from '../hooks/useGameState';
import { PixelSprite } from './PixelSprite';

export function SkillPanel() {
  const skills = useGameState((state) => state.skills);
  const bankedExp = useGameState((state) => state.level.bankedExp);
  const coins = useGameState((state) => state.coins);
  const upgradeSkill = useGameState((state) => state.upgradeSkill);
  const activeArchetype = useGameState((state) => state.job.archetype);

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>只有目前職業的技能會在戰鬥中觸發,其餘職業的技能等級不會歸零</Text>
      {SKILL_IDS.map((archetype) => {
        const skillLevel = skills[archetype];
        const cost = skillUpgradeCost(skillLevel);
        const coinCost = skillUpgradeCoinCost(skillLevel);
        const canUpgrade = canUpgradeSkill(skillLevel, bankedExp, coins);
        const isActive = archetype === activeArchetype;
        const icon = getSkillIcon(archetype);
        return (
          <Pressable
            key={archetype}
            style={[styles.row, isActive && styles.rowActive]}
            onPress={() => upgradeSkill(archetype)}
            disabled={!canUpgrade}
          >
            <View style={styles.iconWrap}>
              <PixelSprite frame={icon.frame} palette={icon.palette} pixelSize={2} />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.label}>
                {SKILL_LABELS[archetype]} Lv.{skillLevel}
              </Text>
              <Text style={styles.cost}>
                {cost} 經驗 / {coinCost} 金幣
              </Text>
            </View>
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
  hint: {
    color: '#8a8a95',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
  },
  rowActive: {
    backgroundColor: '#4a4456',
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
