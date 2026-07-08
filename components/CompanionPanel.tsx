import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  CompanionBonusStat,
  CompanionKind,
  getCompanionBonusTotals,
  getCompanionById,
  getCompanionsByKind,
  isCompanionUnlocked,
} from '../game/companions';
import { useGameState } from '../hooks/useGameState';

const KIND_LABELS: Record<CompanionKind, string> = {
  pet: '寵物',
  mount: '坐騎',
};

const STAT_LABELS: Record<CompanionBonusStat, string> = {
  exp: '經驗',
  coins: '金幣',
  speed: '戰鬥速度',
};

function formatBonus(stat: CompanionBonusStat, value: number): string {
  return `${STAT_LABELS[stat]} +${Math.round(value * 100)}%`;
}

export function CompanionPanel() {
  const companions = useGameState((state) => state.companions);
  const purchaseCompanion = useGameState((state) => state.purchaseCompanion);
  const unequipCompanionSlot = useGameState((state) => state.unequipCompanionSlot);

  const totals = getCompanionBonusTotals(companions);

  return (
    <View style={styles.container}>
      <Text style={styles.totalsText}>
        總加成:{formatBonus('exp', totals.exp)} / {formatBonus('coins', totals.coins)} /{' '}
        {formatBonus('speed', totals.speed)}
      </Text>

      {(['pet', 'mount'] as CompanionKind[]).map((kind) => {
        const equippedId = kind === 'pet' ? companions.equippedPetId : companions.equippedMountId;
        const equipped = equippedId ? getCompanionById(equippedId) : undefined;
        return (
          <View key={kind} style={styles.kindSection}>
            <Text style={styles.kindTitle}>
              {KIND_LABELS[kind]}:{equipped ? equipped.name : '無'}
            </Text>
            {getCompanionsByKind(kind).map((companion) => {
              const unlocked = isCompanionUnlocked(companions, companion.id);
              const isEquipped = equippedId === companion.id;
              return (
                <Pressable
                  key={companion.id}
                  style={[styles.row, isEquipped && styles.rowActive]}
                  onPress={() =>
                    isEquipped ? unequipCompanionSlot(kind) : purchaseCompanion(companion.id)
                  }
                >
                  <Text style={styles.label}>{companion.name}</Text>
                  <Text style={styles.cost}>
                    {formatBonus(companion.bonus.stat, companion.bonus.value)}
                    {unlocked ? (isEquipped ? '(已裝備)' : '') : ` (${companion.price} 金幣)`}
                  </Text>
                </Pressable>
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
  kindSection: {
    gap: 4,
    marginBottom: 8,
  },
  kindTitle: {
    color: '#8a8a95',
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
  },
  rowActive: {
    backgroundColor: '#4a4456',
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
