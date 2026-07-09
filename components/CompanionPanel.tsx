import { useState } from 'react';
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

type SubView = 'worn' | 'bag' | 'shop';

const SUB_VIEWS: { id: SubView; label: string }[] = [
  { id: 'worn', label: '裝備中' },
  { id: 'bag', label: '背包' },
  { id: 'shop', label: '商店' },
];

function formatBonus(stat: CompanionBonusStat, value: number): string {
  return `${STAT_LABELS[stat]} +${Math.round(value * 100)}%`;
}

const KINDS: CompanionKind[] = ['pet', 'mount'];

export function CompanionPanel() {
  const companions = useGameState((state) => state.companions);
  const purchaseCompanion = useGameState((state) => state.purchaseCompanion);
  const unequipCompanionSlot = useGameState((state) => state.unequipCompanionSlot);

  const [subView, setSubView] = useState<SubView>('worn');

  const totals = getCompanionBonusTotals(companions);

  const bagCount = KINDS.reduce((sum, kind) => {
    const equippedId = kind === 'pet' ? companions.equippedPetId : companions.equippedMountId;
    return sum + getCompanionsByKind(kind).filter((c) => isCompanionUnlocked(companions, c.id) && c.id !== equippedId).length;
  }, 0);
  const shopCount = KINDS.reduce(
    (sum, kind) => sum + getCompanionsByKind(kind).filter((c) => !isCompanionUnlocked(companions, c.id)).length,
    0
  );

  return (
    <View style={styles.container}>
      <Text style={styles.totalsText}>
        總加成:{formatBonus('exp', totals.exp)} / {formatBonus('coins', totals.coins)} /{' '}
        {formatBonus('speed', totals.speed)}
      </Text>

      <View style={styles.subNav}>
        {SUB_VIEWS.map((view) => (
          <Pressable
            key={view.id}
            style={[styles.subNavButton, subView === view.id && styles.subNavButtonActive]}
            onPress={() => setSubView(view.id)}
          >
            <Text style={styles.subNavLabel}>
              {view.label}
              {view.id === 'bag' ? `(${bagCount})` : view.id === 'shop' ? `(${shopCount})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      {subView === 'worn' &&
        KINDS.map((kind) => {
          const equippedId = kind === 'pet' ? companions.equippedPetId : companions.equippedMountId;
          const equipped = equippedId ? getCompanionById(equippedId) : undefined;
          return (
            <View key={kind} style={styles.wornCard}>
              <Text style={styles.kindTitle}>{KIND_LABELS[kind]}</Text>
              {equipped ? (
                <>
                  <Text style={styles.wornItemName}>{equipped.name}</Text>
                  <Text style={styles.wornItemBonus}>{formatBonus(equipped.bonus.stat, equipped.bonus.value)}</Text>
                  <Pressable style={styles.unequipButton} onPress={() => unequipCompanionSlot(kind)}>
                    <Text style={styles.unequipLabel}>卸下</Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.emptyText}>還沒裝備{KIND_LABELS[kind]},去「背包」或「商店」挑一隻</Text>
              )}
            </View>
          );
        })}

      {subView === 'bag' &&
        KINDS.map((kind) => {
          const equippedId = kind === 'pet' ? companions.equippedPetId : companions.equippedMountId;
          const owned = getCompanionsByKind(kind).filter(
            (c) => isCompanionUnlocked(companions, c.id) && c.id !== equippedId
          );
          if (owned.length === 0) return null;
          return (
            <View key={kind} style={styles.kindSection}>
              <Text style={styles.kindTitle}>{KIND_LABELS[kind]}</Text>
              {owned.map((companion) => (
                <Pressable key={companion.id} style={styles.row} onPress={() => purchaseCompanion(companion.id)}>
                  <Text style={styles.label}>{companion.name}</Text>
                  <Text style={styles.cost}>{formatBonus(companion.bonus.stat, companion.bonus.value)}(點擊裝備)</Text>
                </Pressable>
              ))}
            </View>
          );
        })}
      {subView === 'bag' && bagCount === 0 && <Text style={styles.emptyText}>背包裡沒有其他寵物/坐騎</Text>}

      {subView === 'shop' &&
        KINDS.map((kind) => {
          const notOwned = getCompanionsByKind(kind).filter((c) => !isCompanionUnlocked(companions, c.id));
          if (notOwned.length === 0) return null;
          return (
            <View key={kind} style={styles.kindSection}>
              <Text style={styles.kindTitle}>{KIND_LABELS[kind]}</Text>
              {notOwned.map((companion) => (
                <Pressable key={companion.id} style={styles.row} onPress={() => purchaseCompanion(companion.id)}>
                  <Text style={styles.label}>{companion.name}</Text>
                  <Text style={styles.cost}>
                    {formatBonus(companion.bonus.stat, companion.bonus.value)} ({companion.price} 金幣)
                  </Text>
                </Pressable>
              ))}
            </View>
          );
        })}
      {subView === 'shop' && shopCount === 0 && <Text style={styles.emptyText}>寵物坐騎都收集齊了</Text>}
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
  subNav: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  subNavButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1c1c24',
    alignItems: 'center',
  },
  subNavButtonActive: {
    backgroundColor: '#4a4456',
  },
  subNavLabel: {
    color: '#f2f2f2',
    fontSize: 11,
  },
  wornCard: {
    gap: 4,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#1c1c24',
    alignItems: 'center',
    marginBottom: 8,
  },
  wornItemName: {
    color: '#f2f2f2',
    fontSize: 13,
    fontWeight: '600',
  },
  wornItemBonus: {
    color: '#c9a94f',
    fontSize: 12,
  },
  emptyText: {
    color: '#8a8a95',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 8,
  },
  unequipButton: {
    marginTop: 2,
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#2a2a35',
  },
  unequipLabel: {
    color: '#f2f2f2',
    fontSize: 12,
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
  label: {
    color: '#f2f2f2',
    fontSize: 12,
  },
  cost: {
    color: '#8a8a95',
    fontSize: 12,
  },
});
