import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Archetype,
  calcSecondaryCombatBonus,
  canUnlockDualClass,
  DUAL_CLASS_UNLOCK_LEVEL,
  getCurrentTier,
  getJobTitle,
  JobBranch,
} from '../game/combat';
import { useGameState } from '../hooks/useGameState';

const ARCHETYPE_LABELS: Record<Archetype, string> = {
  physicalMelee: '物理近戰',
  physicalRanged: '物理遠程',
  physicalSupport: '物理輔助',
  magicMelee: '魔法近戰',
  magicRanged: '魔法遠程',
  magicSupport: '魔法輔助',
};

const ARCHETYPES: Archetype[] = [
  'physicalMelee',
  'physicalRanged',
  'physicalSupport',
  'magicMelee',
  'magicRanged',
  'magicSupport',
];

const BRANCHES: JobBranch[] = ['A', 'B'];

function formatSecondaryBonus(value: number): string {
  return `經驗 +${Math.round(value * 100)}%`;
}

export function JobSelector() {
  const job = useGameState((state) => state.job);
  const level = useGameState((state) => state.level);
  const secondaryJob = useGameState((state) => state.secondaryJob);
  const setJob = useGameState((state) => state.setJob);
  const setSecondaryJob = useGameState((state) => state.setSecondaryJob);

  const tier = getCurrentTier(level.level);
  const title = getJobTitle(job.archetype, job.branch, tier);
  const dualClassUnlocked = canUnlockDualClass(level.level);
  const secondaryOptions = ARCHETYPES.filter((archetype) => archetype !== job.archetype);

  return (
    <View style={styles.container}>
      <Text style={styles.currentTitle}>{title}</Text>

      <View style={styles.archetypeRow}>
        {ARCHETYPES.map((archetype) => (
          <Pressable
            key={archetype}
            style={[styles.archetypeButton, job.archetype === archetype && styles.archetypeButtonActive]}
            onPress={() => setJob(archetype, job.branch)}
          >
            <Text style={styles.archetypeLabel}>{ARCHETYPE_LABELS[archetype]}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.branchRow}>
        {BRANCHES.map((branch) => (
          <Pressable
            key={branch}
            style={[styles.branchButton, job.branch === branch && styles.branchButtonActive]}
            onPress={() => setJob(job.archetype, branch)}
          >
            <Text style={styles.branchLabel}>分支 {branch}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.secondarySection}>
        <Text style={styles.secondaryTitle}>雙職兼修(副職)</Text>
        {!dualClassUnlocked ? (
          <Text style={styles.secondaryLocked}>Lv{DUAL_CLASS_UNLOCK_LEVEL} 解鎖,可另選一個副職分擔加成</Text>
        ) : (
          <>
            <View style={styles.archetypeRow}>
              <Pressable
                style={[styles.archetypeButton, secondaryJob === null && styles.archetypeButtonActive]}
                onPress={() => setSecondaryJob(null)}
              >
                <Text style={styles.archetypeLabel}>無</Text>
              </Pressable>
              {secondaryOptions.map((archetype) => (
                <Pressable
                  key={archetype}
                  style={[styles.archetypeButton, secondaryJob === archetype && styles.archetypeButtonActive]}
                  onPress={() => setSecondaryJob(archetype)}
                >
                  <Text style={styles.archetypeLabel}>{ARCHETYPE_LABELS[archetype]}</Text>
                </Pressable>
              ))}
            </View>
            {secondaryJob && (
              <Text style={styles.secondaryBonus}>
                副職加成:{formatSecondaryBonus(calcSecondaryCombatBonus(secondaryJob, tier))}(技能觸發間隔為本職 2 倍)
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  currentTitle: {
    color: '#c9a94f',
    fontSize: 14,
    fontWeight: '600',
  },
  archetypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  archetypeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
  },
  archetypeButtonActive: {
    backgroundColor: '#4a4456',
  },
  archetypeLabel: {
    color: '#f2f2f2',
    fontSize: 12,
  },
  branchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  branchButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
  },
  branchButtonActive: {
    backgroundColor: '#4a4456',
  },
  branchLabel: {
    color: '#f2f2f2',
    fontSize: 12,
  },
  secondarySection: {
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#2a2a35',
    width: '100%',
  },
  secondaryTitle: {
    color: '#8a8a95',
    fontSize: 12,
  },
  secondaryLocked: {
    color: '#6a6a75',
    fontSize: 12,
    textAlign: 'center',
  },
  secondaryBonus: {
    color: '#c9a94f',
    fontSize: 11,
    textAlign: 'center',
  },
});
